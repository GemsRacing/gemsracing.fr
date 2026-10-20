(function () {
    "use strict";
    const AUTH_KEY = "gems_auth_v2";
    const PASSWORD = "GemsRacing88";
    window.gemsData = { stats: {}, news: {}, gallery: [], races: [], partners: [] };

    function value(id) { return document.getElementById(id)?.value.trim() || ""; }
    function setValue(id, val) { if (document.getElementById(id)) document.getElementById(id).value = val ?? ""; }
    
    function toast(m, color="#2ecc71") { 
        const e = document.getElementById("toast"); 
        if (e) { e.textContent = m; e.style.background = color; e.style.display = "block"; setTimeout(() => e.style.display = "none", 3000); } 
    }

    // --- CHARGEMENT ---
    async function loadData() {
        try {
            const r = await fetch("/api/data", { cache: "no-store" });
            if (r.ok) { 
                const data = await r.json();
                window.gemsData = {
                    stats: data.stats || {},
                    news: data.news || {},
                    gallery: data.gallery || [],
                    races: data.races || [],
                    partners: data.partners || []
                };
                console.log("Données synchronisées :", window.gemsData);
                renderAll(); 
            }
        } catch (e) { console.error("Erreur chargement :", e); }
    }

    // --- SAUVEGARDE ---
    async function saveData() {
        let token = sessionStorage.getItem("gems_admin_token");
        if (!token) {
            token = prompt("🔒 Entrez votre ADMIN_TOKEN (défini sur Vercel) :");
            if (!token) return;
            sessionStorage.setItem("gems_admin_token", token);
        }

        toast("⏳ Enregistrement...", "#f28c28");
        collectStats();

        try {
            const r = await fetch("/api/data", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Admin-Token": token },
                body: JSON.stringify(window.gemsData)
            });

            if (r.ok) { toast("✅ ENREGISTRÉ EN LIGNE !"); } 
            else {
                sessionStorage.removeItem("gems_admin_token");
                alert("❌ Erreur : Token invalide.");
            }
        } catch (e) { alert("Erreur réseau"); }
    }

    function collectStats() {
        window.gemsData.stats = {
            victoires: value("stat-victoires"),
            podiums: value("stat-podiums"),
            sws: value("stat-sws"),
            age: value("stat-age")
        };
    }

    // --- AFFICHAGE (RENDU) ---
    function renderAll() {
        // Stats
        setValue("stat-victoires", window.gemsData.stats.victoires);
        setValue("stat-podiums", window.gemsData.stats.podiums);
        setValue("stat-sws", window.gemsData.stats.sws);
        setValue("stat-age", window.gemsData.stats.age);

        // News
        setValue("news-title", window.gemsData.news.title);
        setValue("news-summary", window.gemsData.news.summary);
        setValue("news-link", window.gemsData.news.link);
        setValue("news-button", window.gemsData.news.button);

        renderRaces();
        renderPartners();
    }

    window.renderRaces = function() {
        const list = document.getElementById("races-list");
        if (!list) return;
        list.innerHTML = window.gemsData.races.map((r, i) => `
            <div style="background:rgba(255,255,255,0.05); padding:10px; margin-bottom:5px; border-radius:5px; display:flex; justify-content:space-between;">
                <span><b>${r.date}</b> - ${r.name} (${r.result})</span>
                <button onclick="deleteRace(${i})" style="background:#e74c3c; border:none; color:white; cursor:pointer; border-radius:3px;">Suppr.</button>
            </div>
        `).join("");
    };

    window.addRace = function() {
        const newRace = {
            date: value("race-date"),
            name: value("race-name"),
            circuit: value("race-circuit"),
            result: value("race-result"),
            city: value("race-city"),
            status: document.getElementById("race-status").value,
            link: value("race-link")
        };
        window.gemsData.races.push(newRace);
        renderRaces();
        toast("Course ajoutée (cliquez sur Enregistrer pour valider)");
    };

    window.deleteRace = function(index) {
        window.gemsData.races.splice(index, 1);
        renderRaces();
    };

    // --- PARTENAIRES ---
    window.renderPartners = function() {
        const list = document.getElementById("partners-list");
        if (!list) return;
        list.innerHTML = window.gemsData.partners.map((p, i) => `
            <div style="display:inline-block; margin:5px; text-align:center;">
                <img src="${p.logo}" style="height:40px; display:block;">
                <button onclick="deletePartner(${i})" style="font-size:10px;">Suppr.</button>
            </div>
        `).join("");
    };

    // --- AUTH ET NAVIGATION ---
    window.checkPass = function () {
        if (value("pass-input") === PASSWORD) {
            sessionStorage.setItem(AUTH_KEY, "true");
            document.getElementById("login-overlay").style.display = "none";
            document.body.classList.remove("is-locked");
        } else { alert("Mot de passe incorrect."); }
    };

    window.showTab = (n, el) => {
        document.querySelectorAll(".tab-content").forEach(t => t.hidden = true);
        document.querySelectorAll(".intra-nav-item").forEach(i => i.classList.remove("active"));
        document.getElementById("tab-" + n).hidden = false;
        el.classList.add("active");
    };

    window.saveAllData = saveData;
    window.logoutIntranet = () => { sessionStorage.removeItem(AUTH_KEY); window.location.reload(); };

    document.addEventListener("DOMContentLoaded", async () => {
        if (sessionStorage.getItem(AUTH_KEY) === "true") {
            document.getElementById("login-overlay").style.display = "none";
            document.body.classList.remove("is-locked");
        }
        await loadData();
    });
})();
