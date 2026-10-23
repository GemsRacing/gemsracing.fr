(function () {
  const AUTH_KEY = "gems_auth_v2";
  const PASSWORD = "GemsRacing88";

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

  // --- UTILITIES ---
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function value(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? "";
  }

  function toast(msg, bg = "#2ecc71") {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.style.background = bg;
    t.style.display = "block";
    setTimeout(() => { t.style.display = "none"; }, 3000);
  }

  // Compression automatique d'image (redimensionne à 1000px max, JPEG léger ~60Ko)
  async function readImage(file, maxWidth = 1000, quality = 0.8) {
    return new Promise((resolve) => {
      if (!file) { resolve(""); return; }
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = function () { resolve(e.target.result); };
        img.src = e.target.result;
      };
      reader.onerror = function () { resolve(""); };
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

  // --- CHARGEMENT & SAUVEGARDE ---
  async function loadData() {
    try {
      const response = await fetch("/api/data", { cache: "no-store" });
      if (response.ok) {
        window.gemsData = normalizeData(await response.json());
      }
    } catch (e) {
      console.warn("Erreur chargement API :", e);
    }
    populateForms();
    renderAll();
  }

  async function saveData() {
    toast("⏳ Publication en cours...", "#f28c28");
    collectForms();
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
        toast("✅ Données publiées en direct !");
      } else {
        toast("❌ Erreur serveur lors de la publication.", "#e74c3c");
      }
    } catch (e) {
      console.error(e);
      toast("❌ Échec de la connexion.", "#e74c3c");
    }
  }
  window.saveAllData = saveData;

  // --- AUTHENTIFICATION ---
  window.checkPass = function () {
    const input = document.getElementById("pass-input");
    const overlay = document.getElementById("login-overlay");
    if ((input?.value || "") !== PASSWORD) {
      alert("Mot de passe incorrect.");
      return;
    }
    sessionStorage.setItem(AUTH_KEY, "true");
    document.body.classList.remove("is-locked");
    if (overlay) overlay.style.display = "none";
    loadData();
  };

  window.logoutIntranet = function () {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.reload();
  };

  // --- ONGLETS ---
  window.showTab = function (tabName, el) {
    document.querySelectorAll(".tab-content").forEach(t => t.hidden = true);
    document.querySelectorAll(".intra-nav-item").forEach(n => n.classList.remove("active"));
    const target = document.getElementById("tab-" + tabName);
    if (target) target.hidden = false;
    if (el) el.classList.add("active");
  };

  // --- FORMULAIRES ---
  function populateForms() {
    setValue("stat-victoires", window.gemsData.stats.victoires);
    setValue("stat-podiums", window.gemsData.stats.podiums);
    setValue("stat-sws", window.gemsData.stats.sws);
    setValue("stat-age", window.gemsData.stats.age);
  }

  function collectForms() {
    window.gemsData.stats = {
      victoires: value("stat-victoires"),
      podiums: value("stat-podiums"),
      sws: value("stat-sws"),
      age: value("stat-age")
    };
  }

  function renderAll() {
    window.renderNews();
    window.renderGallery();
    window.renderRaces();
    window.renderPartners();
    window.renderTickets();
  }

  // --- NEWS MANAGEMENT ---
  window.renderNews = function () {
    const list = document.getElementById("news-list-admin");
    if (!list) return;
    const news = window.gemsData.news;
    if (!news || !news.title) {
      list.innerHTML = "<p style='color:rgba(255,255,255,0.6); font-size:14px;'>Aucune actualité publiée actuellement.</p>";
      return;
    }
    list.innerHTML = `
      <div class="list-item" style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 16px; background:#071b35; border:1px solid rgba(255,255,255,0.08); border-radius:8px; margin-top:15px;">
        <div style="display:flex; align-items:center; gap:14px; min-width:0; flex-grow:1;">
          ${news.image ? `<img src="${escapeHtml(news.image)}" alt="" style="width:52px; height:52px; object-fit:cover; border-radius:6px; flex-shrink:0; border:1px solid rgba(242,140,40,0.5);">` : ''}
          <div class="list-item-main" style="min-width:0;">
            <strong style="color:#fff; font-size:15px; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(news.title)}</strong>
            <small style="color:rgba(255,255,255,0.65); font-size:12px; display:block; margin-top:2px;">
              ${escapeHtml(news.summary || '')} · <span style="color:#f28c28;">${escapeHtml(news.link || '')}</span>
            </small>
          </div>
        </div>
        <div class="list-actions" style="display:flex; gap:8px; flex-shrink:0;">
          <button type="button" class="btn-secondary" style="font-size:12px; padding:6px 12px; border:1px solid #f28c28; color:#f28c28; background:transparent; border-radius:6px; cursor:pointer;" onclick="window.editNews()">✏️ Modifier</button>
          <button type="button" class="btn-danger" style="font-size:12px; padding:6px 12px; background:#e74c3c; color:#fff; border:none; border-radius:6px; cursor:pointer;" onclick="window.deleteNews()">🗑 Supprimer</button>
        </div>
      </div>
    `;
  };

  window.addNews = async function () {
    let imageUrl = value("news-image") || "";
    const fileInput = document.getElementById("news-image-file");
    if (fileInput && fileInput.files && fileInput.files[0]) {
      imageUrl = await readImage(fileInput.files[0]);
    }
    const title = value("news-title");
    if (!title) { toast("ℹ️ Indique au moins un titre."); return; }
    window.gemsData.news = {
      title: title,
      summary: value("news-summary"),
      link: value("news-link"),
      button: value("news-button") || "VOIR LE DÉBRIEF",
      image: imageUrl
    };
    window.renderNews();
    resetNewsForm();
    await saveData();
  };

  window.editNews = function () {
    const news = window.gemsData.news || {};
    setValue("news-title", news.title);
    setValue("news-summary", news.summary);
    setValue("news-link", news.link);
    setValue("news-button", news.button || "VOIR LE DÉBRIEF");
    setValue("news-image", news.image);
    const imgPrev = document.getElementById("news-image-preview-img");
    if (imgPrev) {
      imgPrev.src = news.image || "";
      imgPrev.style.display = news.image ? "block" : "none";
    }
    const pubBtn = document.querySelector("#tab-news .btn-primary");
    if (pubBtn) pubBtn.textContent = "💾 METTRE À JOUR L'ACTUALITÉ";
  };

  function resetNewsForm() {
    setValue("news-title", "");
    setValue("news-summary", "");
    setValue("news-link", "");
    setValue("news-button", "VOIR LE DÉBRIEF");
    setValue("news-image", "");
    const fileInput = document.getElementById("news-image-file");
    if (fileInput) fileInput.value = "";
    const imgPrev = document.getElementById("news-image-preview-img");
    if (imgPrev) imgPrev.style.display = "none";
    const pubBtn = document.querySelector("#tab-news .btn-primary");
    if (pubBtn) pubBtn.textContent = "➕ PUBLIER L'ACTUALITÉ";
  }

  window.deleteNews = async function () {
    if (!confirm("Supprimer cette actualité ?")) return;
    window.gemsData.news = {};
    window.renderNews();
    resetNewsForm();
    await saveData();
  };

  // --- GALLERY MANAGEMENT ---
  window.renderGallery = function () {
    const grid = document.getElementById("gallery-grid");
    if (!grid) return;
    const gallery = window.gemsData.gallery || [];
    if (!gallery.length) {
      grid.innerHTML = "<p>Aucune photo enregistrée.</p>";
      return;
    }
    grid.innerHTML = gallery.map((photo, index) => `
      <div class="photo-admin-card" style="background:#071b35; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
        <img src="${photo.src}" alt="${escapeHtml(photo.caption || '')}" style="width:100%; height:120px; object-fit:cover; border-radius:6px;">
        <p style="font-size:12px; color:#fff; margin:6px 0;">${escapeHtml(photo.caption || 'Sans légende')}</p>
        <button class="btn-danger" style="font-size:11px; padding:4px 8px; width:100%;" onclick="window.deleteGalleryPhoto(${index})">🗑 Supprimer</button>
      </div>
    `).join("");
  };

  window.addGalleryPhoto = async function () {
    const fileInput = document.getElementById("gallery-file");
    const caption = value("gallery-caption");
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      toast("ℹ️ Choisis un fichier photo.");
      return;
    }
    toast("⏳ Traitement de la photo...", "#f28c28");
    const src = await readImage(fileInput.files[0], 1200, 0.85);
    window.gemsData.gallery.push({ src, caption });
    window.renderGallery();
    fileInput.value = "";
    setValue("gallery-caption", "");
    await saveData();
  };

  window.deleteGalleryPhoto = async function (index) {
    if (!confirm("Supprimer cette photo ?")) return;
    window.gemsData.gallery.splice(index, 1);
    window.renderGallery();
    await saveData();
  };

  // --- RACES MANAGEMENT (TOTALEMENT RÉPARÉ & AVEC PHOTO) ---
  window.renderRaces = function () {
    const list = document.getElementById("races-list");
    if (!list) return;
    const races = window.gemsData.races || [];
    if (!races.length) {
      list.innerHTML = "<p style='color:rgba(255,255,255,0.6); font-size:14px;'>Aucune course enregistrée.</p>";
      return;
    }
    list.innerHTML = races.map((race, index) => `
      <div class="list-item" style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 16px; background:#071b35; border:1px solid rgba(255,255,255,0.08); border-radius:8px; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:14px; min-width:0; flex-grow:1;">
          ${race.image ? `<img src="${escapeHtml(race.image)}" alt="" style="width:52px; height:52px; object-fit:cover; border-radius:6px; flex-shrink:0; border:1px solid rgba(242,140,40,0.5);">` : '<div style="width:52px; height:52px; border-radius:6px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; color:#f28c28; font-size:22px; flex-shrink:0;">🏎️</div>'}
          <div class="list-item-main" style="min-width:0;">
            <strong style="color:#fff; font-size:15px; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${escapeHtml(race.name || "Course")}
            </strong>
            <small style="color:rgba(255,255,255,0.65); font-size:12px; display:block; margin-top:2px;">
              📅 ${escapeHtml(race.date || '')} ${race.time ? `· ⏰ ${escapeHtml(race.time)}` : ''} · 📍 ${escapeHtml(race.circuit || '')} ${race.city ? `(${escapeHtml(race.city)})` : ''}
            </small>
            <small style="color:#f28c28; font-size:12px; display:block; margin-top:2px;">
              🏁 Statut : <strong>${escapeHtml(race.status || 'Programmé')}</strong> ${race.result ? `· 🏆 Résultat : ${escapeHtml(race.result)}` : ''}
            </small>
          </div>
        </div>
        <div class="list-actions" style="display:flex; gap:8px; flex-shrink:0;">
          <button type="button" class="btn-secondary" style="font-size:12px; padding:6px 12px; border:1px solid #f28c28; color:#f28c28; background:transparent; border-radius:6px; cursor:pointer;" onclick="window.editRace(${index})">✏️ Modifier</button>
          <button type="button" class="btn-danger" style="font-size:12px; padding:6px 12px; background:#e74c3c; color:#fff; border:none; border-radius:6px; cursor:pointer;" onclick="window.deleteRace(${index})">🗑 Supprimer</button>
        </div>
      </div>
    `).join('');
  };

  window.addRace = async function () {
    let imageUrl = value("race-image") || "";
    const fileInput = document.getElementById("race-image-file");
    if (fileInput && fileInput.files && fileInput.files[0]) {
      toast("⏳ Compression de l'image de course...", "#f28c28");
      imageUrl = await readImage(fileInput.files[0], 1000, 0.8);
    }

    const name = value("race-name");
    if (!name) { toast("ℹ️ Indique au moins le nom de la course."); return; }

    const raceData = {
      date: value("race-date"),
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

    if (!Array.isArray(window.gemsData.races)) {
      window.gemsData.races = [];
    }

    if (editingRaceIndex !== null && editingRaceIndex >= 0 && editingRaceIndex < window.gemsData.races.length) {
      window.gemsData.races[editingRaceIndex] = raceData;
      editingRaceIndex = null;
      const addBtn = document.querySelector("#tab-races .btn-primary");
      if (addBtn) addBtn.textContent = "➕ AJOUTER LA COURSE";
    } else {
      window.gemsData.races.push(raceData);
    }

    window.renderRaces();
    resetRaceForm();
    await saveData();
  };

  window.editRace = function (index) {
    editingRaceIndex = index;
    const race = window.gemsData.races[index];
    if (!race) return;

    setValue("race-date", race.date);
    setValue("race-time", race.time);
    setValue("race-name", race.name);
    setValue("race-circuit", race.circuit);
    setValue("race-city", race.city);
    setValue("race-category", race.category);
    setValue("race-pilots", race.pilots);
    setValue("race-start-position", race.startPosition);
    setValue("race-result", race.result);
    setValue("race-best-lap", race.bestLap);
    setValue("race-comment", race.comment);
    setValue("race-status", race.status || "Programmé");
    setValue("race-link", race.link);
    setValue("race-image", race.image);

    const imgPrev = document.getElementById("race-image-preview-img");
    if (imgPrev) {
      imgPrev.src = race.image || "";
      imgPrev.style.display = race.image ? "block" : "none";
    }

    const addBtn = document.querySelector("#tab-races .btn-primary");
    if (addBtn) addBtn.textContent = "💾 METTRE À JOUR LA COURSE";

    document.getElementById("tab-races")?.scrollIntoView({ behavior: "smooth" });
  };

  function resetRaceForm() {
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

    const fileInput = document.getElementById("race-image-file");
    if (fileInput) fileInput.value = "";
    const imgPrev = document.getElementById("race-image-preview-img");
    if (imgPrev) imgPrev.style.display = "none";

    editingRaceIndex = null;
    const addBtn = document.querySelector("#tab-races .btn-primary");
    if (addBtn) addBtn.textContent = "➕ AJOUTER LA COURSE";
  }

  window.deleteRace = async function (index) {
    if (!confirm("Supprimer cette course ?")) return;
    window.gemsData.races.splice(index, 1);
    window.renderRaces();
    await saveData();
  };

  // --- PARTNERS MANAGEMENT ---
  window.renderPartners = function () {
    const list = document.getElementById("partners-list");
    if (!list) return;
    const partners = window.gemsData.partners || [];
    if (!partners.length) {
      list.innerHTML = "<p style='color:rgba(255,255,255,0.6); font-size:14px;'>Aucun partenaire enregistré.</p>";
      return;
    }
    list.innerHTML = partners.map((partner, index) => `
      <div class="list-item" style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 16px; background:#071b35; border:1px solid rgba(255,255,255,0.08); border-radius:8px; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:14px; min-width:0; flex-grow:1;">
          ${partner.logo ? `<img src="${escapeHtml(partner.logo)}" alt="" style="width:48px; height:48px; object-fit:contain; border-radius:6px; flex-shrink:0; background:rgba(0,0,0,0.5); padding:3px; border:1px solid rgba(242,140,40,0.4);">` : '<div style="width:48px; height:48px; border-radius:6px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; color:#f28c28; font-size:20px; flex-shrink:0;">🤝</div>'}
          <div class="list-item-main" style="min-width:0;">
            <strong style="color:#fff; font-size:15px; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(partner.name || "Partenaire")}</strong>
            <small style="color:rgba(255,255,255,0.65); font-size:12px; display:block; margin-top:2px;">
              <a href="${escapeHtml(partner.url || '#')}" target="_blank" rel="noopener noreferrer" style="color:#f28c28; text-decoration:none;">${escapeHtml(partner.url || 'Aucun lien')}</a>
            </small>
          </div>
        </div>
        <div class="list-actions" style="display:flex; gap:8px; flex-shrink:0;">
          <button type="button" class="btn-secondary" style="font-size:12px; padding:6px 12px; border:1px solid #f28c28; color:#f28c28; background:transparent; border-radius:6px; cursor:pointer;" onclick="window.editPartner(${index})">✏️ Modifier</button>
          <button type="button" class="btn-danger" style="font-size:12px; padding:6px 12px; background:#e74c3c; color:#fff; border:none; border-radius:6px; cursor:pointer;" onclick="window.deletePartner(${index})">🗑 Supprimer</button>
        </div>
      </div>
    `).join('');
  };

  window.addPartner = async function () {
    let logoUrl = value("partner-logo-preview") || "";
    const fileInput = document.getElementById("partner-logo-file");
    if (fileInput && fileInput.files && fileInput.files[0]) {
      logoUrl = await readImage(fileInput.files[0], 600, 0.85);
    }
    const name = value("partner-name");
    if (!name) { toast("ℹ️ Indique le nom du partenaire."); return; }

    const partner = { name: name, url: value("partner-url"), logo: logoUrl };

    if (editingPartnerIndex !== null) {
      window.gemsData.partners[editingPartnerIndex] = partner;
      editingPartnerIndex = null;
      const addBtn = document.querySelector("#tab-partners .btn-primary");
      if (addBtn) addBtn.textContent = "➕ AJOUTER LE PARTENAIRE";
    } else {
      window.gemsData.partners.push(partner);
    }

    window.renderPartners();
    resetPartnerForm();
    await saveData();
  };

  window.editPartner = function (index) {
    editingPartnerIndex = index;
    const partner = window.gemsData.partners[index];
    if (!partner) return;
    setValue("partner-name", partner.name);
    setValue("partner-url", partner.url);
    setValue("partner-logo-preview", partner.logo);
    const imgPrev = document.getElementById("partner-logo-preview-img");
    if (imgPrev) {
      imgPrev.src = partner.logo || "";
      imgPrev.style.display = partner.logo ? "block" : "none";
    }
    const addBtn = document.querySelector("#tab-partners .btn-primary");
    if (addBtn) addBtn.textContent = "💾 METTRE À JOUR LE PARTENAIRE";
  };

  function resetPartnerForm() {
    setValue("partner-name", "");
    setValue("partner-url", "");
    setValue("partner-logo-preview", "");
    const fileInput = document.getElementById("partner-logo-file");
    if (fileInput) fileInput.value = "";
    const imgPrev = document.getElementById("partner-logo-preview-img");
    if (imgPrev) imgPrev.style.display = "none";
    editingPartnerIndex = null;
    const addBtn = document.querySelector("#tab-partners .btn-primary");
    if (addBtn) addBtn.textContent = "➕ AJOUTER LE PARTENAIRE";
  }

  window.deletePartner = async function (index) {
    if (!confirm("Supprimer ce partenaire ?")) return;
    window.gemsData.partners.splice(index, 1);
    window.renderPartners();
    await saveData();
  };

  // --- MESSAGES / TICKETS ---
  window.renderTickets = function () {
    const list = document.getElementById("tickets-list");
    const badge = document.getElementById("intra-badge-tickets");
    if (!list) return;
    const tickets = window.gemsData.tickets || [];
    const newCount = tickets.filter(t => t.status === "Nouveau").length;
    if (badge) {
      badge.textContent = newCount;
      badge.style.display = newCount > 0 ? "inline-block" : "none";
    }
    if (!tickets.length) {
      list.innerHTML = "<p>Aucun message reçu.</p>";
      return;
    }
    list.innerHTML = tickets.map((ticket, index) => `
      <div class="list-item" style="padding:15px; background:#071b35; border-radius:8px; margin-bottom:12px; border-left:4px solid ${ticket.status === 'Nouveau' ? '#f28c28' : '#2ecc71'};">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <strong style="color:#fff; font-size:16px;">${escapeHtml(ticket.subject || 'Message')}</strong>
            <p style="color:rgba(255,255,255,0.7); font-size:13px; margin:4px 0;">De : <strong>${escapeHtml(ticket.name || 'Anonyme')}</strong> (${escapeHtml(ticket.email || '')} ${ticket.phone ? `· ${escapeHtml(ticket.phone)}` : ''})</p>
            <p style="color:#f28c28; font-size:11px; margin:2px 0;">Canal : ${escapeHtml(ticket.type || 'Formulaire')} · Date : ${escapeHtml(ticket.date || '')}</p>
          </div>
          <span style="font-size:11px; padding:3px 8px; border-radius:10px; background:${ticket.status === 'Nouveau' ? '#f28c28' : '#2ecc71'}; color:#071b35; font-weight:700;">${escapeHtml(ticket.status || 'Nouveau')}</span>
        </div>
        <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:6px; margin:10px 0; color:rgba(255,255,255,0.9); font-size:13px; white-space:pre-wrap;">${escapeHtml(ticket.message || '')}</div>
        <div style="display:flex; gap:8px;">
          ${ticket.status === 'Nouveau' ? `<button class="btn-secondary" style="font-size:11px; padding:4px 10px;" onclick="window.markTicketAsRead(${index})">👁 Marquer comme lu</button>` : ''}
          <button class="btn-danger" style="font-size:11px; padding:4px 10px;" onclick="window.deleteTicket(${index})">🗑 Supprimer</button>
        </div>
      </div>
    `).join("");
  };

  window.markTicketAsRead = async function (index) {
    if (!window.gemsData.tickets[index]) return;
    window.gemsData.tickets[index].status = "Traité";
    window.renderTickets();
    await saveData();
  };

  window.deleteTicket = async function (index) {
    if (!confirm("Supprimer ce message ?")) return;
    window.gemsData.tickets.splice(index, 1);
    window.renderTickets();
    await saveData();
  };

  window.toggleManualTicketBox = function () {
    const box = document.getElementById("manual-ticket-box");
    if (box) box.style.display = box.style.display === "none" ? "block" : "none";
  };

  window.saveManualTicket = async function () {
    const name = value("manual-ticket-name");
    const subject = value("manual-ticket-subject");
    const message = value("manual-ticket-message");
    if (!name || !message) { toast("ℹ️ Indique au moins un nom et des notes."); return; }
    const now = new Date();
    window.gemsData.tickets.unshift({
      name: name,
      email: value("manual-ticket-email"),
      phone: value("manual-ticket-phone"),
      subject: subject || "Échange consigné",
      type: value("manual-ticket-type") || "Appel téléphonique",
      message: message,
      status: "Nouveau",
      date: now.toLocaleDateString("fr-FR") + " " + now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    });
    window.renderTickets();
    window.toggleManualTicketBox();
    await saveData();
  };

  // --- INITIALISATION ---
  document.addEventListener("DOMContentLoaded", function () {
    const isAuth = sessionStorage.getItem(AUTH_KEY);
    const overlay = document.getElementById("login-overlay");
    if (isAuth === "true") {
      document.body.classList.remove("is-locked");
      if (overlay) overlay.style.display = "none";
      loadData();
    } else {
      document.body.classList.add("is-locked");
      if (overlay) overlay.style.display = "flex";
    }

    const toggle = document.getElementById("toggle-password");
    const password = document.getElementById("pass-input");
    if (toggle && password) {
      toggle.addEventListener("click", () => {
        const visible = password.type === "text";
        password.type = visible ? "password" : "text";
        toggle.textContent = visible ? "Masquer" : "Afficher";
      });
      password.addEventListener("keypress", (e) => {
        if (e.key === "Enter") { e.preventDefault(); checkPass(); }
      });
    }
  });
})();