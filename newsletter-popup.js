/* ==========================================================
   MY FIBRO COACH — Newsletter Signup Popup
   Site-wide popup, appears once per visitor after a delay.
   Submits Name + Email to a Google Sheet via Apps Script.
   Include on every page with:
   <script src="newsletter-popup.js" defer></script>
   ========================================================== */
(function () {
  "use strict";

  var ENDPOINT = "https://script.google.com/macros/s/AKfycbxDZt5BNHXa7ZZwUZEYC_j-bYfLyQAS7dMeJi-YGIw51r6bUv2MITa6faRzyEIDpJj0rg/exec";
  var STORAGE_KEY = "mfcNewsletterStatus"; // "dismissed" | "subscribed"
  var DELAY_MS = 6000;

  // Don't show again if already dismissed or subscribed
  try {
    if (localStorage.getItem(STORAGE_KEY)) return;
  } catch (e) { /* localStorage unavailable, continue anyway */ }

  var css = [
    "#mfc-newsletter-overlay{position:fixed;inset:0;background:rgba(26,26,46,.55);",
    "z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;",
    "opacity:0;visibility:hidden;transition:opacity .4s ease,visibility 0s linear .4s;}",
    "#mfc-newsletter-overlay.mfc-show{opacity:1;visibility:visible;transition:opacity .4s ease;}",
    "#mfc-newsletter-card{position:relative;background:#fff;max-width:440px;width:100%;",
    "border-radius:1.25rem;box-shadow:0 20px 60px rgba(0,0,0,.25);padding:2.25rem 2rem 2rem;",
    "border-top:6px solid #00afb9;font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;",
    "transform:translateY(16px);transition:transform .4s ease;text-align:center;}",
    "#mfc-newsletter-overlay.mfc-show #mfc-newsletter-card{transform:translateY(0);}",
    "#mfc-newsletter-close{position:absolute;top:14px;right:16px;background:none;border:none;",
    "font-size:1.4rem;line-height:1;color:#967da9;cursor:pointer;padding:4px;}",
    "#mfc-newsletter-close:hover{color:#1a1a2e;}",
    "#mfc-newsletter-card h3{font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;",
    "color:#1a1a2e;font-size:1.6rem;margin:.25rem 0 .5rem;}",
    "#mfc-newsletter-card p{color:#4a4a5a;font-size:.95rem;margin:0 0 1.25rem;line-height:1.6;}",
    "#mfc-newsletter-form input{width:100%;padding:.65rem .9rem;margin-bottom:.7rem;",
    "border:1px solid rgba(0,175,185,.35);border-radius:.6rem;font-size:.95rem;",
    "font-family:inherit;box-sizing:border-box;}",
    "#mfc-newsletter-form input:focus{outline:none;border-color:#00afb9;",
    "box-shadow:0 0 0 3px rgba(0,175,185,.15);}",
    "#mfc-newsletter-submit{width:100%;background:#00afb9;border:1px solid #00afb9;color:#fff;",
    "font-weight:600;padding:.7rem .9rem;border-radius:.6rem;font-size:1rem;cursor:pointer;",
    "transition:.3s;font-family:inherit;}",
    "#mfc-newsletter-submit:hover{background:#008a92;border-color:#008a92;}",
    "#mfc-newsletter-submit:disabled{opacity:.6;cursor:default;}",
    "#mfc-newsletter-note{font-size:.75rem;color:#967da9;margin-top:.85rem;}",
    "#mfc-newsletter-msg{font-size:.9rem;margin-top:.75rem;display:none;}",
    "#mfc-newsletter-msg.mfc-error{color:#b3261e;}",
    "#mfc-newsletter-msg.mfc-success{color:#00afb9;font-weight:600;}",
    "@media (max-width:480px){#mfc-newsletter-card{padding:1.75rem 1.25rem 1.5rem;}}"
  ].join("");

  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var html = [
    '<div id="mfc-newsletter-overlay" role="dialog" aria-modal="true" aria-labelledby="mfc-newsletter-heading">',
    '<div id="mfc-newsletter-card">',
    '<button id="mfc-newsletter-close" aria-label="Close">&times;</button>',
    '<h3 id="mfc-newsletter-heading">Join the Ripple of Hope</h3>',
    '<p>Get hope-filled stories, recovery tips, and updates from Lindsey &mdash; straight to your inbox.</p>',
    '<form id="mfc-newsletter-form">',
    '<input type="text" id="mfc-newsletter-name" name="name" placeholder="Your first name" autocomplete="given-name" required>',
    '<input type="email" id="mfc-newsletter-email" name="email" placeholder="Your email address" autocomplete="email" required>',
    '<button type="submit" id="mfc-newsletter-submit">Yes, Send Me Hope</button>',
    '<div id="mfc-newsletter-msg"></div>',
    '</form>',
    '<div id="mfc-newsletter-note">No spam, ever. Unsubscribe any time.</div>',
    '</div></div>'
  ].join("");

  var wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  var overlay = document.getElementById("mfc-newsletter-overlay");
  var closeBtn = document.getElementById("mfc-newsletter-close");
  var form = document.getElementById("mfc-newsletter-form");
  var submitBtn = document.getElementById("mfc-newsletter-submit");
  var msg = document.getElementById("mfc-newsletter-msg");

  function setStatus(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
  }

  function closePopup(status) {
    overlay.classList.remove("mfc-show");
    if (status) setStatus(status);
  }

  closeBtn.addEventListener("click", function () { closePopup("dismissed"); });
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closePopup("dismissed");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("mfc-newsletter-name").value.trim();
    var email = document.getElementById("mfc-newsletter-email").value.trim();
    if (!name || !email) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    msg.style.display = "none";
    msg.className = "";

    fetch(ENDPOINT, {
      method: "POST",
      // text/plain avoids a CORS preflight; Apps Script still parses the JSON body
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        name: name,
        email: email,
        source: window.location.pathname.replace(/^\//, "") || "index.html"
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.result === "success") {
          msg.textContent = "You're in! Welcome to the ripple. \u{1F49C}";
          msg.className = "mfc-success";
          msg.style.display = "block";
          form.querySelectorAll("input").forEach(function (i) { i.disabled = true; });
          submitBtn.style.display = "none";
          setStatus("subscribed");
          setTimeout(function () { closePopup(); }, 2200);
        } else {
          throw new Error((data && data.error) || "Unknown error");
        }
      })
      .catch(function () {
        msg.textContent = "Something went wrong. Please try again in a moment.";
        msg.className = "mfc-error";
        msg.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = "Yes, Send Me Hope";
      });
  });

  setTimeout(function () {
    overlay.classList.add("mfc-show");
  }, DELAY_MS);
})();
