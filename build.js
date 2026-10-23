#!/usr/bin/env node
// Baut dist/ aus content/site.json + static/. Keine Abhängigkeiten, nur Node 18+.
// Lokal testen:  node build.js && npx serve dist   (oder: python3 -m http.server -d dist)
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUT = path.join(ROOT, "dist");
const c = JSON.parse(fs.readFileSync(path.join(ROOT, "content/site.json"), "utf8"));

// ---------- Helfer ----------
const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const safeUrl = (u = "") => {
  u = String(u).trim();
  return /^(https?:\/\/|mailto:|\/|#)/i.test(u) ? esc(u) : "";
};

// Mini-Markdown für Texte aus dem Editor: **fett**, [Link](url), ### Überschrift, Absätze, Zeilenumbrüche
const inline = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => {
      const href = safeUrl(u.replace(/&amp;/g, "&"));
      return href ? `<a href="${href}">${t}</a>` : t;
    });

const md = (s = "") =>
  String(s)
    .trim()
    .split(/\n\s*\n/)
    .map((b) => (b.startsWith("### ") ? `<h3>${inline(b.slice(4))}</h3>` : `<p>${inline(b).replace(/\n/g, "<br>")}</p>`))
    .join("\n");

const tags = (t = []) => (t.length ? `<div class="tags">${t.map((x) => `<span>${esc(x)}</span>`).join("")}</div>` : "");
const link = (label, url) => (label && safeUrl(url) ? `<a class="more" href="${safeUrl(url)}">${esc(label)}</a>` : "");
const bullets = (b = []) => (b.length ? `<ul class="list">${b.map((x) => `<li>${inline(x)}</li>`).join("")}</ul>` : "");

const sections = [
  ["profil", "Profil"],
  ["praxis", "Praxis"],
  ["zertifikate", "Zertifikate"],
  ["projekte", "Projekte"],
  ["skills", "Skills"],
  ["werdegang", "Werdegang"],
  ["kontakt", "Kontakt"],
];
const num = (id) => String(sections.findIndex(([s]) => s === id) + 1).padStart(2, "0");
const head = (id) =>
  `<div class="kicker">${num(id)} · ${esc(c[id].kicker)}</div>\n      <h2>${esc(c[id].title)}</h2>`;

const badge = { ok: ["ok", "✓ bestanden"], wip: ["wip", "● in Prüfung"], plan: ["plan", "○ geplant"] };

// ---------- Seite ----------
const h = c.hero;
const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.meta.title)}</title>
<meta name="description" content="${esc(c.meta.description)}">
<link rel="preload" href="/fonts/dm-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css">
</head>
<body>

<header>
  <div class="wrap">
    <nav>
      <a class="logo" href="#top">robert<span>@</span>poryzala<span>:~$</span></a>
      <ul>
${sections.map(([id, label]) => `        <li><a href="#${id}">${label}</a></li>`).join("\n")}
      </ul>
    </nav>
  </div>
</header>

<main id="top">
  <div class="wrap hero">
    <span class="status"><i></i>${esc(h.status)}</span>
    <h1>${esc(h.name)}<span class="dot">.</span><small>${esc(h.subtitle)}</small></h1>
    <p class="lead">${inline(h.lead)}</p>
    <div class="cta">
      <a class="btn primary" href="#kontakt">${esc(h.button_primary)}</a>
      ${safeUrl(h.github_url) ? `<a class="btn" href="${safeUrl(h.github_url)}" rel="noopener">${esc(h.button_secondary)}</a>` : ""}
    </div>
${h.show_terminal ? `    <pre class="term"><span class="p">robert@<span class="h">pi5</span>:~$</span> docker compose ps --format '{{.Name}}\\t{{.Status}}'
nextcloud-app     Up 12 days
nextcloud-nginx   Up 12 days
nextcloud-db      Up 12 days
adguard           Up 12 days
<span class="p">robert@<span class="h">pi5</span>:~$</span> <span class="c"># selbst gehostet, selbst gewartet, selbst abgesichert</span></pre>` : ""}
  </div>

  <section id="profil">
    <div class="wrap prose">
      ${head("profil")}
      ${md(c.profil.text)}
    </div>
  </section>

  <section id="praxis">
    <div class="wrap">
      ${head("praxis")}
      <div class="grid g2">
${c.praxis.items
  .map(
    (i) => `        <div class="card">
          <span class="when">${esc(i.when)}</span>
          <h3>${esc(i.title)}</h3>
          <p>${inline(i.text)}</p>
          ${bullets(i.bullets)}
          ${tags(i.tags)}
        </div>`
  )
  .join("\n")}
      </div>
    </div>
  </section>

  <section id="zertifikate">
    <div class="wrap">
      ${head("zertifikate")}
      <div class="grid g2">
${c.zertifikate.items
  .map((i) => {
    const [cls, label] = badge[i.status] || badge.plan;
    const l = i.link_label && safeUrl(i.link_url) ? ` <a href="${safeUrl(i.link_url)}">${esc(i.link_label)}</a>` : "";
    return `        <div class="card cert"><span class="badge ${cls}">${label}</span><h3>${esc(i.title)}</h3><span class="meta">${esc(i.meta)}</span><p>${inline(i.text)}${l}</p></div>`;
  })
  .join("\n")}
      </div>
    </div>
  </section>

  <section id="projekte">
    <div class="wrap">
      ${head("projekte")}
      <div class="grid g2">
${c.projekte.items
  .map(
    (i) => `        <div class="card">
          <h3>${esc(i.title)}</h3>
          <p>${inline(i.text)}</p>
          ${tags(i.tags)}
          ${link(i.link_label, i.link_url)}
        </div>`
  )
  .join("\n")}
      </div>
    </div>
  </section>

  <section id="skills">
    <div class="wrap">
      ${head("skills")}
      <div class="grid g3">
${c.skills.groups
  .map((g) => `        <div class="card skill"><h3>${esc(g.title)}</h3><ul>${g.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`)
  .join("\n")}
      </div>
    </div>
  </section>

  <section id="werdegang">
    <div class="wrap">
      ${head("werdegang")}
      <ul class="tl">
${c.werdegang.items
  .map(
    (i) =>
      `        <li${i.current ? ' class="now"' : ""}><span class="when">${esc(i.when)}</span><h3>${esc(i.title)}</h3><p>${inline(i.text)}</p></li>`
  )
  .join("\n")}
      </ul>
    </div>
  </section>

  <section id="kontakt">
    <div class="wrap">
      ${head("kontakt")}
      <div class="contact">
${c.kontakt.items
  .map(
    (i) =>
      `        <div class="card"><p>${esc(i.label)}</p>${
        safeUrl(i.url) ? `<a href="${safeUrl(i.url)}">${esc(i.value)}</a>` : `<span class="value">${esc(i.value)}</span>`
      }</div>`
  )
  .join("\n")}
      </div>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    <span>${esc(c.footer.text)}</span>
    <span><a href="#impressum">Impressum</a> · <a href="#datenschutz">Datenschutz</a></span>
  </div>
</footer>

<div class="legal" id="impressum"><div class="box">
  <a class="close" href="#top">✕ schließen</a>
  <h2>Impressum</h2>
  ${md(c.impressum.text)}
</div></div>

<div class="legal" id="datenschutz"><div class="box">
  <a class="close" href="#top">✕ schließen</a>
  <h2>Datenschutzerklärung</h2>
  ${md(c.datenschutz.text)}
</div></div>

</body>
</html>
`;

// ---------- Ausgabe ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, "static"), OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "index.html"), html);
console.log("✓ dist/ gebaut:", fs.readdirSync(OUT).join(", "));
