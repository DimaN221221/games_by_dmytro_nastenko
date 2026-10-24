// Click-to-play YouTube trailers and the screenshot lightbox.
(() => {
  // ---------- Trailers: nothing loads from YouTube until the visitor presses play ----------

  document.querySelectorAll(".trailer[data-youtube]").forEach((trailer) => {
    const play = trailer.querySelector(".trailer__play");
    if (!play) return;

    play.addEventListener("click", (event) => {
      event.preventDefault();
      const id = trailer.dataset.youtube;
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      iframe.title = trailer.dataset.title || "Trailer";
      iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      trailer.classList.add("is-playing");
      trailer.replaceChildren(iframe);
      iframe.focus();
    });
  });

  // ---------- Lightbox ----------

  const dialog = document.querySelector(".lightbox");
  if (!dialog || typeof dialog.showModal !== "function") return;

  const img = dialog.querySelector(".lightbox__img");
  const caption = dialog.querySelector(".lightbox__caption");
  const count = dialog.querySelector(".lightbox__count");
  const prev = dialog.querySelector(".lightbox__prev");
  const next = dialog.querySelector(".lightbox__next");

  const galleries = {};
  document.querySelectorAll("a.shot[data-gallery]").forEach((link) => {
    const name = link.dataset.gallery;
    (galleries[name] ||= []).push(link);
  });

  let items = [];
  let index = 0;

  function show(i) {
    index = (i + items.length) % items.length;
    const link = items[index];
    const thumb = link.querySelector("img");
    img.src = link.href;
    img.alt = thumb ? thumb.alt : "";
    caption.textContent = thumb ? thumb.alt : "";
    count.textContent = `${index + 1} / ${items.length}`;

    // Warm up the neighbours so arrows feel instant.
    [index - 1, index + 1].forEach((k) => {
      const neighbour = items[(k + items.length) % items.length];
      if (neighbour) new Image().src = neighbour.href;
    });
  }

  Object.values(galleries).forEach((links) => {
    links.forEach((link, i) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        items = links;
        const single = links.length < 2;
        prev.hidden = single;
        next.hidden = single;
        show(i);
        dialog.showModal();
      });
    });
  });

  prev.addEventListener("click", () => show(index - 1));
  next.addEventListener("click", () => show(index + 1));
  dialog.querySelector(".lightbox__close").addEventListener("click", () => dialog.close());

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") show(index - 1);
    else if (event.key === "ArrowRight") show(index + 1);
  });

  // Swipe left / right on touch screens.
  let startX = null;
  let swiped = false;
  dialog.addEventListener("pointerdown", (event) => {
    swiped = false;
    if (event.pointerType !== "mouse") startX = event.clientX;
  });
  dialog.addEventListener("pointerup", (event) => {
    if (startX === null) return;
    const dx = event.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) {
      swiped = true;
      show(index + (dx < 0 ? 1 : -1));
    }
  });

  // A click on the dark area around the image closes the viewer (but not the end of a swipe).
  dialog.addEventListener("click", (event) => {
    if (swiped) return;
    if (event.target === dialog || event.target.classList.contains("lightbox__frame")) dialog.close();
  });

  dialog.addEventListener("close", () => {
    img.removeAttribute("src");
  });
})();
