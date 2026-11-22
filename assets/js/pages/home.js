/* Home — The Foyer */
(function () {
  "use strict";
  if (!window.MK) return;
  var d = document;

  /* -------- Hero name: split into chars (own split so we control intro + proximity) -------- */
  var nameChars = [];
  d.querySelectorAll(".hero__name .hn").forEach(function (hn) {
    var text = hn.textContent; hn.textContent = "";
    Array.from(text).forEach(function (ch) {
      var s = d.createElement("span"); s.className = "char"; s.textContent = ch; hn.appendChild(s); nameChars.push(s);
    });
  });

  MK.ready(function (MK) {
    var gsap = MK.gsap, ST = MK.ScrollTrigger;
    var reduced = MK.reduced;
    var hero = d.querySelector(".hero");
    var lines = d.querySelectorAll(".hero__line");
    var dot = d.querySelector(".hero__dot");

    if (!reduced) {
      gsap.set(lines, { clipPath: "inset(-0.4em -0.6em 0em -0.6em)" });
      gsap.set(nameChars, { yPercent: 115, rotate: 7, transformOrigin: "0% 100%" });
      gsap.set(dot, { scale: 0 });
    }

    /* -------- Badge rotation, velocity reactive -------- */
    var badgeSvg = d.querySelector(".hero__badge > svg");
    var spin = null;
    if (badgeSvg && !reduced) {
      spin = gsap.to(badgeSvg, { rotation: 360, duration: 20, ease: "none", repeat: -1, transformOrigin: "50% 50%" });
      gsap.ticker.add(function () { spin.timeScale(1 + Math.min(12, Math.abs(MK.velocity()) * 0.35)); });
      gsap.from(".hero__badge", { scale: 0, rotate: -90, duration: 1.4, ease: "expo.out", paused: true, delay: 1.2, id: "badgeIntro" });
    }

    /* -------- Scroll-out: the name drifts apart, the arch rises -------- */
    if (!reduced) {
      var mm = gsap.matchMedia();
      mm.add("(min-width: 761px)", function () {
        var tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 } });
        tl.to(".hero__line--1", { xPercent: -6, ease: "none" }, 0)
          .to(".hero__line--2", { xPercent: 5, ease: "none" }, 0)
          .to(".hero__line--3", { xPercent: 12, ease: "none" }, 0)
          .to(".hero__visual", { yPercent: -18, ease: "none" }, 0)
          .to(".hero__arch", { scale: 0.92, ease: "none" }, 0)
          .to(".hero__foot", { yPercent: -40, opacity: 0, ease: "none" }, 0);
      });
      mm.add("(max-width: 760px)", function () {
        gsap.to(".hero__visual", { yPercent: -10, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 } });
      });
    }

    /* -------- Arch slideshow -------- */
    var slides = Array.from(d.querySelectorAll(".hero__slide"));
    var cap = d.querySelector(".hero__cap"), capN = d.querySelector(".hero__cap-n");
    var arch = d.querySelector(".hero__arch");
    var cur = 0, timer = null, busy = false, inView = true;
    if (arch) arch.setAttribute("data-cursor", "Next");
    function setCap(i) {
      var t = slides[i].getAttribute("data-cap");
      var n = String(i + 1).padStart(2, "0") + "/" + String(slides.length).padStart(2, "0");
      if (reduced) { cap.textContent = t; capN.textContent = n; return; }
      gsap.to([cap, capN], { yPercent: -110, duration: 0.4, ease: "power3.in", onComplete: function () {
        cap.textContent = t; capN.textContent = n;
        gsap.fromTo([cap, capN], { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: "expo.out" });
      } });
    }
    function go(next) {
      if (busy || slides.length < 2) return;
      busy = true;
      var prev = slides[cur]; cur = (next + slides.length) % slides.length;
      var nx = slides[cur];
      setCap(cur);
      if (reduced) { prev.classList.remove("is-on"); nx.classList.add("is-on"); busy = false; return; }
      gsap.set(nx, { zIndex: 2, opacity: 1 }); gsap.set(prev, { zIndex: 1 });
      gsap.fromTo(nx, { clipPath: "inset(100% 0% 0% 0%)", scale: 1.25 }, {
        clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.35, ease: "expo.inOut",
        onComplete: function () { prev.classList.remove("is-on"); gsap.set(prev, { opacity: 0, zIndex: 0 }); nx.classList.add("is-on"); busy = false; }
      });
      gsap.to(prev, { scale: 1.08, duration: 1.35, ease: "expo.inOut" });
    }
    function schedule() {
      clearTimeout(timer);
      if (reduced) return;
      timer = setTimeout(function () { if (inView && !d.hidden) go(cur + 1); schedule(); }, 3600);
    }
    if (arch) arch.addEventListener("click", function () { go(cur + 1); schedule(); });
    ST.create({ trigger: hero, start: "top top", end: "bottom top", onToggle: function (s) { inView = s.isActive; } });

    /* -------- Proximity type: letters thicken and soften near the cursor -------- */
    if (!reduced && !MK.isTouch && nameChars.length) {
      var state = nameChars.map(function () { return { w: 340, s: 30 }; });
      var active = false, heroVisible = true;
      ST.create({ trigger: hero, start: "top top", end: "bottom top", onToggle: function (s) { heroVisible = s.isActive; } });
      MK.onReveal(function () { gsap.delayedCall(2.2, function () { active = true; }); });
      gsap.ticker.add(function () {
        if (!active || !heroVisible) return;
        var px = MK.pointer.x, py = MK.pointer.y;
        for (var i = 0; i < nameChars.length; i++) {
          var c = nameChars[i], r = c.getBoundingClientRect();
          var dist = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
          var k = Math.max(0, 1 - dist / 340);
          k = k * k * (3 - 2 * k);
          var italic = c.parentElement.classList.contains("hn--it");
          var tw = (italic ? 300 : 340) + k * 360, ts = (italic ? 100 : 30) + k * (italic ? 0 : 70);
          var st = state[i];
          st.w += (tw - st.w) * 0.12; st.s += (ts - st.s) * 0.12;
          c.style.fontVariationSettings = '"opsz" 144, "wght" ' + st.w.toFixed(1) + ', "SOFT" ' + st.s.toFixed(1) + ', "WONK" ' + (italic ? 1 : 0);
        }
      });
    }

    /* -------- Intro (plays when the curtain lifts) -------- */
    MK.onReveal(function () {
      if (reduced) { schedule(); return; }
      var tl = gsap.timeline({ delay: 0.05 });
      tl.to(nameChars, { yPercent: 0, rotate: 0, duration: 1.5, ease: "expo.out", stagger: 0.035 }, 0)
        .to(dot, { scale: 1, duration: 1, ease: "back.out(3)" }, 0.9)
        .add(function () { var b = gsap.getById("badgeIntro"); if (b) b.play(); }, 0.6)
        .add(function () { gsap.set(lines, { clearProps: "clipPath" }); }, 2.2);
      schedule();
    });

    /* -------- Intro paragraph: inline images grow in -------- */
    if (!reduced) {
      d.querySelectorAll(".ib").forEach(function (ib) {
        gsap.fromTo(ib, { scale: 0, rotate: -12 }, {
          scale: 1, rotate: 0, duration: 1.4, ease: "expo.out",
          scrollTrigger: { trigger: ib, start: "top 82%", once: true }
        });
        gsap.fromTo(ib.querySelector("img"), { scale: 1.6 }, { scale: 1, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: ib, start: "top 82%", once: true } });
      });
    }

    /* -------- Rooms: rules draw, rows rise -------- */
    if (!reduced) {
      d.querySelectorAll(".room-row").forEach(function (row, i) {
        var parts = row.querySelectorAll(".room__n, .room__thumb, .room__t, .room__d, .room__go");
        var tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 90%", once: true } });
        tl.fromTo(row, { "--rule": 0 }, { "--rule": 1, duration: 1.4, ease: "expo.inOut" }, 0)
          .from(parts, { yPercent: 60, autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: 0.06 }, 0.2);
      });
    }

    /* -------- Voices carousel -------- */
    var voices = Array.from(d.querySelectorAll(".voice"));
    var vi = 0, vBusy = false, vTween = null, vPaused = false, vVisible = false;
    var ring = d.querySelector(".voices__ring circle");
    var counter = d.querySelector(".voices__i");
    var splits = voices.map(function (v) {
      var p = v.querySelector(".voice__text");
      return MK.SplitText && !reduced ? MK.SplitText.create(p, { type: "lines", mask: "lines", linesClass: "line" }) : null;
    });
    function runRing() {
      if (vTween) vTween.kill();
      if (reduced || !ring) return;
      vTween = gsap.fromTo(ring, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 7, ease: "none", paused: vPaused || !vVisible, onComplete: function () { showVoice(vi + 1); } });
    }
    function showVoice(n) {
      if (vBusy) return;
      var next = (n + voices.length) % voices.length;
      if (next === vi) return;
      vBusy = true;
      var a = voices[vi], b = voices[next], sa = splits[vi], sb = splits[next];
      counter.textContent = String(next + 1).padStart(2, "0");
      if (reduced || !sa || !sb) {
        a.classList.remove("is-active"); b.classList.add("is-active"); vi = next; vBusy = false; return;
      }
      var tl = gsap.timeline({ onComplete: function () { a.classList.remove("is-active"); vi = next; vBusy = false; runRing(); } });
      tl.to(sa.lines, { yPercent: -110, duration: 0.6, ease: "power3.in", stagger: 0.04 }, 0)
        .to(a.querySelector(".voice__by"), { autoAlpha: 0, y: -10, duration: 0.4 }, 0)
        .add(function () { b.classList.add("is-active"); }, 0.55)
        .fromTo(sb.lines, { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.07 }, 0.55)
        .fromTo(b.querySelector(".voice__by"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out" }, 0.8)
        .set(sa.lines, { yPercent: 0 })
        .set(a.querySelector(".voice__by"), { autoAlpha: 1, y: 0 });
    }
    var prevBtn = d.querySelector(".voices__prev"), nextBtn = d.querySelector(".voices__next");
    if (prevBtn) prevBtn.addEventListener("click", function () { showVoice(vi - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { showVoice(vi + 1); });
    var stage = d.querySelector(".voices");
    if (stage) {
      stage.addEventListener("pointerenter", function () { vPaused = true; if (vTween) vTween.pause(); });
      stage.addEventListener("pointerleave", function () { vPaused = false; if (vTween && vVisible) vTween.resume(); });
      stage.addEventListener("focusin", function () { vPaused = true; if (vTween) vTween.pause(); });
      stage.addEventListener("focusout", function () { vPaused = false; if (vTween && vVisible) vTween.resume(); });
      var sx = 0;
      stage.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
      stage.addEventListener("touchend", function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) showVoice(vi + (dx < 0 ? 1 : -1)); });
      ST.create({ trigger: stage, start: "top 75%", end: "bottom 20%", onToggle: function (s) {
        vVisible = s.isActive;
        if (!vTween) runRing();
        if (vTween) { if (vVisible && !vPaused) vTween.resume(); else vTween.pause(); }
      } });
      if (!reduced && splits[0]) {
        gsap.from(splits[0].lines, { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: stage, start: "top 70%", once: true } });
      }
    }
  });
})();
