/* ==========================================================================
   Room 03 — The Lens
   Hero depth parallax · frame "develops" on scroll · pinned night reel ·
   drifting columns · colour/mono compare · iris · constellation drift
   ========================================================================== */
(function () {
  "use strict";
  if (!window.MK) return;
  var d = document;

  MK.ready(function (MK) {
    var gsap = MK.gsap, ST = MK.ScrollTrigger;
    var clamp01 = gsap.utils.clamp(0, 1);
    var dev = d.querySelector(".dev");

    /* -------------------------------------------------- Develop: static fallbacks */
    function devFinal() {
      if (!dev) return;
      dev.classList.add("is-static");
      setVals(1, 1, 1, 1);
      dev.querySelectorAll(".dev__step").forEach(function (s, i, all) { s.classList.toggle("is-on", i === all.length - 1); });
      dev.querySelectorAll(".dev__dot").forEach(function (dt) { dt.classList.add("is-on"); });
      var hn = dev.querySelector(".dev__hue-name"); if (hn) hn.textContent = "Hue · all six";
    }
    var HUES = ["Orange", "Red", "Yellow", "Green", "Blue", "Violet"];
    var vEls = dev ? {
      exp: dev.querySelector('[data-k="exp"] .dev__v'), con: dev.querySelector('[data-k="con"] .dev__v'), sat: dev.querySelector('[data-k="sat"] .dev__v'),
      bexp: dev.querySelector('[data-k="exp"] .dev__bar i'), bcon: dev.querySelector('[data-k="con"] .dev__bar i'), bsat: dev.querySelector('[data-k="sat"] .dev__bar i')
    } : null;
    function sign(n, dec) { var s = Math.abs(n).toFixed(dec); return (n > 0.0001 ? "+" : n < -0.0001 ? "−" : "±") + s; }
    function setVals(e, c, s) {
      if (!vEls) return;
      vEls.exp.textContent = sign(-0.8 + e * 1.0, 2);
      vEls.con.textContent = sign(Math.round(-35 + c * 47), 0);
      vEls.sat.textContent = sign(Math.round(-80 + s * 98), 0);
      vEls.bexp.style.transform = "scaleX(" + e + ")";
      vEls.bcon.style.transform = "scaleX(" + c + ")";
      vEls.bsat.style.transform = "scaleX(" + s + ")";
    }

    if (MK.reduced) { devFinal(); return; }

    var mm = gsap.matchMedia();
    var desktop = "(min-width: 761px)", mobile = "(max-width: 760px)";

    /* -------------------------------------------------- Hero: depth parallax */
    var hfs = gsap.utils.toArray(".hf");
    hfs.forEach(function (hf) {
      var depth = parseFloat(hf.getAttribute("data-depth")) || 0.5;
      gsap.to(hf, {
        yPercent: -depth * 55, ease: "none",
        scrollTrigger: { trigger: ".lens-hero", start: "top top", end: "bottom top", scrub: true }
      });
    });
    gsap.to(".lens-hero__copy", {
      yPercent: -14, ease: "none",
      scrollTrigger: { trigger: ".lens-hero", start: "top top", end: "bottom top", scrub: true }
    });
    if (!MK.isTouch) {
      var movers = hfs.map(function (hf) {
        var m = hf.querySelector(".hf__m"), depth = parseFloat(hf.getAttribute("data-depth")) || 0.5;
        return {
          depth: depth,
          x: gsap.quickTo(m, "x", { duration: 1.4, ease: "power3" }),
          y: gsap.quickTo(m, "y", { duration: 1.4, ease: "power3" }),
          r: gsap.quickTo(m, "rotation", { duration: 1.6, ease: "power3" })
        };
      });
      var hero = d.querySelector(".lens-hero");
      hero.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
        movers.forEach(function (m) { m.x(-nx * 60 * m.depth); m.y(-ny * 40 * m.depth); m.r(nx * 3 * m.depth); });
      });
      hero.addEventListener("pointerleave", function () { movers.forEach(function (m) { m.x(0); m.y(0); m.r(0); }); });
    }

    /* -------------------------------------------------- Develop a frame */
    if (dev) {
      var layers = dev.querySelectorAll(".dev__l");
      var steps = dev.querySelectorAll(".dev__step");
      var dots = dev.querySelectorAll(".dev__dot");
      var hueName = dev.querySelector(".dev__hue-name");
      var lastStep = -1, lastDots = -1;
      var render = function (p) {
        var seg = function (a, b) { return clamp01((p - a) / (b - a)); };
        var e = seg(0.1, 0.32), c = seg(0.34, 0.52), s = seg(0.54, 0.7), hu = seg(0.72, 0.95);
        layers[0].style.opacity = 1 - e;
        layers[1].style.opacity = 1 - c;
        layers[2].style.opacity = 1 - s;
        layers[3].style.opacity = 1 - hu;
        setVals(e, c, s);
        var st = p < 0.08 ? 0 : p < 0.71 ? 1 : 2;
        if (st !== lastStep) { lastStep = st; steps.forEach(function (el, i) { el.classList.toggle("is-on", i === st); }); }
        var n = hu <= 0 ? 0 : Math.min(6, Math.ceil(hu * 6));
        if (n !== lastDots) {
          lastDots = n;
          dots.forEach(function (dt, i) { dt.classList.toggle("is-on", i < n); });
          hueName.textContent = n === 0 ? "Hue · —" : n === 6 && hu >= 1 ? "Hue · all six" : "Hue · " + HUES[n - 1];
        }
      };
      var proxy = { p: 0 };
      render(0);
      var setP = gsap.quickTo(proxy, "p", { duration: 0.5, ease: "power3", onUpdate: function () { render(proxy.p); } });
      mm.add({ isDesk: desktop, isMob: mobile }, function (ctx) {
        ST.create({
          trigger: dev, start: "top top", end: ctx.conditions.isDesk ? "+=190%" : "+=150%",
          pin: true, anticipatePin: 1,
          onUpdate: function (self) { setP(self.progress); }
        });
        gsap.from(dev.querySelector(".dev__media"), {
          clipPath: "inset(100% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut",
          scrollTrigger: { trigger: dev, start: "top 75%", once: true }
        });
      });
    }

    /* -------------------------------------------------- Heritage: drifting columns */
    mm.add(desktop, function () {
      gsap.utils.toArray(".cols__c").forEach(function (col) {
        var sp = parseFloat(col.getAttribute("data-speed")) || 0;
        if (!sp) return;
        gsap.fromTo(col, { y: sp * 90 }, {
          y: -sp * 90, ease: "none",
          scrollTrigger: { trigger: ".cols", start: "top bottom", end: "bottom top", scrub: true }
        });
      });
    });

    /* -------------------------------------------------- After dark: pinned reel */
    var stage = d.querySelector(".stage");
    if (stage) {
      var track = stage.querySelector(".reel__track");
      var items = gsap.utils.toArray(stage.querySelectorAll(".reel__item .ph"));
      var medias = items.map(function (f) { return f.querySelector(".media"); });
      var count = stage.querySelector(".reel__count"), bar = stage.querySelector(".reel__bar i");
      var total = items.length;

      mm.add(desktop, function () {
        var dist = function () { return Math.max(0, track.scrollWidth - innerWidth); };
        gsap.fromTo(stage, { clipPath: "circle(16% at 50% 50%)" }, {
          clipPath: "circle(75% at 50% 50%)", ease: "none",
          scrollTrigger: { trigger: stage, start: "top bottom", end: "top top", scrub: true }
        });
        var skewTo = gsap.quickTo(items, "skewX", { duration: 0.7, ease: "power3" });
        var horiz = gsap.to(track, {
          x: function () { return -dist(); }, ease: "none",
          scrollTrigger: {
            trigger: stage, start: "top top", end: function () { return "+=" + dist(); },
            pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
            onUpdate: function (self) {
              bar.style.transform = "scaleX(" + self.progress + ")";
              var i = Math.min(total, Math.max(1, Math.round(self.progress * (total - 1)) + 1));
              count.textContent = String(i).padStart(2, "0") + " / " + String(total).padStart(2, "0");
              skewTo(gsap.utils.clamp(-7, 7, -self.getVelocity() / 260));
            },
            onScrubComplete: function () { skewTo(0); }
          }
        });
        items.forEach(function (f, i) {
          var img = f.querySelector("img"), m = medias[i];
          gsap.fromTo(img, { xPercent: -7 }, {
            xPercent: 7, ease: "none",
            scrollTrigger: { trigger: f, containerAnimation: horiz, start: "left right", end: "right left", scrub: true }
          });
          gsap.fromTo(m, { clipPath: "inset(100% 0% 0% 0%)" }, {
            clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut",
            scrollTrigger: { trigger: f, containerAnimation: horiz, start: "left 95%", toggleActions: "play none none none" }
          });
        });
        gsap.from(stage.querySelectorAll(".reel__head > *"), {
          y: 40, autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: 0.08,
          scrollTrigger: { trigger: stage, start: "top 40%", once: true }
        });
        return function () { gsap.set(items, { skewX: 0 }); };
      });

      mm.add(mobile, function () {
        medias.forEach(function (m) {
          gsap.fromTo(m, { clipPath: "inset(100% 0% 0% 0%)" }, {
            clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut",
            scrollTrigger: { trigger: m, start: "top 90%", once: true }
          });
          gsap.fromTo(m.querySelector("img"), { yPercent: -6 }, {
            yPercent: 6, ease: "none",
            scrollTrigger: { trigger: m, start: "top bottom", end: "bottom top", scrub: true }
          });
        });
        gsap.from(stage.querySelectorAll(".reel__head > *"), {
          y: 30, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.08,
          scrollTrigger: { trigger: stage, start: "top 75%", once: true }
        });
      });
    }

    /* -------------------------------------------------- Strangers: colour / mono */
    var cmp = d.querySelector(".cmp__media");
    if (cmp) {
      var cx = { v: 50 }, hovering = false;
      var applyX = function () { cmp.style.setProperty("--x", cx.v.toFixed(2) + "%"); };
      var toX = gsap.quickTo(cx, "v", { duration: 0.6, ease: "power3", onUpdate: applyX });
      ST.create({
        trigger: cmp, start: "top 85%", end: "bottom 25%",
        onUpdate: function (self) { if (!hovering) toX(88 - self.progress * 76); }
      });
      if (!MK.isTouch) {
        cmp.addEventListener("pointermove", function (e) {
          var r = cmp.getBoundingClientRect();
          hovering = true; toX(gsap.utils.clamp(2, 98, (e.clientX - r.left) / r.width * 100));
        });
        cmp.addEventListener("pointerleave", function () { hovering = false; toX(50); });
      }
    }

    /* -------------------------------------------------- Vivian Maier: iris */
    gsap.fromTo(".maier__blades", { rotation: -40, scale: 0.82 }, {
      rotation: 80, scale: 1.04, ease: "none",
      scrollTrigger: { trigger: ".maier", start: "top bottom", end: "bottom top", scrub: true }
    });

    /* -------------------------------------------------- Small wonders: drift */
    mm.add(desktop, function () {
      var sp = [-50, 70, -20, 110, -70, 40, 90];
      gsap.utils.toArray(".sky .ph").forEach(function (f, i) {
        var s = sp[i % sp.length];
        gsap.fromTo(f, { y: s }, {
          y: -s, ease: "none",
          scrollTrigger: { trigger: ".sky", start: "top bottom", end: "bottom top", scrub: true }
        });
      });
    });

    ST.refresh();
  });
})();
