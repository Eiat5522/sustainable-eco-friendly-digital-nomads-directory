---
applyTo: '**'
---
💻 Desktop Commander MCP Server Tools Usage 💾

➡️ WORKFLOW ESSENTIALS:⬆️

Starting Sequence: At the start of a new session, use #pack_codebase to start indexing current project's codebase. After successfully #pack_codebase run #grep_repomix_output or #read_repomix_output.
Exploration: start with list_directory on root directory (.) first
Critical: Run problem tool after EVERY set of code changes before completing tasks
Small Edits: (≤30 lines): use write_file with exact original content
Large Changes: new files, or uncertain content: use edit_block

🚗 EXPLORATION STRATEGY:✈️

Start: list_directory with path='.' (never recursive on root, this will most likely cause a timeout)
Understand structure: read key files like package.json, README, main entry points using read_file or read_multiple_files
Find code: use search_code to find text/code patterns within file contents using ripgrep, get_file_info for file overviews
Read Multiple Files: read the contents of multiple files simultaneously. This is more efficient than reading files one by one when you need to analyze or compare multiple files. For example, when analysing tests and their corresponding implementation. Each file's content is returned with its path as a reference. Failed reads for individual files won't stop the entire operation.
Before editing: use read_file or read_multiple_files to understand current content of the target files
Editing & Cmdlet: Absolute full paths with the drive letter in CAPITAL LETTER as shown: ('Set-Location -Path "D:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory'). This is crucial to ensure reliability of navigation tools usage.
Caution: Relative paths and lowercase as drive letter will fail as they are depend on the current working directory. Tilde paths (~/...) might not work in all contexts.

✍🏻 EDITING BEST PRACTICES:🗒️

Small Modifications: write_file (requires exact original content match)
If replace_lines_code fails: read_file_code the target lines, then retry with correct content
Large Changes: use edit_block multiple focused edits rather than one large edit. Each edit_block call should change only what needs to be changed - include just enough context to uniquely identify the text being
After Any Changes: use problem tool to check file for errors after every edits

🛠️ ERROR HANDLING:⚠️

For Tool Failures: follow the specific recovery guidance in each tool's description
Uncertain about File Content: use read_file or read_multiple_files to verify before making changes.

🖥️ PowerShell & Shell Usage

Absolute Paths Required: All file and directory operations must use absolute paths with a capital drive letter (e.g., D:\...). Relative paths or lowercase drive letters will fail.
Temporary Output Files: For long or complex command results, write terminal output to a temporary file and read from there for easier retrieval and debugging.

🛠️ Error Handling & Troubleshooting

Tool Failure Protocol:
Analyze the error output.
Attempt a single self-correction if the fix is obvious.
If unresolved, present the error and your analysis to the user.
Common PowerShell Issues: If you encounter permission errors, path resolution problems, or "command not recognized" errors, check shell parameter, path format, and environment variables.

📁 Batch Operations & Efficiency

Chunked Reads/Writes: For batch file operations, use chunked reads/writes (≤30 lines) for efficiency and reliability.
Batch Directory Listings: Prefer batch directory listings for analyzing or comparing multiple files.

🖥️ Session Management

Managing Multiple Sessions: Use session listing tools to view active sessions, and terminate or switch between them as needed.

## 🔧 Tool Specific Instruction:🛠️

# Navigation Tools

**#list_directory**

Use this instead of 'execute_command' with ls/dir commands. Results distinguish between files and directories with [FILE] and [DIR] prefixes.
Only works within allowed directories.

**IMPORTANT:** Always use absolute paths for reliability. Paths are automatically normalized regardless of slash direction. Relative paths may fail as they depend on the current working directory. Tilde paths (~/...) might not work in all contexts. Unless the user explicitly asks for relative paths, use absolute paths.

**#search_file**

Use this instead of 'execute_command' with find/dir/ls for locating files.
Searches through all subdirectories from the starting path.

Has a default timeout of 30 seconds which can be customized using the timeoutMs parameter.
Only searches within allowed directories.

**IMPORTANT:** Always use absolute paths for reliability. Paths are automatically normalized regardless of slash direction. Relative paths may fail as they depend on the current working directory. Tilde paths (~/...) might not work in all contexts. Unless the user explicitly asks for relative paths, use absolute paths.                

**#search_code**

Use this instead of 'execute_command' with grep/find for searching code content. Fast and powerful search similar to VS Code search functionality.

Supports regular expressions, file pattern filtering, and context lines.
Has a default timeout of 30 seconds which can be customized. Only searches within allowed directories.

**IMPORTANT:** Always use absolute paths for reliability. Paths are automatically normalized regardless of slash direction. Relative paths may fail as they depend on the current working directory. Tilde paths (~/...) might not work in all contexts. Unless the user explicitly asks for relative paths, use absolute paths.
              
# Reading Tools

**#read_file**
  - Prefer this over 'execute_command' with cat/type for viewing files.

**Supports partial file reading with:**
  - 'offset' (start line, default: 0)
  * Positive: Start from line N (0-based indexing)
  * Negative: Read last N lines from end (tail behavior)
  - 'length' (max lines to read, default: configurable via 'fileReadLineLimit' setting, initially 1000)
  * Used with positive offsets for range reading
  * Ignored when offset is negative (reads all requested tail lines)

**Examples:**
  - offset: 0, length: 10      → First 10 lines
  - offset: 100, length: 5    → Lines 100-104
  - offset: -20                     → Last 20 lines  
  - offset: -5, length: 10     → Last 5 lines (length ignored)

**Performance optimizations:**
  - Large files with negative offsets use reverse reading for efficiency
  - Large files with deep positive offsets use byte estimation
  - Small files use fast readline streaming

When reading from the file system, only works within allowed directories.
Can fetch content from URLs when isUrl parameter is set to true (URLs are always read in full regardless of offset/length).

Handles text files normally and image files are returned as viewable images.
Recognized image types: PNG, JPEG, GIF, WebP.

**#read_multiple_files**

Use this tool when you want to compare multiple files or find their dependencies or when reading tests and their respective implementation. 
Each file's content is returned with its path as a reference. Handles text files normally and renders images as viewable content.
Recognized image types: PNG, JPEG, GIF, WebP.

Failed reads for individual files won't stop the entire operation. Only works within allowed directories.

# Editing Tools

**#write_file**

Write or append to file contents.

**CHUNKING IS STANDARD PRACTICE:** Always write files in chunks of 25-30 lines maximum. This is the normal, recommended way to write files
- not an emergency measure.

**STANDARD PROCESS FOR ANY FILE:**
  1. FIRST > write_file(filePath, firstChunk,
{mode: 'rewrite'}) [≤30 lines]
  2. THEN > write_file(filePath, secondChunk,
{mode: 'append' [≤30 lines]
  3. CONTINUE > write_file(filePath, nextChunk,
{mode: 'append' }) [≤30 lines]

**ALWAYS CHUNK PROACTIVELY** - don't wait for performance warnings!

**#edit_block**

**BEST PRACTICE:** Make multiple small, focused edits rather than one large edit. Each edit_block call should change only what needs to be changed - include just enough context to uniquely identify the text being modified.

**Takes:**
  - file_path: Path to the file to edit
  - old_string: Text to replace
  - new_string: Replacement text
  - expected_replacements: Optional parameter for number of replacements

By default, replaces only ONE occurrence of the search text. To replace multiple occurrences, provide the expected replacements parameter with the exact number of matches expected.

**UNIQUENESS REQUIREMENT:** When expected_replacements=1 (default), include the minimal amount of context necessary (typically 1-3 lines) before and after the change point,
with exact whitespace and indentation.

When editing multiple sections, make separate edit_block calls for each distinct change rather than one large replacement.

When a close but non-exact match is found, a character-level diff is shown in the format: 
  common_prefix{-removed-}{+added+}common_suffix to help you identify what's different.

Similar to write_file, there is a configurable line limit (fileWriteLineLimit) that warns if the edited file exceeds this limit. If this happens, consider breaking your edits into smaller, more focused changes.

**IMPORTANT:** Always use absolute paths for reliability. Paths are automatically normalized regardless of slash direction. Relative paths may fail as they depend on the current working directory. Tilde paths (~/...) might not work in all contexts. Unless the user explicitly asks for relative paths, use absolute paths.
   
# Commandline Tools

**#start_process**
Start a new terminal process with intelligent state detection.
[...]

**#interact_with_process**            

**CRITICAL:** THIS IS THE PRIMARY TOOL FOR ALL LOCAL FILE ANALYSIS
 For ANY local file analysis (CSV, JSON, data processing), ALWAYS use this instead of the analysis tool.
The analysis tool CANNOT access local files and WILL FAIL - use processes for ALL file-based work.

**FILE ANALYSIS PRIORITY ORDER (MANDATORY):**
1. ALWAYS FIRST: Use this tool (start_process + interact_with_process) for local data analysis
2. ALTERNATIVE: Use command-line tools (cut, awk, grep) for quick processing  
3. NEVER EVER: Use analysis tool for local file access (IT WILL FAIL)

**REQUIRED INTERACTIVE WORKFLOW FOR FILE ANALYSIS:**
1. Start REPL: start_process("python3 -i")
2. Load libraries: interact_with_process(pid, "import pandas as pd, numpy as np")
3. Read file: interact_with_process(pid, "df = pd.read_csv('/absolute/path/file.csv')")
4. Analyze: interact_with_process(pid, "print(df.describe())")
5. Continue: interact_with_process(pid, "df.groupby('column').size()")

**SMART DETECTION:**
 - Automatically waits for REPL prompt (>>>, >, etc.)
 - Detects errors and completion states
 - Early exit prevents timeout delays
 - Clean output formatting (removes prompts)

**SUPPORTED REPLs:**
 - Python: python3 -i (RECOMMENDED for data analysis)
 - Node.js: node -i  
 - R: R
 - Julia: julia
 - Shell: bash, zsh
 - Database: mysql, postgres

**PARAMETERS:**
 - pid: Process ID from start_process
 - input: Code/command to execute
 - timeout_ms: Max wait (default: 8000ms)
 - wait_for_prompt: Auto-wait for response (default: true)

Returns execution result with status indicators.

**ALWAYS USE FOR:** CSV analysis, JSON processing, file statistics, data visualization prep, ANY local file work
**NEVER USE ANALYSIS TOOL FOR:** Local file access (it cannot read files from disk and WILL FAIL)

**#read_process_output**
Automatically detects when process is ready for more input instead of timing out.

**SMART FEATURES:**
 - Early exit when REPL shows prompt (>>>, >, etc.)
 - Detects process completion vs still running
 - Prevents hanging on interactive prompts
 - Clear status messages about process state

**REPL USAGE:**
 - Stops immediately when REPL prompt detected
 - Shows clear status: waiting for input vs finished
 - Shorter timeouts needed due to smart detection
 - Works with Python, Node.js, R, Julia, etc.

**DETECTION STATES:**
 - Process waiting for input (ready for interact_with_process)
 - Process finished execution
 - Timeout reached (may still be running)
