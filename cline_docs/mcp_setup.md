# MCP (Model Context Protocol) Configuration

## Overview
This project uses MCP for enhanced AI capabilities and task automation. The configuration is global and not workspace-specific.

## Global Setup

1. Install TaskMaster AI globally:
```bash
npm install -g task-master-ai
```

2. Create a global `.env` file in your home directory:
```bash
# Required API keys for providers
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
PERPLEXITY_API_KEY=pplx-your-key-here
# OPENAI_API_KEY=sk-your-key-here
# GOOGLE_API_KEY=AIzaSy...

# Optional Endpoint Overrides
# AZURE_OPENAI_ENDPOINT=https://your-azure-endpoint.openai.azure.com/
# OLLAMA_BASE_URL=http://custom-ollama-host:11434/api
```

## Security Notes
- Keep your API keys secure and never commit them to version control
- Use environment variables for sensitive configuration
- Consider using a credential manager for key storage

## Features
The MCP configuration enables:
- Automated task management
- Enhanced code generation
- Intelligent project assistance
- Multi-model AI capabilities

## Troubleshooting
If you encounter issues:
1. Verify global installation: `npm list -g task-master-ai`
2. Check environment variables are set correctly
3. Verify API keys are valid
4. Check network access to API endpoints

## Contributing
When suggesting MCP feature changes:
1. Update global documentation
2. Test with different environments
3. Consider security implications
