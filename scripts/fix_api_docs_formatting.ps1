# PowerShell script to fix markdown formatting issues in API documentation
$filePath = "d:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory\docs\API_DOCUMENTATION.md"

# Read the content
$content = Get-Content -Path $filePath -Raw

# Fix MD022 - Add blank lines around headings
$content = $content -replace '(\r?\n)(####[^\r\n]+)(\r?\n)', "`$1`n`$2`n`n"
$content = $content -replace '^(####[^\r\n]+)(\r?\n)', "`$1`n`n"

# Fix MD031 - Add blank lines around fenced code blocks
$content = $content -replace '(\r?\n)(```[^\r\n]*\r?\n)', "`$1`n`$2"
$content = $content -replace '(\r?\n```\r?\n)([^\r\n])', "`$1`n`$2"

# Fix MD032 - Add blank lines around lists
$content = $content -replace '(\r?\n)(- [^\r\n]+)', "`$1`n`$2"
$content = $content -replace '(- [^\r\n]+)(\r?\n)([^-\r\n])', "`$1`$2`n`$3"

# Clean up multiple consecutive blank lines
$content = $content -replace '(\r?\n){3,}', "`n`n"

# Write the fixed content back
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "Fixed markdown formatting in API_DOCUMENTATION.md"
