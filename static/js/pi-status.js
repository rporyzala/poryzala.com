// Live-Status vom Raspberry Pi: liest https://status.poryzala.com/status.json
// und ersetzt die statische Terminal-Box. Ohne JS/Netz bleibt der Fallback stehen.
(function () {
  "use strict";
  var box = document.getElementById("pi-term");
  if (!box || !window.fetch) return;

  var URL = "https://status.poryzala.com/status.json";
  var STALE_MS = 2 * 60 * 60 * 1000; // Timer läuft stündlich → nach 2 h veraltet

  function span(cls, text) {
    var s = document.createElement("span");
    if (cls) s.className = cls;
    s.textContent = text;
    return s;
  }
  function prompt() {
    var p = span("p", "robert@");
    p.appendChild(span("h", "pi5"));
    p.appendChild(document.createTextNode(":~$"));
    return p;
  }
  function since(iso, now) {
    var t = Date.parse(iso);
    if (!iso || isNaN(t)) return "Up";
    var s = Math.max(0, Math.floor((now - t) / 1000));
    if (s < 60) return "Up " + s + " seconds";
    var m = Math.floor(s / 60);
    if (m < 60) return "Up " + m + (m === 1 ? " minute" : " minutes");
    var h = Math.floor(m / 60);
    if (h < 48) return "Up " + h + (h === 1 ? " hour" : " hours");
    return "Up " + Math.floor(h / 24) + " days";
  }
  function hhmm(iso) {
    var d = new Date(iso);
    return isNaN(d) ? "?" : d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  function render(data) {
    var now = Date.now();
    var frag = document.createDocumentFragment();
    frag.appendChild(prompt());
    frag.appendChild(document.createTextNode(" ./status.sh\n"));

    (data.services || []).forEach(function (svc) {
      var ok = svc.state === "running";
      frag.appendChild(span(ok ? "ok" : "bad", "\u25CF "));
      var name = String(svc.name || "?").slice(0, 20);
      frag.appendChild(document.createTextNode(name + new Array(Math.max(1, 18 - name.length)).join(" ")));
      frag.appendChild(document.createTextNode(ok ? since(svc.since, now) : String(svc.state || "down")));
      frag.appendChild(document.createTextNode("\n"));
    });

    frag.appendChild(prompt());
    var age = now - Date.parse(data.updated);
    var note = isNaN(age) || age > STALE_MS
      ? "# Daten veraltet \u2013 letzter Stand " + hhmm(data.updated)
      : "# live vom Pi \u00B7 Stand " + hhmm(data.updated) + " \u00B7 Boot " + hhmm(data.booted);
    frag.appendChild(document.createTextNode(" "));
    frag.appendChild(span("c", note));

    box.textContent = "";
    box.appendChild(frag);
    box.classList.add("live");
  }

  fetch(URL, { cache: "no-store", credentials: "omit" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(render)
    .catch(function () { /* Fallback stehen lassen */ });
})();
