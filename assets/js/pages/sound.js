/* Room 04 — Sound & Voice
   Live waveform hero, a playable stave of six grades, an orbiting studio,
   a spinning EP and the podcast hosts. */
(function () {
  "use strict";
  if (!window.MK) return;
  var d = document;

  /* ------------------------------------------------------------ Audio (gesture only) */
  var soundOn = true, ctx = null, master = null;
  function audio() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return ctx; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.5;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2600;
    master.connect(lp); lp.connect(ctx.destination);
    return ctx;
  }
  function tone(freq) {
    if (!soundOn) return;
    var c = audio(); if (!c) return;
    var t = c.currentTime + 0.01;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
    g.connect(master);
    var o1 = c.createOscillator(); o1.type = "triangle"; o1.frequency.value = freq; o1.connect(g);
    var g2 = c.createGain(); g2.gain.value = 0.12; g2.connect(g);
    var o2 = c.createOscillator(); o2.type = "sine"; o2.frequency.value = freq * 2; o2.connect(g2);
    o1.start(t); o2.start(t); o1.stop(t + 2); o2.stop(t + 2);
  }

  MK.ready(function (MK) {
    var gsap = MK.gsap, ST = MK.ScrollTrigger, reduced = MK.reduced;
    if (!MK.isTouch && !reduced) d.documentElement.classList.add("snd-hover");

    /* ------------------------------------------------------------ Hero waveform */
    var wave = d.querySelector("[data-wave]");
    var hero = d.querySelector(".snd-hero");
    if (wave) {
      var line = wave.querySelector(".snd-wave__line"), ghost = wave.querySelector(".snd-wave__ghost");
      var W = 1440, H = 400, N = 96;
      var st = { amp: reduced ? 1 : 0, energy: 0, px: 0.62, pAmp: 0 };
      var lastPX = null;
      var build = function (t, phase, scale) {
        var dStr = "";
        for (var i = 0; i <= N; i++) {
          var u = i / N, x = u * W;
          var env = Math.pow(Math.sin(Math.PI * u), 1.4);
          var y = Math.sin(u * 9.0 + t * 1.3 + phase) * 0.55 +
                  Math.sin(u * 17.0 - t * 2.1 + phase * 2) * 0.28 +
                  Math.sin(u * 31.0 + t * 3.4) * 0.12 * (1 + st.energy);
          var bump = Math.exp(-Math.pow((u - st.px) / 0.09, 2)) * st.pAmp;
          var a = (38 + st.energy * 90) * env + bump * 120;
          y = H / 2 + y * a * st.amp * scale;
          dStr += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
        }
        return dStr;
      };
      var render = function (t) {
        line.setAttribute("d", build(t, 0, 1));
        ghost.setAttribute("d", build(t * 0.8, 1.7, 0.7));
      };
      if (reduced) { render(0.6); }
      else {
        var visible = true, time = 0;
        ST.create({ trigger: hero, start: "top bottom", end: "bottom top", onToggle: function (s) { visible = s.isActive; } });
        addEventListener("pointermove", function (e) {
          var nx = e.clientX / innerWidth;
          if (lastPX !== null) st.pAmp = Math.min(1, st.pAmp + Math.abs(nx - lastPX) * 6);
          st.px += (nx - st.px) * 0.5; lastPX = nx;
        }, { passive: true });
        gsap.ticker.add(function (t, dt) {
          if (!visible) return;
          time += dt / 1000;
          var v = Math.min(1.6, Math.abs(MK.velocity()) / 25);
          st.energy += (v - st.energy) * 0.06;
          st.pAmp *= 0.95;
          render(time);
        });
        MK.onReveal(function () { gsap.to(st, { amp: 1, duration: 2.4, ease: "expo.out", delay: 0.3 }); });
      }
    }

    /* ------------------------------------------------------------ The scale */
    var scale = d.querySelector("[data-scale]");
    if (scale) {
      var notes = Array.from(scale.querySelectorAll(".snd-note"));
      var rows = Array.from(scale.querySelectorAll(".snd-grades li"));
      var readout = scale.querySelector("[data-readout]");
      var readoutHTML = readout.innerHTML;
      var toggle = scale.querySelector("[data-sound-toggle]");
      var stateEl = scale.querySelector("[data-sound-state]");
      var playBtn = scale.querySelector("[data-play-scale]");
      var resetT = null;

      toggle.addEventListener("click", function () {
        soundOn = !soundOn;
        toggle.setAttribute("aria-pressed", String(soundOn));
        stateEl.textContent = soundOn ? "on" : "off";
        MK.toast(soundOn ? "Sound on — tap a note" : "Sound off — notes play silently");
      });

      var info = function (i) {
        var r = rows[i];
        return {
          g: r.querySelector(".snd-grades__g").textContent,
          d: r.querySelector(".snd-grades__d").textContent,
          c: r.querySelector(".snd-grades__c").textContent
        };
      };
      var play = function (i) {
        var n = notes[i];
        tone(parseFloat(n.getAttribute("data-note")));
        notes.forEach(function (x) { x.classList.toggle("is-on", x === n); });
        rows.forEach(function (x, j) { x.classList.toggle("is-on", j === i); });
        var f = info(i);
        readout.innerHTML = '<span class="snd-distinction__k">' + f.g + ", " + f.d + ", " + f.c + ".</span> <em>With Distinction.</em>";
        clearTimeout(resetT);
        resetT = setTimeout(function () {
          notes.forEach(function (x) { x.classList.remove("is-on"); });
          rows.forEach(function (x) { x.classList.remove("is-on"); });
          readout.innerHTML = readoutHTML;
        }, 4200);
        if (reduced) return;
        var head = n.querySelector(".snd-note__head");
        gsap.fromTo(head, { y: 0 }, { keyframes: [{ y: -8, duration: 0.14, ease: "power2.out" }, { y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" }] });
        for (var k = 0; k < 2; k++) {
          var rp = d.createElement("span"); rp.className = "snd-ripple"; rp.setAttribute("aria-hidden", "true");
          n.appendChild(rp);
          gsap.fromTo(rp, { scale: 0.6, opacity: 0.9 }, { scale: 3.2 + k, opacity: 0, duration: 1.4 + k * 0.3, delay: k * 0.12, ease: "expo.out", onComplete: (function (el) { return function () { el.remove(); }; })(rp) });
        }
        gsap.fromTo(readout.children, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: "expo.out" });
      };
      notes.forEach(function (n, i) { n.addEventListener("click", function () { play(i); }); });

      var playing = false;
      playBtn.addEventListener("click", function () {
        if (playing) return; playing = true; playBtn.classList.add("is-playing");
        notes.forEach(function (_, i) { setTimeout(function () { play(i); }, i * 330); });
        setTimeout(function () { playing = false; playBtn.classList.remove("is-playing"); }, notes.length * 330 + 300);
      });

      if (!reduced) {
        var lines = scale.querySelectorAll(".snd-stave__lines i");
        var heads = scale.querySelectorAll(".snd-note__head ellipse");
        var tags = scale.querySelectorAll(".snd-note__tag");
        var ledger = scale.querySelector(".snd-note__ledger");
        gsap.set(lines, { scaleX: 0 });
        gsap.set(heads, { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set(tags, { autoAlpha: 0, y: 12 });
        gsap.set(ledger, { scaleX: 0 });
        gsap.set(scale.querySelectorAll(".snd-note__head"), { y: -30, autoAlpha: 0 });
        var tl = gsap.timeline({ paused: true });
        tl.to(lines, { scaleX: 1, duration: 1.4, ease: "expo.inOut", stagger: 0.07 }, 0)
          .to(ledger, { scaleX: 1, duration: 0.8, ease: "expo.out" }, 0.6)
          .to(scale.querySelectorAll(".snd-note__head"), { y: 0, autoAlpha: 1, duration: 1.1, ease: "expo.out", stagger: 0.1 }, 0.55)
          .to(heads, { strokeDashoffset: 0, duration: 1.2, ease: "power3.inOut", stagger: 0.1 }, 0.55)
          .to(tags, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.08 }, 0.8);
        ST.create({ trigger: scale.querySelector(".snd-stave"), start: "top 80%", once: true, onEnter: function () { tl.play(); } });
        gsap.from(rows, { autoAlpha: 0, y: 24, duration: 1.1, ease: "expo.out", stagger: 0.07, scrollTrigger: { trigger: scale.querySelector(".snd-grades"), start: "top 88%", once: true } });
      }
    }

    /* ------------------------------------------------------------ Orbit */
    var orbit = d.querySelector("[data-orbit]");
    if (orbit && !reduced) {
      var ring = orbit.querySelector("[data-ring]");
      var sats = ring.querySelectorAll(".snd-orbit__s");
      var rot = { r: -24 };
      var apply = function () {
        gsap.set(ring, { rotation: rot.r });
        gsap.set(sats, { rotation: -rot.r });
      };
      gsap.to(rot, { r: 96, ease: "none", onUpdate: apply,
        scrollTrigger: { trigger: orbit, start: "top bottom", end: "bottom top", scrub: 0.8 } });
      apply();
      gsap.from(sats, { scale: 0, duration: 1.3, ease: "expo.out", stagger: 0.09,
        scrollTrigger: { trigger: orbit, start: "top 70%", once: true } });
    }

    /* ------------------------------------------------------------ DAW playhead */
    var daw = d.querySelector("[data-daw]");
    if (daw && !reduced) {
      gsap.fromTo(daw.querySelector(".snd-daw__head"), { xPercent: 8 }, { xPercent: 92, ease: "none",
        scrollTrigger: { trigger: daw, start: "top 85%", end: "bottom 25%", scrub: 0.6 } });
    }

    /* ------------------------------------------------------------ Vinyl */
    var vinyl = d.querySelector("[data-vinyl]");
    if (vinyl && !reduced) {
      var disc = vinyl.querySelector("[data-disc]");
      var spin = gsap.to(disc, { rotation: "+=360", duration: 9, ease: "none", repeat: -1 });
      var boost = { v: 1 }, fast = false;
      var setBoost = function (on) { fast = on; gsap.to(boost, { v: on ? 7 : 1, duration: on ? 1.2 : 2, ease: on ? "power2.in" : "power3.out" }); };
      if (!MK.isTouch) {
        vinyl.addEventListener("pointerenter", function () { setBoost(true); });
        vinyl.addEventListener("pointerleave", function () { setBoost(false); });
      }
      vinyl.addEventListener("click", function () { setBoost(!fast); });
      vinyl.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setBoost(!fast); } });
      gsap.ticker.add(function () {
        spin.timeScale(boost.v + Math.min(6, Math.abs(MK.velocity()) * 0.08));
      });
      gsap.from(vinyl, { xPercent: -30, rotation: -120, autoAlpha: 0, duration: 1.8, ease: "expo.out",
        scrollTrigger: { trigger: vinyl, start: "top 85%", once: true } });
    }

    /* ------------------------------------------------------------ Podcast */
    var lamp = d.querySelector(".snd-onair__lamp");
    if (lamp && !reduced) {
      gsap.from(lamp, { keyframes: [{ opacity: 0.15, duration: 0.08 }, { opacity: 1, duration: 0.06 }, { opacity: 0.3, duration: 0.1 }, { opacity: 1, duration: 0.5 }],
        scale: 0.7, ease: "power2.out", scrollTrigger: { trigger: lamp, start: "top 88%", once: true } });
    }
    d.querySelectorAll(".snd-host").forEach(function (h) {
      h.addEventListener("click", function () {
        if (!MK.isTouch) return;
        d.querySelectorAll(".snd-host").forEach(function (o) { if (o !== h) o.classList.remove("is-open"); });
        h.classList.toggle("is-open");
      });
    });
    if (!reduced) {
      d.querySelectorAll(".snd-host__name").forEach(function (n) {
        gsap.from(n, { yPercent: 60, autoAlpha: 0, duration: 1.4, ease: "expo.out", delay: 0.25,
          scrollTrigger: { trigger: n.closest(".snd-host"), start: "top 75%", once: true } });
      });
    }
  });
})();
