/* Customer quote request (demo). Adaptive questions; never submits or uploads anything. */
(function () {
  "use strict";
  var D = window.BensonsDemo;
  var form = document.getElementById("quote-form");
  if (!form || !D) return;
  form.querySelectorAll("[data-enable]").forEach(function (b) { b.disabled = false; });

  var $ = function (id) { return document.getElementById(id); };
  var panels = form.querySelectorAll(".q-panel");
  var common = form.querySelector(".q-common");
  var prompt = $("type-prompt");
  var status = $("type-status");
  var summary = $("error-summary");
  var confirmBox = $("confirm");
  var fileInput = $("f-file"), fileChosen = $("file-chosen");
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function currentType() { var c = form.querySelector('input[name="job-type"]:checked'); return c ? c.value : ""; }

  function showType() {
    var t = currentType();
    panels.forEach(function (p) { p.hidden = p.getAttribute("data-for") !== t; });
    common.hidden = !t;
    prompt.hidden = !!t;
    if (t) {
      status.textContent = { brochures: "Showing brochure questions: quantity, finished size and pages.", labels: "Showing label questions: quantity, dimensions and what they’re for.", different: "Showing a box to describe your idea.", unsure: "Showing a box to tell us what it’s for." }[t];
      clearErr("job-type");
    }
  }
  form.querySelectorAll('input[name="job-type"]').forEach(function (r) { r.addEventListener("change", showType); });

  // deadline date only when relevant
  var dl = $("deadline"), dateField = form.querySelector(".date-field");
  function syncDate() { dateField.hidden = dl.value !== "By a specific date"; if (dateField.hidden) $("deadline-date").value = ""; }
  dl.addEventListener("change", syncDate); syncDate();

  // simulated attachment: read the name and size locally only
  function renderFile() {
    var f = fileInput.files && fileInput.files[0];
    if (!f) { fileChosen.hidden = true; fileChosen.innerHTML = ""; $("art-btn-text").textContent = "Add a file"; return; }
    fileChosen.hidden = false;
    fileChosen.innerHTML = "";
    var s = document.createElement("span"); s.textContent = "Chosen: " + f.name + " (" + D.kb(f.size) + "). Stays on your device in this demo.";
    var b = document.createElement("button"); b.type = "button"; b.textContent = "Remove file";
    b.addEventListener("click", function () { fileInput.value = ""; renderFile(); fileInput.focus(); });
    fileChosen.append(s, b);
    $("art-btn-text").textContent = "Change file";
  }
  fileInput.addEventListener("change", renderFile);

  // ---------- validation
  function setErr(id, text) {
    var el = $(id), err = $(id + "-err");
    el.setAttribute("aria-invalid", "true"); err.textContent = text; err.hidden = false;
  }
  function clearErr(id) {
    var el = $(id), err = $(id + "-err"); if (!el || !err) return;
    el.removeAttribute("aria-invalid"); err.textContent = ""; err.hidden = true;
  }
  function validate() {
    var t = currentType(), errs = [];
    ["job-type", "d-desc", "u-desc", "f-name", "f-email"].forEach(clearErr);
    if (!t) errs.push(["job-type", "Choose what you’d like a quote for", "job-type"]);
    if (t === "different" && !$("d-desc").value.trim()) errs.push(["d-desc", "Describe what you have in mind, in a few words", "d-desc"]);
    if (t === "unsure" && !$("u-desc").value.trim()) errs.push(["u-desc", "Tell us a little about what it’s for", "u-desc"]);
    if (!$("f-name").value.trim()) errs.push(["f-name", "Enter your name", "f-name"]);
    var em = $("f-email").value.trim();
    if (!em) errs.push(["f-email", "Enter your email address", "f-email"]);
    else if (!EMAIL_RE.test(em)) errs.push(["f-email", "Enter an email address in the right format, like name@example.co.uk", "f-email"]);
    errs.forEach(function (e) { setErr(e[0], e[1]); });
    return errs;
  }
  ["d-desc", "u-desc", "f-name", "f-email"].forEach(function (id) {
    $(id).addEventListener("input", function () { if (this.getAttribute("aria-invalid") === "true") validate(); });
  });

  function focusTarget(id) {
    if (id === "job-type") { var first = form.querySelector('input[name="job-type"]'); first.focus(); }
    else $(id).focus();
  }

  function collect() {
    var t = currentType(), v = function (id) { return ($(id) && $(id).value || "").trim(); };
    var f = { deadline: v("deadline"), deadlineDate: v("deadline-date"), reference: v("f-ref"), fileName: "", fileSize: 0 };
    var file = fileInput.files && fileInput.files[0];
    if (file) { f.fileName = file.name; f.fileSize = file.size; }
    if (t === "brochures") { f.qty = v("b-qty"); f.size = v("b-size"); f.pages = v("b-pages"); f.paper = v("b-paper"); }
    if (t === "labels") { f.qty = v("l-qty"); f.size = v("l-size"); f.use = v("l-use"); }
    if (t === "different") { f.desc = v("d-desc"); f.qty = v("d-qty"); }
    if (t === "unsure") { f.desc = v("u-desc"); }
    return { ref: D.newRef(), created: new Date().toISOString(), type: t, fields: f, name: v("f-name"), email: v("f-email"), notes: v("f-notes") };
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // DEMO: never submits anywhere
    var errs = validate(), ul = summary.querySelector("ul");
    ul.innerHTML = "";
    if (errs.length) {
      errs.forEach(function (er) {
        var li = document.createElement("li"), a = document.createElement("a");
        a.href = "#" + er[2]; a.textContent = er[1];
        a.addEventListener("click", function (ev) { ev.preventDefault(); focusTarget(er[2]); });
        li.appendChild(a); ul.appendChild(li);
      });
      summary.hidden = false; summary.focus();
      return;
    }
    summary.hidden = true;
    var req = collect();
    D.save(req);
    var info = D.describe(req);
    if (window.BensonsTrack) window.BensonsTrack("Sent a test quote request (" + info.typeLabel + ")");
    var first = req.name.split(/\s+/)[0];
    confirmBox.querySelector("[data-c-name]").textContent = first ? ", " + first : "";
    confirmBox.querySelector("[data-c-summary]").textContent = info.summaryLine + " · reference " + req.ref;
    $("open-staff").href = "../staff-demo/#r=" + D.encode(req);
    form.hidden = true;
    confirmBox.hidden = false;
    confirmBox.focus();
    confirmBox.scrollIntoView({ block: "start" });
  });

  $("confirm-reset").addEventListener("click", function () {
    form.reset(); fileInput.value = ""; renderFile(); syncDate(); showType();
    confirmBox.hidden = true; form.hidden = false;
    form.querySelector('input[name="job-type"]').focus();
  });

  showType();
})();
