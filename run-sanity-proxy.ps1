# run-sanity-proxy.ps1
# Hardcoded proxy for Sanity CLI via global-agent
param(
  [Parameter(Mandatory=$false)]
  [string[]]$Args
)

$env:GLOBAL_AGENT_HTTP_PROXY = "http://proxy:8080"
node -r global-agent/bootstrap .\node_modules\@sanity\cli\bin\sanity.js @Args
