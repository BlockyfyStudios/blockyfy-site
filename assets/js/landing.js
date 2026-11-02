(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var burger = document.querySelector(".burger");
  var nav = document.getElementById("nav");
  if (burger && nav) {
    function closeMenu(returnFocus) {
      nav.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      if (returnFocus) burger.focus();
    }

    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        var firstLink = nav.querySelector("a[href]");
        if (firstLink) firstLink.focus();
      }
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        closeMenu(false);
      }
    });
    nav.addEventListener("focusout", function (e) {
      var next = e.relatedTarget;
      if (next && next !== burger && !nav.contains(next)) closeMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) closeMenu(true);
    });
    document.documentElement.classList.add("nav-ready");
  }

  document.querySelectorAll("[data-youtube-id]").forEach(function (frame) {
    var videoId = (frame.getAttribute("data-youtube-id") || "").trim();
    var play = frame.querySelector(".trailer-play");
    if (!play || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return;

    var status = frame.querySelector("[data-trailer-status]");
    var detail = frame.querySelector("[data-trailer-detail]");
    frame.classList.add("trailer-ready");
    play.disabled = false;
    play.setAttribute("aria-label", "Play the official Dragon Block Galactic trailer");
    if (status) status.textContent = "Official gameplay trailer";
    if (detail) detail.textContent = "Watch now";

    play.addEventListener("click", function () {
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + videoId + "?autoplay=1";
      iframe.title = frame.getAttribute("data-youtube-title") || "Official gameplay trailer";
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
      iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      iframe.setAttribute("allowfullscreen", "");
      frame.replaceChildren(iframe);
      if (iframe.focus) iframe.focus();
      frame.classList.add("trailer-playing");
    }, { once: true });
  });

  var sectionLinks = document.querySelectorAll('.head-nav a[href^="#"]:not(.btn)');
  if (sectionLinks.length && "IntersectionObserver" in window) {
    var linkFor = {};
    sectionLinks.forEach(function (link) {
      linkFor[link.getAttribute("href").slice(1)] = link;
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var link = linkFor[en.target.id];
        if (!link) return;
        if (en.isIntersecting) {
          sectionLinks.forEach(function (other) { other.classList.remove("is-active"); });
          link.classList.add("is-active");
        } else {
          link.classList.remove("is-active");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(linkFor).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  var rise = document.querySelectorAll(".rise");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        io.unobserve(en.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -5% 0px" });
    rise.forEach(function (el) { io.observe(el); });
    document.documentElement.classList.add("reveal-ready");
  } else {
    rise.forEach(function (el) { el.classList.add("in"); });
  }

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
