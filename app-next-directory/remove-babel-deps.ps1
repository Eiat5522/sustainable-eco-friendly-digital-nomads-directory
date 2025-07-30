# PowerShell script to remove Babel dependencies since we're using SWC

Write-Host "Removing Babel dependencies..." -ForegroundColor Green

# Remove Babel-related dependencies
pnpm remove @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript babel-jest

Write-Host "Babel dependencies removed successfully!" -ForegroundColor Green
Write-Host "The project is now using SWC for both Next.js compilation and Jest testing." -ForegroundColor Cyan