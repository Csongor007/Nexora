function initTransition(isBack = false) {
  const transition_el = document.querySelector(".transition");
  const anchors = document.querySelectorAll("a");

  // Ha visszalépés történt, adjunk késleltetést a transition eltávolítására
  const delay = isBack ? 50 : 0;

  setTimeout(() => {
    transition_el.classList.remove("is-active");
  }, delay);

  anchors.forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      const target = anchor.href;

      transition_el.classList.add("is-active");

      setTimeout(() => {
        window.location.href = target;
      }, 200);
    });
  });
}

// Normál betöltés
window.onload = () => initTransition(false);

// Vissza gomb (bfcache)
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    initTransition(true);
  }
});
