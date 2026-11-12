/* Staff enquiry review (demo). Reads the request from the URL or this browser only; sends nothing. */
(function () {
  "use strict";
  var D = window.BensonsDemo;
  if (!D) return;
  var $ = function (id) { return document.getElementById(id); };
  var q = function (sel) { return document.querySelector(sel); };
  var icons = $("icons").content;
  function ico(name) { var s = icons.querySelector(".ico-" + name); return s ? s.cloneNode(true) : document.createElement("span"); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function chip(status) { return el("span", "unknown", { unsure: "Not sure", missing: "Not given", notasked: "Not asked" }[status] || "Unknown"); }

  var current = null;

  function fromHash() {
    var h = location.hash.slice(1), m;
    if ((m = h.match(/^r=(.+)$/))) { var r = D.decode(m[1]); if (r && r.ref) { D.save(r); return r; } }
    if ((m = h.match(/^id=(.+)$/))) { var id = decodeURIComponent(m[1]); return D.list().filter(function (x) { return x.ref === id; })[0] || null; }
    return null;
  }

  function render(req) {
    current = req;
    $("staff-empty").hidden = !!req;
    $("staff-grid").hidden = !req;
    if (!req) return;
    var info = D.describe(req);

    var iconName = { brochures: "book", labels: "tag", different: "star", unsure: "question" }[req.type] || "box";
    var ji = q("[data-job-icon]"); ji.innerHTML = ""; ji.appendChild(ico(iconName));
    q("[data-headline]").textContent = info.headline;
    q("[data-meta]").textContent = info.typeLabel + " · Ref " + req.ref + " · Received " + info.received;

    var rows = q("[data-rows]"); rows.innerHTML = "";
    info.rows.forEach(function (r) {
      var li = el("li"); li.appendChild(ico(r.icon));
      if (r.status === "given" && r.text) li.appendChild(el("span", null, r.text));
      else { li.appendChild(el("span", "row-label", r.label)); li.appendChild(chip(r.status)); }
      rows.appendChild(li);
    });

    var fl = q("[data-flags]"); fl.innerHTML = "";
    if (info.flags.length) info.flags.forEach(function (f) { var li = el("li"); li.appendChild(ico("flag")); li.appendChild(el("span", null, f)); fl.appendChild(li); });
    else { var ok = el("li", "all-clear"); ok.appendChild(ico("flag")); ok.appendChild(el("span", null, "Nothing to confirm")); fl.appendChild(ok); }

    var cust = q("[data-customer]"); cust.innerHTML = "";
    [["Name", req.name], ["Email", req.email], ["Reference", req.ref], ["Received", info.received]].forEach(function (p) {
      cust.appendChild(el("dt", null, p[0])); cust.appendChild(el("dd", null, p[1]));
    });

    var msg = q("[data-message]"); msg.innerHTML = "";
    if (info.messages.length) info.messages.forEach(function (m) { msg.appendChild(el("p", "msg-label", m.label)); msg.appendChild(el("p", "msg", m.text)); });
    else msg.appendChild(el("p", "muted", "No message added."));

    var sp = q("[data-specs]"); sp.innerHTML = "";
    sp.appendChild(el("dt", null, "Job type")); sp.appendChild(el("dd", null, info.typeLabel));
    info.specs.forEach(function (s) {
      sp.appendChild(el("dt", null, s.label));
      var dd = el("dd"); if (s.status === "given") dd.textContent = s.value; else dd.appendChild(chip(s.status));
      sp.appendChild(dd);
    });

    var all = D.list().filter(function (r) { return r.ref !== "BEN-DEMO-SAMPLE" || req.ref === "BEN-DEMO-SAMPLE"; });
    var rw = q("[data-recent-wrap]"), rl = q("[data-recent]"); rl.innerHTML = "";
    rw.hidden = all.length < 2;
    all.forEach(function (r) {
      var a = el("a"); a.href = "#id=" + encodeURIComponent(r.ref);
      if (r.ref === req.ref) a.setAttribute("aria-current", "true");
      a.appendChild(el("span", null, D.describe(r).summaryLine + " · " + r.name));
      a.appendChild(el("small", null, r.ref));
      var li = el("li"); li.appendChild(a); rl.appendChild(li);
    });
  }

  window.addEventListener("hashchange", function () { var r = fromHash(); if (r) render(r); });
  $("load-sample").addEventListener("click", function () {
    var s = JSON.parse(JSON.stringify(D.sample)); s.created = new Date().toISOString(); D.save(s);
    location.hash = "id=" + s.ref; render(s); q("[data-headline]").focus && $("job-headline").setAttribute("tabindex", "-1"); $("job-headline").focus();
  });

  // ---------- dialogs
  function openDialog(d) { if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
  $("ask-btn").addEventListener("click", function () {
    var info = D.describe(current);
    q("[data-ask-to]").textContent = current.name + " <" + current.email + ">";
    $("ask-subject").value = info.draft.subject;
    $("ask-body").value = info.draft.body;
    clearStatus(); openDialog($("ask-dialog")); $("ask-body").focus();
  });
  $("prep-btn").addEventListener("click", function () {
    $("prep-body").value = D.describe(current).brief;
    clearStatus(); openDialog($("prep-dialog")); $("prep-body").focus();
  });
  function clearStatus() { document.querySelectorAll("[data-copy-status]").forEach(function (s) { s.textContent = ""; }); }
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var text = b.getAttribute("data-copy") === "ask" ? "Subject: " + $("ask-subject").value + "\n\n" + $("ask-body").value : $("prep-body").value;
      var out = b.parentNode.querySelector("[data-copy-status]");
      function done(ok) { out.textContent = ok ? "Copied to clipboard" : "Select the text and copy it"; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      else done(false);
    });
  });

  render(fromHash() || D.list()[0] || null);
})();
