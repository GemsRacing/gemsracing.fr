document.addEventListener("DOMContentLoaded", function () {
  const header = document.querySelector("header");
  if (!header) return;

  // Cible l'élément <nav class="menu"> directement
  const menu = header.querySelector("nav.menu"); 
  if (!menu) {
    console.warn("Le menu nav.menu est introuvable. Assurez-vous que l'élément nav avec la classe 'menu' existe.");
    return;
  }

  let button = header.querySelector(".gems-menu-toggle");

  if (!button) {
    button = document.createElement("button");
    button.className = "gems-menu-toggle";
    button.type = "button";
    button.setAttribute("aria-label", "Ouvrir le menu");
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = "<span></span><span></span><span></span>";

    header.appendChild(button);
  }

  button.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();

    const isOpen = menu.classList.toggle("gems-mobile-open");

    button.classList.toggle("active", isOpen);
    button.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Cible les enfants directs <a> de nav.menu
  menu.querySelectorAll(":scope > a").forEach(function (link) { 
    link.addEventListener("click", function () {
      menu.classList.remove("gems-mobile-open");
      button.classList.remove("active");
      button.setAttribute("aria-expanded", "false");
    });
  });
});
