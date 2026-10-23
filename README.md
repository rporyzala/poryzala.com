# poryzala.com

Persönliche Bewerbungsseite – statisch, ohne PHP, ohne Datenbank, ohne Cookies.

```
content/site.json   ← alle Texte (im CMS bearbeitbar)
static/             ← CSS, Schriften, LPIC-Trainer, Bilder, Security-Header (_headers)
build.js            ← baut dist/ aus content + static (Node 18+, keine Abhängigkeiten)
.pages.yml          ← Formulare für Pages CMS
```

Ablauf: Text im CMS ändern → Commit auf GitHub → Cloudflare Pages baut und veröffentlicht (ca. 30 s).

---

## Einrichtung (einmalig)

### 1. Lokal testen

```bash
cd ~/Projekte/poryzala-site
node build.js
python3 -m http.server 8000 -d dist
# Browser: http://localhost:8000
```

### 2. GitHub-Repository anlegen und hochladen

Auf github.com → **New repository** → Name `poryzala-site`, **Public** oder **Private** (beides geht), ohne README anlegen.

```bash
cd ~/Projekte/poryzala-site
git init
git add .
git commit -m "Neue statische Website"
git branch -M main
git remote add origin git@github.com:B0B-X/poryzala-site.git
git push -u origin main
```

> GitHub-Konto vorher mit **2FA** absichern (Settings → Password and authentication). Das ist ab jetzt der Login für deine Website.

### 3. Cloudflare Pages verbinden

Cloudflare-Dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git** → GitHub autorisieren → Repo `poryzala-site` → **Begin setup**

| Feld | Wert |
|---|---|
| Production branch | `main` |
| Framework preset | None |
| Build command | `node build.js` |
| Build output directory | `dist` |

→ **Save and Deploy**. Danach ist die Seite unter `poryzala-site.pages.dev` erreichbar. Dort alles prüfen.

### 4. Domain umstellen

Im Pages-Projekt → **Custom domains** → **Set up a custom domain** → `poryzala.com`, danach dasselbe für `www.poryzala.com`.

Cloudflare ersetzt dabei die alten A-Records (webgo) durch CNAME-Records auf Pages.
**Die MX-, SPF-, DKIM- und Autodiscover-Einträge für die E-Mail NICHT anfassen**, die Mail bleibt bei webgo.
`cloud.poryzala.com` und `ssh.poryzala.com` (Tunnel zum Pi) bleiben ebenfalls unverändert.

### 5. Editor (Pages CMS) einrichten

1. https://app.pagescms.org → **Sign in with GitHub**
2. Zugriff auf das Repo `poryzala-site` erlauben (nur dieses eine Repo auswählen)
3. Repo öffnen → links **Website-Texte** → ändern → **Save**

Jedes Speichern ist ein Git-Commit. Ältere Versionen lassen sich jederzeit auf GitHub wiederherstellen.

---

## Texte formatieren

| Eingabe | Ergebnis |
|---|---|
| `**wichtig**` | **wichtig** |
| `[GitHub](https://github.com/B0B-X)` | Link |
| Leerzeile | neuer Absatz |
| `### Titel` | Zwischenüberschrift (Impressum/Datenschutz) |

## Sicherheit

- Keine Server-Logik → keine Webshells, keine SQL-Injection, keine Plugin-Lücken
- Login nur über GitHub (2FA), Änderungen versioniert
- `static/_headers`: Content-Security-Policy, HSTS, X-Frame-Options, nosniff, Referrer-Policy
- Schrift lokal ausgeliefert (kein Google Fonts), keine Cookies, kein Tracking

Prüfen nach dem Go-live: https://securityheaders.com/?q=poryzala.com
