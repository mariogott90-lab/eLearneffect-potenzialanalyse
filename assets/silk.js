/* Seidenhintergrund „Seide & Gold“ (aus der OLS-Präsentation, js/background.js)
   Feine goldene Linien bilden zwei Stoffbahnen, die sehr langsam ziehen.
   Liegt nur oben auf der Seite (Hero bzw. Kopf der Auswertung) und läuft nach unten aus.
   Handy: halb so viele Linien und halbe Bildrate. „Bewegung reduzieren“: Standbild.
   Außerhalb des Sichtbereichs oder im Hintergrund-Tab wird nicht gezeichnet. */
(function () {
  const host = document.getElementById("silk");
  if (!host) return;
  const canvas = document.createElement("canvas");
  host.prepend(canvas);
  const ctx = canvas.getContext("2d");

  const theme = {
    base: ["#020409", "#050b18", "#0b1628"],
    line: [212, 175, 55],
    alpha: 0.17,
    glows: [
      { x: 1450, y: 260, r: 760, c: "rgba(212, 175, 55, 0.12)" },
      { x: 1700, y: 900, r: 600, c: "rgba(40, 70, 140, 0.22)" },
      { x: 300, y: 980, r: 700, c: "rgba(16, 28, 49, 0.9)" },
    ],
  };
  const ribbonsBase = [
    { y: 0.56, amp: 1, half: 280, f: 2.6, phase: 0, a: 1, n: 110 },
    { y: 0.24, amp: 0.55, half: 150, f: 3.4, phase: 2.1, a: 0.45, n: 60 },
  ];

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lite = still || Math.min(screen.width, screen.height) < 820;

  let W, H, glows, ribbons;
  function setup() {
    // Hochformat (Handy hochkant): Leinwand 1080 × 1700 wie in der Präsentation
    const P = window.innerHeight > window.innerWidth;
    W = P ? 1080 : 1920;
    H = P ? 1700 : 1080;
    canvas.width = W;
    canvas.height = H;
    glows = theme.glows.map((g) => (P ? { x: (g.x * W) / 1920, y: (g.y * H) / 1080, r: g.r * 1.1, c: g.c } : g));
    ribbons = ribbonsBase.map((rb) => ({ ...rb, n: lite ? Math.round(rb.n / 2) : rb.n }));
  }
  setup();

  let t = Math.random() * 100;
  let intensity = 1.2;
  let target = 1.2;

  function drawBase() {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, theme.base[0]);
    g.addColorStop(0.55, theme.base[1]);
    g.addColorStop(1, theme.base[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (const gl of glows) {
      const rg = ctx.createRadialGradient(gl.x, gl.y, 0, gl.x, gl.y, gl.r);
      rg.addColorStop(0, gl.c);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // Stoffbahnen: obere und untere Kante laufen umeinander, an den Kreuzungen entstehen helle Falten.
  function drawRibbon(rb) {
    const [r, g, b] = theme.line;
    const pts = [];
    for (let x = -60; x <= W + 60; x += 20) {
      const u = x / W;
      const mid = H * rb.y + (Math.sin(u * 2.3 + t + rb.phase) * 150 + Math.cos(u * 1.2 - t * 0.7 + rb.phase) * 110) * rb.amp + (u - 0.5) * -180;
      const half = rb.half * Math.cos(u * rb.f + t * 0.55 + rb.phase) + 40 * Math.sin(u * 6.0 - t);
      pts.push([x, mid, half]);
    }
    for (let i = 0; i < rb.n; i++) {
      const p = i / (rb.n - 1);
      ctx.beginPath();
      pts.forEach(([x, mid, half], k) => {
        const y = mid + (p - 0.5) * 2 * half + Math.sin(k * 0.25 + p * 9 + t * 2) * 3;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      const edge = 0.35 + 0.65 * Math.sin(p * Math.PI);
      const a = theme.alpha * edge * intensity * rb.a * (lite ? 1.5 : 1); // weniger Linien etwas kräftiger
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      for (let k = 0; k <= 12; k++) {
        const u = k / 12;
        const half = Math.abs(rb.half * Math.cos(u * rb.f + t * 0.55 + rb.phase));
        const fold = Math.min(1, 0.22 + half / 170); // schmale Stellen dunkler, sonst überstrahlen sie
        const fade = u < 0.3 ? 0.2 + (u / 0.3) * 0.55 : u < 0.65 ? 0.75 + ((u - 0.3) / 0.35) * 0.25 : 1 - ((u - 0.65) / 0.35) * 0.7;
        grad.addColorStop(u, `rgba(${r},${g},${b},${a * fade * fold})`);
      }
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function draw() {
    drawBase();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ribbons.forEach(drawRibbon);
    ctx.restore();
  }

  let visible = true;
  let running = false;
  let skip = false;
  function frame() {
    if (!visible || document.hidden || still) { running = false; return; }
    requestAnimationFrame(frame);
    if (lite && (skip = !skip)) return;
    intensity += (target - intensity) * (lite ? 0.06 : 0.03);
    t += lite ? 0.0044 : 0.0022;
    draw();
  }
  function start() {
    if (running || still) return;
    running = true;
    requestAnimationFrame(frame);
  }

  draw();
  start();

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }).observe(host);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) start(); });

  let lastP = window.innerHeight > window.innerWidth;
  window.addEventListener("resize", () => {
    const P = window.innerHeight > window.innerWidth;
    if (P === lastP) return;
    lastP = P;
    setup();
    draw();
  });

  window.Silk = {
    // ruhige Inhaltsseiten schwächer (0,7 bis 0,85), Eröffnung und Abschluss stärker (1,2 bis 1,25)
    setIntensity(v) {
      target = v;
      if (still) { intensity = v; draw(); }
    },
  };
})();
