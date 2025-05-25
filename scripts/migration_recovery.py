"""
Enhanced Error Recovery and Logging System
Sustainable Digital Nomads Directory - Migration Infrastructure

This module provides comprehensive error handling, recovery mechanisms,
and detailed logging for the Sanity CMS migration process.
"""

import json
import logging
import time
import traceback
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable, Union
from dataclasses import dataclass, asdict
from functools import wraps
import pickle

class MigrationErrorType(Enum):
    """Categories of migration errors for better handling"""
    NETWORK_ERROR = "network_error"
    AUTHENTICATION_ERROR = "authentication_error"
    API_RATE_LIMIT = "api_rate_limit"
    VALIDATION_ERROR = "validation_error"
    FILE_NOT_FOUND = "file_not_found"
    IMAGE_PROCESSING_ERROR = "image_processing_error"
    SANITY_API_ERROR = "sanity_api_error"
    UNKNOWN_ERROR = "unknown_error"

class MigrationStatus(Enum):
    """Status of migration operations"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUCCESS = "success"
    FAILED = "failed"
    RETRY = "retry"
    SKIPPED = "skipped"

@dataclass
class MigrationError:
    """Structured error information for migration operations"""
    error_type: MigrationErrorType
    message: str
    timestamp: str
    context: Dict[str, Any]
    stack_trace: Optional[str] = None
    retry_count: int = 0
    is_recoverable: bool = True

@dataclass
class MigrationItem:
    """Represents a single item being migrated"""
    item_id: str
    item_type: str  # 'listing', 'image', etc.
    status: MigrationStatus
    data: Dict[str, Any]
    errors: List[MigrationError]
    created_at: str
    updated_at: str
    attempts: int = 0
    success_at: Optional[str] = None

class MigrationLogger:
    """Enhanced logging system with structured output and recovery tracking"""

    def __init__(self, log_dir: Path, migration_session_id: Optional[str] = None):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)

        self.session_id = migration_session_id or f"migration_{int(time.time())}"
        self.session_start = datetime.now(timezone.utc)

        # Setup structured logging
        self.setup_logging()

        # Migration state tracking
        self.migration_state = {
            "session_id": self.session_id,
            "started_at": self.session_start.isoformat(),
            "status": "in_progress",
            "items": {},  # item_id -> MigrationItem
            "statistics": {
                "total_items": 0,
                "successful": 0,
                "failed": 0,
                "skipped": 0,
                "retried": 0
            },
            "errors_by_type": {},
            "performance_metrics": {
                "start_time": time.time(),
                "items_per_second": 0.0,
                "estimated_completion": None
            }
        }

    def setup_logging(self):
        """Configure structured logging"""
        log_file = self.log_dir / f"{self.session_id}.log"
        error_log_file = self.log_dir / f"{self.session_id}_errors.log"

        # Main logger
        self.logger = logging.getLogger(f"migration_{self.session_id}")
        self.logger.setLevel(logging.DEBUG)

        # Remove existing handlers
        for handler in self.logger.handlers[:]:
            self.logger.removeHandler(handler)

        # File handler for all logs
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)

        # File handler for errors only
        error_handler = logging.FileHandler(error_log_file, encoding='utf-8')
        error_handler.setLevel(logging.ERROR)

        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)

        # Formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
        )

        file_handler.setFormatter(formatter)
        error_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)

        self.logger.addHandler(file_handler)
        self.logger.addHandler(error_handler)
        self.logger.addHandler(console_handler)

        self.logger.info(f"Migration session started: {self.session_id}")

    def add_item(self, item_id: str, item_type: str, data: Dict[str, Any]):
        """Add a new item to track in the migration"""
        item = MigrationItem(
            item_id=item_id,
            item_type=item_type,
            status=MigrationStatus.PENDING,
            data=data,
            errors=[],
            created_at=datetime.now(timezone.utc).isoformat(),
            updated_at=datetime.now(timezone.utc).isoformat()
        )

        self.migration_state["items"][item_id] = item
        self.migration_state["statistics"]["total_items"] += 1

        self.logger.debug(f"Added {item_type} item for migration: {item_id}")
        self.save_state()

    def update_item_status(self, item_id: str, status: MigrationStatus,
                          error: Optional[MigrationError] = None):
        """Update the status of a migration item"""
        if item_id not in self.migration_state["items"]:
            self.logger.warning(f"Attempted to update unknown item: {item_id}")
            return

        item = self.migration_state["items"][item_id]
        old_status = item.status
        item.status = status
        item.updated_at = datetime.now(timezone.utc).isoformat()
        item.attempts += 1

        if error:
            item.errors.append(error)
            error_type = error.error_type.value
            self.migration_state["errors_by_type"].setdefault(error_type, 0)
            self.migration_state["errors_by_type"][error_type] += 1

        # Update statistics
        stats = self.migration_state["statistics"]
        if old_status != status:
            if status == MigrationStatus.SUCCESS:
                stats["successful"] += 1
                item.success_at = datetime.now(timezone.utc).isoformat()
            elif status == MigrationStatus.FAILED:
                stats["failed"] += 1
            elif status == MigrationStatus.SKIPPED:
                stats["skipped"] += 1
            elif status == MigrationStatus.RETRY:
                stats["retried"] += 1

        # Log the update
        log_level = logging.INFO if status == MigrationStatus.SUCCESS else logging.WARNING
        self.logger.log(log_level, f"Item {item_id} status: {old_status.value} -> {status.value}")

        if error:
            self.logger.error(f"Error for item {item_id}: {error.message}")

        self.update_performance_metrics()
        self.save_state()

    def update_performance_metrics(self):
        """Update performance metrics and ETA"""
        stats = self.migration_state["statistics"]
        metrics = self.migration_state["performance_metrics"]

        elapsed_time = time.time() - metrics["start_time"]
        completed_items = stats["successful"] + stats["failed"] + stats["skipped"]

        if elapsed_time > 0 and completed_items > 0:
            metrics["items_per_second"] = completed_items / elapsed_time

            remaining_items = stats["total_items"] - completed_items
            if metrics["items_per_second"] > 0:
                eta_seconds = remaining_items / metrics["items_per_second"]
                metrics["estimated_completion"] = (
                    datetime.now(timezone.utc) +
                    timedelta(seconds=eta_seconds)
                ).isoformat()

    def get_failed_items(self) -> List[MigrationItem]:
        """Get all items that failed migration"""
        return [
            item for item in self.migration_state["items"].values()
            if item.status == MigrationStatus.FAILED
        ]

    def get_retryable_items(self, max_attempts: int = 3) -> List[MigrationItem]:
        """Get items that can be retried"""
        retryable = []
        for item in self.migration_state["items"].values():
            if (item.status in [MigrationStatus.FAILED, MigrationStatus.RETRY] and
                item.attempts < max_attempts and
                self._has_recoverable_errors(item)):
                retryable.append(item)
        return retryable

    def _has_recoverable_errors(self, item: MigrationItem) -> bool:
        """Check if an item has recoverable errors"""
        if not item.errors:
            return True

        # Check if the latest error is recoverable
        latest_error = item.errors[-1]
        return latest_error.is_recoverable

    def save_state(self):
        """Save current migration state to disk"""
        state_file = self.log_dir / f"{self.session_id}_state.json"

        # Convert dataclasses to dict for JSON serialization
        serializable_state = self.migration_state.copy()
        serializable_state["items"] = {
            item_id: asdict(item) for item_id, item in self.migration_state["items"].items()
        }

        try:
            with open(state_file, 'w', encoding='utf-8') as f:
                json.dump(serializable_state, f, indent=2, default=str)
        except Exception as e:
            self.logger.error(f"Failed to save migration state: {e}")

    def load_state(self, session_id: str) -> bool:
        """Load migration state from a previous session"""
        state_file = self.log_dir / f"{session_id}_state.json"

        if not state_file.exists():
            self.logger.warning(f"No state file found for session: {session_id}")
            return False

        try:
            with open(state_file, 'r', encoding='utf-8') as f:
                loaded_state = json.load(f)

            # Convert back to dataclass objects
            loaded_state["items"] = {
                item_id: MigrationItem(**item_data)
                for item_id, item_data in loaded_state["items"].items()
            }

            self.migration_state = loaded_state
            self.session_id = session_id

            self.logger.info(f"Loaded migration state for session: {session_id}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to load migration state: {e}")
            return False

    def finalize_session(self, status: str = "completed"):
        """Finalize the migration session"""
        self.migration_state["status"] = status
        self.migration_state["completed_at"] = datetime.now(timezone.utc).isoformat()

        stats = self.migration_state["statistics"]
        metrics = self.migration_state["performance_metrics"]

        total_time = time.time() - metrics["start_time"]

        self.logger.info(f"Migration session completed: {self.session_id}")
        self.logger.info(f"Total items: {stats['total_items']}")
        self.logger.info(f"Successful: {stats['successful']}")
        self.logger.info(f"Failed: {stats['failed']}")
        self.logger.info(f"Skipped: {stats['skipped']}")
        self.logger.info(f"Total time: {total_time:.2f} seconds")

        if metrics["items_per_second"] > 0:
            self.logger.info(f"Average speed: {metrics['items_per_second']:.2f} items/second")

        self.save_state()

        # Generate summary report
        self.generate_summary_report()

    def generate_summary_report(self):
        """Generate a human-readable summary report"""
        report_file = self.log_dir / f"{self.session_id}_summary.md"

        stats = self.migration_state["statistics"]
        metrics = self.migration_state["performance_metrics"]

        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(f"# Migration Summary Report\n\n")
            f.write(f"**Session ID:** {self.session_id}\n")
            f.write(f"**Started:** {self.migration_state['started_at']}\n")
            f.write(f"**Completed:** {self.migration_state.get('completed_at', 'In Progress')}\n\n")

            f.write(f"## Statistics\n\n")
            f.write(f"- **Total Items:** {stats['total_items']}\n")
            f.write(f"- **Successful:** {stats['successful']}\n")
            f.write(f"- **Failed:** {stats['failed']}\n")
            f.write(f"- **Skipped:** {stats['skipped']}\n")
            f.write(f"- **Retried:** {stats['retried']}\n\n")

            if self.migration_state["errors_by_type"]:
                f.write(f"## Errors by Type\n\n")
                for error_type, count in self.migration_state["errors_by_type"].items():
                    f.write(f"- **{error_type}:** {count}\n")
                f.write("\n")

            if metrics["items_per_second"] > 0:
                f.write(f"## Performance\n\n")
                f.write(f"- **Processing Speed:** {metrics['items_per_second']:.2f} items/second\n\n")

            failed_items = self.get_failed_items()
            if failed_items:
                f.write(f"## Failed Items\n\n")
                for item in failed_items[:10]:  # Show first 10 failed items
                    f.write(f"- **{item.item_id}** ({item.item_type})\n")
                    if item.errors:
                        latest_error = item.errors[-1]
                        f.write(f"  - Error: {latest_error.message}\n")

                if len(failed_items) > 10:
                    f.write(f"- ... and {len(failed_items) - 10} more\n")

        self.logger.info(f"Summary report generated: {report_file}")

def retry_on_error(max_attempts: int = 3,
                  backoff_factor: float = 2.0,
                  retry_exceptions: tuple = (Exception,)):
    """Decorator for automatic retry with exponential backoff"""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except retry_exceptions as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        delay = backoff_factor ** attempt
                        time.sleep(delay)
                        continue
                    else:
                        raise last_exception

            return None

        return wrapper
    return decorator

def create_migration_error(error_type: MigrationErrorType,
                         message: str,
                         context: Dict[str, Any],
                         exception: Optional[Exception] = None,
                         is_recoverable: bool = True) -> MigrationError:
    """Create a structured migration error"""

    stack_trace = None
    if exception:
        stack_trace = traceback.format_exception(
            type(exception), exception, exception.__traceback__
        )
        stack_trace = ''.join(stack_trace)

    return MigrationError(
        error_type=error_type,
        message=message,
        timestamp=datetime.now(timezone.utc).isoformat(),
        context=context,
        stack_trace=stack_trace,
        is_recoverable=is_recoverable
    )

# Error type detection utilities
def classify_error(exception: Exception, context: Dict[str, Any] = None) -> MigrationErrorType:
    """Automatically classify an exception into a migration error type"""

    error_message = str(exception).lower()

    if "network" in error_message or "connection" in error_message:
        return MigrationErrorType.NETWORK_ERROR
    elif "401" in error_message or "unauthorized" in error_message:
        return MigrationErrorType.AUTHENTICATION_ERROR
    elif "429" in error_message or "rate limit" in error_message:
        return MigrationErrorType.API_RATE_LIMIT
    elif "404" in error_message or "not found" in error_message:
        return MigrationErrorType.FILE_NOT_FOUND
    elif "validation" in error_message or "invalid" in error_message:
        return MigrationErrorType.VALIDATION_ERROR
    elif "image" in error_message or "pil" in error_message:
        return MigrationErrorType.IMAGE_PROCESSING_ERROR
    elif "sanity" in error_message or "api" in error_message:
        return MigrationErrorType.SANITY_API_ERROR
    else:
        return MigrationErrorType.UNKNOWN_ERROR

def is_recoverable_error(error_type: MigrationErrorType) -> bool:
    """Determine if an error type is recoverable"""

    recoverable_errors = {
        MigrationErrorType.NETWORK_ERROR,
        MigrationErrorType.API_RATE_LIMIT,
        MigrationErrorType.SANITY_API_ERROR,
        MigrationErrorType.UNKNOWN_ERROR
    }

    return error_type in recoverable_errors
