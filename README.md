# Portfolio Website v2 (anonymised branch)

This `anonymised` branch hides client identities: generic client names, no client links, client names/logos/phones
blurred in every creative, and video ads shown as still blurred thumbnails (the loop files are removed here).

Static site (HTML/CSS/JS, no build step) for Ashish Gupta's portfolio. v1 lives in `../Portfolio Website` for comparison.

- Run locally: `powershell -ExecutionPolicy Bypass -File serve.ps1 -Port 8082` → http://localhost:8082/
- Page: `index.html` · Styles: `css/site.css` · Behaviour: `js/main.js` · Media: `assets/`
- After changing CSS/JS, bump the `?v=` query on the links in every page.
- Hosting: Netlify, connected to GitHub `ashishgupta1350/ashish-gupta-portfolio` (branch `main`). Every push deploys.
  `netlify.toml` publishes the repo root and strips private working files during the build.
- Notes and TODOs: `project-notes/handoff.md`
