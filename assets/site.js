/* Bensons preview: menu, header state, demo quote form (sends nothing). */
(function () {
  "use strict";
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  // Header border once scrolled
  var header = document.querySelector(".site-header");
  function onScroll() { if (header) header.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // Mobile menu
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
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) { setMenu(false); btn.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 1100 && !menu.hidden) setMenu(false); });
  }

  // ---------------- Demo quote form ----------------
  var form = document.getElementById("quote-form");
  if (!form) return;
  form.querySelectorAll("[data-enable]").forEach(function (b) { b.disabled = false; });

  var summary = document.getElementById("error-summary");
  var confirmBox = document.getElementById("confirm");
  var msg = document.getElementById("f-message");
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var rules = [
    { id: "f-name", test: function (v) { return v.trim().length > 0; }, text: "Enter your name" },
    { id: "f-email", test: function (v) { return v.trim().length > 0; }, text: "Enter your email address" },
    { id: "f-email", test: function (v) { return EMAIL_RE.test(v.trim()); }, text: "Enter an email address in the right format, like name@example.co.uk" },
    { id: "f-message", test: function (v) { return v.replace(/^(What it is|Quantity|Size|Deadline):/gm, "").trim().length > 0; }, text: "Tell us a little about what you’d like printed" }
  ];

  function setError(id, text) {
    var input = document.getElementById(id);
    var err = document.getElementById(id + "-err");
    if (text) { input.setAttribute("aria-invalid", "true"); err.textContent = text; err.hidden = false; }
    else { input.removeAttribute("aria-invalid"); err.textContent = ""; err.hidden = true; }
  }

  function validate() {
    var errors = {}, order = [];
    rules.forEach(function (r) {
      if (errors[r.id]) return;
      if (!r.test(document.getElementById(r.id).value)) { errors[r.id] = r.text; order.push(r.id); }
    });
    ["f-name", "f-email", "f-message"].forEach(function (id) { setError(id, errors[id]); });
    return order.map(function (id) { return { id: id, text: errors[id] }; });
  }

  // Re-check a field once the person fixes it
  ["f-name", "f-email", "f-message"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", function () {
      if (this.getAttribute("aria-invalid") === "true") validate();
    });
  });

  document.getElementById("add-prompts").addEventListener("click", function () {
    var lines = ["What it is: ", "Quantity: ", "Size: ", "Deadline: "];
    var cur = msg.value.replace(/\s+$/, "");
    msg.value = (cur ? cur + "\n\n" : "") + lines.join("\n");
    msg.focus();
    var first = msg.value.indexOf("What it is: ") + "What it is: ".length;
    msg.setSelectionRange(first, first);
    this.hidden = true;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // DEMO: never submits anywhere
    var errs = validate();
    var ul = summary.querySelector("ul");
    ul.innerHTML = "";
    if (errs.length) {
      errs.forEach(function (er) {
        var li = document.createElement("li"), a = document.createElement("a");
        a.href = "#" + er.id; a.textContent = er.text;
        a.addEventListener("click", function (ev) { ev.preventDefault(); document.getElementById(er.id).focus(); });
        li.appendChild(a); ul.appendChild(li);
      });
      summary.hidden = false;
      summary.focus();
      return;
    }
    summary.hidden = true;
    var name = document.getElementById("f-name").value.trim().split(/\s+/)[0];
    confirmBox.querySelector("[data-confirm-name]").textContent = name ? ", " + name : "";
    form.hidden = true;
    document.querySelector(".form-intro").hidden = true;
    document.getElementById("form-title").hidden = true;
    confirmBox.hidden = false;
    confirmBox.focus();
    confirmBox.scrollIntoView({ block: "start" });
  });

  document.getElementById("confirm-reset").addEventListener("click", function () {
    form.reset();
    document.getElementById("add-prompts").hidden = false;
    confirmBox.hidden = true;
    form.hidden = false;
    document.querySelector(".form-intro").hidden = false;
    document.getElementById("form-title").hidden = false;
    document.getElementById("f-name").focus();
  });
})();
