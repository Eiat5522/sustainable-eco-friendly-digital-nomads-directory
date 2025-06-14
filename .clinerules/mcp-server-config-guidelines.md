## Brief overview
These guidelines provide instructions for configuring Model Context Protocol (MCP) servers, ensuring correct path resolution and adherence to project or global settings.

## MCP Server Configuration
*   **Workspace-Specific Servers:**
    *   For MCP servers that rely on workspace-relative paths (e.g., using `"${workspaceFolder}"` in their arguments), configure them in the project's `.vscode/mcp.json` file.
    *   This ensures correct path resolution (e.g., `"${workspaceFolder}"` resolves to the current project root like "D:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory") and keeps project-specific configurations localized.
*   **Global Servers:**
    *   Servers intended for general use across multiple projects can be configured in the global `cline_mcp_settings.json` file (e.g., `c:/Users/Dev/AppData/Roaming/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`).
*   **Default Settings:**
    *   When adding new MCP servers to any configuration file, ensure `disabled` is set to `false`.
    *   Initialize `autoApprove` to an empty array (`[]`) unless specific auto-approval for certain tool calls is intended.
*   **Command Execution on Windows:**
    *   When configuring MCP server commands on Windows, prefer direct `npx <package>` calls.
    *   If a server's documentation suggests using `C:\Windows\System32\cmd.exe /c npx ...` and it fails, try a direct `npx` call as a fallback.
*   **Installation Path:**
    *   Unless specified otherwise by the user, new MCP server repositories should be created in `C:\Users\Dev\Documents\Cline\MCP`.
