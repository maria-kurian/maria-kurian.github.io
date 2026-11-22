# Maria Catherine Kurian: a museum of the mediated life

Multimedia portfolio site, live at **https://maria-kurian.github.io/**

Each page is a room in the museum:

| Room | Page | What's inside |
| --- | --- | --- |
| 00 The Foyer | `index.html` | Introduction, the four rooms, numbers, letters of recommendation |
| 01 The Ledger | `work.html` | ICICI Bank, MambaSR editorial, Jay Former studio |
| 02 Stage & Page | `campus.html` | Jesus and Mary College: conferences, magazines, theatre |
| 03 The Lens | `lens.html` | Photography |
| 04 Sound & Voice | `sound.html` | Music training, studio work, the *Amar Akbar Anthony* podcast |

## Tech

Plain static HTML, CSS and JavaScript. There's no build step, so GitHub Pages serves the repo as is.

- [GSAP 3.13](https://gsap.com) (ScrollTrigger, SplitText, Flip) and [Lenis](https://lenis.darkroom.engineering) smooth scroll, vendored in `assets/vendor/`
- Fonts: Fraunces, Inter Tight and JetBrains Mono, from Google Fonts
- Light and dark themes (follows the system setting; the toggle remembers your choice)
- Respects `prefers-reduced-motion`

```
assets/css/main.css       design system: tokens, shapes, type, shared components
assets/css/pages/*.css    page-specific styles
assets/js/main.js         motion engine: smooth scroll, page transitions, cursor, theme,
                          menu, lightbox and declarative scroll animations (data-* attributes)
assets/js/pages/*.js      page-specific interactions
assets/img/               photos as WebP (800px and 1600px)
```

## Run locally

Any static server works:

```sh
python -m http.server 8000
# then open http://localhost:8000
```

Add `?static` to any URL to turn off all animations (useful for screenshots).

## Editing content

The copy lives in the HTML files. The header, menu, footer and page-transition curtain are repeated in
every page, so change them in all five files. Images go in `assets/img/` as `name-800.webp`, plus an
optional `name-1600.webp`.
