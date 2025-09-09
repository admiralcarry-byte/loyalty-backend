# PowerShell script to start the backend server with proper cleanup
param(
    [int]$Port = 5000,
    [switch]$KillExisting
)

Write-Host "🚀 Starting Backend Server..." -ForegroundColor Green

# Function to kill processes on a specific port
function Kill-ProcessOnPort {
    param($Port)
    try {
        $processes = netstat -ano | Select-String ":$Port " | ForEach-Object {
            ($_ -split '\s+')[-1]
        } | Sort-Object -Unique
        
        foreach ($pid in $processes) {
            if ($pid -and $pid -ne "0") {
                Write-Host "🔪 Killing process $pid on port $Port" -ForegroundColor Yellow
                taskkill /PID $pid /F 2>$null
            }
        }
    }
    catch {
        Write-Host "⚠️  Could not kill processes on port $Port" -ForegroundColor Yellow
    }
}

# Kill existing processes if requested
if ($KillExisting) {
    Write-Host "🔪 Killing existing processes on port $Port..." -ForegroundColor Yellow
    Kill-ProcessOnPort -Port $Port
    Start-Sleep -Seconds 2
}

# Check if port is available
$portInUse = netstat -ano | Select-String ":$Port "
if ($portInUse) {
    Write-Host "⚠️  Port $Port is in use. Available options:" -ForegroundColor Yellow
    Write-Host "1. Use -KillExisting flag to kill existing processes" -ForegroundColor Cyan
    Write-Host "2. The server will automatically find an available port" -ForegroundColor Cyan
    Write-Host ""
}

# Start the server
Write-Host "🔄 Starting server..." -ForegroundColor Green
try {
    npm start
}
catch {
    Write-Host "❌ Failed to start server: $_" -ForegroundColor Red
    exit 1
}