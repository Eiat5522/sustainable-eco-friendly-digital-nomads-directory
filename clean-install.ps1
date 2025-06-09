# Clean Install Script for Sustainable Digital Nomads Directory
Write-Host "🧹 Starting Clean Install Process..." -ForegroundColor Green

# Navigate to project root
Set-Location -Path "d:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory"

# Function to clean directory
function Clean-Directory {
    param($path, $name)
    Write-Host "🗑️  Cleaning $name..." -ForegroundColor Yellow

    if (Test-Path $path) {
        Push-Location -Path $path

        # Remove node_modules
        if (Test-Path "node_modules") {
            Write-Host "   Removing node_modules..." -ForegroundColor Gray
            Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
        }

        # Remove lock files
        @("package-lock.json", "yarn.lock", "pnpm-lock.yaml") | ForEach-Object {
            if (Test-Path $_) {
                Write-Host "   Removing $_..." -ForegroundColor Gray
                Remove-Item -Force $_ -ErrorAction SilentlyContinue
            }
        }

        # Remove .next build cache (if exists)
        if (Test-Path ".next") {
            Write-Host "   Removing .next cache..." -ForegroundColor Gray
            Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
        }

        # Remove .turbo cache (if exists)
        if (Test-Path ".turbo") {
            Write-Host "   Removing .turbo cache..." -ForegroundColor Gray
            Remove-Item -Recurse -Force ".turbo" -ErrorAction SilentlyContinue
        }

        Pop-Location
    }
}

# Clean all directories
Clean-Directory "." "Root Directory"
Clean-Directory "app-next-directory" "Next.js App"
Clean-Directory "sanity" "Sanity CMS"

# Clear npm cache globally
Write-Host "🧹 Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Function to install dependencies
function Install-Dependencies {
    param($path, $name)
    Write-Host "📦 Installing $name dependencies..." -ForegroundColor Green

    if (Test-Path (Join-Path $path "package.json")) {
        Push-Location -Path $path

        Write-Host "   Running npm install in $name..." -ForegroundColor Cyan
        npm install --legacy-peer-deps --audit=false

        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ $name installation successful!" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $name installation failed!" -ForegroundColor Red
            Pop-Location
            exit 1
        }

        Pop-Location
    } else {
        Write-Host "   ⚠️  No package.json found in $name, skipping..." -ForegroundColor Yellow
    }
}

# Install dependencies in correct order
# 1. Root level (if package.json exists)
Install-Dependencies "." "Root Project"

# 2. Next.js App
Install-Dependencies "app-next-directory" "Next.js App"

# 3. Sanity CMS (if it has a package.json)
Install-Dependencies "sanity" "Sanity CMS"

Write-Host ""
Write-Host "🎉 Clean installation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Navigate to app-next-directory and start development:" -ForegroundColor White
Write-Host "   Set-Location -Path 'app-next-directory'" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. In a separate terminal, start Sanity Studio (if configured):" -ForegroundColor White
Write-Host "   Set-Location -Path 'sanity'" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""

# Optional: Start development servers
$startDev = Read-Host "Start Next.js development server now? (y/N)"
if ($startDev -eq "y" -or $startDev -eq "Y") {
    Write-Host "🚀 Starting Next.js development server..." -ForegroundColor Green

    # Navigate to app-next-directory and start dev server
    Set-Location -Path "app-next-directory"
    Write-Host "Starting server at http://localhost:3000" -ForegroundColor Cyan
    npm run dev
}
