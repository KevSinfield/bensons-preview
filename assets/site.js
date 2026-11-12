/* Bensons preview: menu + shared demo-request helpers. Nothing here sends data anywhere. */
(function () {
  "use strict";
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  // ---------- mobile menu
  var btn = document.querySelector(".menu-btn");
  var menu = document.getElementById("mobile-menu");
  function setMenu(open) {
    btn.setAttribute("aria-expanded", String(open));
    btn.querySelector(".menu-label").textContent = open ? "Close" : "Menu";
    menu.hidden = !open;
    if (open) { var f = menu.querySelector("a"); if (f) f.focus(); }
  }
  if (btn && menu) {
    btn.addEventListener("click", function () { setMenu(btn.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { setMenu(false); btn.focus(); } });
    window.addEventListener("resize", function () { if (window.innerWidth > 1100 && !menu.hidden) setMenu(false); });
  }
})();

/* ---------- Demo request model, shared by the quote page and the staff view ---------- */
window.BensonsDemo = (function () {
  "use strict";
  var KEY = "bensons-demo-requests";
  var TYPE_LABEL = { brochures: "Brochures", labels: "Labels", different: "Something different", unsure: "Not sure yet" };

  function encode(obj) {
    var bytes = new TextEncoder().encode(JSON.stringify(obj)), bin = "";
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function decode(s) {
    try {
      var bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
      var bytes = Uint8Array.from(bin, function (c) { return c.charCodeAt(0); });
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (e) { return null; }
  }
  function list() {
    try { var a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function save(req) {
    try {
      var a = list().filter(function (r) { return r.ref !== req.ref; });
      a.unshift(req); localStorage.setItem(KEY, JSON.stringify(a.slice(0, 12)));
    } catch (e) { /* storage unavailable: the URL still carries the request */ }
  }
  function newRef() { return "BEN-DEMO-" + String(Math.floor(1000 + Math.random() * 9000)); }

  function fmtDate(iso, withTime) {
    var d = new Date(iso); if (isNaN(d)) return iso;
    var o = { day: "numeric", month: "short", year: "numeric" };
    if (withTime) { o.hour = "2-digit"; o.minute = "2-digit"; }
    return d.toLocaleString("en-GB", o);
  }
  function kb(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }

  // status: given | unsure | missing | notasked
  function st(v) { if (!v || !String(v).trim()) return "missing"; if (v === "Not sure") return "unsure"; return "given"; }
  function spec(label, value, status) { status = status || st(value); return { label: label, value: status === "given" ? String(value).trim() : "", status: status }; }

  function deadlineSpec(f) {
    if (f.deadline === "By a specific date") {
      return f.deadlineDate ? spec("Deadline", "By " + fmtDate(f.deadlineDate)) : { label: "Deadline", value: "By a specific date (date not given)", status: "given", needsDate: true };
    }
    return spec("Deadline", f.deadline);
  }
  function artwork(f) {
    if (f.fileName) return { text: "Artwork: " + f.fileName + " (" + kb(f.fileSize || 0) + ", name only in demo)", supplied: true };
    if (f.reference && f.reference.trim()) return { text: "Artwork reference: " + f.reference.trim(), supplied: true };
    return { text: "Artwork not supplied", supplied: false };
  }

  var QUESTION = {
    "Confirm quantity": "how many you need",
    "Confirm finished size": "the finished size",
    "Confirm the exact finished size": "the exact finished size",
    "Confirm page count": "how many pages, including the cover",
    "Confirm paper and finish": "what paper and finish you’d like (if you’re not sure, we can suggest options)",
    "Confirm deadline": "when you need them by",
    "Confirm deadline date": "the date you need them by",
    "Confirm label dimensions": "the size of each label",
    "Confirm what the labels are for": "what the labels will be used for",
    "Confirm material and finish": "the material and finish you have in mind (if you’re not sure, we can suggest options)",
    "Confirm size, material and finish": "the size, material and finish you have in mind",
    "Confirm the product and quantity": "a little more about what you’d like printed, and roughly how many"
  };

  function describe(req) {
    var f = req.fields || {}, t = req.type, specs = [], rows = [], flags = [], messages = [];
    var dl = deadlineSpec(f), art = artwork(f);
    var headline, phrase;
    function need(cond, flag) { if (cond) flags.push(flag); }
    var known = function (s) { return s.status === "given"; };

    if (t === "brochures") {
      var q = spec("Quantity", f.qty), s = spec("Finished size", f.size), p = spec("Pages", f.pages), pa = spec("Paper or finish", f.paper);
      specs.push(q, s, p, pa);
      var sizeForHead = known(s) && s.value !== "Other size" ? s.value : "";
      if (known(q) && /^\d/.test(q.value)) headline = q.value + (sizeForHead ? " × " + sizeForHead : "") + " brochures";
      else headline = (sizeForHead ? sizeForHead + " brochures" : "Brochures") + (known(q) ? ", " + q.value.toLowerCase() : "");
      phrase = (known(q) ? q.value + " " : "") + (sizeForHead ? sizeForHead + " " : "") + "brochures" + (known(p) ? ", " + p.value + " pages" : "");
      rows.push({ icon: "layers", label: "Pages", text: known(p) ? p.value + " pages" : "", status: p.status });
      need(!known(q), "Confirm quantity");
      need(!known(s), "Confirm finished size");
      need(known(s) && s.value === "Other size", "Confirm the exact finished size");
      need(!known(p), "Confirm page count");
      need(!known(pa), "Confirm paper and finish");
    } else if (t === "labels") {
      var lq = spec("Quantity", f.qty), ls = spec("Dimensions", f.size), lu = spec("What they’re for", f.use);
      specs.push(lq, ls, lu, { label: "Material and finish", value: "", status: "notasked" });
      headline = (known(lq) ? lq.value + " labels" : "Labels") + (known(ls) ? ", " + ls.value : "");
      phrase = (known(lq) ? lq.value + " " : "") + "labels";
      rows.push({ icon: "ruler", label: "Dimensions", text: known(ls) ? ls.value : "", status: ls.status });
      rows.push({ icon: "tag", label: "For", text: known(lu) ? lu.value : "", status: lu.status });
      need(!known(lq), "Confirm quantity");
      need(!known(ls), "Confirm label dimensions");
      need(!known(lu), "Confirm what the labels are for");
      flags.push("Confirm material and finish");
    } else if (t === "different") {
      var dq = spec("Rough quantity", f.qty);
      specs.push(dq, { label: "Size, material and finish", value: "", status: "notasked" });
      headline = "Custom request";
      phrase = "your custom job";
      rows.push({ icon: "box", label: "Quantity", text: known(dq) ? dq.value : "", status: dq.status });
      if (f.desc) { messages.push({ label: "What they have in mind", text: f.desc }); rows.unshift({ icon: "star", label: "Idea", text: "“" + (f.desc.length > 72 ? f.desc.slice(0, 70).replace(/\s+\S*$/, "") + "…" : f.desc) + "”", status: "given" }); }
      flags.push("Confirm size, material and finish");
      need(!known(dq), "Confirm quantity");
    } else {
      headline = "Not sure yet";
      phrase = "your printing";
      if (f.desc) { messages.push({ label: "What it’s for", text: f.desc }); rows.unshift({ icon: "question", label: "For", text: "“" + (f.desc.length > 72 ? f.desc.slice(0, 70).replace(/\s+\S*$/, "") + "…" : f.desc) + "”", status: "given" }); }
      flags.push("Confirm the product and quantity");
    }
    specs.push(dl);
    specs.push({ label: "Artwork", value: art.supplied ? art.text.replace(/^Artwork( reference)?: /, "") : "Not supplied", status: "given" });
    rows.push({ icon: "calendar", label: "Deadline", text: dl.status === "given" ? (dl.value === "Flexible" ? "Deadline flexible" : dl.value) : "", status: dl.status });
    rows.push({ icon: "clip", label: "Artwork", text: art.text, status: "given" });
    need(dl.status !== "given", "Confirm deadline");
    need(!!dl.needsDate, "Confirm deadline date");
    if (req.notes && req.notes.trim()) messages.push({ label: "Anything else", text: req.notes.trim() });

    // follow-up draft
    var first = (req.name || "").trim().split(/\s+/)[0] || "there";
    var body = "Hi " + first + ",\n\nThanks for asking us to quote for " + phrase + ".\n\n";
    if (flags.length) {
      body += "Before we price it, could you let us know:\n" + flags.map(function (fl) { return "- " + (QUESTION[fl] || fl.toLowerCase()); }).join("\n") + "\n\n";
    } else {
      body += "We have what we need to prepare your estimate. [Add your question here.]\n\n";
    }
    body += "Kind regards,\nBensons Printing Company\n01376 517600";

    // estimating brief
    function line(l, v) { return (l + ":").padEnd(28, " ") + v; }
    function show(sp) {
      if (sp.status === "given") return sp.value;
      if (sp.status === "unsure") return "TO CONFIRM (customer not sure)";
      if (sp.status === "notasked") return "TO CONFIRM (not asked on form)";
      return "TO CONFIRM (not given)";
    }
    var brief = ["ESTIMATING BRIEF (demo, no price calculated)", "",
      line("Reference", req.ref), line("Received", fmtDate(req.created, true)),
      line("Customer", (req.name || "") + " <" + (req.email || "") + ">"), line("Job type", TYPE_LABEL[t] || t), "", "SPECIFICATION"]
      .concat(specs.map(function (sp) { return line(sp.label, show(sp)); }));
    if (messages.length) { brief.push("", "CUSTOMER’S WORDS"); messages.forEach(function (m) { brief.push(m.label + ": " + m.text); }); }
    brief.push("", "TO CONFIRM BEFORE ESTIMATING");
    brief = brief.concat(flags.length ? flags.map(function (fl) { return "- " + fl; }) : ["- Nothing outstanding"]);

    return {
      headline: headline, typeLabel: TYPE_LABEL[t] || t, rows: rows, specs: specs, flags: flags, messages: messages,
      draft: { subject: "Your quote request (" + req.ref + ")", body: body }, brief: brief.join("\n"),
      received: fmtDate(req.created, true), summaryLine: headline === "Custom request" || headline === "Not sure yet" ? TYPE_LABEL[t] : headline
    };
  }

  var SAMPLE = {
    ref: "BEN-DEMO-SAMPLE", created: "2026-11-12T10:30:00", type: "brochures",
    fields: { qty: "250", size: "A5", pages: "16", paper: "", deadline: "Flexible", deadlineDate: "", fileName: "", fileSize: 0, reference: "" },
    name: "Sam Taylor (sample)", email: "sam.taylor@example.com", notes: ""
  };

  return { encode: encode, decode: decode, list: list, save: save, newRef: newRef, describe: describe, sample: SAMPLE, typeLabel: TYPE_LABEL, kb: kb };
})();
