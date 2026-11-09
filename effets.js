// Effets visuels : neige dans l'en-tête et rafale de flocons à la fin.
// Désactivés si l'utilisateur a demandé de réduire les animations.
(function () {
  "use strict";

  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setupCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);
    return ctx;
  }

  // Neige continue dans l'en-tête.
  function snow(canvas) {
    if (!canvas || reduced) return;
    const ctx = setupCanvas(canvas);
    const flakes = Array.from({ length: 70 }, function () {
      return {
        x: Math.random(), y: Math.random(),
        r: 0.8 + Math.random() * 2.2,
        speed: 0.00025 + Math.random() * 0.0006,
        sway: Math.random() * Math.PI * 2,
        alpha: 0.35 + Math.random() * 0.55
      };
    });
    function frame() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      flakes.forEach(function (f) {
        f.y += f.speed * (1 + f.r * 0.4);
        f.sway += 0.01;
        if (f.y > 1.05) { f.y = -0.05; f.x = Math.random(); }
        ctx.beginPath();
        ctx.arc((f.x + Math.sin(f.sway) * 0.01) * w, f.y * h, f.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255," + f.alpha + ")";
        ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // Rafale de flocons et de confettis aux couleurs de la page.
  function celebrate() {
    if (reduced) return;
    const canvas = document.createElement("canvas");
    canvas.className = "celebration";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = setupCanvas(canvas);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const colors = ["#00338D", "#1E49E2", "#0091DA", "#F5A34B", "#FFFFFF"];
    const parts = Array.from({ length: 140 }, function () {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const speed = 6 + Math.random() * 9;
      return {
        x: w / 2, y: h * 0.45,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        round: Math.random() < 0.45
      };
    });
    const start = performance.now();
    function frame(now) {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);
      parts.forEach(function (p) {
        p.vy += 0.25; p.vx *= 0.99; p.vy *= 0.99;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - t / 2.8);
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      if (t < 2.8) requestAnimationFrame(frame); else canvas.remove();
    }
    requestAnimationFrame(frame);
  }

  window.Effets = { celebrate: celebrate, reduced: reduced };
  snow(document.getElementById("snow"));
})();
