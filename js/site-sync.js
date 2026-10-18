(function () {
  "use strict";

  window.renderPublicData = function(data) {
    const stats = data.stats || {};
    const news = data.news || {};
    const races = data.races || [];
    const gallery = data.gallery || [];

    // --- Page Accueil ---
    const statsIds = {
        "stat-victoires-display": stats.victoires,
        "stat-podiums-display": stats.podiums,
        "stat-sws-display": stats.sws,
        "stat-age-display": stats.age,
        "stat-victoires-kart": stats.victoires
    };
    
    Object.keys(statsIds).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = statsIds[id] || "0";
    });

    if (document.getElementById("latest-news-title-display")) {
        document.getElementById("latest-news-title-display").textContent = news.title || "Aucune actualité récente";
    }
    if (document.getElementById("latest-news-summary-display")) {
        document.getElementById("latest-news-summary-display").textContent = news.summary || "";
    }
    const newsLink = document.getElementById("latest-news-link-display");
    if (newsLink) newsLink.href = news.link || "resultats.html";

    // --- Page Résultats ---
    const resStatsIds = {
        "stat-victoires-display": stats.victoires,
        "stat-podiums-display": stats.podiums,
        "stat-sws-france-display": stats.sws,
        "stat-dernier-resultat-display": races.length > 0 ? races[races.length-1].result : "N/A"
    };

    Object.keys(resStatsIds).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = resStatsIds[id] || "0";
    });

    const newsContent = document.getElementById("results-latest-news-content");
    if (newsContent) {
        newsContent.innerHTML = `<h2>${news.title || ""}</h2><p>${news.summary || ""}</p>`;
    }

    const racesList = document.getElementById("results-public-races-list");
    if (racesList && races.length > 0) {
        racesList.innerHTML = races.map(r => `
            <div class="list-item">
                <div class="list-item-main">
                    <strong>${r.name || "Course"}</strong>

                    <small>${r.date} · ${r.circuit} · ${r.result}</small>
                </div>
            </div>`).join("");
    }

    // --- Page Galerie ---
    const galleryGrid = document.getElementById("gems-dynamic-gallery-grid");
    if (galleryGrid) {
        if (gallery.length === 0) {
            galleryGrid.innerHTML = "<p>Galerie en cours d'alimentation...</p>";
        } else {
            galleryGrid.innerHTML = gallery.map(photo => `
                <a class="gems-gallery-item" href="${photo.image}" aria-label="${photo.alt}">
                    <img src="${photo.image}" alt="${photo.alt}" loading="lazy">
                    <span class="gems-gallery-caption">${photo.caption}</span>
                </a>
            `).join("");
        }
    }
  };

  async function loadDataAndRender() {
    try {
      const response = await fetch("data/site-data.json?v=" + Date.now(), { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      if (window.renderPublicData) window.renderPublicData(data);
    } catch (e) { console.log("Mode statique actif."); }
  }

  document.addEventListener("DOMContentLoaded", loadDataAndRender);
})();