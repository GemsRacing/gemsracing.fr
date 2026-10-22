document.addEventListener("DOMContentLoaded", function() {
    fetch("/api/data", { cache: "no-store" })
    .then(response => {
        if (!response.ok) throw new Error("Erreur serveur " + response.status);
        return response.json();
    })
    .then(data => {
        if (!data || !data.stats) return;
        // Fonction utilitre pour mettre à jour en toute sécurité
        function safeSetText(id, text) {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        }
        function safeSetHref(id, url) {
            const el = document.getElementById(id);
            if (el && url) el.href = url;
        }
        // Mise à jour des stats
        const v = data.stats.victoires || "0";
        safeSetText("stat-victoires-display", v);
        safeSetText("stat-victoires-kart", v);
        safeSetText("stat-podiums-display", data.stats.podiums || "0");
        safeSetText("stat-sws-display", data.stats.sws || "-");
        let age = data.stats.age || "0";
        age = age.toString().replace(" ans", "").replace("ans", "");
        safeSetText("stat-age-display", age + " ans");
        // Mise à jour de l'actualité
        if (data.news && data.news.title) {
            safeSetText("latest-news-title-display", data.news.title);
            safeSetText("latest-news-summary-display", data.news.summary);
            safeSetHref("latest-news-link-display", data.news.link);
        }
    })
    .catch(err => console.error("Erreur synchro site :", err));
});

