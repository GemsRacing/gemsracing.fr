(function () {
  "use strict";
  // Fonction pour mettre à jour les éléments HTML avec les données de l'intranet
  window.renderPublicData = function(data) {
    const stats = data.stats || {};
    const news = data.news || {};
    const races = data.races || [];
    // --- Page d'accueil (index.html) ---
    if (document.getElementById("stat-victoires-display")) {
        document.getElementById("stat-victoires-display").textContent = stats.victoires || "0";
    }
    if (document.getElementById("stat-victoires-kart")) { // Numéro sur le kart
        document.getElementById("stat-victoires-kart").textContent = stats.victoires || "0";
    }
    if (document.getElementById("stat-podiums-display")) {
        document.getElementById("stat-podiums-display").textContent = stats.podiums || "0";
    }
    if (document.getElementById("stat-sws-display")) {
        document.getElementById("stat-sws-display").textContent = stats.sws || "N/A";
    }
    if (document.getElementById("stat-age-display")) {
        document.getElementById("stat-age-display").textContent = stats.age || "N/A";
    }
    // Actualité sur l'accueil
    if (document.getElementById("latest-news-title-display")) {
        document.getElementById("latest-news-title-display").textContent = news.title || "Aucune actualité récente";
    }
    if (document.getElementById("latest-news-summary-display")) {
        document.getElementById("latest-news-summary-display").textContent = news.summary || "";
    }
    const newsLinkDisplay = document.getElementById("latest-news-link-display");
    if (newsLinkDisplay) {
        newsLinkDisplay.href = news.link || "resultats.html";
    }
    // --- Page Résultats (resultats.html) ---
    // Statistiques sur la page Résultats
    if (document.getElementById("results-stat-victoires-display")) {
        document.getElementById("results-stat-victoires-display").textContent = stats.victoires || "0";
    }
    if (document.getElementById("results-stat-podiums-display")) {
        document.getElementById("results-stat-podiums-display").textContent = stats.podiums || "0";
    }
    if (document.getElementById("results-stat-courses-disputees-display")) {
        // Cette stat n'est pas dans l'intranet, on peut la lsser en dur ou la gérer si ajoutée
        // document.getElementById("results-stat-courses-disputees-display").textContent = "37";
    }
    if (document.getElementById("results-stat-sws-france-display")) {
        document.getElementById("results-stat-sws-france-display").textContent = stats.sws || "N/A";
    }
    if (document.getElementById("results-stat-sws-mondl-display")) {
        // Cette stat n'est pas dans l'intranet, on peut la lsser en dur ou la gérer si ajoutée
        // document.getElementById("results-stat-sws-mondl-display").textContent = "172e";
    }
    if (document.getElementById("results-stat-dernier-resultat-display")) {
        // Pour le dernier résultat, on peut prendre la dernière course terminée de l'agenda
        const lastRace = races.filter(r => r.status === "Terminé").sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
        document.getElementById("results-stat-dernier-resultat-display").textContent = lastRace ? lastRace.result : "N/A";
    }
    // Actualités sur la page Résultats
    const resultsNewsContent = document.getElementById("results-latest-news-content");
    if (resultsNewsContent) {
        resultsNewsContent.innerHTML = `
            <span class="gems-news-date">Sson 2026</span>
            <h2 id="latest-news-title-display">${news.title || "Aucune actualité récente"}</h2>
            <p id="latest-news-summary-display">${news.summary || ""}</p>
        `;
    }
    // Agenda des courses sur la page Résultats
    const publicRacesList = document.getElementById("results-public-races-list");
    if (publicRacesList) {
        if (races.length === 0) {
            publicRacesList.innerHTML = "<p>Aucune course enregistrée.</p>";
        } else {
            publicRacesList.innerHTML = races.map(race => `
                <div class="list-item">
                    <div class="list-item-mn">
                        <strong>${race.name || "Course sans nom"}</strong>
                        <small>
                            ${race.date || ""} ·
                            ${race.circuit || ""} ·
                            ${race.city || ""}
                        </small>
                        <small>
                            Statut : ${race.status || ""} ·
                            Résultat : ${race.result || ""}
                        </small>
                        ${race.link ? `<a href="${race.link}" target="_blank" rel="noopener noreferrer" style="color:#f28c28;">Voir le débrief</a>` : ""}
                    </div>
                </div>
            `).join("");
        }
    }
  };
  async function loadDataAndRender() {
    try {
      // Lecture directe du fichier JSON statique sur GitHub Pages
      const response = awt fetch("data/site-data.json?v=" + Date.now(), { cache: "no-store" });
      if (!response.ok) {
        console.warn("Impossible de charger data/site-data.json. Le site fonctionnera avec les données par défaut.");
        return;
      }
      const data = awt response.json();
      if (window.renderPublicData && typeof window.renderPublicData === "function") {
        window.renderPublicData(data);
      }
    } catch (e) {
      console.error("Erreur lors du chargement ou du rendu des données publiques :", e);
    }
  }
  document.addEventListener("DOMContentLoaded", loadDataAndRender);
})();
