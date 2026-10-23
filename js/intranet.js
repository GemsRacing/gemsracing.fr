(function () {
  "use strict";

  const PASSWORD = "GemsRacing88";
  const AUTH_KEY = "gems_auth_status";

  window.gemsData = {
    stats: {},
    news: {},
    gallery: [],
    races: [],
    partners: [],
    tickets: []
  };

  let editingNewsIndex = null;
  let editingRaceIndex = null;
  let editingPartnerIndex = null;

  function value(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  }

  function toast(msg, bg = "#2ecc71") {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.style.background = bg;
    t.style.display = "block";
    t.style.zIndex = "10000";
    setTimeout(() => { t.style.display = "none"; }, 3500);
  }

  function readImage(file, maxDim = 1000, quality = 0.8) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function normalizeData(data) {
    return {
      stats: data?.stats || {},
      news: data?.news || {},
      gallery: Array.isArray(data?.gallery) ? data.gallery : [],
      races: Array.isArray(data?.races) ? data.races : [],
      partners: Array.isArray(data?.partners) ? data.partners : [],
      tickets: Array.isArray(data?.tickets) ? data.tickets : []
    };
  }

  // --- CHARGEMENT ---
  async function loadData() {
    try {
      const response = await fetch("/api/data?t=" + Date.now(), { cache: "no-store" });
      if (!response.ok) throw new Error("Erreur " + response.status);
      window.gemsData = normalizeData(await response.json());
      renderAll();
    } catch (e) {
      console.warn("API hors ligne, utilisation du cache local :", e);
      const local = localStorage.getItem("gems_site_data");
      if (local) {
        try { window.gemsData = normalizeData(JSON.parse(local)); } catch (_) {}
      }
      renderAll();
    }
  }

  // --- SAUVEGARDE & UPLOAD DIRECT AUTOMATIQUE ---
  async function saveData() {
    toast("⏳ Enregistrement et publication en direct...", "#f28c28");
    collectScoring();

    localStorage.setItem("gems_site_data", JSON.stringify(window.gemsData));

    try {
      const response = await fetch("/api/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": PASSWORD
        },
        body: JSON.stringify(window.gemsData)
      });

      if (response.ok) {
        toast("✅ Mis à jour et publié en direct sur le site !");
      } else {
        toast("⚠️ Enregistré en local (Erreur serveur " + response.status + ")", "#e67e22");
      }
    } catch (err) {
      console.error(err);
      toast("⚠️ Enregistré en local (connexion serveur impossible)", "#e67e22");
    }
  }
  window.saveAllData = saveData;

  // --- SCORING ---
  function collectScoring() {
    window.gemsData.stats = {
      victoires: value("stat-victoires") || window.gemsData.stats.victoires || "7",
      podiums: value("stat-podiums") || window.gemsData.stats.podiums || "15",
      sws: value("stat-sws") || window.gemsData.stats.sws || "57e",
      age: value("stat-age") || window.gemsData.stats.age || "16"
    };
  }

  window.saveScoring = async function () {
    collectScoring();
    await saveData();
  };

  function renderScoring() {
    const s = window.gemsData.stats || {};
    setValue("stat-victoires", s.victoires || "");
    setValue("stat-podiums", s.podiums || "");
    setValue("stat-sws", s.sws || "");
    setValue("stat-age", s.age || "");
  }

  // --- ACTUS (1 CLIC = UPLOAD DIRECT) ---
  window.renderNews = function () {
    const list = document.getElementById("news-list-admin");
    if (!list) return;
    const n = window.gemsData.news;
    if (!n || !n.title) {
      list.innerHTML = "<p style='color:rgba(255,255,255,0.4); font-size:13px;'>Aucune actualité en ligne.</p>";
      return;
    }
    list.innerHTML = `
      <div style="background:#071b35; padding:15px; border-radius:8px; border:1px solid rgba(242,140,40,0.3); display:flex; justify-content:space-between; align-items:center; gap:12px;">
        <div style="display:flex; align-items:center; gap:12px;">
          ${n.image ? `<img src="${n.image}" style="width:60px; height:40px; object-fit:cover; border-radius:4px; border:1px solid #f28c28;">` : ""}
          <div>
            <strong style="color:#fff; font-size:15px;">${n.title}</strong>
            <p style="margin:4px 0 0 0; color:rgba(255,255,255,0.7); font-size:13px;">${n.summary || ""}</p>
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn-secondary" style="padding:6px 12px; font-size:12px;" onclick="editNews()">✏️ Modifier</button>
          <button class="btn-secondary" style="padding:6px 12px; font-size:12px; border-color:#e74c3c; color:#e74c3c;" onclick="deleteNews()">🗑️ Supprimer</button>
        </div>
      </div>
    `;
  };

  window.addNews = async function () {
    const title = value("news-title");
    if (!title) { alert("Veuillez indiquer un titre."); return; }

    let imageUrl = value("news-image");
    const fileInput = document.getElementById("news-image-file");
    if (fileInput && fileInput.files && fileInput.files[0]) {
      toast("⏳ Compression de l'image...", "#f28c28");
      imageUrl = await readImage(fileInput.files[0], 1000, 0.8);
    }

    window.gemsData.news = {
      title: title,
      summary: value("news-summary"),
      link: value("news-link") || "resultats.html",
      buttonText: value("news-button") || "VOIR LE DÉBRIEF",
      image: imageUrl
    };

    resetNewsForm();
    window.renderNews();
    await saveData(); // UPLOAD DIRECT EN 1 CLIC !
  };

  window.editNews = function () {
    const n = window.gemsData.news || {};
    setValue("news-title", n.title);
    setValue("news-summary", n.summary);
    setValue("news-link", n.link);
    setValue("news-button", n.buttonText);
    setValue("news-image", n.image);
    const prev = document.getElementById("news-image-preview-img");
    if (prev) {
      if (n.image) { prev.src = n.image; prev.style.display = "block"; }
      else { prev.style.display = "none"; }
    }
    const btn = document.querySelector("#tab-news .btn-primary");
    if (btn) btn.textContent = "💾 METTRE À JOUR L'ACTUALITÉ";
  };

  window.deleteNews = async function () {
    if (!confirm("Supprimer l'actualité en ligne ?")) return;
    window.gemsData.news = {};
    resetNewsForm();
    window.renderNews();
    await saveData(); // UPLOAD DIRECT EN 1 CLIC !
  };

  function resetNewsForm() {
    setValue("news-title", "");
    setValue("news-summary", "");
    setValue("news-link", "");
    setValue("news-button", "VOIR LE DÉBRIEF");
    setValue("news-image", "");
    const fi = document.getElementById("news-image-file");
    if (fi) fi.value = "";
    const prev = document.getElementById("news-image-preview-img");
    if (prev) prev.style.display = "none";
    const btn = document.querySelector("#tab-news .btn-primary");
    if (btn) btn.textContent = "➕ PUBLIER L'ACTUALITÉ";
  }

  // --- AGENDA COURSES (1 CLIC = SAUVEGARDE & UPLOAD) ---
  window.renderRaces = function () {
    const list = document.getElementById("races-list");
    if (!list) return;
    const races = window.gemsData.races || [];
    if (races.length === 0) {
      list.innerHTML = "<p style='color:rgba(255,255,255,0.4); font-size:13px;'>Aucune course enregistrée.</p>";
      return;
    }

    list.innerHTML = races.map((r, i) => `
      <div style="background:#071b35; padding:15px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
        <div style="display:flex; align-items:center; gap:12px; flex:1;">
          ${r.image ? `<img src="${r.image}" style="width:65px; height:45px; object-fit:cover; border-radius:6px; border:1px solid #f28c28;">` : ""}
          <div>
            <strong style="color:#fff; font-size:15px;">${r.name || "Course sans nom"}</strong>
            <p style="margin:4px 0 0 0; color:rgba(255,255,255,0.7); font-size:12px;">
              📅 ${r.date || "Date à venir"} ${r.time ? "· ⏰ " + r.time : ""} · 📍 ${r.circuit || ""} ${r.city ? "(" + r.city + ")" : ""} · 🏁 ${r.status || "Programmé"}
            </p>
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn-secondary" style="padding:6px 12px; font-size:12px;" onclick="editRace(${i})">✏️ Modifier</button>
          <button class="btn-secondary" style="padding:6px 12px; font-size:12px; border-color:#e74c3c; color:#e74c3c;" onclick="deleteRace(${i})">🗑️ Supprimer</button>
        </div>
      </div>
    `).join("");
  };

  window.addRace = async function () {
    const name = value("race-name");
    const date = value("race-date");
    if (!name || !date) { alert("Veuillez indiquer au moins le nom et la date de la course."); return; }

    let imageUrl = value("race-image");
    const fileInput = document.getElementById("race-image-file");
    if (fileInput && fileInput.files && fileInput.files[0]) {
      toast("⏳ Compression de la photo de course...", "#f28c28");
      imageUrl = await readImage(fileInput.files[0], 1000, 0.8);
    }

    const raceData = {
      id: (editingRaceIndex !== null && window.gemsData.races[editingRaceIndex]?.id) ? window.gemsData.races[editingRaceIndex].id : Date.now(),
      date: date,
      time: value("race-time"),
      name: name,
      circuit: value("race-circuit"),
      city: value("race-city"),
      category: value("race-category"),
      pilots: value("race-pilots"),
      startPosition: value("race-start-position"),
      result: value("race-result"),
      bestLap: value("race-best-lap"),
      comment: value("race-comment"),
      status: value("race-status") || "Programmé",
      link: value("race-link"),
      image: imageUrl
    };

    if (editingRaceIndex !== null) {
      window.gemsData.races[editingRaceIndex] = raceData;
      editingRaceIndex = null;
    } else {
      window.gemsData.races.unshift(raceData);
    }

    resetRaceForm();
    window.renderRaces();
    await saveData(); // UPLOAD DIRECT EN 1 CLIC !
  };

  window.editRace = function (i) {
    editingRaceIndex = i;
    const r = window.gemsData.races[i];
    if (!r) return;

    setValue("race-date", r.date);
    setValue("race-time", r.time);
    setValue("race-name", r.name);
    setValue("race-circuit", r.circuit);
    setValue("race-city", r.city);
    setValue("race-category", r.category);
    setValue("race-pilots", r.pilots);
    setValue("race-start-position", r.startPosition);
    setValue("race-result", r.result);
    setValue("race-best-lap", r.bestLap);
    setValue("race-comment", r.comment);
    setValue("race-status", r.status);
    setValue("race-link", r.link);
    setValue("race-image", r.image);

    const prev = document.getElementById("race-image-preview-img");
    if (prev) {
      if (r.image) { prev.src = r.image; prev.style.display = "block"; }
      else { prev.style.display = "none"; }
    }

    const btn = document.querySelector("#tab-races .btn-primary");
    if (btn) btn.textContent = "💾 METTRE À JOUR LA COURSE";

    document.getElementById("tab-races")?.scrollIntoView({ behavior: "smooth" });
  };

  window.deleteRace = async function (i) {
    if (!confirm("Supprimer cette course du calendrier ?")) return;
    window.gemsData.races.splice(i, 1);
    resetRaceForm();
    window.renderRaces();
    await saveData(); // UPLOAD DIRECT EN 1 CLIC !
  };

  function resetRaceForm() {
    editingRaceIndex = null;
    setValue("race-date", "");
    setValue("race-time", "");
    setValue("race-name", "");
    setValue("race-circuit", "");
    setValue("race-city", "");
    setValue("race-category", "");
    setValue("race-pilots", "");
    setValue("race-start-position", "");
    setValue("race-result", "");
    setValue("race-best-lap", "");
    setValue("race-comment", "");
    setValue("race-status", "Programmé");
    setValue("race-link", "");
    setValue("race-image", "");
    const fi = document.getElementById("race-image-file");
    if (fi) fi.value = "";
    const prev = document.getElementById("race-image-preview-img");
    if (prev) prev.style.display = "none";
    const btn = document.querySelector("#tab-races .btn-primary");
    if (btn) btn.textContent = "➕ AJOUTER LA COURSE";
  }

  // --- GALERIE (1 CLIC = UPLOAD) ---
  window.renderGallery = function () {
    const grid = document.getElementById("gallery-grid");
    if (!grid) return;
    grid.innerHTML = (window.gemsData.gallery || []).map((item, i) => `
      <div style="position:relative; background:#071b35; border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.08);">
        <img src="${item.image || item.src}" style="width:100%; height:130px; object-fit:cover;">
        <p style="padding:6px; margin:0; font-size:11px; color:#fff;">${item.caption || ""}</p>
        <button style="position:absolute; top:5px; right:5px; background:rgba(231,76,60,0.85); color:#fff; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;" onclick="deleteGalleryPhoto(${i})">🗑️</button>
      </div>
    `).join("");
  };

  window.addGalleryPhoto = async function () {
    const fi = document.getElementById("gallery-file");
    if (!fi || !fi.files || !fi.files[0]) { alert("Choisissez une photo."); return; }
    toast("⏳ Compression de la photo...", "#f28c28");
    const src = await readImage(fi.files[0], 1200, 0.85);
    window.gemsData.gallery.unshift({
      id: Date.now(),
      image: src,
      src: src,
      caption: value("gallery-caption")
    });
    fi.value = "";
    setValue("gallery-caption", "");
    window.renderGallery();
    await saveData(); // UPLOAD DIRECT EN 1 CLIC !
  };

  window.deleteGalleryPhoto = async function (i) {
    if (!confirm("Supprimer cette photo ?")) return;
    window.gemsData.gallery.splice(i, 1);
    window.renderGallery();
    await saveData(); // UPLOAD DIRECT EN 1 CLIC !
  };

  // --- PARTENAIRES (1 CLIC = UPLOAD) ---
  window.renderPartners = function () {
    const list = document.getElementById("partners-list");
    if (!list) return;
    list.innerHTML = (window.gemsData.partners || []).map((p, i) => `
      <div style="background:#071b35; padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:12px;">
          ${p.logo ? `<img src="${p.logo}" style="height:35px; max-width:70px; object-fit:contain; background:rgba(255,255,255,0.05); padding:3px; border-radius:4px;">` : ""}
          <strong style="color:#fff;">${p.name}</strong>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn-secondary" style="padding:6px 12px; font-size:12px;" onclick="editPartner(${i})">✏️ Modifier</button>
          <button class="btn-secondary" style="padding:6px 12px; font-size:12px; border-color:#e74c3c; color:#e74c3c;" onclick="deletePartner(${i})">🗑️ Supprimer</button>
        </div>
      </div>
    `).join("");
  };

  window.addPartner = async function () {
    const name = value("partner-name");
    if (!name) { alert("Nom du partenaire obligatoire."); return; }

    let logoUrl = value("partner-logo-preview");
    const fileInput = document.getElementById("partner-logo-file");
    if (fileInput && fileInput.files && fileInput.files[0]) {
      logoUrl = await readImage(fileInput.files[0], 600, 0.85);
    }

    const partnerData = {
      name: name,
      url: value("partner-url") || "#",
      logo: logoUrl
    };

    if (editingPartnerIndex !== null) {
      window.gemsData.partners[editingPartnerIndex] = partnerData;
      editingPartnerIndex = null;
    } else {
      window.gemsData.partners.push(partnerData);
    }

    resetPartnerForm();
    window.renderPartners();
    await saveData(); // UPLOAD DIRECT EN 1 CLIC !
  };

  window.editPartner = function (i) {
    editingPartnerIndex = i;
    const p = window.gemsData.partners[i];
    if (!p) return;
    setValue("partner-name", p.name);
    setValue("partner-url", p.url);
    setValue("partner-logo-preview", p.logo);
    const prev = document.getElementById("partner-logo-preview-img");
    if (prev) {
      if (p.logo) { prev.src = p.logo; prev.style.display = "block"; }
      else { prev.style.display = "none"; }
    }
    const btn = document.querySelector("#tab-partners .btn-primary");
    if (btn) btn.textContent = "💾 METTRE À JOUR LE PARTENAIRE";
  };

  window.deletePartner = async function (i) {
    if (!confirm("Supprimer ce partenaire ?")) return;
    window.gemsData.partners.splice(i, 1);
    resetPartnerForm();
    window.renderPartners();
    await saveData(); // UPLOAD DIRECT EN 1 CLIC !
  };

  function resetPartnerForm() {
    editingPartnerIndex = null;
    setValue("partner-name", "");
    setValue("partner-url", "");
    setValue("partner-logo-preview", "");
    const fi = document.getElementById("partner-logo-file");
    if (fi) fi.value = "";
    const prev = document.getElementById("partner-logo-preview-img");
    if (prev) prev.style.display = "none";
    const btn = document.querySelector("#tab-partners .btn-primary");
    if (btn) btn.textContent = "➕ AJOUTER LE PARTENAIRE";
  }

  // --- MESSAGES / TICKETS ---
  window.renderTickets = function () {
    const list = document.getElementById("tickets-list");
    const badge = document.getElementById("intra-badge-tickets");
    const t = window.gemsData.tickets || [];
    if (badge) {
      badge.textContent = t.length;
      badge.style.display = t.length > 0 ? "inline-block" : "none";
    }
    if (!list) return;
    if (t.length === 0) {
      list.innerHTML = "<p style='color:rgba(255,255,255,0.4); font-size:13px;'>Aucun message reçu.</p>";
      return;
    }
    list.innerHTML = t.map((m, i) => `
      <div style="background:#071b35; padding:15px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color:#f28c28;">${m.name || "Visiteur"} · <span style="color:#fff; font-size:12px;">${m.subject || "Contact"}</span></strong>
          <button class="btn-secondary" style="padding:4px 8px; font-size:11px; border-color:#e74c3c; color:#e74c3c;" onclick="deleteTicket(${i})">Supprimer</button>
        </div>
        <p style="margin:8px 0; color:rgba(255,255,255,0.85); font-size:13px;">${m.message || ""}</p>
        <div style="font-size:11px; color:rgba(255,255,255,0.5);">
          📧 ${m.email || "-"} · 📞 ${m.phone || "-"} · 📅 ${m.date || ""}
        </div>
      </div>
    `).join("");
  };

  window.deleteTicket = async function (i) {
    if (!confirm("Supprimer ce message ?")) return;
    window.gemsData.tickets.splice(i, 1);
    window.renderTickets();
    await saveData();
  };

  window.toggleManualTicketBox = function () {
    const box = document.getElementById("manual-ticket-box");
    if (box) box.style.display = box.style.display === "none" ? "block" : "none";
  };

  window.saveManualTicket = async function () {
    const name = value("manual-ticket-name");
    const msg = value("manual-ticket-message");
    if (!name || !msg) { alert("Nom et message requis."); return; }
    window.gemsData.tickets.unshift({
      id: Date.now(),
      name: name,
      email: value("manual-ticket-email"),
      phone: value("manual-ticket-phone"),
      subject: value("manual-ticket-subject") || value("manual-ticket-type"),
      message: msg,
      date: new Date().toLocaleDateString("fr-FR")
    });
    setValue("manual-ticket-name", "");
    setValue("manual-ticket-email", "");
    setValue("manual-ticket-phone", "");
    setValue("manual-ticket-subject", "");
    setValue("manual-ticket-message", "");
    window.toggleManualTicketBox();
    window.renderTickets();
    await saveData();
  };

  // --- NAVIGATION ---
  window.showTab = function (tabName, el) {
    document.querySelectorAll(".tab-content").forEach(s => s.hidden = true);
    document.querySelectorAll(".intra-nav-item").forEach(n => n.classList.remove("active"));
    const target = document.getElementById("tab-" + tabName);
    if (target) target.hidden = false;
    if (el) el.classList.add("active");
  };

  function renderAll() {
    renderScoring();
    window.renderNews();
    window.renderGallery();
    window.renderRaces();
    window.renderPartners();
    window.renderTickets();
  }

  // --- AUTHENTIFICATION ---
  window.checkPass = function () {
    const input = document.getElementById("pass-input");
    const overlay = document.getElementById("login-overlay");
    if ((input?.value || "").trim() !== PASSWORD) {
      alert("Mot de passe incorrect.");
      return;
    }
    sessionStorage.setItem(AUTH_KEY, "true");
    if (overlay) overlay.style.display = "none";
    document.body.classList.remove("is-locked");
  };

  window.logoutIntranet = function () {
    sessionStorage.removeItem(AUTH_KEY);
    location.reload();
  };

  // --- INIT ---
  document.addEventListener("DOMContentLoaded", function () {
    const isAuth = sessionStorage.getItem(AUTH_KEY);
    const overlay = document.getElementById("login-overlay");
    if (isAuth === "true" && overlay) {
      overlay.style.display = "none";
      document.body.classList.remove("is-locked");
    }

    const passInput = document.getElementById("pass-input");
    if (passInput) {
      passInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          window.checkPass();
        }
      });
    }

    const toggleBtn = document.getElementById("toggle-password");
    if (toggleBtn && passInput) {
      toggleBtn.addEventListener("click", function () {
        const isPass = passInput.type === "password";
        passInput.type = isPass ? "text" : "password";
        toggleBtn.textContent = isPass ? "Masquer" : "Afficher";
      });
    }

    loadData();
  });
})();