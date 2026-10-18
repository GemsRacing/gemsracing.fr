Set-Location "$PSScriptRoot\.."

Write-Host "Démarrage du serveur Gems Racing..." -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Le programme nécessaire est introuvable." -ForegroundColor Red
    Read-Host "Appuie sur Entrée pour fermer"
    exit 1
}

node ".\server-local.js"