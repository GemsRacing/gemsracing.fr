(function () {
  "use strict";
  const AUTH_KEY = "gems_auth_v2";
  const PASSWORD = "GemsRacing88";
  window.gemsData = { stats: {}, news: {}, gallery: [], races: [], partners: [] };

  function value(id) { return document.getElementById(id)?.value.trim() || ""; }
  function setValue(id, val) { if (document.getElementById(id)) document.getElementById(id).value = val ?? ""; }
  function toast(m) { const e = document.getElementById("toast"); if (e) { e.textContent = m; e.style.display = "block"; setTimeout(() => e.style.display = "none", 3000); } }

  async function loadData() {
    try {
      const r = await fetch("/api/data", { cache: "no-store" });
      if (r.ok) { window.gemsData = await r.json(); renderAll(); }
    } catch (e) { console.error(e); }
  }

  async function saveData() {
    let token = sessionStorage.getItem("gems_admin_token");
    if (!token) {
        token = prompt("Entrez votre Clé de Sécurité (ADMIN_TOKEN) pour valider l'enregistrement en ligne :");
        if (!token) return;
        sessionStorage.setItem("gems_admin_token", token);
    }

    const r = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify(window.gemsData)
    });

    if (r.ok) { toast("✅ Enregistré en ligne !"); }
    else { 
        sessionStorage.removeItem("gems_admin_token");
        alert("❌ Erreur : Clé de sécurité (Token) invalide."); 
    }
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

  function collectForms() {
    window.gemsData.stats = { victoires: value("stat-victoires"), podiums: value("stat-podiums"), sws: value("stat-sws"), age: value("stat-age") };
    window.gemsData.news = { title: value("news-title"), summary: value("news-summary"), link: value("news-link"), button: value("news-button") };
  }

  window.saveAllData = async () => { collectForms(); await saveData(); };
  
  // Fonctions de rendu simplifiées
  window.renderNews = () => { /* ... */ };
  window.renderGallery = () => { /* ... */ };
  window.renderRaces = () => { /* ... */ };
  window.renderPartners = () => { /* ... */ };

  function renderAll() {
    setValue("stat-victoires", window.gemsData.stats.victoires);
    setValue("stat-podiums", window.gemsData.stats.podiums);
    setValue("stat-sws", window.gemsData.stats.sws);
    setValue("stat-age", window.gemsData.stats.age);
    setValue("news-title", window.gemsData.news.title);
    setValue("news-summary", window.gemsData.news.summary);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (sessionStorage.getItem(AUTH_KEY) === "true") {
      document.getElementById("login-overlay").style.display = "none";
      document.body.classList.remove("is-locked");
    }
    await loadData();
  });
})();
