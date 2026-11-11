function sanitizeCaption(str) {
  if (!str) return "";
  return str
    .replace(/tourn[^\s\w]*e/gi, "tourn\u00e9e")
    .replace(/tourn\?*e/gi, "tourn\u00e9e")
    .replace(/tourne\b/gi, "tourn\u00e9e")
    .replace(/Rien arr\u00eate/gi, "Rien n'arr\u00eate")
    .replace(/Rien n'arr\u00eate/gi, "Rien n'arr\u00eate")
    .replace(/Prt\s+prendre/gi, "Pr\u00eat \u00e0 prendre")
    .replace(/dpart/gi, "d\u00e9part")
    .replace(/Acclrer/gi, "Acc\u00e9l\u00e9rer")
    .replace(/matrise/gi, "ma\u00eetrise")
    .replace(/prcision/gi, "pr\u00e9cision")
    .replace(/Marchal/gi, "Mar\u00e9chal");
}

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

  async function loadPhotos() {
    try {
      const response = await fetch("/api/data?t=" + Date.now(), { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.gallery) && data.gallery.length > 0) {
          return data.gallery;
        }
      }
    } catch (e) {
      console.warn("API indisponible, bascule sur les donnees locales");
    }

    try {
      const localResp = await fetch("data/site-data.json?t=" + Date.now(), { cache: "no-store" });
      if (localResp.ok) {
        const staticData = await localResp.json();
        if (staticData && Array.isArray(staticData.gallery) && staticData.gallery.length > 0) {
          return staticData.gallery;
        }
      }
    } catch (e2) {}

    try {
      const raw = localStorage.getItem("gems_site_data") || localStorage.getItem("gemsData");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.gallery) && parsed.gallery.length > 0) {
          return parsed.gallery;
        }
      }
    } catch (e3) {}

    return [];
  }

  function renderGrid(photos) {
    if (!Array.isArray(photos) || photos.length === 0) {
      const staticEntries = Array.from(grid.querySelectorAll(".gems-gallery-card"))
        .map((card) => {
          const img = card.querySelector("img");
          const caption = card.querySelector(".gems-gallery-card-caption");

          return {
            card: card,
            photo: {
              image: img ? (img.getAttribute("src") || img.currentSrc || "") : "",
              caption: caption ? caption.textContent.trim() : (img ? img.alt : "")
            }
          };
        })
        .filter((entry) => entry.photo.image);

      galleryItems = staticEntries.map((entry) => entry.photo);

      staticEntries.forEach((entry, index) => {
        const card = entry.card;
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.addEventListener("click", () => openLightbox(index));
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openLightbox(index);
          }
        });
      });

      return;
    }

    galleryItems = photos;
    grid.innerHTML = "";

    photos.forEach((photo, index) => {
      const card = document.createElement("div");
      card.className = "gems-gallery-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");

      const rot = photo.rotation ? `transform: rotate(${photo.rotation}deg);` : "";
      const imgSrc = photo.image || photo.src || "";
      const captionText = sanitizeCaption(photo.caption || "");

      card.innerHTML = `
        <img referrerpolicy="no-referrer" loading="lazy" src="${imgSrc}" alt="${escapeHtml(captionText || 'Photo Gems Racing')}" style="${rot}">
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

    const caption = sanitizeCaption(photo.caption || "");

    if (lbImage) {
      lbImage.src = photo.image || photo.src || "";
      lbImage.alt = caption || "Photo Gems Racing";
      lbImage.style.transform = photo.rotation ? `rotate(${photo.rotation}deg)` : "";
    }

    if (lbCaption) {
      lbCaption.textContent = caption;
      lbCaption.style.display = caption ? "block" : "none";
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

  btnClose?.addEventListener("click", closeLightbox);
  backdrop?.addEventListener("click", closeLightbox);
  btnPrev?.addEventListener("click", (e) => { e.stopPropagation(); showPrev(); });
  btnNext?.addEventListener("click", (e) => { e.stopPropagation(); showNext(); });

  document.addEventListener("keydown", function (e) {
    if (!lightbox || lightbox.style.display === "none") return;
    if (e.key === "ArrowLeft") showPrev();
    else if (e.key === "ArrowRight") showNext();
    else if (e.key === "Escape") closeLightbox();
  });

  loadPhotos().then(renderGrid);
});