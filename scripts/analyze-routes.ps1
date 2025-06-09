# analyze-routes.ps1
# Script to analyze the Next.js project's dynamic routes and help identify potential issues

$appDirectory = ".\app-next-directory\src\app"
$pagesDirectory = ".\app-next-directory\pages"

Write-Host "📊 Analyzing Dynamic Routes in Next.js Project" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Function to analyze directory structure and identify dynamic routes
function Analyze-DirectoryForDynamicRoutes {
    param (
        [string]$directoryPath,
        [string]$routeType
    )

    Write-Host "`n📁 Analyzing $routeType Directory: $directoryPath" -ForegroundColor Magenta

    if (-Not (Test-Path $directoryPath)) {
        Write-Host "   Directory does not exist." -ForegroundColor Yellow
        return
    }

    # Find all dynamic route directories (those with square brackets)
    $dynamicRouteDirs = Get-ChildItem -Path $directoryPath -Directory -Recurse |
                        Where-Object { $_.Name -match "\[.*\]" }

    if ($dynamicRouteDirs.Count -eq 0) {
        Write-Host "   No dynamic routes found." -ForegroundColor Yellow
        return
    }

    Write-Host "   Found $($dynamicRouteDirs.Count) dynamic route directories:" -ForegroundColor Green

    # Group directories by their parent path to identify potential conflicts
    $groupedByParent = $dynamicRouteDirs | Group-Object -Property { $_.Parent.FullName }

    foreach ($group in $groupedByParent) {
        $relativePath = $group.Name.Replace("$((Get-Location).Path)\", "")
        Write-Host "`n   📂 $relativePath" -ForegroundColor Yellow

        if ($group.Group.Count -gt 1) {
            Write-Host "     ⚠️ Potential conflict detected: Multiple dynamic routes in same directory" -ForegroundColor Red
        }

        foreach ($dir in $group.Group) {
            $parameterName = $dir.Name -replace "\[|\]",""
            Write-Host "     🔹 $($dir.Name) (parameter: '$parameterName')" -ForegroundColor $(if ($parameterName -eq "slug") { "Green" } else { "White" })

            # Check if there's a page.tsx file
            $pageFile = Get-ChildItem -Path $dir.FullName -Filter "page.tsx" -ErrorAction SilentlyContinue
            if ($pageFile) {
                Write-Host "       ✅ Has page.tsx implementation" -ForegroundColor Green

                # Check for data fetching patterns
                $pageContent = Get-Content $pageFile.FullName -Raw
                if ($pageContent -match "generateStaticParams") {
                    Write-Host "       ✨ Uses generateStaticParams for static generation" -ForegroundColor Green
                }
                if ($pageContent -match "params\.$parameterName") {
                    Write-Host "       ✅ Uses expected parameter name in code" -ForegroundColor Green
                } else {
                    Write-Host "       ⚠️ Parameter name mismatch detected in code" -ForegroundColor Red
                }
            } else {
                Write-Host "       ⚠️ No page.tsx implementation found" -ForegroundColor Red
            }
        }
    }
}

# Analyze App Router dynamic routes
Analyze-DirectoryForDynamicRoutes -directoryPath $appDirectory -routeType "App Router"

# Analyze Pages Router dynamic routes (if used)
Analyze-DirectoryForDynamicRoutes -directoryPath $pagesDirectory -routeType "Pages Router"

Write-Host "`n🔍 Component Link Analysis" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

# Find components with Link tags that might need updating
$componentFiles = Get-ChildItem -Path ".\app-next-directory\src\components" -Filter "*.tsx" -Recurse
$totalLinks = 0
$slugLinks = 0
$idLinks = 0
$cityLinks = 0

foreach ($file in $componentFiles) {
    $content = Get-Content $file.FullName -Raw
    $linkMatches = [regex]::Matches($content, "href=\{?[`"']\s*(/[\w/-]+(/\[[\w-]+\]|/\$\{[\w.]+\}|/[\w-]+))\s*[`"']\}?")

    if ($linkMatches.Count -gt 0) {
        Write-Host "`n📄 $($file.Name)" -ForegroundColor Yellow

        foreach ($match in $linkMatches) {
            $totalLinks++
            $link = $match.Groups[1].Value

            # Classify the link
            $linkClass = "Other"
            $linkColor = "White"

            if ($link -match "/listings/\[\s*slug\s*\]|/listings/\$\{.*slug") {
                $slugLinks++
                $linkClass = "Slug-based listings link"
                $linkColor = "Green"
            } elseif ($link -match "/listings/\[\s*id\s*\]|/listings/\$\{.*id") {
                $idLinks++
                $linkClass = "ID-based listings link"
                $linkColor = "Red"
            } elseif ($link -match "/city/\[\s*slug\s*\]|/city/\$\{.*slug") {
                $slugLinks++
                $linkClass = "Slug-based city link"
                $linkColor = "Green"
            } elseif ($link -match "/city/\[\s*city\s*\]|/city/\$\{.*city") {
                $cityLinks++
                $linkClass = "City-named city link"
                $linkColor = "Red"
            }

            Write-Host "   🔗 $link" -ForegroundColor $linkColor
            Write-Host "      $linkClass" -ForegroundColor $linkColor
        }
    }
}

Write-Host "`n📊 Link Summary" -ForegroundColor Cyan
Write-Host "   Total dynamic links found: $totalLinks" -ForegroundColor White
Write-Host "   Standard slug-based links: $slugLinks" -ForegroundColor Green
Write-Host "   ID-based links: $idLinks" -ForegroundColor $(if ($idLinks -gt 0) { "Red" } else { "Green" })
Write-Host "   City-named links: $cityLinks" -ForegroundColor $(if ($cityLinks -gt 0) { "Red" } else { "Green" })

Write-Host "`n✅ Analysis complete!" -ForegroundColor Green
Write-Host "Run './scripts/run-routes-test.ps1' to test the routes in action." -ForegroundColor Cyan
