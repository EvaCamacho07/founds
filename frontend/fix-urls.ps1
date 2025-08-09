# Script para corregir todas las URLs de localhost en index.html
$content = Get-Content -Path "index.html" -Raw
$content = $content -replace "http://localhost:3000/", "https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/"
$content = $content -replace "http://\+573001661010/", "https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/"
Set-Content -Path "index.html" -Value $content
Write-Host "URLs corregidas exitosamente"
