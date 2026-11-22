/* ==========================================================================
   Core motion engine — shared by every page.
   Exposes window.MK. Page scripts register work with:
     MK.ready(fn)    -> after fonts load and core animations are built
     MK.onReveal(fn) -> when the page becomes visible (after curtain/preloader)
   Declarative attributes handled here (see README for the full list):
     data-split="lines|words|chars"  masked text reveal (add data-intro to play on page reveal)
     data-reveal="up|fade|scale"     simple reveal
     data-media="wipe|bloom|rise"    shaped image reveal (figure.media)
     data-parallax="0.2"             scrubbed parallax
     data-words                      word-by-word scrub brightening
     data-count="5.2" data-decimals  number counter
     data-marquee="1|-1"             velocity-reactive marquee
     data-draw / data-draw="scrub"   SVG stroke drawing
     data-magnetic="0.35"            magnetic pull
     data-cursor="View"              cursor label
     data-preview="src"              floating arch preview following the cursor
     data-lightbox="group"           opens image in lightbox
     data-roll                       per-character roll on hover
     data-copy="text"                copy to clipboard
     data-top                        scroll to top
     data-clock                      live IST clock
   ========================================================================== */
(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger, SplitText = window.SplitText;
  if (!gsap || !ScrollTrigger) { root.classList.add("no-anim"); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (SplitText) gsap.registerPlugin(SplitText);
  if (window.Flip) gsap.registerPlugin(window.Flip);

  var STATIC = /[?&]static/.test(location.search);
  var reduced = STATIC || matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
  if (STATIC) { root.classList.add("no-anim"); root.classList.remove("is-arriving", "is-preloading"); }

  var MK = (window.MK = {
    gsap: gsap, ScrollTrigger: ScrollTrigger, SplitText: SplitText, Flip: window.Flip,
    reduced: reduced, isTouch: isTouch, lenis: null, booted: false, revealed: false,
    _ready: [], _reveal: [], _readyDone: false,
    ready: function (fn) { if (MK._readyDone) fn(MK); else MK._ready.push(fn); },
    onReveal: function (fn) { if (MK.revealed) fn(MK); else MK._reveal.push(fn); },
    mq: { mobile: matchMedia("(max-width: 760px)"), tablet: matchMedia("(max-width: 1100px)") }
  });
  MK.booted = true;

  var PAGES = {
    "index.html": "The Foyer", "": "The Foyer", "work.html": "The Ledger",
    "campus.html": "Stage & Page", "lens.html": "The Lens", "sound.html": "Sound & Voice"
  };
  function pageKey(url) { var p = url.pathname.split("/").pop(); return p; }

  /* ------------------------------------------------------------------ Theme */
  var themeBtn = d.querySelector("[data-theme-toggle]");
  var metaTheme = d.querySelector('meta[name="theme-color"]');
  function syncThemeUI() {
    var t = root.getAttribute("data-theme");
    if (themeBtn) themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
    if (metaTheme) metaTheme.setAttribute("content", t === "dark" ? "#13100e" : "#f1ebe4");
  }
  syncThemeUI();
  if (themeBtn) themeBtn.addEventListener("click", function (e) {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    var apply = function () {
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("mk-theme", next); } catch (_) {}
      syncThemeUI();
    };
    if (!d.startViewTransition || reduced) {
      root.classList.add("theme-anim"); apply();
      setTimeout(function () { root.classList.remove("theme-anim"); }, 700);
      return;
    }
    var r = themeBtn.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var vt = d.startViewTransition(apply);
    vt.ready.then(function () {
      root.animate(
        { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + rad + "px at " + x + "px " + y + "px)"] },
        { duration: 900, easing: "cubic-bezier(.76,0,.24,1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(function () {});
  });

  /* ------------------------------------------------------------------ Lenis */
  if (!reduced && window.Lenis) {
    var lenis = new window.Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    MK.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  MK.scrollTo = function (target, opts) {
    if (MK.lenis) MK.lenis.scrollTo(target, Object.assign({ duration: 1.6 }, opts || {}));
    else {
      var y = typeof target === "number" ? target : (typeof target === "string" ? d.querySelector(target) : target).getBoundingClientRect().top + scrollY;
      scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    }
  };
  MK.velocity = function () { return MK.lenis ? MK.lenis.velocity : 0; };

  /* ------------------------------------------------------------------ Header */
  var header = d.querySelector("[data-header]");
  var progress = d.querySelector(".brand__progress");
  var lastY = 0;
  function onScroll() {
    var y = scrollY;
    var max = d.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.strokeDashoffset = String(1 - (max > 0 ? Math.min(1, y / max) : 0));
    if (header) header.classList.toggle("is-scrolled", y > 60);
    if (header && !root.classList.contains("menu-open")) {
      if (y > 160 && y > lastY + 4) header.classList.add("is-hidden");
      else if (y < lastY - 4 || y < 160) header.classList.remove("is-hidden");
    }
    lastY = y;
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  d.querySelectorAll(".nav a, .menu__links a").forEach(function (a) {
    var here = pageKey(location) || "index.html";
    var there = pageKey(new URL(a.href, location.href)) || "index.html";
    if (here === there) a.setAttribute("aria-current", "page");
  });

  /* ------------------------------------------------------------------ Menu */
  var menu = d.querySelector("[data-menu]");
  var menuBtn = d.querySelector("[data-menu-toggle]");
  var menuOpen = false;
  function setMenu(open) {
    if (!menu || !menuBtn || open === menuOpen) return;
    menuOpen = open;
    var r = menuBtn.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 20;
    var links = menu.querySelectorAll(".menu__links a > *");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) {
      root.classList.add("menu-open");
      menu.removeAttribute("inert"); menu.setAttribute("aria-hidden", "false");
      if (MK.lenis) MK.lenis.stop();
      header && header.classList.remove("is-hidden");
      gsap.killTweensOf([menu, links]);
      gsap.set(menu, { visibility: "visible" });
      gsap.fromTo(menu, { clipPath: "circle(0px at " + x + "px " + y + "px)" },
        { clipPath: "circle(" + rad + "px at " + x + "px " + y + "px)", duration: reduced ? 0 : 1, ease: "expo.inOut" });
      gsap.fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: reduced ? 0 : 1.1, ease: "expo.out", stagger: 0.05, delay: reduced ? 0 : 0.35 });
      gsap.fromTo(menu.querySelector(".menu__foot"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8, delay: reduced ? 0 : 0.6, ease: "expo.out" });
      var first = menu.querySelector("a"); first && setTimeout(function () { first.focus({ preventScroll: true }); }, 400);
    } else {
      root.classList.remove("menu-open");
      menu.setAttribute("inert", ""); menu.setAttribute("aria-hidden", "true");
      if (MK.lenis) MK.lenis.start();
      gsap.to(menu, { clipPath: "circle(0px at " + x + "px " + y + "px)", duration: reduced ? 0 : 0.8, ease: "expo.inOut",
        onComplete: function () { gsap.set(menu, { visibility: "hidden" }); } });
      menuBtn.focus({ preventScroll: true });
    }
  }
  if (menu) menu.setAttribute("inert", "");
  if (menuBtn) menuBtn.addEventListener("click", function () { setMenu(!menuOpen); });
  addEventListener("keydown", function (e) { if (e.key === "Escape" && menuOpen) setMenu(false); });
  MK.closeMenu = function () { setMenu(false); };

  /* ------------------------------------------------------------------ Roll text */
  function rollify(el) {
    if (el.dataset.rolled) return;
    var text = el.textContent;
    el.dataset.rolled = "1";
    if (!el.getAttribute("aria-label") && (el.tagName === "A" || el.tagName === "BUTTON")) el.setAttribute("aria-label", text.trim());
    el.textContent = "";
    var wrap = d.createElement("span"); wrap.setAttribute("aria-hidden", "true"); wrap.style.display = "inline-flex";
    Array.from(text).forEach(function (ch, i) {
      var s = d.createElement("span"); s.className = "rc"; s.style.setProperty("--i", i); s.textContent = ch; wrap.appendChild(s);
    });
    el.appendChild(wrap);
    var sr = d.createElement("span"); sr.className = "sr-only"; sr.textContent = text; el.appendChild(sr);
  }
  d.querySelectorAll("[data-roll]").forEach(rollify);
  MK.rollify = rollify;

  /* ------------------------------------------------------------------ Cursor */
  var cursor = null;
  if (!isTouch && !STATIC) {
    cursor = d.createElement("div");
    cursor.className = "cursor is-hidden"; cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<div class="cursor__ring"><span class="cursor__label"></span></div><div class="cursor__dot"></div>';
    d.body.appendChild(cursor);
    root.classList.add("has-cursor");
    var ring = cursor.querySelector(".cursor__ring"), dot = cursor.querySelector(".cursor__dot"), label = cursor.querySelector(".cursor__label");
    var dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" }), dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
    var rx = gsap.quickTo(ring, "x", { duration: 0.55, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.55, ease: "power3" });
    MK.pointer = { x: innerWidth / 2, y: innerHeight / 2 };
    addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      MK.pointer.x = e.clientX; MK.pointer.y = e.clientY;
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      cursor.classList.remove("is-hidden");
    }, { passive: true });
    d.addEventListener("mouseleave", function () { cursor.classList.add("is-hidden"); });
    addEventListener("pointerdown", function () { cursor.classList.add("is-down"); });
    addEventListener("pointerup", function () { cursor.classList.remove("is-down"); });
    d.addEventListener("pointerover", function (e) {
      var t = e.target.closest ? e.target.closest("[data-cursor], a, button, [role=button], input, label") : null;
      cursor.classList.remove("is-link", "has-label");
      if (!t) return;
      var l = t.getAttribute("data-cursor");
      if (l) { label.textContent = l; cursor.classList.add("has-label"); }
      else cursor.classList.add("is-link");
    });
  } else {
    MK.pointer = { x: innerWidth / 2, y: innerHeight / 2 };
  }

  /* ------------------------------------------------------------------ Magnetic */
  function magnetic(el) {
    if (isTouch || reduced) return;
    var s = parseFloat(el.getAttribute("data-magnetic")) || 0.35;
    var xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.45)" });
    var yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.45)" });
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * s);
      yTo((e.clientY - (r.top + r.height / 2)) * s);
    });
    el.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
  }
  d.querySelectorAll("[data-magnetic]").forEach(magnetic);
  MK.magnetic = magnetic;

  /* Circle-button fill enters from the pointer's side */
  d.addEventListener("pointerover", function (e) {
    var b = e.target.closest && e.target.closest(".btn-circle");
    if (!b || b.contains(e.relatedTarget)) return;
    var r = b.getBoundingClientRect();
    b.style.setProperty("--fx", ((e.clientX - r.left) / r.width - 0.5) * 200 + "%");
    b.style.setProperty("--fy", ((e.clientY - r.top) / r.height - 0.5) * 200 + "%");
  });

  /* ------------------------------------------------------------------ Hover preview */
  var preview = null;
  if (!isTouch && !STATIC) {
    preview = d.createElement("div"); preview.className = "preview"; preview.setAttribute("aria-hidden", "true");
    d.body.appendChild(preview);
    var px = gsap.quickTo(preview, "x", { duration: 0.7, ease: "power3" });
    var py = gsap.quickTo(preview, "y", { duration: 0.7, ease: "power3" });
    var prot = gsap.quickTo(preview, "rotation", { duration: 0.9, ease: "power3" });
    var lastX = 0, current = null;
    addEventListener("pointermove", function (e) {
      px(e.clientX); py(e.clientY);
      prot(gsap.utils.clamp(-14, 14, (e.clientX - lastX) * 0.6)); lastX = e.clientX;
    }, { passive: true });
    function showPreview(src) {
      if (current === src) return; current = src;
      var img = new Image(); img.src = src; img.alt = "";
      preview.appendChild(img);
      gsap.fromTo(img, { clipPath: "inset(100% 0 0 0)", scale: 1.3 }, { clipPath: "inset(0% 0 0 0)", scale: 1, duration: 0.8, ease: "expo.out" });
      var imgs = preview.querySelectorAll("img"); if (imgs.length > 3) imgs[0].remove();
      gsap.to(preview, { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" });
    }
    function hidePreview() { current = null; gsap.to(preview, { opacity: 0, scale: 0.4, duration: 0.5, ease: "expo.out" }); }
    d.querySelectorAll("[data-preview]").forEach(function (el) {
      var pre = new Image(); pre.src = el.getAttribute("data-preview");
      el.addEventListener("pointerenter", function () { showPreview(el.getAttribute("data-preview")); });
      el.addEventListener("pointerleave", hidePreview);
    });
  }

  /* ------------------------------------------------------------------ Page transitions */
  var curtain = d.querySelector("[data-curtain]");
  var cPath = curtain && curtain.querySelector("path");
  var cTitle = curtain && curtain.querySelector(".curtain__title");
  function pathCover(y, c) { return "M0 100 L0 " + y + " Q50 " + (y - c) + " 100 " + y + " L100 100 Z"; }
  function pathLift(y, c) { return "M0 0 L0 " + y + " Q50 " + (y + c) + " 100 " + y + " L100 0 Z"; }
  var leaving = false;
  function leaveTo(href, title) {
    if (leaving) return; leaving = true;
    try { sessionStorage.setItem("mk-arrive", "1"); } catch (_) {}
    if (reduced || !curtain) { location.href = href; return; }
    if (menuOpen) { root.classList.remove("menu-open"); }
    var st = { y: 100, c: 0 };
    cTitle.textContent = title || "";
    gsap.set(curtain, { visibility: "visible", pointerEvents: "auto" });
    gsap.set(cTitle, { opacity: 0, yPercent: 40 });
    var tl = gsap.timeline({ onComplete: function () { location.href = href; } });
    tl.to(st, { y: 0, duration: 0.85, ease: "power3.inOut", onUpdate: function () { cPath.setAttribute("d", pathCover(st.y, st.c)); } }, 0)
      .to(st, { keyframes: [{ c: 22, duration: 0.42, ease: "power2.out" }, { c: 0, duration: 0.43, ease: "power2.in" }] }, 0)
      .to(cTitle, { opacity: 1, yPercent: 0, duration: 0.6, ease: "expo.out" }, 0.45)
      .to({}, { duration: 0.12 });
  }
  MK.navigate = leaveTo;
  d.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== "_self") return;
    if (a.hasAttribute("download") || a.dataset.noTransition !== undefined) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.protocol.indexOf("http") !== 0 && url.protocol !== "file:") return;
    if (url.pathname === location.pathname && url.hash) {
      e.preventDefault(); if (menuOpen) setMenu(false);
      var tgt = d.querySelector(url.hash); if (tgt) MK.scrollTo(tgt, { offset: 0 }); return;
    }
    if (url.pathname === location.pathname && !url.hash) { e.preventDefault(); if (menuOpen) setMenu(false); MK.scrollTo(0); return; }
    if (!/\.html$|\/$/.test(url.pathname)) return;
    e.preventDefault();
    var key = pageKey(url);
    leaveTo(url.href, a.getAttribute("data-title") || PAGES[key] || "");
  });
  addEventListener("pageshow", function (e) {
    if (e.persisted && curtain) {
      leaving = false;
      root.classList.remove("is-arriving", "is-preloading", "menu-open");
      gsap.set(curtain, { visibility: "hidden", pointerEvents: "none" });
      if (menu) { gsap.set(menu, { visibility: "hidden" }); menuOpen = false; }
      if (MK.lenis) MK.lenis.start();
    }
  });

  function revealCurtain(done) {
    var st = { y: 100, c: 0 };
    if (!curtain) { done(); return; }
    cPath.setAttribute("d", pathLift(100, 0));
    var tl = gsap.timeline({ onComplete: function () {
      gsap.set(curtain, { visibility: "hidden", pointerEvents: "none" });
      root.classList.remove("is-arriving", "is-preloading");
    } });
    tl.to(cTitle, { opacity: 0, yPercent: -30, duration: 0.5, ease: "power2.in" }, 0)
      .to(curtain.querySelectorAll(".curtain__count, .curtain__meta"), { opacity: 0, duration: 0.4 }, 0)
      .to(st, { y: 0, duration: 1.05, ease: "power3.inOut", onUpdate: function () { cPath.setAttribute("d", pathLift(st.y, st.c)); } }, 0.15)
      .to(st, { keyframes: [{ c: 26, duration: 0.5, ease: "power2.out" }, { c: 0, duration: 0.55, ease: "power2.in" }] }, 0.15)
      .add(done, 0.55);
  }

  function preload(done) {
    var count = curtain.querySelector(".curtain__count");
    var o = { v: 0 };
    cTitle.textContent = "Maria Catherine Kurian";
    var split = SplitText ? SplitText.create(cTitle, { type: "chars", mask: "chars" }) : null;
    gsap.set(cTitle, { opacity: 1 });
    var tl = gsap.timeline({ onComplete: function () { if (split) split.revert(); done(); } });
    if (split) tl.from(split.chars, { yPercent: 110, duration: 1, ease: "expo.out", stagger: 0.03 }, 0.1);
    tl.to(o, { v: 100, duration: 2, ease: "power2.inOut", onUpdate: function () { count.textContent = String(Math.round(o.v)).padStart(3, "0"); } }, 0)
      .to({}, { duration: 0.15 });
    try { sessionStorage.setItem("mk-visited", "1"); } catch (_) {}
  }

  /* ------------------------------------------------------------------ Declarative animations */
  var introQueue = [];
  function vis(el) { el.style.visibility = "visible"; }

  function buildSplit(el) {
    var type = el.getAttribute("data-split") || "lines";
    var intro = el.hasAttribute("data-intro");
    if (reduced || !SplitText) { vis(el); return; }
    var splitType = type === "chars" ? "lines,words,chars" : type === "words" ? "lines,words" : "lines";
    var holder = { anim: null };
    SplitText.create(el, {
      type: splitType, mask: "lines", linesClass: "line", autoSplit: true,
      onSplit: function (self) {
        vis(el);
        var targets = type === "chars" ? self.chars : type === "words" ? self.words : self.lines;
        var vars = {
          yPercent: 115, rotate: type === "lines" ? 3 : 8, transformOrigin: "0% 100%",
          duration: type === "chars" ? 1.2 : 1.25, ease: "expo.out",
          stagger: type === "chars" ? 0.022 : type === "words" ? 0.035 : 0.09
        };
        if (intro) { vars.paused = !MK.revealed; holder.anim = gsap.from(targets, vars); return holder.anim; }
        vars.scrollTrigger = { trigger: el, start: "top 88%", once: true };
        return gsap.from(targets, vars);
      }
    });
    if (intro) introQueue.push({ el: el, play: function () { holder.anim && holder.anim.play(); } });
  }

  function buildReveal(el) {
    var type = el.getAttribute("data-reveal") || "up";
    vis(el);
    if (reduced) return;
    var from = type === "fade" ? { autoAlpha: 0 } : type === "scale" ? { autoAlpha: 0, scale: 0.85 } : { autoAlpha: 0, y: 40 };
    var to = { autoAlpha: 1, y: 0, scale: 1, duration: 1.3, ease: "expo.out", delay: parseFloat(el.getAttribute("data-delay")) || 0 };
    if (el.hasAttribute("data-intro")) {
      gsap.set(el, from);
      introQueue.push({ el: el, play: function () { gsap.to(el, to); } });
    } else {
      to.scrollTrigger = { trigger: el, start: "top 90%", once: true };
      gsap.fromTo(el, from, to);
    }
  }

  function buildMedia(el) {
    var type = el.getAttribute("data-media") || "wipe";
    var img = el.querySelector("img");
    vis(el);
    if (reduced) return;
    var base = img && img.hasAttribute("data-parallax") ? 1.2 : 1;
    var clipFrom = type === "bloom" ? "circle(0% at 50% 60%)" : type === "rise" ? "inset(100% 0% 0% 0%)" : "inset(100% 0% 0% 0%)";
    var clipTo = type === "bloom" ? "circle(75% at 50% 50%)" : "inset(0% 0% 0% 0%)";
    var tl = gsap.timeline({ paused: true, delay: parseFloat(el.getAttribute("data-delay")) || 0 });
    tl.fromTo(el, { clipPath: clipFrom }, { clipPath: clipTo, duration: 1.5, ease: "expo.inOut" }, 0);
    if (type === "rise") tl.from(el, { yPercent: 12, duration: 1.6, ease: "expo.out" }, 0);
    if (img) tl.fromTo(img, { scale: base + 0.3 }, { scale: base, duration: 2, ease: "expo.out" }, 0.1);
    if (el.hasAttribute("data-intro")) {
      gsap.set(el, { clipPath: clipFrom });
      introQueue.push({ el: el, play: function () { tl.play(); } });
    } else {
      ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: function () { tl.play(); } });
    }
  }

  function buildParallax(el) {
    if (reduced) return;
    var s = parseFloat(el.getAttribute("data-parallax")) || 0.2;
    var inMedia = el.tagName === "IMG" && el.closest(".media");
    var trig = inMedia ? el.closest(".media") : el;
    if (inMedia) gsap.set(el, { scale: 1.2 });
    gsap.fromTo(el, { yPercent: -s * 50 }, {
      yPercent: s * 50, ease: "none",
      scrollTrigger: { trigger: trig, start: "top bottom", end: "bottom top", scrub: true }
    });
  }

  function buildWords(el) {
    vis(el);
    if (reduced || !SplitText) return;
    SplitText.create(el, {
      type: "words", autoSplit: true,
      onSplit: function (self) {
        return gsap.fromTo(self.words, { opacity: 0.12 }, {
          opacity: 1, stagger: 0.1, ease: "none",
          scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 50%", scrub: true }
        });
      }
    });
  }

  function buildCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var fmt = function (v) { return v.toFixed(dec); };
    if (reduced) { el.textContent = fmt(target); return; }
    var o = { v: 0 };
    el.textContent = fmt(0);
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: function () {
        gsap.to(o, { v: target, duration: 2.2, ease: "expo.out", onUpdate: function () { el.textContent = fmt(o.v); } });
      }
    });
  }

  function buildMarquee(el) {
    var dir = parseFloat(el.getAttribute("data-marquee")) || 1;
    var speed = parseFloat(el.getAttribute("data-speed")) || 1;
    var track = el.querySelector(".marquee__track");
    if (!track) return;
    var original = track.innerHTML;
    var guard = 0;
    while (track.scrollWidth < el.offsetWidth * 2.2 && guard++ < 10) track.insertAdjacentHTML("beforeend", original);
    track.insertAdjacentHTML("beforeend", track.innerHTML);
    track.querySelectorAll("*").forEach(function (n, i) { if (i > 0 && n.parentElement === track) n.setAttribute("aria-hidden", "true"); });
    if (reduced) return;
    var x = 0, half = 0, skewTo = gsap.quickTo(track, "skewX", { duration: 0.6, ease: "power3" });
    var visible = true;
    ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top", onToggle: function (s) { visible = s.isActive; } });
    function measure() { half = track.scrollWidth / 2; }
    measure(); addEventListener("resize", measure);
    var flip = 1;
    gsap.ticker.add(function (t, dt) {
      if (!visible || !half) return;
      var v = MK.velocity();
      if (v > 0.5) flip = 1; else if (v < -0.5) flip = -1;
      x -= (0.045 * speed + Math.abs(v) * 0.012) * dt * dir * flip;
      if (x <= -half) x += half; if (x > 0) x -= half;
      gsap.set(track, { x: x });
      if (el.hasAttribute("data-skew")) skewTo(gsap.utils.clamp(-8, 8, -v * 0.25));
    });
  }

  function buildDraw(el) {
    var len = el.getTotalLength ? el.getTotalLength() : 0;
    if (!len) return;
    if (reduced) return;
    gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
    var scrub = el.getAttribute("data-draw") === "scrub";
    var trig = el.closest("svg") || el;
    if (scrub) gsap.to(el, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: trig, start: "top 80%", end: "bottom 50%", scrub: 0.6 } });
    else gsap.to(el, { strokeDashoffset: 0, duration: 2, ease: "expo.inOut", scrollTrigger: { trigger: trig, start: "top 85%", once: true } });
  }

  /* ------------------------------------------------------------------ Lightbox */
  var lb = null, lbGroup = [], lbIndex = 0;
  function ensureLightbox() {
    if (lb) return lb;
    lb = d.createElement("div");
    lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Image viewer");
    lb.setAttribute("data-lenis-prevent", "");
    lb.innerHTML =
      '<span class="lightbox__count label">01 / 01</span>' +
      '<button class="icon-btn lightbox__close" type="button" aria-label="Close viewer" data-cursor="Close"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 5l14 14M19 5L5 19"/></svg></button>' +
      '<div class="lightbox__media"></div>' +
      '<div class="lightbox__cap"><span class="t"></span><span class="label"></span></div>' +
      '<div class="lightbox__nav"><button class="btn-circle btn-circle--small" type="button" aria-label="Previous image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 5l-7 7 7 7"/></svg></button><button class="btn-circle btn-circle--small" type="button" aria-label="Next image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5l7 7-7 7"/></svg></button></div>';
    d.body.appendChild(lb);
    lb.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
    var btns = lb.querySelectorAll(".lightbox__nav button");
    btns[0].addEventListener("click", function () { stepLightbox(-1); });
    btns[1].addEventListener("click", function () { stepLightbox(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
    var sx = 0;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) stepLightbox(dx < 0 ? 1 : -1); });
    addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") stepLightbox(1);
      if (e.key === "ArrowLeft") stepLightbox(-1);
    });
    return lb;
  }
  function lbData(fig) {
    var img = fig.querySelector("img");
    var cap = fig.getAttribute("data-caption") || (fig.querySelector("figcaption") ? fig.querySelector("figcaption").textContent.trim() : img.alt);
    var src = fig.getAttribute("data-full") || img.currentSrc || img.src;
    var w = img.naturalWidth || parseInt(img.getAttribute("width"), 10) || 3, h = img.naturalHeight || parseInt(img.getAttribute("height"), 10) || 4;
    return { src: src, alt: img.alt, cap: cap, meta: fig.getAttribute("data-meta") || "", r: w / h };
  }
  function renderLightbox(dir) {
    var item = lbData(lbGroup[lbIndex]);
    var media = lb.querySelector(".lightbox__media");
    var img = new Image(); img.src = item.src; img.alt = item.alt;
    media.style.setProperty("--r", item.r);
    var old = media.querySelectorAll("img");
    media.appendChild(img);
    lb.querySelector(".lightbox__cap .t").textContent = item.cap;
    lb.querySelector(".lightbox__cap .label").textContent = item.meta;
    lb.querySelector(".lightbox__count").textContent = String(lbIndex + 1).padStart(2, "0") + " / " + String(lbGroup.length).padStart(2, "0");
    if (reduced) { old.forEach(function (o) { o.remove(); }); return; }
    gsap.fromTo(img, { clipPath: dir ? (dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)") : "inset(100% 0 0 0)", scale: 1.25 },
      { clipPath: "inset(0 0% 0 0%)", scale: 1, duration: 1.1, ease: "expo.inOut", onComplete: function () { old.forEach(function (o) { o.remove(); }); } });
    gsap.fromTo(lb.querySelector(".lightbox__cap"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.3, ease: "expo.out" });
  }
  function openLightbox(fig) {
    ensureLightbox();
    var g = fig.getAttribute("data-lightbox");
    lbGroup = Array.from(d.querySelectorAll('[data-lightbox="' + g + '"]'));
    lbIndex = Math.max(0, lbGroup.indexOf(fig));
    lb.classList.add("is-open");
    lb.querySelector(".lightbox__media").innerHTML = "";
    gsap.set(lb, { visibility: "visible" });
    gsap.to(lb, { opacity: 1, duration: reduced ? 0 : 0.5, ease: "power2.out" });
    if (MK.lenis) MK.lenis.stop();
    renderLightbox(0);
    lb.querySelector(".lightbox__close").focus({ preventScroll: true });
    lb._return = fig;
  }
  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove("is-open");
    gsap.to(lb, { opacity: 0, duration: reduced ? 0 : 0.5, ease: "power2.in", onComplete: function () { gsap.set(lb, { visibility: "hidden" }); } });
    if (MK.lenis) MK.lenis.start();
    if (lb._return) lb._return.focus({ preventScroll: true });
  }
  function stepLightbox(s) { if (!lbGroup.length) return; lbIndex = (lbIndex + s + lbGroup.length) % lbGroup.length; renderLightbox(s); }
  d.querySelectorAll("[data-lightbox]").forEach(function (fig) {
    if (!fig.hasAttribute("tabindex") && fig.tagName !== "A" && fig.tagName !== "BUTTON") fig.setAttribute("tabindex", "0");
    fig.setAttribute("role", fig.getAttribute("role") || "button");
    if (!fig.hasAttribute("data-cursor")) fig.setAttribute("data-cursor", "View");
    fig.addEventListener("click", function (e) { e.preventDefault(); openLightbox(fig); });
    fig.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(fig); } });
  });
  MK.openLightbox = openLightbox;

  /* ------------------------------------------------------------------ Small utilities */
  var toast = null;
  MK.toast = function (msg) {
    if (!toast) { toast = d.createElement("div"); toast.className = "toast"; toast.setAttribute("role", "status"); d.body.appendChild(toast); }
    toast.textContent = msg; toast.classList.add("is-on");
    clearTimeout(toast._t); toast._t = setTimeout(function () { toast.classList.remove("is-on"); }, 2200);
  };
  d.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var txt = b.getAttribute("data-copy");
      var ok = function () { MK.toast("Email copied — talk soon"); };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, function () { location.href = "mailto:" + txt; });
      else location.href = "mailto:" + txt;
    });
  });
  d.querySelectorAll("[data-top]").forEach(function (b) { b.addEventListener("click", function () { MK.scrollTo(0, { duration: 2.2 }); }); });
  var clocks = d.querySelectorAll("[data-clock]");
  if (clocks.length) {
    var f = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
    var tick = function () { var s = f.format(new Date()); clocks.forEach(function (c) { c.textContent = s; }); };
    tick(); setInterval(tick, 15000);
  }
  d.querySelectorAll("[data-year]").forEach(function (y) { y.textContent = new Date().getFullYear(); });

  /* ------------------------------------------------------------------ Boot */
  function fontsReady() {
    return Promise.race([
      d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve(),
      new Promise(function (r) { setTimeout(r, 1800); })
    ]);
  }

  fontsReady().then(function () {
    d.querySelectorAll("[data-split]").forEach(buildSplit);
    d.querySelectorAll("[data-reveal]").forEach(buildReveal);
    d.querySelectorAll("[data-media]").forEach(buildMedia);
    d.querySelectorAll("[data-parallax]").forEach(buildParallax);
    d.querySelectorAll("[data-words]").forEach(buildWords);
    d.querySelectorAll("[data-count]").forEach(buildCount);
    d.querySelectorAll("[data-marquee]").forEach(buildMarquee);
    d.querySelectorAll("[data-draw]").forEach(buildDraw);

    MK._readyDone = true;
    MK._ready.forEach(function (fn) { try { fn(MK); } catch (err) { console.error(err); } });
    MK._ready = [];
    ScrollTrigger.refresh();

    var go = function () {
      MK.revealed = true;
      introQueue.forEach(function (q, i) {
        var delay = parseFloat(q.el.getAttribute("data-intro"));
        gsap.delayedCall(isNaN(delay) ? 0.15 + i * 0.12 : delay, q.play);
      });
      MK._reveal.forEach(function (fn) { try { fn(MK); } catch (err) { console.error(err); } });
      MK._reveal = [];
      try { sessionStorage.removeItem("mk-arrive"); } catch (_) {}
    };

    if (root.classList.contains("is-preloading") && curtain && !reduced) {
      preload(function () { revealCurtain(go); });
    } else if (root.classList.contains("is-arriving") && curtain && !reduced) {
      if (cTitle && !cTitle.textContent.trim()) cTitle.textContent = d.body.getAttribute("data-title") || "";
      gsap.delayedCall(0.1, function () { revealCurtain(go); });
    } else {
      root.classList.remove("is-arriving", "is-preloading");
      go();
    }
    try { sessionStorage.setItem("mk-visited", "1"); } catch (_) {}
  });

  addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
