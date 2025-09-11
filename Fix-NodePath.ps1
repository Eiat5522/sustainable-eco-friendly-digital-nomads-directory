 param(
  [switch]$Apply
  )

  function Write-Header($text) { Write-Host "`n=== $text ===" -ForegroundColor Cyan }
  function Write-Info($text)   { Write-Host $text -ForegroundColor Gray }
  function Write-Warn($text)   { Write-Host $text -ForegroundColor Yellow }
  function Write-Good($text)   { Write-Host $text -ForegroundColor Green }
  function Write-Bad($text)    { Write-Host $text -ForegroundColor Red }

  Write-Header "Detecting Node runtimes"
  $nodePaths = & where.exe node 2>$null
  $npmPaths  = & where.exe npm  2>$null
  $pnpmPaths = & where.exe pnpm 2>$null
  $corepackPaths = & where.exe corepack 2>$null

  Write-Info "node:"
  if ($nodePaths) { $nodePaths | ForEach-Object { Write-Host "  $_" } } else { Write-Warn "  Not found" }

  Write-Info "npm:"
  if ($npmPaths) { $npmPaths | ForEach-Object { Write-Host "  $_" } } else { Write-Warn "  Not found" }

  Write-Info "pnpm:"
  if ($pnpmPaths) { $pnpmPaths | ForEach-Object { Write-Host "  $_" } } else { Write-Warn "  Not found" }

  Write-Info "corepack:"
  if ($corepackPaths) { $corepackPaths | ForEach-Object { Write-Host "  $_" } } else { Write-Warn "  Not found" }

  Write-Header "Checking nvm-windows"
  $nvmExe = & where.exe nvm 2>$null | Select-Object -First 1
  if (-not $nvmExe) {
  Write-Warn "nvm-windows not found in PATH. Install: https://github.com/coreybutler/nvm-windows/releases"
  } else {
  Write-Good "Found nvm: $nvmExe"
  try {
  Write-Info "nvm list:"
  & nvm list
  } catch { Write-Warn "Unable to run 'nvm list' — check installation." }
  }

  Write-Header "PATH inspection"
  $userPath   = [Environment]::GetEnvironmentVariable("Path","User")
  $systemPath = [Environment]::GetEnvironmentVariable("Path","Machine")

  function Split-PathList($p) {
  if (-not $p) { @() } else { $p.Split([IO.Path]::PathSeparator) | Where-Object { $_ -ne "" } }
  }

  $userEntries   = Split-PathList $userPath
  $systemEntries = Split-PathList $systemPath

  Write-Info "User PATH entries:"
  $userEntries | ForEach-Object { Write-Host "  $_" }

  Write-Info "System PATH entries:"
  $systemEntries | ForEach-Object { Write-Host "  $_" }

  Write-Header "Finding Node-related PATH entries"
  function Is-NodeRelated($e) {
  $patterns = @(
  'nodejs',              # classic MSI
  'nvm',                 # nvm itself
  '\Roaming\npm',        # npm global bin
  '\pnpm',               # pnpm standalone
  'Corepack'             # corepack shim
  )
  foreach ($p in $patterns) {
  if ($e -match [regex]::Escape($p)) { return $true }
  }
  return $false
  }

  $userNodeEntries   = $userEntries   | Where-Object { Is-NodeRelated $_ }
  $systemNodeEntries = $systemEntries | Where-Object { Is-NodeRelated $_ }

  Write-Info "User Node-related PATH:"
  if ($userNodeEntries) { $userNodeEntries | ForEach-Object { Write-Host "  $_" } } else { Write-Host "  (none)" }

  Write-Info "System Node-related PATH:"
  if ($systemNodeEntries) { $systemNodeEntries | ForEach-Object { Write-Host "  $_" } } else { Write-Host
  "  (none)" }

  Write-Header "Proposed cleanup"

  # nvm-windows uses:

  # - C:\Program Files\nvm\  (nvm.exe location)

  # - C:\Program Files\nodejs\ (symlink managed by nvm to active version)

  $keepPatterns = @(
  '^C:\Program Files\nvm\?$',         # nvm root
  '^C:\Program Files\nodejs\?$',      # nvm-managed node shim
  '\Roaming\npm\?$',                  # user npm global bin (optional to keep)
  '\Corepack\?$',                      # corepack shim (optional)
  '\pnpm\?$',                          # pnpm standalone (optional; safe if using corepack instead)
  )

  function Should-Keep($entry) {
  foreach ($kp in $keepPatterns) {
  if ($entry -match $kp) { return $true }
  }
  return $false
  }

  # Identify entries to remove: anything Node-related but not in keepPatterns

  $userToRemove   = $userNodeEntries   | Where-Object { -not (Should-Keep $_) }
  $systemToRemove = $systemNodeEntries | Where-Object { -not (Should-Keep $) }

  if ($userToRemove -or $systemToRemove) {
  Write-Warn "Will remove these Node-related PATH entries:"
  if ($userToRemove)   { Write-Host "User:";   $userToRemove   | ForEach-Object { Write-Host "  $_" } }
  if ($systemToRemove) { Write-Host "System:"; $systemToRemove | ForEach-Object { Write-Host "  $" } }
  } else {
  Write-Good "No removable Node-related entries found."
  }

  $newUserEntries = $userEntries   | Where-Object { $userToRemove   -notcontains $_ }
  $newSystemEntries = $systemEntries | Where-Object { $systemToRemove -notcontains $_ }

  Write-Info "Proposed User PATH:"
  $newUserEntries | ForEach-Object { Write-Host "  $_" }

  Write-Info "Proposed System PATH:"
  $newSystemEntries | ForEach-Object { Write-Host "  $_" }

  if (-not $Apply) {
  Write-Header "Dry run complete"
  Write-Info "Re-run with -Apply to write PATH changes (backup will be made)."
  exit 0
  }

  Write-Header "Applying PATH changes with backup"
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $backup = @{
  User   = $userPath
  System = $systemPath
  }
  $backupFile = Join-Path $PWD "PATH-backup-$timestamp.json"
  $backup | ConvertTo-Json | Set-Content -Encoding UTF8 $backupFile
  Write-Info "Backup saved: $backupFile"

  try {
  [Environment]::SetEnvironmentVariable("Path", ($newUserEntries -join ';'), "User")
  [Environment]::SetEnvironmentVariable("Path", ($newSystemEntries -join ';'), "Machine")
  Write-Good "PATH updated. Close and re-open terminals/IDEs to reload."
  } catch {
  Write-Bad "Failed to update PATH: $($_.Exception.Message)"
  Write-Info "You can restore from $backupFile if needed."
  exit 1
  }

  Write-Header "Post-setup suggestions"
  Write-Info "1) Ensure nvm controls Node:"
  Write-Host "   nvm list"
  Write-Host "   nvm install 20.17.0"
  Write-Host "   nvm use 20.17.0"

  Write-Info "2) Enable corepack and pnpm:"
  Write-Host "   corepack enable"
  Write-Host "   corepack prepare pnpm@latest --activate"

  Write-Info "3) Verify:"
  Write-Host "   where node"
  Write-Host "   node -v   # should be v20.x"
  Write-Host "   pnpm -v   # runs OK"