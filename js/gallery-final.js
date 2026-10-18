document.addEventListener("DOMContentLoaded", function () {
  const lightbox = document.getElementById("gems-lightbox");
  const image = document.getElementById("gems-lightbox-image");
  const items = Array.from(document.querySelectorAll("[data-gallery-image]"));

  if (!lightbox || !image || !items.length) return;

  let index = 0;

  const close = document.querySelector(".gems-gallery-close");

  const previous = document.createElement("button");
  previous.className = "gems-gallery-prev";
  previous.type = "button";
  previous.setAttribute("aria-label", "Photo précédente");
  previous.textContent = "‹";

  const next = document.createElement("button");
  next.className = "gems-gallery-next";
  next.type = "button";
  next.setAttribute("aria-label", "Photo suivante");
  next.textContent = "›";

  lightbox.appendChild(previous);
  lightbox.appendChild(next);

  function showPhoto(number) {
    if (number < 0) number = items.length - 1;
    if (number >= items.length) number = 0;

    index = number;
    image.src = items[index].dataset.galleryImage;
    image.alt = items[index].getAttribute("aria-label") || "";
    lightbox.classList.add("is-open");
  }

  items.forEach(function (item, number) {
    item.addEventListener("click", function (event) {
      event.preventDefault();
      showPhoto(number);
    });
  });

  previous.addEventListener("click", function (event) {
    event.stopPropagation();
    showPhoto(index - 1);
  });

  next.addEventListener("click", function (event) {
    event.stopPropagation();
    showPhoto(index + 1);
  });

  close.addEventListener("click", function () {
    lightbox.classList.remove("is-open");
    image.src = "";
  });

  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) {
      lightbox.classList.remove("is-open");
      image.src = "";
    }
  });

  document.addEventListener("keydown", function (event) {
    if (!lightbox.classList.contains("is-open")) return;

    if (event.key === "ArrowLeft") showPhoto(index - 1);
    if (event.key === "ArrowRight") showPhoto(index + 1);

    if (event.key === "Escape") {
      lightbox.classList.remove("is-open");
      image.src = "";
    }
  });
});
