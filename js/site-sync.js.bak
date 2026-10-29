document.addEventListener("DOMContentLoaded", async function() {
    let data = null;
    try {
        const response = await fetch("/api/data?t=" + Date.now(), { cache: "no-store" });
        if (response.ok) {
            data = await response.json();
        }
    } catch (e) {
        console.warn("API non joignable, tentative sur data/site-data.json");
    }

    if (!data) {
        try {
            const localResp = await fetch("data/site-data.json?t=" + Date.now(), { cache: "no-store" });
            if (localResp.ok) data = await localResp.json();
        } catch (e2) {}
    }

    if (!data || !data.stats) return;

    function safeSetText(id, text) {
        const el = document.getElementById(id);
        if (el && text !== undefined && text !== null) el.textContent = text;
    }

    function safeSetHref(id, url) {
        const el = document.getElementById(id);
        if (el && url) el.href = url;
    }

    const s = data.stats;

    // --- ACCUEIL & COMMUNS ---
    safeSetText("stat-victoires-display", s.victoires || "7");
    safeSetText("stat-victoires-kart", s.victoires || "7");
    safeSetText("stat-podiums-display", s.podiums || "16");
    safeSetText("stat-sws-display", s.sws || "57e");

    let age = s.age || "16";
    age = age.toString().replace(" ans", "").replace("ans", "").trim();
    safeSetText("stat-age-display", age + " ans");

    // --- GRILLE DES 6 COMPTEURS (RESULTATS.HTML) ---
    safeSetText("stat-sws-france-display", s.sws || "57e");
    safeSetText("stat-courses-disputees-display", s.coursesDisputees || "37");
    safeSetText("stat-sws-mondial-display", s.swsMondial || "172e");
    safeSetText("stat-dernier-resultat-display", s.dernierResultat || "3e / 27");

    // --- ACTUALITÉ ---
    if (data.news && data.news.title) {
        safeSetText("latest-news-title-display", data.news.title);
        safeSetText("latest-news-summary-display", data.news.summary);
        safeSetHref("latest-news-link-display", data.news.link);
    }
    // --- SYNCHRONISATION PROCHAINE COURSE ACCUEIL ---
    if (data.races && Array.isArray(data.races) && data.races.length > 0) {
        const sorted = data.races.slice().sort((a,b) => String(b.date || "").localeCompare(String(a.date || "")));
        const upcoming = sorted.find(r => r.status === "Programmé") || sorted[0];
        if (upcoming) {
            let dStr = upcoming.date || "Date à venir";
            if (upcoming.circuit) dStr += " · " + upcoming.circuit;
            if (upcoming.city) dStr += " (" + upcoming.city + ")";
            safeSetText("home-next-race-date", dStr);
            safeSetText("home-next-race-title", upcoming.name || "Course officielle");
            let dDetails = (upcoming.category ? upcoming.category + " · " : "") + (upcoming.comment || "Suivez le déroulement de la course et les chronos sur Instagram.");
            safeSetText("home-next-race-details", dDetails);
        }
    }
});