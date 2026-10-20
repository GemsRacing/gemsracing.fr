require('dotenv').config(); // Charge les variables du fichier .env

const http = require("http");
const fs = require("fs");
const path = require("path");

// --- CONFIGURATION GITHUB ---
// Le jeton est maintenant lu depuis le fichier .env (sécurisé)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
const REPO_OWNER = "GemsRacing";
const REPO_NAME = "gemsracing.fr";
const FILE_PATH = "data/site-data.json";

const PORT = 5500;
const DATA_FILE = path.join(__dirname, "data", "site-data.json");

async function pushToGithub(content) {
    if (!GITHUB_TOKEN) {
        console.error("Erreur: GITHUB_TOKEN n'est pas configuré dans le fichier .env");
        return false;
    }

    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    
    try {
        // 1. Récupérer le SHA du fichier actuel (obligatoire pour GitHub)
        const getFile = await fetch(url, {
            headers: { "Authorization": `token ${GITHUB_TOKEN}` }
        });
        const fileData = await getFile.json();
        const sha = fileData.sha;

        // 2. Envoyer la mise à jour
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: "Mise à jour automatique via Intranet",
                content: Buffer.from(content).toString("base64"),
                sha: sha
            })
        });

        return response.ok;
    } catch (error) {
        console.error("Erreur GitHub:", error);
        return false;
    }
}

const server = http.createServer(async (req, res) => {
    // Gérer le CORS (pour que l'intranet puisse parler au serveur)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === "/api/site-data" && req.method === "GET") {
        fs.readFile(DATA_FILE, "utf8", (err, data) => {
            res.writeHead(err ? 404 : 200, { "Content-Type": "application/json" });
            res.end(data || JSON.stringify({}));
        });
    } 
    else if (req.url === "/api/site-data" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });
        req.on("end", async () => {
            // Sauvegarde locale
            fs.writeFile(DATA_FILE, body, "utf8", async (err) => {
                if (err) {
                    res.writeHead(500);
                    res.end("Erreur locale");
                } else {
                    // PUBLICATION AUTOMATIQUE SUR GITHUB
                    console.log("Publication sur GitHub en cours...");
                    const success = await pushToGithub(body);
                    
                    res.writeHead(success ? 200 : 207, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ 
                        success: true, 
                        github: success 
                    }));
                    console.log(success ? "✅ Publié sur gemsracing.fr" : "⚠️ Sauvegardé localement mais échec GitHub");
                }
            });
        });
    }
    else {
        // Servir les fichiers statiques (intranet.html, etc.)
        let filePath = path.join(__dirname, req.url === "/" ? "index.html" : req.url);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end("Non trouvé");
            } else {
                res.end(data);
            }
        });
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Serveur Intranet Actif sur http://localhost:${PORT}`);
    console.log(`👉 Gems peut modifier le site ici.`);
});