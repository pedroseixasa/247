// Lightweight enhancements: reveal on scroll, header shrink, smooth links
(function () {
  "use strict";

  // Reveal on scroll using IntersectionObserver
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in-view");
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.14 },
  );

  document.querySelectorAll(".reveal").forEach(function (el) {
    observer.observe(el);
  });

  // Header shrink on scroll
  var header = document.querySelector("header");
  if (header) {
    var lastY = window.scrollY;
    var up = false;
    function check() {
      var y = window.scrollY;
      if (y > 60) header.classList.add("shrink");
      else header.classList.remove("shrink");
      lastY = y;
    }
    window.addEventListener("scroll", check, { passive: true });
    check();
  }

  // Smooth anchor links
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href");
    if (id && id.length > 1) {
      var target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });

  // Small accessibility: add reveal class to common elements to animate
  // if developer didn't add them manually
  ["h1", ".card", "main p"].forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (!el.classList.contains("reveal")) el.classList.add("reveal");
    });
  });
})();
