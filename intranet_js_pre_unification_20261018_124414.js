let data = {};

document.addEventListener("DOMContentLoaded", async function () {
  data = await loadData();
  loadForms();
  renderNewsPreview();
  renderGallery();
  renderRaces();
  renderPartners();
});

async function loadData() {
  try {
    const response = await fetch("/api/site-data", {
      cache: "no-store"
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn("Serveur de sauvegarde indisponible.", error);
  }

  return window.GEMS_DATA || {
    stats: {},
    news: {},
    races: [],
    gallery: [],
    partners: []
  };
}

async function saveAllData() {
  collectForms();

  try {
    const response = await fetch("/api/site-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error("Sauvegarde refusée");
    }

    showToast("✅ Modifications enregistrées sur le site");
  } catch (error) {
    localStorage.setItem("gems_intranet_backup", JSON.stringify(data));
    showToast("⚠️ Sauvegarde locale uniquement");
  }
}

function collectForms() {
  data.stats = data.stats || {};
  data.news = data.news || {};

  data.stats.victoires =
    document.getElementById("stat-victoires")?.value || "";

  data.stats.podiums =
    document.getElementById("stat-podiums")?.value || "";

  data.stats.sws =
    document.getElementById("stat-sws")?.value || "";

  data.stats.age =
    document.getElementById("stat-age")?.value || "";

  data.news.title =
    document.getElementById("news-title")?.value || "";

  data.news.summary =
    document.getElementById("news-summary")?.value || "";

  data.news.link =
    document.getElementById("news-link")?.value || "resultats.html";

  data.news.button =
    document.getElementById("news-button")?.value || "VOIR LES RÉSULTATS";
}

function loadForms() {
  document.getElementById("stat-victoires").value =
    data.stats?.victoires || "";

  document.getElementById("stat-podiums").value =
    data.stats?.podiums || "";

  document.getElementById("stat-sws").value =
    data.stats?.sws || "";

  document.getElementById("stat-age").value =
    data.stats?.age || "";

  document.getElementById("news-title").value =
    data.news?.title || "";

  document.getElementById("news-summary").value =
    data.news?.summary || "";

  document.getElementById("news-link").value =
    data.news?.link || "resultats.html";

  document.getElementById("news-button").value =
    data.news?.button || "VOIR LES RÉSULTATS";
}

function showTab(name, item) {
  document.querySelectorAll(".tab-content").forEach(tab => {
    tab.hidden = true;
  });

  document.querySelectorAll(".intra-nav-item").forEach(nav => {
    nav.classList.remove("active");
  });

  const tab = document.getElementById("tab-" + name);

  if (tab) {
    tab.hidden = false;
  }

  if (item) {
    item.classList.add("active");
  }
}

function renderNewsPreview() {
  const preview = document.getElementById("news-preview");

  if (!preview || !data.news) {
    return;
  }

  preview.innerHTML = `
    <small>Dernière actualité</small>
    <h3>${escapeHtml(data.news.title || "")}</h3>
    <p>${escapeHtml(data.news.summary || "")}</p>
  `;

  preview.style.display = "block";
}

function renderGallery() {
  if (typeof window.renderGallery === "function") {
    window.renderGallery();
  }
}

function renderRaces() {
  if (typeof window.renderRaces === "function") {
    window.renderRaces();
  }
}

function renderPartners() {
  if (typeof window.renderPartners === "function") {
    window.renderPartners();
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
  // --- Logique de Connexion / Déconnexion (déplacée de intranet.html) ---
  const AUTH_KEY = "gems_auth_v2";
  const PASSWORD = "GemsRacing88"; // ATTENTION: Mot de passe en clair - Vulnérabilité de sécurité majeure!

  const loginOverlay = document.getElementById("login-overlay");
  const passInput = document.getElementById("pass-input");

  function showLoginOverlay() {
    if (loginOverlay) {
      loginOverlay.style.display = "flex";
    }
    document.body.classList.add("is-locked");
    if (passInput) {
      passInput.value = "";
      setTimeout(() => passInput.focus(), 100);
    }
  }

  function hideLoginOverlay() {
    if (loginOverlay) {
      loginOverlay.style.display = "none";
    }
    document.body.classList.remove("is-locked");
  }

  window.checkPass = function () {
    const value = passInput ? passInput.value : "";
    if (value === PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "true");
      hideLoginOverlay();
      // Initialiser les onglets après connexion réussie
      window.showTab('scoring', document.querySelector('.intra-nav-item.active'));
    } else {
      alert("Mot de passe incorrect.");
      showLoginOverlay();
    }
  };

  window.logoutIntranet = function () {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.reload(); // Recharger la page pour afficher l'écran de connexion
  };

  if (passInput) {
    passInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        window.checkPass();
      }
    });
  }

  // Vérification de l'état de connexion au chargement
  if (sessionStorage.getItem(AUTH_KEY) === "true") {
    hideLoginOverlay();
    // Afficher le premier onglet par défaut après connexion
    document.addEventListener('DOMContentLoaded', () => {
      window.showTab('scoring', document.querySelector('.intra-nav-item.active'));
    });
  } else {
    showLoginOverlay();
  }
  // --- Fin Logique de Connexion / Déconnexion ---