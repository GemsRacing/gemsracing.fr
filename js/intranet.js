(function () {
    "use strict";
    const AUTH_KEY = "gems_auth_v2";
    const PASSWORD = "GemsRacing88";
    window.gemsData = { stats:{}, news:{}, gallery:[], races:[], partners:[], tickets:[] };

    function value(id) { return document.getElementById(id)?.value.trim() || ""; }
    function setValue(id, val) { if (document.getElementById(id)) document.getElementById(id).value = val ?? ""; }
    function toast(m, c="#2ecc71") { 
        const e = document.getElementById("toast"); 
        if(e) { e.textContent = m; e.style.background = c; e.style.display = "block"; setTimeout(() => e.style.display = "none", 3000); } 
    }

    async function loadData() {
        try {
            const r = await fetch("/api/data", { cache: "no-store" });
            if (r.ok) { 
                window.gemsData = await r.json(); 
                renderAll(); 
            }
        } catch (e) { console.error(e); }
    }

    async function saveData() {
        let token = sessionStorage.getItem("gems_admin_token");
        if (!token) {
            token = prompt("🔒 Entrez votre ADMIN_TOKEN :");
            if (!token) return;
            sessionStorage.setItem("gems_admin_token", token);
        }
        toast("⏳ Enregistrement...", "#f28c28");
        try {
            const r = await fetch("/api/data", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Admin-Token": token },
                body: JSON.stringify(window.gemsData)
            });
            if (r.ok) { toast("✅ PUBLIÉ !"); renderAll(); }
            else { alert("❌ Erreur Token/Serveur"); }
        } catch (e) { alert("Erreur réseau"); }
    }

    window.checkPass = function () {
        if (value("pass-input") === PASSWORD) {
            sessionStorage.setItem(AUTH_KEY, "true");
            document.getElementById("login-overlay").style.display = "none";
            document.body.classList.remove("is-locked");
        } else { alert("Mot de passe incorrect."); }
    };

    window.logoutIntranet = () => { sessionStorage.removeItem(AUTH_KEY); window.location.reload(); };
    window.showTab = (n, el) => {
        document.querySelectorAll(".tab-content").forEach(t => t.hidden = true);
        document.querySelectorAll(".intra-nav-item").forEach(i => i.classList.remove("active"));
        document.getElementById("tab-" + n).hidden = false;
        el.classList.add("active");
    };

    window.saveAllData = async () => {
        window.gemsData.stats = { victoires: value("stat-victoires"), podiums: value("stat-podiums"), sws: value("stat-sws"), age: value("stat-age") };
        await saveData();
    };

    function renderAll() {
        setValue("stat-victoires", window.gemsData.stats.victoires);
        setValue("stat-podiums", window.gemsData.stats.podiums);
        setValue("stat-sws", window.gemsData.stats.sws);
        setValue("stat-age", window.gemsData.stats.age);
    }

    document.addEventListener("DOMContentLoaded", async () => {
        if (sessionStorage.getItem(AUTH_KEY) === "true") {
            document.getElementById("login-overlay").style.display = "none";
            document.body.classList.remove("is-locked");
        }
        await loadData();
    });
})();
