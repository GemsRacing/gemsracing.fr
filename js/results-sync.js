(function () {
  "use strict";

  function escapeHtml(val) {
    return String(val || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function loadData() {
    try {
      const res = await fetch("/api/data?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (e) {
      console.warn("API indisponible, chargement local data/site-data.json :", e);
      try {
        const local = await fetch("data/site-data.json", { cache: "no-store" });
        return await local.json();
      } catch (err) {
        return { news: {}, races: [] };
      }
    }
  }

  function newsCardHtml(news, large) {
    if (!news || !news.title) return "";
    var img = "";
    if (news.image) {
      img = '<div style="margin-bottom:15px; border-radius:10px; overflow:hidden; border:1px solid rgba(242,140,40,0.3); background:#020b17; cursor:zoom-in;" onclick="window.openGemsRaceLightbox(this.querySelector(\'img\').src, this.querySelector(\'img\').alt)">' +
      '<img src="' + news.image + '" alt="' + escapeHtml(news.title) + '" style="width:100%; height:auto; max-height:480px; object-fit:contain; display:block; margin:0 auto; transition:transform 0.2s;" onmouseover="this.style.transform=\'scale(1.01)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
      '<div style="text-align:center; padding:6px; font-size:11px; font-weight:700; color:#f28c28; background:rgba(7,27,53,0.95); border-top:1px solid rgba(242,140,40,0.2);">🔍 CLIQUER POUR AGRANDIR L''AFFICHE</div>' +
      '</div>';
    }
    var btn = "";
    if (news.link) {
      btn = '<a class="btn" href="' + escapeHtml(news.link) + '" style="display:inline-block; font-size:13px; padding:10px 18px;">' +
            escapeHtml(news.button || "VOIR L'ACTUALITÉ") + '</a>';
    }
    return '<article class="' + (large ? "news-card news-card-large" : "news-card") + '" style="margin-bottom:25px;">' +
           img +
           '<h4 style="margin:0 0 10px 0; color:#f28c28;">' + escapeHtml(news.title) + '</h4>' +
           '<p style="margin:0 0 15px 0; line-height:1.6;">' + escapeHtml(news.summary || "") + '</p>' +
           btn +
           '</article>';
  }

  function renderNews(data) {
    const latestContainer = document.getElementById("results-latest-news-content");
    const archivesContainer = document.getElementById("news-archives");
    const moreButton = document.getElementById("results-news-more-button");
    if (!latestContainer || !archivesContainer) return;

    const news = data.news || {};
    const archives = Array.isArray(data.newsArchive) ? data.newsArchive : (Array.isArray(data.newsArchives) ? data.newsArchives : []);
    let expanded = false;

    latestContainer.innerHTML = (news && news.title) ? newsCardHtml(news, true) : "<p>Aucune actualité publiée pour le moment.</p>";

    function updateNewsView() {
      if (!archives.length) {
        archivesContainer.style.display = "none";
        archivesContainer.innerHTML = "";
        if (moreButton) {
          moreButton.hidden = true;
          moreButton.style.display = "none";
        }
        return;
      }
      if (moreButton) {
        moreButton.hidden = false;
        moreButton.style.display = "block";
        moreButton.textContent = expanded ? "RÉDUIRE" : "VOIR PLUS D'ACTUALITÉS";
      }
      if (expanded) {
        archivesContainer.style.display = "block";
        archivesContainer.innerHTML = archives.map(item => newsCardHtml(item, false)).join("");
      } else {
        archivesContainer.style.display = "none";
        archivesContainer.innerHTML = "";
      }
    }

    if (moreButton) {
      moreButton.onclick = function () {
        expanded = !expanded;
        updateNewsView();
      };
    }
    updateNewsView();
  }

  function raceHtml(race) {
    if (!race) return "";
    var img = "";
    if (race.image) {
      img = '<div style="margin-bottom:15px; border-radius:8px; overflow:hidden; border:1px solid rgba(242,140,40,0.3); background:#020b17; cursor:zoom-in;" onclick="window.openGemsRaceLightbox(this.querySelector(\'img\').src, this.querySelector(\'img\').alt)">' +
      '<img src="' + race.image + '" alt="' + escapeHtml(race.name) + '" style="width:100%; height:auto; max-height:480px; object-fit:contain; display:block; margin:0 auto; transition:transform 0.2s;" onmouseover="this.style.transform=\'scale(1.01)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
      '<div style="text-align:center; padding:6px; font-size:11px; font-weight:700; color:#f28c28; background:rgba(7,27,53,0.95); border-top:1px solid rgba(242,140,40,0.2);">🔍 CLIQUER POUR AGRANDIR L''AFFICHE</div>' +
      '</div>';
    }
    var debrief = "";
    if (race.link) {
      debrief = '<a href="' + escapeHtml(race.link) + '" target="_blank" rel="noopener noreferrer" style="color:#f28c28; font-weight:700; font-size:13px; text-decoration:none;">Voir le débrief →</a>';
    }
    var comment = "";
    if (race.comment) {
      comment = '<p style="margin:0 0 12px 0; font-size:14px; line-height:1.5; opacity:0.9;">' + escapeHtml(race.comment) + '</p>';
    }

    return '<article class="race-card" style="margin-bottom:25px; padding:20px; background:rgba(7,27,53,0.6); border-radius:12px; border:1px solid rgba(255,255,255,0.08);">' +
           img +
           '<div style="font-size:13px; color:#f28c28; font-weight:700; margin-bottom:6px;">' +
           escapeHtml(race.date || "Date à venir") + (race.time ? " · " + escapeHtml(race.time) : "") +
           '</div>' +
           '<h4 style="margin:0 0 8px 0; font-size:18px; color:#ffffff;">' + escapeHtml(race.name || "Course") + '</h4>' +
           '<div style="font-size:14px; opacity:0.8; margin-bottom:12px;">' +
           escapeHtml(race.circuit || "") + (race.city ? " · " + escapeHtml(race.city) : "") + (race.category ? " · " + escapeHtml(race.category) : "") +
           '</div>' +
           '<div style="font-size:14px; margin-bottom:12px;">' +
           '<strong style="color:#f28c28;">' + escapeHtml(race.status || "Programmé") + '</strong>' +
           (race.result ? " · Résultat : " + escapeHtml(race.result) : "") +
           (race.bestLap ? " · Meilleur tour : " + escapeHtml(race.bestLap) : "") +
           '</div>' +
           comment +
           debrief +
           '</article>';
  }

  function renderRaces(data) {
    const latestContainer = document.getElementById("results-public-races-list");
    const archivesContainer = document.getElementById("race-archives");
    const moreButton = document.getElementById("results-races-more-button");
    if (!latestContainer || !archivesContainer) return;

    const races = Array.isArray(data.races) ? data.races.slice() : [];
    races.sort(function (a, b) {
      return String(b.date || "").localeCompare(String(a.date || ""));
    });

    const latestRace = races[0];
    const archives = races.slice(1);
    let expanded = false;

    latestContainer.innerHTML = latestRace ? raceHtml(latestRace) : "<p>Aucune course enregistrée pour le moment.</p>";

    function updateArchivesView() {
      if (!archives.length) {
        archivesContainer.style.display = "none";
        archivesContainer.innerHTML = "";
        if (moreButton) {
          moreButton.hidden = true;
          moreButton.style.display = "none";
        }
        return;
      }
      if (moreButton) {
        moreButton.hidden = false;
        moreButton.style.display = "block";
        moreButton.textContent = expanded ? "RÉDUIRE" : ("VOIR PLUS DE COURSES (" + archives.length + ")");
      }
      if (expanded) {
        archivesContainer.style.display = "block";
        archivesContainer.innerHTML = archives.map(raceHtml).join("");
      } else {
        archivesContainer.style.display = "none";
        archivesContainer.innerHTML = "";
      }
    }

    if (moreButton) {
      moreButton.onclick = function () {
        expanded = !expanded;
        updateArchivesView();
      };
    }
    updateArchivesView();
  }

  document.addEventListener("DOMContentLoaded", async function () {
    const data = await loadData();
    renderNews(data);
    renderRaces(data);
  });
})();