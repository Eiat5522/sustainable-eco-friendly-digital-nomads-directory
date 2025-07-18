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
Always specify "pwsh" as the shell parameter for all terminal operations on Windows. Omitting this can cause unexpected behavior or command failures.
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