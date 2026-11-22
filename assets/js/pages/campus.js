/* Room 02 — Stage & Page */
(function () {
  "use strict";
  if (!window.MK) return;
  var d = document, root = d.documentElement;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }

  /* ---------------- Prologue arc: a curve drawn through the education nodes ---------------- */
  function catmull(pts) {
    var p = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      p += " C" + [c1x, c1y, c2x, c2y, p2[0], p2[1]].map(function (n) { return n.toFixed(1); }).join(" ");
    }
    return p;
  }
  function drawArc() {
    var arc = $(".cp-arc"); if (!arc) return;
    var svg = $(".cp-arc__svg", arc);
    var box = arc.getBoundingClientRect();
    var pts = $$(".cp-node__dot", arc).map(function (dot) {
      var r = dot.getBoundingClientRect();
      return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
    });
    if (pts.length < 2) return;
    var mobile = MK.mq.mobile.matches;
    var first = pts[0], last = pts[pts.length - 1];
    if (mobile) {
      pts.unshift([first[0], first[1] - 70]);
      pts.push([last[0], box.height + 20]);
    } else {
      pts.unshift([first[0] - Math.min(160, box.width * 0.08), first[1] + 160]);
      pts.push([box.width, last[1] - 60]);
    }
    svg.setAttribute("viewBox", "0 0 " + box.width.toFixed(1) + " " + box.height.toFixed(1));
    var dAttr = catmull(pts);
    $(".cp-arc__path", svg).setAttribute("d", dAttr);
    $(".cp-arc__ghost", svg).setAttribute("d", dAttr);
  }

  MK.ready(function (MK) {
    var gsap = MK.gsap, ST = MK.ScrollTrigger, reduced = MK.reduced;

    if (MK.isTouch) root.classList.add("cp-touch");
    drawArc();
    ST.addEventListener("refreshInit", drawArc);
    addEventListener("load", drawArc);

    if (reduced) return; /* everything else is motion; static layout is already final */
    root.classList.add("cp-motion");

    /* Arc stroke scrubs with scroll; dots pop as you arrive */
    var arcPath = $(".cp-arc__path");
    if (arcPath) {
      gsap.fromTo(arcPath, { strokeDasharray: 1, strokeDashoffset: 1 }, {
        strokeDashoffset: 0, ease: "none",
        scrollTrigger: { trigger: ".cp-arc", start: "top 80%", end: "bottom 55%", scrub: 0.8 }
      });
    }
    $$(".cp-node").forEach(function (node) {
      var dot = $(".cp-node__dot", node);
      var rest = $$(":scope > :not(.cp-node__dot)", node);
      var tl = gsap.timeline({ scrollTrigger: { trigger: node, start: "top 78%", once: true } });
      tl.from(dot, { scale: 0, duration: 0.9, ease: "back.out(2.2)" })
        .from(rest, { autoAlpha: 0, y: 30, duration: 1.2, ease: "expo.out", stagger: 0.08 }, 0.1);
    });

    /* Programme rows slide in like names on a playbill */
    gsap.from(".cp-bill__row", {
      autoAlpha: 0, y: 26, duration: 1.1, ease: "expo.out", stagger: 0.07,
      scrollTrigger: { trigger: ".cp-bill__list", start: "top 85%", once: true }
    });

    /* Act numerals fill with ink as you read through the act header */
    $$(".cp-numeral").forEach(function (n) {
      var f = $(".cp-numeral__f", n);
      gsap.fromTo(f, { clipPath: "inset(100% 0% 0% 0%)" }, {
        clipPath: "inset(0% 0% 0% 0%)", ease: "none",
        scrollTrigger: { trigger: n, start: "top 85%", end: "bottom 45%", scrub: 0.6 }
      });
      gsap.fromTo(n, { yPercent: 18, rotate: -4 }, {
        yPercent: -6, rotate: 0, ease: "none",
        scrollTrigger: { trigger: n, start: "top bottom", end: "bottom 30%", scrub: true }
      });
    });

    /* Hero: the round cover drifts against the pointer */
    var coin = $(".cp-hero__coin");
    if (coin && !MK.isTouch) {
      var cx = gsap.quickTo(coin, "x", { duration: 1.2, ease: "power3" });
      var cy = gsap.quickTo(coin, "y", { duration: 1.2, ease: "power3" });
      $(".cp-hero").addEventListener("pointermove", function (e) {
        cx((e.clientX / innerWidth - 0.5) * -28);
        cy((e.clientY / innerHeight - 0.5) * -22);
      });
    }

    /* ELA: the plate turns as you scroll */
    var plate = $(".cp-menu__plate img");
    if (plate) gsap.fromTo(plate, { rotate: -50, scale: 1.08 }, {
      rotate: 40, scale: 1.08, ease: "none",
      scrollTrigger: { trigger: ".cp-menu", start: "top bottom", end: "bottom top", scrub: true }
    });

    /* ELA: brackets that open on arrival, close on hover / tap */
    $$(".cp-conf__title").forEach(function (title) {
      var l = $(".cp-paren__l", title), r = $(".cp-paren__r", title), inn = $(".cp-paren__in", title);
      if (!l || !r || !inn) return;
      var shift = function () { return inn.offsetWidth / 2 - inn.offsetHeight * 0.02; };
      var tl = gsap.timeline({ paused: true, defaults: { duration: 0.9, ease: "expo.inOut" } });
      tl.to(l, { x: function () { return shift(); }, rotate: 8 }, 0)
        .to(r, { x: function () { return -shift(); }, rotate: -8 }, 0)
        .to(inn, { scaleX: 0, autoAlpha: 0, duration: 0.7 }, 0);
      var shut = false, inView = false;
      ST.create({
        trigger: title, start: "top 82%", once: true,
        onEnter: function () { inView = true; tl.progress(1); gsap.delayedCall(0.25, function () { tl.timeScale(0.75).reverse(); }); }
      });
      ST.addEventListener("refreshInit", function () { var p = tl.progress(); tl.invalidate(); tl.progress(p); });
      if (!MK.isTouch) {
        title.addEventListener("pointerenter", function () { if (inView) { tl.timeScale(1).play(); shut = true; } });
        title.addEventListener("pointerleave", function () { if (inView) { tl.timeScale(1).reverse(); shut = false; } });
      }
      var toggle = function () { if (!inView) return; shut = !shut; tl.timeScale(1); if (shut) tl.play(); else tl.reverse(); };
      if (MK.isTouch) title.addEventListener("click", toggle);
      title.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    });

    /* Omori: five endings light up one by one */
    var ends = $$(".cp-paper__end");
    if (ends.length) {
      ST.create({
        trigger: ".cp-paper", start: "top 75%", end: "center 40%", scrub: true,
        onUpdate: function (s) {
          var n = Math.round(s.progress * ends.length);
          ends.forEach(function (e, i) { e.classList.toggle("is-lit", i < n); });
        }
      });
      gsap.fromTo(".cp-paper__ends", { rotate: -72 }, {
        rotate: 0, ease: "none",
        scrollTrigger: { trigger: ".cp-paper", start: "top bottom", end: "center 40%", scrub: 0.6 }
      });
    }

    /* Aranya: the covers fan out as you scroll in */
    var fan = $(".cp-fan");
    if (fan) {
      gsap.fromTo(fan, { "--spread": 0 }, {
        "--spread": 1, ease: "none",
        scrollTrigger: { trigger: fan, start: "top 92%", end: "center 55%", scrub: 0.9 }
      });
      gsap.from($$(".cp-fan__cover", fan), {
        clipPath: "inset(100% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut", stagger: 0.08,
        scrollTrigger: { trigger: fan, start: "top 88%", once: true },
        onComplete: function () { gsap.set($$(".cp-fan__cover", fan), { clearProps: "clipPath" }); }
      });
    }

    /* Inside list: words rise one by one */
    gsap.from(".cp-inside__list li", {
      yPercent: 60, autoAlpha: 0, duration: 1.3, ease: "expo.out", stagger: 0.1,
      scrollTrigger: { trigger: ".cp-inside", start: "top 80%", once: true }
    });

    /* Stage: curtain rise */
    var stage = $(".cp-stage"), curtain = $(".cp-curtain"), spot = $(".cp-spot");
    if (curtain) {
      gsap.fromTo(curtain, { yPercent: 0 }, {
        yPercent: -102, ease: "power1.in",
        scrollTrigger: { trigger: stage, start: "top 75%", end: "top 5%", scrub: 0.5 }
      });
      gsap.fromTo(".cp-curtain__lab", { yPercent: 0, autoAlpha: 1 }, {
        yPercent: -80, autoAlpha: 0, ease: "none",
        scrollTrigger: { trigger: stage, start: "top 60%", end: "top 25%", scrub: true }
      });
    }

    /* Stage: the spotlight follows the cursor (or drifts on touch) */
    if (stage && spot) {
      var active = false;
      var s = { x: innerWidth / 2, y: innerHeight * 0.45, r: 0 };
      ST.create({ trigger: stage, start: "top bottom", end: "bottom top", onToggle: function (st) { active = st.isActive; } });
      gsap.ticker.add(function (t) {
        if (!active) return;
        var tx, ty, tr;
        if (!MK.isTouch && MK.pointer) {
          tx = MK.pointer.x; ty = MK.pointer.y; tr = Math.max(240, Math.min(innerWidth * 0.26, 440));
        } else {
          tx = innerWidth * (0.5 + 0.26 * Math.sin(t * 0.55));
          ty = innerHeight * (0.48 + 0.2 * Math.sin(t * 0.83 + 1.2));
          tr = innerWidth * 0.7;
        }
        s.x += (tx - s.x) * 0.1; s.y += (ty - s.y) * 0.1; s.r += (tr - s.r) * 0.06;
        spot.style.setProperty("--sx", s.x.toFixed(1) + "px");
        spot.style.setProperty("--sy", s.y.toFixed(1) + "px");
        spot.style.setProperty("--sr", s.r.toFixed(1) + "px");
      });
    }

    /* Macbeth roles: lines rise like cues */
    gsap.from(".cp-mac__roles li", {
      autoAlpha: 0, x: -40, duration: 1.2, ease: "expo.out", stagger: 0.09,
      scrollTrigger: { trigger: ".cp-mac__roles", start: "top 82%", once: true }
    });

    /* LitScroll: on touch, the essay in the middle of the screen takes the hover state */
    if (MK.isTouch) {
      $$(".cp-essay").forEach(function (e) {
        ST.create({ trigger: e, start: "top 62%", end: "bottom 38%", toggleClass: { targets: e, className: "is-on" } });
      });
    }
    gsap.from(".cp-essay", {
      autoAlpha: 0, y: 40, duration: 1.2, ease: "expo.out", stagger: 0.12,
      scrollTrigger: { trigger: ".cp-essays", start: "top 85%", once: true }
    });

    /* Epilogue: the quote mark swings in */
    gsap.fromTo(".cp-epi__mark", { rotate: -30, scale: 0.5, autoAlpha: 0 }, {
      rotate: 0, scale: 1, autoAlpha: 1, ease: "none",
      scrollTrigger: { trigger: ".cp-epi__big", start: "top 90%", end: "top 45%", scrub: 0.6 }
    });

    /* Exeunt: the letters walk on from the wings */
    var ex = $(".cp-exeunt__word");
    if (ex && MK.SplitText) {
      MK.SplitText.create(ex, {
        type: "chars", autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.chars, {
            xPercent: 160, rotate: 12, autoAlpha: 0, ease: "power2.out", stagger: 0.06,
            scrollTrigger: { trigger: ex, start: "top 95%", end: "top 50%", scrub: 0.8 }
          });
        }
      });
    }

  });
})();
