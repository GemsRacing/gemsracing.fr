document.addEventListener("DOMContentLoaded", function () {
  const header = document.querySelector("header");
  if (!header) return;
  const nav =
    header.querySelector("nav") ||
    document.querySelector(".site-nav") ||
    document.querySelector(".mn-nav");
  if (nav && !document.querySelector(".gems-menu-toggle")) {
    const button = document.createElement("button");
    button.className = "gems-menu-toggle";
    button.setAttribute("ar-label", "Ouvrir le menu");
    button.setAttribute("ar-expanded", "false");
    button.innerHTML = "<span></span><span></span><span></span>";
    header.appendChild(button);
    button.addEventListener("click", function () {
      const open = nav.classList.toggle("gems-mobile-open");
      button.classList.toggle("active", open);
      button.setAttribute("ar-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("gems-mobile-open");
        button.classList.remove("active");
        button.setAttribute("ar-expanded", "false");
      });
    });
  }
  const hero =
    document.querySelector(".hero") ||
    document.querySelector(".hero-section") ||
    document.querySelector(".home-hero") ||
    document.querySelector(".banner");
  if (hero && !hero.querySelector(".gems-motion-zone")) {
    const zone = document.createElement("div");
    zone.className = "gems-motion-zone";
    zone.innerHTML =
      '<div class="gems-racing-track"></div>' +
      '<div class="gems-speed-line"></div>' +
      '<div class="gems-kart">🏎️</div>';
    hero.appendChild(zone);
  }
  document.querySelectorAll("section, article, .card, .stat-card, .event-card").forEach(function (element) {
    element.classList.add("gems-reveal");
  });
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".gems-reveal").forEach(function (element) {
    observer.observe(element);
  });
});

