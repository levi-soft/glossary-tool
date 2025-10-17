# PowerShell script to test AI translation
# Run: .\test-ai.ps1

Write-Host "🧪 Testing AI Translation API..." -ForegroundColor Cyan

# Test 1: Health check
Write-Host "`n1. Checking backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get
    Write-Host "✅ Backend is running" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host "   Please run: npm run dev:backend" -ForegroundColor Yellow
    exit
}

# Test 2: AI Capabilities
Write-Host "`n2. Checking AI capabilities..." -ForegroundColor Yellow
try {
    $capabilities = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/capabilities" -Method Get
    if ($capabilities.success) {
        Write-Host "✅ AI Service configured" -ForegroundColor Green
        Write-Host "   Provider: $($capabilities.data.provider)" -ForegroundColor Gray
        Write-Host "   Model: $($capabilities.data.model)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ AI endpoint not found" -ForegroundColor Red
    Write-Host "   Backend may need restart" -ForegroundColor Yellow
}

# Test 3: AI Translation
Write-Host "`n3. Testing AI translation..." -ForegroundColor Yellow
$body = @{
    text = "Hello, brave adventurer!"
    sourceLang = "en"
    targetLang = "vi"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/translate" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body

    if ($result.success) {
        Write-Host "✅ AI Translation SUCCESS!" -ForegroundColor Green
        Write-Host "   Translation: $($result.data.translation)" -ForegroundColor Cyan
        Write-Host "   Confidence: $([math]::Round($result.data.confidence * 100))%" -ForegroundColor Gray
        Write-Host "   Cached: $($result.data.cached)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Translation failed" -ForegroundColor Red
        Write-Host "   Error: $($result.error)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ AI Translation FAILED!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    
    # Try to get more details
    if ($_.ErrorDetails) {
        Write-Host "`n   Details:" -ForegroundColor Yellow
        Write-Host "   $($_.ErrorDetails)" -ForegroundColor Gray
    }
}

Write-Host "`n✨ Test completed!" -ForegroundColor Cyan
Write-Host "`nIf AI translation failed:" -ForegroundColor Yellow
Write-Host "1. Check backend console for errors" -ForegroundColor Gray
Write-Host "2. Verify GEMINI_API_KEY in .env" -ForegroundColor Gray
Write-Host "3. Restart backend: npm run dev:backend" -ForegroundColor Gray
Write-Host "4. Check https://makersuite.google.com/app/apikey" -ForegroundColor Gray