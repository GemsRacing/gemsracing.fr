$ErrorActionPreference = "Stop"

$project = Join-Path $env:USERPROFILE "Downloads\gems_racing_preprod"
$serverScript = Join-Path $project "scripts\start-local.ps1"
$cloudflared = Join-Path $project "cloudflared.exe"

if (!(Test-Path $project)) {
    Write-Host "Dossier du projet introuvable :" -ForegroundColor Red
    Write-Host $project
    Read-Host "Appuie sur Entrée pour fermer"
    exit 1
}

if (!(Test-Path $serverScript)) {
    Write-Host "Script du serveur local introuvable :" -ForegroundColor Red
    Write-Host $serverScript
    Read-Host "Appuie sur Entrée pour fermer"
    exit 1
}

if (!(Test-Path $cloudflared)) {
    Write-Host "cloudflared.exe est introuvable :" -ForegroundColor Red
    Write-Host $cloudflared
    Read-Host "Appuie sur Entrée pour fermer"
    exit 1
}

Write-Host "Dossier du projet :" -ForegroundColor Cyan
Write-Host $project
Write-Host ""

# Vérifie si le port 5500 est déjà utilisé
$portInUse = Get-NetTCPConnection -LocalPort 5500 -State Listen -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "Le port 5500 est déjà utilisé." -ForegroundColor Yellow
    Write-Host "Le serveur local semble déjà fonctionner." -ForegroundColor Yellow
}
else {
    Write-Host "Lancement du serveur local..." -ForegroundColor Green

    Start-Process powershell.exe `
        -ArgumentList @(
            "-NoExit",
            "-ExecutionPolicy", "Bypass",
            "-Command",
            "Set-Location '$project'; & '$serverScript'"
        ) `
        -WorkingDirectory $project
}

Start-Sleep -Seconds 3

Write-Host "Lancement du tunnel de partage..." -ForegroundColor Green

Start-Process powershell.exe `
    -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-Command",
        "Set-Location '$project'; Write-Host 'Tunnel Gems Racing - Intranet' -ForegroundColor Cyan; Write-Host 'Adresse locale : http://127.0.0.1:5500/intranet.html' -ForegroundColor Yellow; Write-Host ''; & '$cloudflared' tunnel --url http://127.0.0.1:5500"
    ) `
    -WorkingDirectory $project

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "SERVEUR ET TUNNEL LANCES" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Adresse locale de l'intranet :" -ForegroundColor Cyan
Write-Host "http://127.0.0.1:5500/intranet.html" -ForegroundColor White
Write-Host ""
Write-Host "Regarde la deuxième fenêtre PowerShell." -ForegroundColor Yellow
Write-Host "Elle affichera l'adresse publique en trycloudflare.com." -ForegroundColor Yellow
Write-Host ""
Write-Host "Ajoute /intranet.html à la fin de cette adresse." -ForegroundColor Cyan
Write-Host ""
Read-Host "Appuie sur Entrée pour fermer cette fenêtre"