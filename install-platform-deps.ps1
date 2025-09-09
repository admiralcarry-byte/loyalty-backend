# PowerShell script for platform-specific dependency installation
# This script ensures that platform-specific packages like sharp are installed correctly

Write-Host "🔧 Installing platform-specific dependencies..." -ForegroundColor Green

# Detect the platform
$Platform = [System.Environment]::OSVersion.Platform
$Architecture = [System.Environment]::GetEnvironmentVariable("PROCESSOR_ARCHITECTURE")

Write-Host "📍 Detected platform: $Platform-$Architecture" -ForegroundColor Cyan

# Install sharp with platform-specific binaries
Write-Host "📦 Installing sharp with optional dependencies..." -ForegroundColor Yellow
try {
    npm install --include=optional sharp
    Write-Host "✅ Sharp installed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to install sharp: $_" -ForegroundColor Red
    Write-Host "🔄 Trying alternative installation..." -ForegroundColor Yellow
    
    # Try installing without optional dependencies first
    npm install sharp
    
    # Then try to rebuild
    npm rebuild sharp
}

Write-Host "✅ Platform-specific dependencies installation completed!" -ForegroundColor Green