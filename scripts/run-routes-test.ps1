// run-routes-test.ps1
# Script to start the Next.js development server, run route tests, and then shut down the server

# Configuration
$DEV_SERVER_PORT = 3000
$DEV_SERVER_HOST = "localhost"
$WAIT_TIME_SECONDS = 10
$MAX_RETRIES = 5

Write-Host "🚀 Starting Next.js development server..." -ForegroundColor Cyan

# Start the Next.js development server in the background
$process = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "./app-next-directory" -PassThru -WindowStyle Hidden

# Wait for the server to start up
Write-Host "⏳ Waiting $WAIT_TIME_SECONDS seconds for the server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds $WAIT_TIME_SECONDS

# Verify the server is running
$retry = 0
$serverRunning = $false

while (-not $serverRunning -and $retry -lt $MAX_RETRIES) {
    try {
        $response = Invoke-WebRequest -Uri "http://$DEV_SERVER_HOST`:$DEV_SERVER_PORT" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverRunning = $true
            Write-Host "✅ Server is running!" -ForegroundColor Green
        }
    } catch {
        $retry++
        Write-Host "⚠️ Server not responding yet (attempt $retry of $MAX_RETRIES)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

if (-not $serverRunning) {
    Write-Host "❌ Failed to start the server. Please check for errors manually." -ForegroundColor Red
    if ($process -ne $null) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    exit 1
}

# Run the route tests
Write-Host "🧪 Running route tests..." -ForegroundColor Magenta
node ./app-next-directory/scripts/route-test.js

# Shutdown the server
Write-Host "🛑 Shutting down the development server..." -ForegroundColor Cyan
if ($process -ne $null) {
    Stop-Process -Id $process.Id -Force
}

Write-Host "✨ Completed route testing!" -ForegroundColor Green
