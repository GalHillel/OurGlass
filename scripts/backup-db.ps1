# OurGlass Database Backup Helper
# This script helps you extract a local schema snapshot if needed (requires supabase CLI).

param (
    [string]$ProjectRef = ""
)

if ($ProjectRef -eq "") {
    Write-Host "❌ Error: Please provide your Supabase Project Reference." -ForegroundColor Red
    Write-Host "Usage: ./scripts/backup-db.ps1 -ProjectRef your-ref"
    exit
}

Write-Host "💾 backing up schema for $ProjectRef..." -ForegroundColor Yellow

if (-not (Get-Command "supabase" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Supabase CLI is not installed." -ForegroundColor Red
    exit
}

supabase db pull --project-ref $ProjectRef
Write-Host "✅ Schema pulled to supabase/migrations." -ForegroundColor Green
