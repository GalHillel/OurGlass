# OurGlass Setup Script for Windows
# This script initializes the environment and prepares the project for development.

$ErrorActionPreference = "Stop"

Write-Host "💎 Welcome to OurGlass Setup!" -ForegroundColor Cyan

# 1. Check for .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "📝 Creating .env.local from example..." -ForegroundColor Yellow
    Copy-Item "env/example.env" ".env.local"
    Write-Host "✅ .env.local created. PLEASE OPEN IT AND ADD YOUR API KEYS!" -ForegroundColor Green
} else {
    Write-Host "✅ .env.local already exists." -ForegroundColor Green
}

# 2. Check for node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies (npm install)..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installed." -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already present." -ForegroundColor Green
}

Write-Host "`n🚀 Setup complete! You can now run the app with:" -ForegroundColor Cyan
Write-Host "npm run dev" -ForegroundColor White
Write-Host "`nRemember to initialize your Supabase database using database/schema.sql" -ForegroundColor Gray
