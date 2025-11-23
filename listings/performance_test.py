"""
Performance testing script for the Sustainable Digital Nomads Directory
"""
import asyncio
import aiohttp
import json
import time
from pathlib import Path
from rich.console import Console
from rich.table import Table
from typing import Dict, List, Any

console = Console()

class PerformanceTest:
    def __init__(self):
        self.session: aiohttp.ClientSession = None
        self.results: Dict[str, List[float]] = {}
        self.base_url = "http://localhost:3000"  # Update for production

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def measure_response_time(self, endpoint: str, name: str, attempts: int = 5) -> None:
        """Measure response time for an endpoint"""
        times = []
        for _ in range(attempts):
            start = time.time()
            async with self.session.get(f"{self.base_url}{endpoint}") as response:
                await response.text()
                end = time.time()
                times.append(end - start)
            await asyncio.sleep(0.5)  # Prevent hammering the server

        self.results[name] = times

    def print_results(self):
        """Print performance test results in a table"""
        table = Table(title="Performance Test Results")
        table.add_column("Endpoint", justify="left", style="cyan")
        table.add_column("Avg Time (s)", justify="right", style="green")
        table.add_column("Min Time (s)", justify="right", style="blue")
        table.add_column("Max Time (s)", justify="right", style="red")

        for name, times in self.results.items():
            avg_time = sum(times) / len(times)
            min_time = min(times)
            max_time = max(times)
            table.add_row(
                name,
                f"{avg_time:.3f}",
                f"{min_time:.3f}",
                f"{max_time:.3f}"
            )

        console.print(table)

    def save_results(self, filename: str = "performance_results.json"):
        """Save results to a JSON file"""
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)

async def main():
    """Run performance tests"""
    test_endpoints = [
        ("/api/listings", "Listings API"),
        ("/api/cities", "Cities API"),
        ("/", "Homepage"),
        ("/search", "Search Page"),
        ("/city/bangkok", "City Detail Page"),
        ("/listing/shinei-office", "Listing Detail Page"),
    ]

    console.print("[bold blue]Starting performance tests...[/bold blue]")

    async with PerformanceTest() as tester:
        for endpoint, name in test_endpoints:
            console.print(f"Testing {name}...")
            await tester.measure_response_time(endpoint, name)

        tester.print_results()
        tester.save_results()

    console.print("[bold green]Performance tests completed![/bold green]")

if __name__ == "__main__":
    asyncio.run(main())
