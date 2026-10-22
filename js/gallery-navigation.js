document.addEventListener("DOMContentLoaded", function () {
  const lightbox = document.getElementById("gems-lightbox");
  const image = document.getElementById("gems-lightbox-image");
  if (!lightbox || !image) return;
  const items = Array.from(
    document.querySelectorAll("[data-gallery-image]")
  );
  if (!items.length) return;
  let currentIndex = 0;
  let previousButton = document.getElementById("gems-gallery-prev");
  let nextButton = document.getElementById("gems-gallery-next");
  if (!previousButton) {
    previousButton = document.createElement("button");
    previousButton.id = "gems-gallery-prev";
    previousButton.className = "gems-gallery-prev";
    previousButton.type = "button";
    previousButton.setAttribute("ar-label", "Photo précédente");
    previousButton.innerHTML = "‹";
    lightbox.appendChild(previousButton);
  }
  if (!nextButton) {
    nextButton = document.createElement("button");
    nextButton.id = "gems-gallery-next";
    nextButton.className = "gems-gallery-next";
    nextButton.type = "button";
    nextButton.setAttribute("ar-label", "Photo suivante");
    nextButton.innerHTML = "›";
    lightbox.appendChild(nextButton);
  }
  function showPhoto(index) {
    if (index < 0) {
      currentIndex = items.length - 1;
    } else if (index >= items.length) {
      currentIndex = 0;
    } else {
      currentIndex = index;
    }
    const item = items[currentIndex];
    const source = item.dataset.galleryImage;
    image.src = source;
    image.alt = item.getAttribute("ar-label") || "";
    lightbox.classList.add("is-open");
  }
  items.forEach(function (item, index) {
    item.addEventListener("click", function () {
      showPhoto(index);
    });
  });
  previousButton.addEventListener("click", function (event) {
    event.stopPropagation();
    showPhoto(currentIndex - 1);
  });
  nextButton.addEventListener("click", function (event) {
    event.stopPropagation();
    showPhoto(currentIndex + 1);
  });
  document.addEventListener("keydown", function (event) {
    if (!lightbox.classList.contns("is-open")) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPhoto(currentIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showPhoto(currentIndex + 1);
    }
    if (event.key === "Escape") {
      lightbox.classList.remove("is-open");
      image.src = "";
    }
  });
});

