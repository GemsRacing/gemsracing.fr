/* ============================================================
   MOTEUR DYNAMIQUE GALERIE & LIGHTBOX AVEC DÉFILEMENT
   (Connecté aux données Intranet /api/data)
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  let galleryItems = [];
  let currentIndex = 0;
  const grid = document.getElementById("gems-dynamic-gallery-grid");
  const lightbox = document.getElementById("gems-lightbox");
  const lbImage = document.getElementById("gems-lightbox-image");
  const lbCaption = document.getElementById("gems-lightbox-caption");
  const lbCounter = document.getElementById("gems-lightbox-counter");
  const btnClose = document.getElementById("gems-lightbox-close");
  const btnPrev = document.getElementById("gems-lightbox-prev");
  const btnNext = document.getElementById("gems-lightbox-next");
  const backdrop = document.querySelector(".gems-lightbox-backdrop");
  if (!grid) return;
  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  // Chargement des photos depuis /api/data ou le localStorage
  async function loadPhotos() {
    try {
      const response = awt fetch("/api/data", { cache: "no-store" });
      if (response.ok) {
        const data = awt response.json();
        if (data && Array.isArray(data.gallery) && data.gallery.length > 0) {
          return data.gallery;
        }
      }
    } catch (e) {
      console.warn("Échec lecture /api/data, tentative localStorage...");
    }
    try {
      const local = localStorage.getItem("gemsData");
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && Array.isArray(parsed.gallery) && parsed.gallery.length > 0) {
          return parsed.gallery;
        }
      }
    } catch (e) {}
    // Fallback si aucune photo n'est retournée
    return [
      { image: "assets/images/gems-portrt.jpg", caption: "Gems Maréchal - Pilote SWS", rotation: 0 },
      { image: "assets/images/gems-socl-preview.jpg", caption: "Gems en compétition karting", rotation: 0 }
    ];
  }
  function renderGrid(photos) {
    galleryItems = photos;
    grid.innerHTML = "";
    photos.forEach((photo, index) => {
      const card = document.createElement("div");
      card.className = "gems-gallery-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      const rot = photo.rotation ? `transform: rotate(${photo.rotation}deg);` : "";
      const imgSrc = photo.image || photo.src || "";
      const captionText = photo.caption || "";
      card.innerHTML = `
        <img src="${imgSrc}" alt="${escapeHtml(captionText || 'Photo Gems Racing')}" loading="lazy" style="${rot}">
        ${captionText ? `<div class="gems-gallery-card-caption">${escapeHtml(captionText)}</div>` : ""}
      `;
      card.addEventListener("click", () => openLightbox(index));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(index);
        }
      });
      grid.appendChild(card);
    });
  }
  function updateLightboxView() {
    if (!galleryItems.length) return;
    const photo = galleryItems[currentIndex];
    if (!photo) return;
    if (lbImage) {
      lbImage.src = photo.image || photo.src || "";
      lbImage.alt = photo.caption || "Photo Gems Racing";
      lbImage.style.transform = photo.rotation ? `rotate(${photo.rotation}deg)` : "";
    }
    if (lbCaption) {
      lbCaption.textContent = photo.caption || "";
      lbCaption.style.display = photo.caption ? "block" : "none";
    }
    if (lbCounter) {
      lbCounter.textContent = `${currentIndex + 1} / ${galleryItems.length}`;
    }
  }
  function openLightbox(index) {
    currentIndex = index;
    updateLightboxView();
    if (lightbox) {
      lightbox.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
  }
  function closeLightbox() {
    if (lightbox) {
      lightbox.style.display = "none";
      document.body.style.overflow = "";
    }
  }
  function showPrev() {
    if (!galleryItems.length) return;
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    updateLightboxView();
  }
  function showNext() {
    if (!galleryItems.length) return;
    currentIndex = (currentIndex + 1) % galleryItems.length;
    updateLightboxView();
  }
  // Événements boutons et backdrop
  btnClose?.addEventListener("click", closeLightbox);
  backdrop?.addEventListener("click", closeLightbox);
  btnPrev?.addEventListener("click", (e) => { e.stopPropagation(); showPrev(); });
  btnNext?.addEventListener("click", (e) => { e.stopPropagation(); showNext(); });
  // Événements Clavier (Gauche / Droite / Échap)
  document.addEventListener("keydown", function (e) {
    if (!lightbox || lightbox.style.display === "none") return;
    if (e.key === "ArrowLeft") {
      showPrev();
    } else if (e.key === "ArrowRight") {
      showNext();
    } else if (e.key === "Escape") {
      closeLightbox();
    }
  });
  // Swipe tactile mobile (Gauche / Droite)
  let touchStartX = 0;
  let touchEndX = 0;
  lightbox?.addEventListener("touchstart", function (e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  lightbox?.addEventListener("touchend", function (e) {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        showPrev(); // Glissement vers la droite = image précédente
      } else {
        showNext(); // Glissement vers la gauche = image suivante
      }
    }
  }, { passive: true });
  // Lancement du chargement
  loadPhotos().then(renderGrid);
});
