const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 5500;
const DATA_FILE = path.join(__dirname, 'data', 'site-data.json');
const server = http.createServer((req, res) => {
    // 1. Nettoyer l'URL (enlever les paramètres comme ?v=33)
    const cleanUrl = req.url.split('?')[0];
    // 2. Gérer l'API (Lecture/Écriture des données)
    if (cleanUrl === '/api/site-data') {
        if (req.method === 'GET') {
            fs.readFile(DATA_FILE, 'utf8', (err, data) => {
                res.writeHead(err ? 500 : 200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
                res.end(data || JSON.stringify({}));
            });
            return;
        }
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                fs.writeFile(DATA_FILE, body, (err) => {
                    res.writeHead(err ? 500 : 200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
                    res.end(JSON.stringify({ success: !err }));
                });
            });
            return;
        }
    }
    // 3. Servir les fichiers statiques (HTML, JS, CSS, Images)
    let filePath = path.join(__dirname, cleanUrl === '/' ? 'index.html' : cleanUrl);
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 - Fichier non trouvé</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Erreur serveur: ' + error.code);
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*' 
            });
            res.end(content, 'utf-8');
        }
    });
});
server.listen(PORT, () => {
    console.log(`
🚀 Serveur GEMS RACING actif sur http://localhost:${PORT}`);
    console.log(`📂 Dossier : ${__dirname}`);
    console.log(`👉 Ouvre l'intranet ici : http://localhost:${PORT}/intranet.html
`);
});

