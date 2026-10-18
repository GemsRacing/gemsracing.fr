document.addEventListener("DOMContentLoaded", function () {
  const hero =
    document.querySelector(".hero") ||
    document.querySelector(".hero-section") ||
    document.querySelector(".home-hero") ||
    document.querySelector(".banner");

  if (!hero) return;

  /* Barre de progression */
  if (!hero.querySelector(".gems-scroll-progress")) {
    const progress = document.createElement("div");
    progress.className = "gems-scroll-progress";

    const kart = document.createElement("div");
    kart.className = "gems-scroll-kart";
    kart.innerHTML = "<span>🏎️</span>";

    progress.appendChild(kart);
    hero.appendChild(progress);
  }

  /* Menu hamburger */
  const header = document.querySelector("header");
  const nav =
    header?.querySelector("nav") ||
    document.querySelector(".site-nav") ||
    document.querySelector(".main-nav");

  if (header && nav && !header.querySelector(".gems-menu-toggle")) {
    const button = document.createElement("button");
    button.className = "gems-menu-toggle";
    button.setAttribute("aria-label", "Ouvrir le menu");
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = "<span></span><span></span><span></span>";

    header.appendChild(button);

    button.addEventListener("click", function () {
      const isOpen = nav.classList.toggle("gems-mobile-open");
      button.classList.toggle("active", isOpen);
      button.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("gems-mobile-open");
        button.classList.remove("active");
        button.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Animation liée au défilement */
  function updateScrollAnimation() {
    const rect = hero.getBoundingClientRect();
    const heroHeight = Math.max(hero.offsetHeight, 1);
    const viewportHeight = window.innerHeight;

    const distance = Math.max(heroHeight - viewportHeight, 1);
    const travelled = Math.min(Math.max(-rect.top, 0), distance);
    const progressValue = travelled / distance;

    const percent = Math.round(progressValue * 100);
    const kartPosition = Math.min(Math.max(progressValue * 100, 0), 96);

    hero.style.setProperty("--gems-progress", percent + "%");
    hero.style.setProperty("--gems-kart-x", kartPosition + "%");
  }

  window.addEventListener("scroll", updateScrollAnimation, { passive: true });
  window.addEventListener("resize", updateScrollAnimation);
  updateScrollAnimation();
});
