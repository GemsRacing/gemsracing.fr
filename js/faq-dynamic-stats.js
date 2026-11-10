(function () {
  "use strict";

  function updateText(text, stats) {
    let updated = text;

    if (stats.victoires != null && stats.podiums != null) {
      updated = updated.replace(
        /\b\d+\s+victoires?\s+et\s+\d+\s+podiums?\s+en\s+(\d{4})\b/gi,
        function (_, year) {
          return String(stats.victoires).trim() +
            " victoires et " +
            String(stats.podiums).trim() +
            " podiums en " + year;
        }
      );
    }

    if (stats.sws != null) {
      updated = updated.replace(
        /\bse classant\s+\d+(?:er|e)?\s+au classement SWS France\b/gi,
        "se classant " + String(stats.sws).trim() +
          " au classement SWS France"
      );
    }

    return updated;
  }

  function updateVisibleAnswer(stats) {
    let changed = 0;
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );

    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || parent.closest("script, style, noscript")) continue;

      const updated = updateText(node.nodeValue, stats);
      if (updated !== node.nodeValue) {
        node.nodeValue = updated;
        changed++;
      }
    }
    return changed;
  }

  function updateFaqSchema(stats) {
    let changed = 0;
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );

    scripts.forEach(function (script) {
      try {
        const data = JSON.parse(script.textContent);
        const nodes = [data];

        if (Array.isArray(data["@graph"])) {
          nodes.push.apply(nodes, data["@graph"]);
        }

        let schemaChanged = false;
        nodes.forEach(function (node) {
          if (node["@type"] !== "FAQPage" || !Array.isArray(node.mainEntity)) {
            return;
          }

          node.mainEntity.forEach(function (item) {
            const question = String(item.name || "");
            const answer = item.acceptedAnswer;

            if (
              question.indexOf("Pourquoi Gems Maréchal est-il considéré") === 0 &&
              answer &&
              typeof answer.text === "string"
            ) {
              const updated = updateText(answer.text, stats);
              if (updated !== answer.text) {
                answer.text = updated;
                schemaChanged = true;
                changed++;
              }
            }
          });
        });

        if (schemaChanged) {
          script.textContent = JSON.stringify(data);
        }
      } catch (error) {
        console.warn("Le schéma FAQ n'a pas pu être actualisé.", error);
      }
    });

    return changed;
  }

  async function fetchStats(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);

    const payload = await response.json();
    const stats = payload && payload.stats;

    if (
      !stats ||
      stats.victoires == null ||
      stats.podiums == null ||
      stats.sws == null
    ) {
      throw new Error("Les statistiques attendues sont absentes.");
    }

    return stats;
  }

  async function start() {
    let stats = null;

    try {
      stats = await fetchStats("/api/data?t=" + Date.now());
    } catch (apiError) {
      try {
        stats = await fetchStats("/data/site-data.json?t=" + Date.now());
      } catch (fallbackError) {
        console.warn("Statistiques FAQ indisponibles.", fallbackError);
        return;
      }
    }

    const visibleCount = updateVisibleAnswer(stats);
    const schemaCount = updateFaqSchema(stats);

    if (visibleCount === 0 && schemaCount === 0) {
      console.warn("Aucun texte statistique FAQ n'a été actualisé.");
    } else {
      console.info("Statistiques FAQ actualisées.", {
        victoires: stats.victoires,
        podiums: stats.podiums,
        classementSWS: stats.sws
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();