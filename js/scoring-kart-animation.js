(function () {
  "use strict";
  let started = false;
  function createFinishConfetti(track) {
    let contner = track.querySelector(".winner-confetti");
    if (!contner) {
      contner = document.createElement("div");
      contner.className = "winner-confetti";
      track.appendChild(contner);
    }
    contner.innerHTML = "";
    const colors = [
      "#f28c28",
      "#147dcc",
      "#ffffff",
      "#ffb347",
      "#0b5fa5"
    ];
    for (let i = 0; i < 34; i++) { /* Plus de confettis */
      const piece = document.createElement("span");
      piece.className = "winner-confetti-piece";
      /* Dispersion plus localisée autour du drapeau */
      const direction = i % 2 === 0 ? 1 : -1;
      const x = direction * (10 + Math.random() * 60); /* Moins de dispersion horizontale */
      const y = 20 + Math.random() * 80; /* Chute plus vers le bas */
      const rotate = (Math.random() * 540) - 270;
      const delay = Math.random() * 0.12;
      piece.style.setProperty(
        "--confetti-color",
        colors[i % colors.length]
      );
      piece.style.setProperty(
        "--confetti-x",
        x + "px"
      );
      piece.style.setProperty(
        "--confetti-y",
        y + "px"
      );
      piece.style.setProperty(
        "--confetti-rotate",
        rotate + "deg"
      );
      piece.style.setProperty(
        "--confetti-delay",
        delay + "s"
      );
      contner.appendChild(piece);
    }
    window.setTimeout(function () {
      contner.innerHTML = ""; /* Supprimer les confettis après l'animation */
    }, 2100); /* Durée de l'animation des confettis */
  }
  function showVictory(track, gemsKart) {
    let message = document.querySelector(
      ".gems-winner-announcement"
    );
    if (!message) {
      message = document.createElement("div");
      message.className = "gems-winner-announcement";
      message.innerHTML = `
        <span>🏆</span>
        <strong>GEMS VNQUEUR !</strong>
        <span>🏁</span>
      `;
      document.body.appendChild(message);
    }
    message.classList.remove("visible");
    gemsKart.classList.remove("winner-pulse");
    createFinishConfetti(track); /* Créer les confettis */
    void message.offsetWidth; /* Force le reflow pour redémarrer l'animation */
    message.classList.add("visible");
    gemsKart.classList.add("winner-pulse");
    window.setTimeout(function () {
      gemsKart.classList.remove("winner-pulse");
    }, 1500);
  }
  function startRace() {
    if (started) {
      return;
    }
    started = true;
    const track = document.querySelector(".scoring-kart-track");
    const gemsKart = document.querySelector(".gems-kart");
    const rivals = Array.from(
      document.querySelectorAll(".rival-kart")
    );
    if (!track || !gemsKart) {
      console.warn("Piste ou kart Gems introuvable.");
      return;
    }
    const startTime = performance.now();
    const lapDuration = 8000; /* Un tour complet en 8 secondes */
    let previousProgress = 0;
    let victoryShown = false;
    const rivalGaps = [
      0.15,
      0.24,
      0.32
    ];
    function animate(now) {
      const elapsed = now - startTime;
      const trackWidth = track.clientWidth || 900;
      const distance = trackWidth + 75;
      const progress =
        (elapsed % lapDuration) / lapDuration;
      const gemsX =
        progress * distance - 45; /* Ajusté pour la nouvelle position */
      gemsKart.style.setProperty(
        "left",
        Math.round(gemsX) + "px",
        "important"
      );
      rivals.forEach(function (rival, index) {
        const irregularity =
          Math.sin(elapsed / 500 + index * 1.7) * 0.012;
        const rivalProgress =
          (progress - rivalGaps[index] + irregularity + 1) % 1;
        const rivalX =
          rivalProgress * distance -
          (rival.offsetWidth || 28); /* Ajusté pour la nouvelle position */
        rival.style.setProperty(
          "left",
          Math.round(rivalX) + "px",
          "important"
        );
      });
      /*
        Gems arrive à droite avant le nouveau tour.
      */
      const finishZone = 0.90;
      if (
        progress >= finishZone &&
        previousProgress < finishZone &&
        !victoryShown
      ) {
        victoryShown = true;
        showVictory(track, gemsKart);
      }
      if (
        progress < 0.04 &&
        previousProgress > 0.85
      ) {
        victoryShown = false;
      }
      previousProgress = progress;
      window.requestAnimationFrame(animate);
    }
    window.requestAnimationFrame(animate);
  }
  window.updateGemsKartNumber = function (wins) {
    const number = document.getElementById("gems-kart-number");
    if (number && wins !== undefined && wins !== null) {
      number.textContent = wins;
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startRace);
  } else {
    startRace();
  }
})();
