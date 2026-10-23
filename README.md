# poryzala.com

Persönliche Bewerbungsseite – statisch, ohne PHP, ohne Datenbank, ohne Cookies.
Live: https://poryzala.com · Design-Portfolio: https://poryzala.com/design/

```
content/site.json     ← Texte der Hauptseite (im CMS bearbeitbar)
content/design.json   ← Arbeiten der Design-Unterseite (im CMS bearbeitbar)
static/               ← CSS, Schriften, Bilder, LPIC-Trainer, Security-Header (_headers)
build.js              ← baut dist/ aus content + static (Node 18+, keine Abhängigkeiten)
wrangler.jsonc        ← Cloudflare Workers: liefert dist/ als statische Seite aus
.pages.yml            ← Formulare für Pages CMS
```

Ablauf: Text im CMS oder lokal ändern → Commit auf GitHub → Cloudflare baut und veröffentlicht (ca. 1 Minute).

---

## Lokal arbeiten

```bash
cd ~/Projekte/poryzala-site
git pull                              # IMMER zuerst – das CMS committet ebenfalls
node build.js
python3 -m http.server 8000 -d dist   # http://localhost:8000
git add -A && git commit -m "…" && git push
```

Vor dem Commit prüfen:

```bash
python3 -m json.tool content/site.json > /dev/null && echo "site.json ok"
python3 -m json.tool content/design.json > /dev/null && echo "design.json ok"
grep -c "<<<<<<<\|>>>>>>>\|^=======" content/*.json   # muss 0 sein
```

**Konflikt bei `git pull --rebase`?** Nicht von Hand basteln: `git rebase --abort`, dann mit `git log --oneline HEAD..origin/main` ansehen, was auf GitHub neu ist.

---

## Hosting: Cloudflare Workers (Static Assets)

Projekt `poryzala-com` in Cloudflare → **Workers & Pages**, verbunden mit GitHub `rporyzala/poryzala.com` (Branch `main`).

| Einstellung | Wert |
|---|---|
| Build command | `node build.js` |
| Deploy command | `npx wrangler deploy` |
| Assets-Verzeichnis | `./dist` (in `wrangler.jsonc`) |
| Custom domains | `poryzala.com`, `www.poryzala.com` (Settings → Domains & Routes) |
| Testadresse | `poryzala-com.robert-228.workers.dev` |

Build-Log: Workers & Pages → `poryzala-com` → **Deployments**.

### DNS (Cloudflare)

- `poryzala.com`, `www` → automatisch durch die Custom Domains des Workers
- `cloud`, `ssh` → Cloudflare Tunnel zum Raspberry Pi (nicht ändern)
- MX, SPF, `_autodiscover` → E-Mail bei webgo (bis zum Mail-Umzug nicht ändern)
- `_dmarc` → DMARC-Richtlinie

---

## Editor: Pages CMS

https://app.pagescms.org → mit GitHub anmelden → Repo `poryzala.com`.

- **Website-Texte** → Hauptseite
- **Design-Portfolio** → Arbeiten ein-/ausblenden, sortieren, Texte ändern. Das erste Bild einer Arbeit ist das Vorschaubild.

Jedes Speichern ist ein Git-Commit. Ältere Versionen lassen sich auf GitHub wiederherstellen.

### Texte formatieren

| Eingabe | Ergebnis |
|---|---|
| `**wichtig**` | **wichtig** |
| `[Design-Portfolio →](/design/)` | Link |
| Leerzeile | neuer Absatz |
| `### Titel` | Zwischenüberschrift (Impressum/Datenschutz) |

### Neue Bilder

Nur als `.webp` oder `.jpg` hochladen, möglichst unter 500 KB (z. B. `cwebp -q 80 -resize 1800 0 bild.jpg -o bild.webp`). Keine anderen Dateitypen in `static/media/`.

---

## Sicherheit

- Keine Server-Logik → keine Webshells, keine SQL-Injection, keine Plugin-Lücken
- Login nur über GitHub mit 2FA; Cloudflare und Pages CMS haben nur Zugriff auf dieses eine Repo
- `static/_headers`: Content-Security-Policy, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy
- Schrift lokal ausgeliefert (kein Google Fonts), keine Cookies, kein Tracking
- Bilder aus der alten WordPress-Seite wurden neu kodiert (WebP, ohne Metadaten); aus dem alten Archiv wurde kein Code übernommen

Header prüfen: https://securityheaders.com/?q=poryzala.com

---

## Hintergrund

Die frühere WordPress-Installation wurde im Oktober 2026 kompromittiert (Webshells, fremdes Admin-Konto). Die Seite wurde daraufhin vollständig als statische Website neu aufgebaut.
