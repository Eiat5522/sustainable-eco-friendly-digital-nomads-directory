---
applyTo: 'toolsUsageGuidelines'
---
### 💻 VSCode MCP Server Usage 💾 ###

## ➡️ WORKFLOW ESSENTIALS:⬆️
- **Start Exploration:** with list_files_code on root directory (.) first
- **Critical:** Run get_diagnostics_code after EVERY set of code changes before completing tasks
- **Small Edits:** (≤10 lines): use replace_lines_code with exact original content
- **Large Changes:** new files, or uncertain content: use create_file_code with overwrite=true

## 🚗 EXPLORATION STRATEGY:✈️
- **Start:** list_files_code with path='.' (never recursive on root)
- **Understand structure:** read key files like package.json, README, main entry points
- **Find symbols:** use search_symbols_code for functions/classes, get_document_symbols_code for file overviews
- **Before editing:** read_file_code the target file to understand current content
- **Cmdlet:**Absolute full paths with the drive letter in CAPITAL LETTER as shown: ('Set-Location -Path "D:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory'). This is crucial to ensure reliability of navigation tools usage.
- **Caution:** Relative paths and lowercase as drive letter will fail as they are depend on the current working directory. Tilde paths (~/...) might not work in all contexts.

## ✍🏻 EDITING BEST PRACTICES:🗒️
- **Small Modifications:** replace_lines_code (requires exact original content match)
- **If replace_lines_code** fails: read_file_code the target lines, then retry with correct content
- **Large Changes:** create_file_code with overwrite=true is more reliable
- **After Any Changes:** get_diagnostics_code to check for errors

## 🛠️ ERROR HANDLING:⚠️
- **For Tool Failures:** follow the specific recovery guidance in each tool's description
- **Uncertain about File Content:** use read_file_code to verify before making changes

### 💻 Repomix MCP Usage Instructions 🖱️ ###

  This repository contains the source code for the Sustainable Eco Friendly Digital Nomads Directory (Thailand).
  - 1. Please follow these guidelines when analyzing the code:
  - 2. Focus on the core functionality in the `/app-next-directory/src/core` directory.
  - 3. Pay special attention to the security checks in `/app-next-directory/src/core/security`.
  - 4. Ignore any files in the `tests` directory.
