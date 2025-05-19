# Sync Listings Data Script
param (
    [string]$Mode = "production" # Can be "production" or "development"
)

$ErrorActionPreference = "Stop"

$sourceDir = Join-Path $PSScriptRoot "..\listings\production"
$targetDir = Join-Path $PSScriptRoot "..\app-scaffold\src\data\listings"

# Ensure target directory exists
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

Write-Host "Syncing listings data from $sourceDir to $targetDir..."

# Copy all files from source to target
Copy-Item -Path "$sourceDir\*" -Destination $targetDir -Recurse -Force

Write-Host "Sync complete!"

# In development mode, set up a file watcher
if ($Mode -eq "development") {
    Write-Host "Starting file watcher for continuous sync..."
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $sourceDir
    $watcher.Filter = "*.*"
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true

    $action = {
        $path = $event.SourceEventArgs.FullPath
        $targetPath = $path.Replace($sourceDir, $targetDir)
        Copy-Item -Path $path -Destination $targetPath -Force
        Write-Host "Updated: $($event.SourceEventArgs.Name)"
    }

    Register-ObjectEvent $watcher "Created" -Action $action
    Register-ObjectEvent $watcher "Changed" -Action $action

    Write-Host "Watcher started. Press Ctrl+C to stop."
    while ($true) { Start-Sleep 1 }
}
