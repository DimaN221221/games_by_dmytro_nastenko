// Scroll-driven DN cube intro: the page scroll scrubs through a pre-rendered frame sequence.
(() => {
  const FRAME_COUNT = 147;
  const framePath = (i) => `assets/intro/${String(i).padStart(3, "0")}.webp`;

  const intro = document.querySelector(".intro");
  const canvas = document.querySelector(".intro__canvas");
  if (!intro || !canvas) return;

  const ctx = canvas.getContext("2d");
  const frames = new Array(FRAME_COUNT);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let current = 0;
  let target = 0;
  let drawn = -1;
  let drawnSource = -1;
  let rafId = 0;

  function load(i) {
    const img = new Image();
    img.decoding = "async";
    img.src = framePath(i);
    img.onload = () => {
      frames[i] = img;
      // A closer frame for what is on screen just arrived.
      if (i <= Math.round(current) && i > drawnSource) draw(Math.round(current));
    };
  }

  // Index of the nearest frame at or before i that has finished loading.
  function nearestLoaded(i) {
    for (let k = i; k >= 0; k--) if (frames[k]) return k;
    return -1;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    draw(Math.round(current));
  }

  function draw(index) {
    const source = nearestLoaded(index);
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    if (source < 0) return;
    const img = frames[source];

    // The frames are square with the cube in the upper part; keep room for the text below.
    const portrait = w / h < 0.8;
    const size = portrait ? Math.min(w * 1.25, h * 0.62) : Math.min(h * 0.85, w * 0.9);
    const x = (w - size) / 2;
    const y = portrait ? h * 0.1 : h * 0.06;
    ctx.drawImage(img, x, y, size, size);
    drawn = index;
    drawnSource = source;
  }

  function progress() {
    const rect = intro.getBoundingClientRect();
    const range = intro.offsetHeight - window.innerHeight;
    if (range <= 0) return 1;
    return Math.min(1, Math.max(0, -rect.top / range));
  }

  function update() {
    const p = progress();
    // The animation finishes a little before the end of the pinned section, then holds.
    const frameP = Math.min(1, p / 0.75);
    target = frameP * (FRAME_COUNT - 1);

    intro.classList.toggle("is-scrolled", p > 0.02);
    intro.classList.toggle("is-revealed", frameP > 0.92);

    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick() {
    rafId = 0;
    current += (target - current) * 0.18;
    if (Math.abs(target - current) < 0.05) current = target;

    const index = Math.round(current);
    if (index !== drawn) draw(index);
    if (current !== target) rafId = requestAnimationFrame(tick);
  }

  function showStatic() {
    current = target = FRAME_COUNT - 1;
    intro.classList.add("is-scrolled", "is-revealed");
    load(FRAME_COUNT - 1);
    resize();
  }

  if (reduceMotion.matches) {
    showStatic();
    window.addEventListener("resize", resize);
    return;
  }

  load(0);
  for (let i = 1; i < FRAME_COUNT; i++) load(i);

  resize();
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", () => {
    resize();
    update();
  });
})();
