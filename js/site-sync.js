document.addEventListener("DOMContentLoaded", function() {
    fetch("/api/data", { cache: "no-store" })
    .then(response => response.json())
    .then(data => {
        if (!data || !data.stats) return;

        // Mise à jour des stats
        const v = data.stats.victoires || "0";
        document.getElementById("stat-victoires-display").textContent = v;
        document.getElementById("stat-victoires-kart").textContent = v;
        document.getElementById("stat-podiums-display").textContent = data.stats.podiums || "0";
        document.getElementById("stat-sws-display").textContent = data.stats.sws || "-";
        
        // On enlève "ans" du JSON s'il y est déjà pour éviter le doublon
        let age = data.stats.age || "0";
        age = age.toString().replace(" ans", "").replace("ans", "");
        document.getElementById("stat-age-display").textContent = age + " ans";

        // Mise à jour de l'actualité
        if (data.news && data.news.title) {
            document.getElementById("latest-news-title-display").textContent = data.news.title;
            document.getElementById("latest-news-summary-display").textContent = data.news.summary;
            document.getElementById("latest-news-link-display").href = data.news.link;
        }
    })
    .catch(err => console.error("Erreur synchro site :", err));
});
