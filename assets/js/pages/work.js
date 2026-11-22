/* ==========================================================================
   Room 01 — The Ledger (work.html)
   Signature motion: hero line masks + glyphs, ledger thread with chapter
   nodes, 200-dot client orbit, fanned magazine spread, orbiting stills,
   live waveform, spinning EP record, quote marks.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.MK) return;
  var d = document;
  var SVGNS = "http://www.w3.org/2000/svg";

  function svgEl(tag, attrs) {
    var el = d.createElementNS(SVGNS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  /* ---------------------------------------------------- static builds (always) */
  // 200 client dots across four orbits
  var orbit = d.querySelector("[data-orbit]");
  var ringGroups = [];
  if (orbit) {
    var dotsG = orbit.querySelector(".orbit__dots");
    var radii = [132, 176, 220, 266], counts = [34, 46, 56, 64];
    var n = 0;
    radii.forEach(function (r, ri) {
      var g = svgEl("g", { "class": "orbit__ring" });
      for (var i = 0; i < counts[ri]; i++) {
        n++;
        var a = (i / counts[ri]) * Math.PI * 2 + Math.sin(i * 12.9898 + ri) * 0.06;
        var jr = r + Math.sin(i * 78.233 + ri * 3) * 5;
        var c = svgEl("circle", { cx: (300 + Math.cos(a) * jr).toFixed(2), cy: (300 + Math.sin(a) * jr).toFixed(2), r: (2.4 + (i % 3) * 0.55).toFixed(2) });
        if (n % 11 === 0) c.setAttribute("class", "is-a");
        else if (n % 17 === 0) c.setAttribute("class", "is-g");
        g.appendChild(c);
      }
      dotsG.appendChild(g);
      ringGroups.push(g);
    });
  }

  // EP grooves: six bands for six songs
  var vinyl = d.querySelector("[data-vinyl]");
  if (vinyl) {
    var gg = vinyl.querySelector(".vinyl__grooves");
    var bandEdges = [92, 110, 128, 146, 162, 178];
    for (var r = 80; r <= 192; r += 3.2) {
      var isGap = bandEdges.some(function (b) { return Math.abs(b - r) < 1.6; });
      gg.appendChild(svgEl("circle", { cx: 200, cy: 200, r: r.toFixed(1), "class": isGap ? "is-gap" : "" }));
    }
  }

  // Waveform path builder
  var wave = d.querySelector("[data-wave]");
  var waveLine = wave && wave.querySelector(".wave__line");
  var waveGhost = wave && wave.querySelector(".wave__ghost");
  var PTS = 140;
  function wavePath(t, amp, phase, px) {
    var s = "";
    for (var i = 0; i <= PTS; i++) {
      var u = i / PTS;
      var env = Math.pow(Math.sin(Math.PI * u), 1.6);
      var near = px == null ? 0 : Math.exp(-Math.pow((u - px) * 6, 2)) * 0.8;
      var y = Math.sin(u * 23 + t * 2.1 + phase) * 0.55 +
              Math.sin(u * 51 - t * 3.3 + phase * 2) * 0.28 +
              Math.sin(u * 9 + t * 0.9) * 0.35;
      var v = 120 + y * amp * env * (1 + near);
      s += (i ? "L" : "M") + (u * 1200).toFixed(1) + " " + v.toFixed(1);
    }
    return s;
  }
  if (wave) { waveLine.setAttribute("d", wavePath(1.3, 62, 0, null)); waveGhost.setAttribute("d", wavePath(1.3, 44, 1.7, null)); }

  /* ---------------------------------------------------- motion */
  MK.ready(function (MK) {
    var gsap = MK.gsap, ST = MK.ScrollTrigger;
    var chapters = d.querySelectorAll(".ch");

    if (MK.reduced) {
      chapters.forEach(function (c) { c.classList.add("is-on"); });
      return;
    }

    /* Hero: masked lines + glyphs (played on reveal) */
    var lines = d.querySelectorAll(".w-hero__title .hl__in");
    var glyphs = d.querySelectorAll(".w-hero__title .w-glyph");
    gsap.set(lines, { yPercent: 115, rotate: 3, transformOrigin: "0% 100%" });
    gsap.set(glyphs, { scale: 0, rotate: -60 });
    MK.onReveal(function () {
      gsap.to(lines, { yPercent: 0, rotate: 0, duration: 1.5, ease: "expo.out", stagger: 0.11, delay: 0.1 });
      gsap.to(glyphs, { scale: 1, rotate: 0, duration: 1.6, ease: "expo.out", stagger: 0.12, delay: 0.55 });
    });
    // gentle hero parallax on the way out
    gsap.to(".w-hero__title", { yPercent: -12, ease: "none", scrollTrigger: { trigger: ".w-hero", start: "top top", end: "bottom top", scrub: true } });

    /* Ledger thread */
    var ledger = d.querySelector("[data-ledger]");
    if (ledger) {
      var fill = ledger.querySelector(".ledger__fill"), bead = ledger.querySelector(".ledger__bead");
      var stCfg = { trigger: ledger, start: "top 50%", end: "bottom 50%", scrub: 0.4 };
      gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: stCfg });
      gsap.fromTo(bead, { y: 0 }, { y: function () { return ledger.offsetHeight; }, ease: "none", immediateRender: false,
        scrollTrigger: Object.assign({}, stCfg, { invalidateOnRefresh: true,
          onToggle: function (s) { gsap.to(bead, { opacity: s.isActive ? 1 : 0, duration: 0.4 }); } }) });
      chapters.forEach(function (c) {
        ST.create({ trigger: c.querySelector(".ch__node"), start: "top 50%",
          onEnter: function () { c.classList.add("is-on"); },
          onLeaveBack: function () { c.classList.remove("is-on"); } });
      });
    }

    /* Ledger rows: dotted leaders draw in */
    d.querySelectorAll("[data-rows]").forEach(function (dl) {
      var rows = dl.querySelectorAll(".rows__r");
      gsap.fromTo(rows, { "--lead": 0, autoAlpha: 0, y: 14 }, { "--lead": 1, autoAlpha: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.08,
        scrollTrigger: { trigger: dl, start: "top 85%", once: true } });
    });

    /* Orbit: rings draw, dots bloom outward, rotation reacts to scroll velocity */
    if (orbit) {
      var rings = orbit.querySelectorAll(".orbit__rings circle");
      rings.forEach(function (c) { var L = 2 * Math.PI * c.r.baseVal.value; gsap.set(c, { strokeDasharray: L, strokeDashoffset: L }); });
      var allDots = orbit.querySelectorAll(".orbit__dots circle");
      gsap.set(allDots, { scale: 0, transformOrigin: "50% 50%" });
      gsap.set(".orbit__center", { autoAlpha: 0, scale: 0.85 });
      var tl = gsap.timeline({ paused: true });
      tl.to(rings, { strokeDashoffset: 0, duration: 1.8, ease: "expo.inOut", stagger: 0.12 }, 0)
        .to(allDots, { scale: 1, duration: 0.9, ease: "back.out(2)", stagger: { each: 0.006 } }, 0.4)
        .to(".orbit__center", { autoAlpha: 1, scale: 1, duration: 1.2, ease: "expo.out" }, 0.3);
      ST.create({ trigger: orbit, start: "top 80%", once: true, onEnter: function () { tl.play(); } });

      var spins = ringGroups.map(function (g, i) {
        return gsap.to(g, { rotation: i % 2 ? -360 : 360, svgOrigin: "300 300", duration: 70 + i * 28, ease: "none", repeat: -1 });
      });
      var oVis = false, oBoost = 1;
      ST.create({ trigger: orbit, start: "top bottom", end: "bottom top", onToggle: function (s) {
        oVis = s.isActive; spins.forEach(function (t) { oVis ? t.resume() : t.pause(); });
      } });
      var hover = 0;
      if (!MK.isTouch) {
        orbit.addEventListener("pointerenter", function () { hover = 3; });
        orbit.addEventListener("pointerleave", function () { hover = 0; });
      }
      gsap.ticker.add(function () {
        if (!oVis) return;
        var target = 1 + Math.min(Math.abs(MK.velocity()) * 0.6, 14) + hover;
        oBoost += (target - oBoost) * 0.06;
        spins.forEach(function (t) { t.timeScale(oBoost); });
      });
    }

    /* Quote marks swing in */
    d.querySelectorAll("[data-quote]").forEach(function (q) {
      var mark = q.querySelector(".quote__mark"), by = q.querySelector(".quote__by"), q2 = q.querySelector(".ch__quote-2");
      var t = gsap.timeline({ scrollTrigger: { trigger: q, start: "top 82%", once: true } });
      t.from(mark, { scale: 0.3, rotate: -30, autoAlpha: 0, transformOrigin: "30% 60%", duration: 1.4, ease: "expo.out" }, 0)
       .from(by, { autoAlpha: 0, x: -24, duration: 1.2, ease: "expo.out" }, 0.5);
      if (q2) t.from(q2, { autoAlpha: 0, y: 24, duration: 1.2, ease: "expo.out" }, 0.7);
    });

    /* Magazine spread fans open on scroll */
    var fan = d.querySelector("[data-fan]");
    if (fan) {
      var items = fan.querySelectorAll(".fan__i");
      var mm = gsap.matchMedia();
      mm.add({ mob: "(max-width: 760px)", desk: "(min-width: 761px)" }, function (ctx) {
        var spread = ctx.conditions.mob ? [[-26, -12], [0, 0], [26, 12]] : [[-30, -17], [0, 0], [30, 17]];
        items.forEach(function (it, i) {
          gsap.fromTo(it, { xPercent: 0, yPercent: i === 1 ? 6 : 10, rotation: (i - 1) * 2, scale: 0.9 },
            { xPercent: spread[i][0], yPercent: i === 1 ? -3 : 0, rotation: spread[i][1], scale: 1, ease: "none",
              scrollTrigger: { trigger: fan, start: "top 92%", end: "center 52%", scrub: 0.8 } });
        });
      });
    }

    /* Article rows stagger in */
    var arts = d.querySelectorAll(".arts__list li");
    if (arts.length) gsap.from(arts, { autoAlpha: 0, y: 30, duration: 1.2, ease: "expo.out", stagger: 0.09,
      scrollTrigger: { trigger: ".arts__list", start: "top 85%", once: true } });

    /* Stills orbit around the centre while you scroll */
    var stills = d.querySelector("[data-stills]");
    if (stills) {
      var orb = stills.querySelector(".stills__orb");
      var sItems = stills.querySelectorAll(".stills__i");
      var sMedia = stills.querySelectorAll(".stills__i .media");
      gsap.from(sMedia, { scale: 0, duration: 1.4, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: stills, start: "top 80%", once: true } });
      var stc = { trigger: stills, start: "top bottom", end: "bottom top", scrub: 0.6 };
      gsap.fromTo(orb, { rotation: -25 }, { rotation: 25, ease: "none", scrollTrigger: stc });
      gsap.fromTo(sItems, { rotation: 25 }, { rotation: -25, ease: "none", scrollTrigger: stc });
    }

    /* Live waveform */
    if (wave) {
      var wVis = false, amp = 40, px = null, pxS = 0.5, pxOn = 0;
      ST.create({ trigger: wave, start: "top bottom", end: "bottom top", onToggle: function (s) { wVis = s.isActive; } });
      gsap.from(wave, { scaleX: 0, transformOrigin: "0% 50%", duration: 1.8, ease: "expo.inOut", scrollTrigger: { trigger: wave, start: "top 85%", once: true } });
      if (!MK.isTouch) {
        wave.addEventListener("pointermove", function (e) { var r = wave.getBoundingClientRect(); px = (e.clientX - r.left) / r.width; });
        wave.addEventListener("pointerleave", function () { px = null; });
      }
      gsap.ticker.add(function (time) {
        if (!wVis) return;
        var target = 46 + Math.min(Math.abs(MK.velocity()) * 4, 50);
        amp += (target - amp) * 0.08;
        pxOn += ((px == null ? 0 : 1) - pxOn) * 0.08;
        if (px != null) pxS += (px - pxS) * 0.15;
        var p = pxOn > 0.02 ? pxS : null;
        waveLine.setAttribute("d", wavePath(time, amp * (p == null ? 1 : 1 + pxOn * 0.2), 0, p));
        waveGhost.setAttribute("d", wavePath(time * 0.8, amp * 0.7, 1.7, p));
      });
    }

    /* Stats + tally rise */
    [".tally__i", ".stats__i"].forEach(function (sel) {
      var els = d.querySelectorAll(sel);
      if (els.length) gsap.from(els, { autoAlpha: 0, y: 40, duration: 1.3, ease: "expo.out", stagger: 0.1,
        scrollTrigger: { trigger: els[0].parentNode, start: "top 85%", once: true } });
    });

    /* EP record spins; faster on hover and with scroll velocity */
    if (vinyl) {
      var spinG = vinyl.querySelector(".vinyl__spin");
      var spin = gsap.to(spinG, { rotation: 360, svgOrigin: "200 200", duration: 9, ease: "none", repeat: -1 });
      gsap.from(vinyl, { scale: 0.6, rotate: -90, autoAlpha: 0, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: vinyl, start: "top 85%", once: true } });
      var vVis = false, vBoost = 1, vHover = 0;
      ST.create({ trigger: vinyl, start: "top bottom", end: "bottom top", onToggle: function (s) { vVis = s.isActive; vVis ? spin.resume() : spin.pause(); } });
      var ep = vinyl.closest(".ep");
      if (!MK.isTouch && ep) {
        vinyl.addEventListener("pointerenter", function () { vHover = 3.5; });
        vinyl.addEventListener("pointerleave", function () { vHover = 0; });
      }
      gsap.ticker.add(function () {
        if (!vVis) return;
        var target = 1 + vHover + Math.min(Math.abs(MK.velocity()) * 0.25, 5);
        vBoost += (target - vBoost) * 0.05;
        spin.timeScale(vBoost);
      });
    }
  });
})();
