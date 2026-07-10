/* Blockyfy site — shared behavior v2.
   Cinematic starfield (depth layers + nebula + shooting stars + mouse
   parallax), nav scroll state, staggered reveals, 3D tilt, year stamp.
   No dependencies. Everything respects prefers-reduced-motion. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ------------------------------------------------ starfield canvas */
  document.querySelectorAll("canvas.stars").forEach(function (canvas) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var gold = document.body.classList.contains("theme-gold");
    var w = 0, h = 0;
    var layers = [];
    var nebulae = [];
    var meteors = [];
    var nextMeteor = 3500;
    var mouseX = 0, mouseY = 0;       // -1..1 targets
    var camX = 0, camY = 0;           // eased camera
    var running = false;
    var lastT = 0;

    var tint = gold ? "#e9c46a" : "#59d99d";
    var nebulaHues = gold
      ? [[233, 176, 86], [130, 80, 220], [70, 110, 230]]
      : [[70, 210, 150], [70, 140, 240], [140, 100, 240]];

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduceMotion) drawFrame(0, 0);
    }

    function seed() {
      layers = [
        { stars: [], density: 9000, size: 0.7, drift: 2.4, par: 6 },
        { stars: [], density: 5200, size: 1.1, drift: 4.2, par: 14 },
        { stars: [], density: 3400, size: 1.6, drift: 7.0, par: 26 }
      ];
      layers.forEach(function (L) {
        var count = Math.round((w * h) / L.density);
        for (var i = 0; i < count; i++) {
          L.stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * L.size + 0.3,
            base: Math.random() * 0.55 + 0.25,
            speed: Math.random() * 1.4 + 0.3,
            phase: Math.random() * Math.PI * 2,
            tinted: Math.random() < 0.16
          });
        }
      });

      nebulae = [];
      for (var n = 0; n < 3; n++) {
        var hue = nebulaHues[n % nebulaHues.length];
        nebulae.push({
          cx: (0.18 + 0.32 * n) * w + (Math.random() - 0.5) * w * 0.1,
          cy: (n % 2 ? 0.72 : 0.24) * h + (Math.random() - 0.5) * h * 0.1,
          r: Math.max(w, h) * (0.32 + Math.random() * 0.18),
          hue: hue,
          alpha: 0.05 + Math.random() * 0.035,
          dx: (Math.random() - 0.5) * 0.008,
          dy: (Math.random() - 0.5) * 0.006,
          phase: Math.random() * Math.PI * 2
        });
      }
      meteors = [];
    }

    function spawnMeteor() {
      var fromLeft = Math.random() < 0.5;
      meteors.push({
        x: fromLeft ? -40 : Math.random() * w * 0.8 + w * 0.2,
        y: fromLeft ? Math.random() * h * 0.4 : -30,
        vx: 0.55 + Math.random() * 0.35,
        vy: 0.35 + Math.random() * 0.25,
        life: 0,
        span: 700 + Math.random() * 500
      });
    }

    function drawFrame(t, dt) {
      ctx.clearRect(0, 0, w, h);

      /* nebulae — slow breathing fog */
      for (var n = 0; n < nebulae.length; n++) {
        var nb = nebulae[n];
        var pulse = 1 + 0.08 * Math.sin(t * 0.00012 + nb.phase);
        var cx = nb.cx + Math.sin(t * 0.00005 + nb.phase) * 30 + camX * 18;
        var cy = nb.cy + Math.cos(t * 0.00004 + nb.phase) * 22 + camY * 12;
        var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, nb.r * pulse);
        g.addColorStop(0, "rgba(" + nb.hue[0] + "," + nb.hue[1] + "," + nb.hue[2] + "," + nb.alpha + ")");
        g.addColorStop(1, "rgba(" + nb.hue[0] + "," + nb.hue[1] + "," + nb.hue[2] + ",0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      /* stars — three depth layers, parallax against the camera */
      for (var li = 0; li < layers.length; li++) {
        var L = layers[li];
        var ox = camX * L.par;
        var oy = camY * L.par * 0.7;
        for (var i = 0; i < L.stars.length; i++) {
          var s = L.stars[i];
          var tw = reduceMotion ? 0.7 : 0.5 + 0.5 * Math.sin(t * 0.001 * s.speed + s.phase);
          var x = s.x + ox;
          var y = ((s.y + t * 0.001 * L.drift) % (h + 8)) - 4 + oy;
          if (x < -6) x += w + 12; else if (x > w + 6) x -= w + 12;
          ctx.globalAlpha = s.base * (0.3 + 0.7 * tw);
          ctx.fillStyle = s.tinted ? tint : "#dfe7ff";
          ctx.beginPath();
          ctx.arc(x, y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      /* shooting stars */
      if (!reduceMotion) {
        nextMeteor -= dt;
        if (nextMeteor <= 0 && meteors.length < 2) {
          spawnMeteor();
          nextMeteor = 6000 + Math.random() * 9000;
        }
        for (var m = meteors.length - 1; m >= 0; m--) {
          var mt = meteors[m];
          mt.life += dt;
          mt.x += mt.vx * dt;
          mt.y += mt.vy * dt;
          var k = mt.life / mt.span;
          if (k >= 1 || mt.x > w + 60 || mt.y > h + 60) { meteors.splice(m, 1); continue; }
          var fade = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
          var tailX = mt.x - mt.vx * 150;
          var tailY = mt.y - mt.vy * 150;
          var grad = ctx.createLinearGradient(mt.x, mt.y, tailX, tailY);
          grad.addColorStop(0, "rgba(240,246,255," + 0.85 * fade + ")");
          grad.addColorStop(1, "rgba(240,246,255,0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(mt.x, mt.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();
        }
      }
    }

    function loop(t) {
      if (!running) return;
      var dt = Math.min(64, t - lastT || 16);
      lastT = t;
      camX += (mouseX - camX) * 0.045;
      camY += (mouseY - camY) * 0.045;
      drawFrame(t, dt);
      requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduceMotion) return;
      running = true;
      lastT = 0;
      requestAnimationFrame(function (t) { lastT = t; requestAnimationFrame(loop); });
    }
    function stop() { running = false; }

    if (finePointer && !reduceMotion) {
      window.addEventListener("pointermove", function (e) {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });
    }

    /* only animate while the hero is on screen; pause on hidden tab */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0.02 }).observe(canvas);
    } else {
      start();
    }
    document.addEventListener("visibilitychange", function () {
      document.hidden ? stop() : start();
    });

    window.addEventListener("resize", resize);
    resize();
    start();
  });

  /* ------------------------------------------------ nav scroll state */
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("scrolled", window.scrollY > 12);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------ mobile nav */
  var burger = document.querySelector(".nav-burger");
  var links = document.querySelector(".nav-links");
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.textContent = open ? "✕" : "☰";
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        links.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
        burger.textContent = "☰";
      }
    });
  }

  /* ------------------------------------------------ scroll reveal (+stagger) */
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      if (child.classList.contains("reveal")) {
        child.style.setProperty("--d", (i * 90) + "ms");
      }
    });
  });

  var revealed = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add("in"); });
  }

  /* ------------------------------------------------ 3D tilt */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      var raf = null;
      el.addEventListener("pointermove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform =
            "perspective(1100px) rotateX(" + (-py * 4).toFixed(2) + "deg)" +
            " rotateY(" + (px * 5).toFixed(2) + "deg)";
        });
      });
      el.addEventListener("pointerleave", function () {
        el.style.transition = "transform 0.5s cubic-bezier(0.16,1,0.3,1)";
        el.style.transform = "perspective(1100px)";
        setTimeout(function () { el.style.transition = ""; }, 500);
      });
    });
  }

  /* ------------------------------------------------ year stamp */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
