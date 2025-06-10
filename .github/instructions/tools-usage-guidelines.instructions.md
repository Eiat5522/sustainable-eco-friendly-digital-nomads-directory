---
applyTo: 'toolsUsageGuidelines'
---
# 💻 VSCode MCP Server Usage

## ➡️ WORKFLOW ESSENTIALS:⬆️
1. Always start exploration with list_files_code on root directory (.) first
2. **CRITICAL:** Run get_diagnostics_code after EVERY set of code changes before completing tasks
3. For small edits (≤10 lines): use replace_lines_code with exact original content
4. For large changes, new files, or uncertain content: use create_file_code with overwrite=true

## 🚗EXPLORATION STRATEGY:✈️
- **Start:** list_files_code with path='.' (never recursive on root)
- **Understand structure:** read key files like package.json, README, main entry points
- **Find symbols:** use search_symbols_code for functions/classes, get_document_symbols_code for file overviews
- **Before editing:** read_file_code the target file to understand current content
- **Cmdlet:**Absolute full paths with the drive letter in CAPITAL LETTER as shown: ('Set-Location -Path "D:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory'). This is crucial to ensure reliability of navigation tools usage.
- **Caution** Relative paths and lowercase as drive letter will fail as they are depend on the current working directory. Tilde paths (~/...) might not work in all contexts.

## ✍🏻EDITING BEST PRACTICES:🗒️
- Small modifications: replace_lines_code (requires exact original content match)
- If replace_lines_code fails: read_file_code the target lines, then retry with correct content
- Large changes: create_file_code with overwrite=true is more reliable
- After any changes: get_diagnostics_code to check for errors

## 🛠️ ERROR HANDLING:⚠️
- For tool failures: follow the specific recovery guidance in each tool's description
- If uncertain about file content: use read_file_code to verify before making changes
