# Quick Start Script para Barbearia 247
# Copiar este ficheiro para backend/ e rodar em PowerShell

Write-Host "⏱️  Iniciando setup do Backend..." -ForegroundColor Cyan

# Verificar se Node.js está instalado
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js não está instalado!" -ForegroundColor Red
    Write-Host "📥 Download: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js encontrado: $(node -v)" -ForegroundColor Green

# Instalar dependências
Write-Host "`n📦 Instalando dependências..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependências instaladas!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
    exit 1
}

# Verificar se .env existe
if (-not (Test-Path ".env")) {
    Write-Host "`n⚠️  Arquivo .env não encontrado!" -ForegroundColor Yellow
    Write-Host "📝 Criar arquivo .env com as variáveis:" -ForegroundColor Cyan
    Write-Host @"
PORT=5000
MONGODB_URI=mongodb://localhost:27017/barbearia
JWT_SECRET=seu_secret_key_super_seguro_aqui
TWILIO_ACCOUNT_SID=seu_sid
TWILIO_AUTH_TOKEN=seu_token
TWILIO_PHONE_NUMBER=+351912345678
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
"@
    exit 0
}

# Perguntar se quer inicializar base de dados
Write-Host "`n🗄️  Deseja inicializar a base de dados?" -ForegroundColor Yellow
Write-Host "Isto criará os barbeiros e serviços padrão." -ForegroundColor Gray
$response = Read-Host "Continuar? (S/N)"

if ($response -eq "S" -or $response -eq "s") {
    Write-Host "`n⏳ Inicializando base de dados..." -ForegroundColor Cyan
    node seed.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Base de dados inicializada!" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Erro ao inicializar base de dados!" -ForegroundColor Red
        Write-Host "💡 Verificar se MongoDB está rodando" -ForegroundColor Yellow
        exit 1
    }
}

# Perguntar se quer iniciar servidor
Write-Host "`n🚀 Deseja iniciar o servidor agora?" -ForegroundColor Yellow
$response = Read-Host "Continuar? (S/N)"

if ($response -eq "S" -or $response -eq "s") {
    Write-Host "`n🟢 Iniciando servidor..." -ForegroundColor Cyan
    Write-Host "Servidor disponível em: http://localhost:5000" -ForegroundColor Green
    Write-Host "Painel Admin: http://localhost:3000/admin/" -ForegroundColor Green
    Write-Host "`nPressione Ctrl+C para parar o servidor`n" -ForegroundColor Yellow
    npm run dev
} else {
    Write-Host "`n✅ Setup completo!" -ForegroundColor Green
    Write-Host "Para iniciar o servidor, rodar: npm run dev" -ForegroundColor Cyan
}
