(function () {
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
      try {
        const local = await fetch("data/site-data.json", { cache: "no-store" });
        return await local.json();
      } catch (err) {
        return { news: {}, races: [] };
      }
    }
  }

  function newsCardHtml(news) {
    if (!news || !news.title) return "";
    var img = "";
    if (news.image) {
      img = '<div style="margin-bottom:15px; border-radius:10px; overflow:hidden; border:1px solid rgba(242,140,40,0.3);">' +
            '<img src="' + news.image + '" alt="' + escapeHtml(news.title) + '" style="width:100%; max-height:260px; object-fit:cover; display:block;">' +
            '</div>';
    }
    var btn = "";
    if (news.link) {
      btn = '<a class="btn" href="' + escapeHtml(news.link) + '" style="display:inline-block; font-size:13px; padding:10px 18px;">' +
            escapeHtml(news.button || "VOIR L'ACTUALITÉ") + '</a>';
    }
    return '<article class="news-card" style="margin-bottom:25px;">' +
           img +
           '<h4 style="margin:0 0 10px 0; color:#f28c28;">' + escapeHtml(news.title) + '</h4>' +
           '<p style="margin:0 0 15px 0; line-height:1.6;">' + escapeHtml(news.summary || "") + '</p>' +
           btn +
           '</article>';
  }

  function raceHtml(race) {
    if (!race) return "";
    var img = "";
    if (race.image) {
      img = '<div style="margin-bottom:15px; border-radius:8px; overflow:hidden; border:1px solid rgba(242,140,40,0.3);">' +
            '<img src="' + race.image + '" alt="' + escapeHtml(race.name) + '" style="width:100%; max-height:240px; object-fit:cover; display:block;">' +
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

  document.addEventListener("DOMContentLoaded", async function () {
    const data = await loadData();
    const newsEl = document.getElementById("results-latest-news-content");
    if (newsEl && data.news && data.news.title) {
      newsEl.innerHTML = newsCardHtml(data.news);
    }
    const racesEl = document.getElementById("results-public-races-list");
    if (racesEl && Array.isArray(data.races) && data.races.length > 0) {
      var sorted = data.races.slice().sort(function (a, b) {
        return String(b.date || "").localeCompare(String(a.date || ""));
      });
      racesEl.innerHTML = raceHtml(sorted[0]);
    }
  });
})();