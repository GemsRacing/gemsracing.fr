/* ============================================================
   MENU MOBILE GEMS RACING - SITE PUBLIC
   (Version propre et fonctionnelle)
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".menu");

  if (!toggle || !menu) {
    console.warn("Menu toggle ou menu introuvable. Le script de menu mobile ne peut pas s'initialiser.");
    return;
  }

  toggle.addEventListener("click", function () {
    const isOpen = menu.classList.toggle("is-open");

    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute(
      "aria-label",
      isOpen ? "Fermer le menu" : "Ouvrir le menu"
    );
    toggle.textContent = isOpen ? "✕" : "☰"; // Caractères UTF-8 corrects
  });

  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Ouvrir le menu");
      toggle.textContent = "☰"; // Caractère UTF-8 correct
    });
  });
});
