/* Portfolio Website — site behaviour (no dependencies) */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* Header: border once the page scrolls */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Count-up numbers */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var start = null;
    var duration = 1400;
    function frame(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* Scroll reveal */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        entry.target.querySelectorAll("[data-count]").forEach(countUp);
        if (entry.target.hasAttribute("data-count")) countUp(entry.target);
        revealObs.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { revealObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* Strips: drift slowly on their own, alternating direction row by row.
     Cards are duplicated once so the loop is seamless; hover, touch or a manual
     scroll pauses the drift, and off-screen strips don't move. Runs before the
     video observer so the copies' videos load lazily too. */
  var strips = reduceMotion ? [] : document.querySelectorAll(".clients .reel, .reel.phones");
  strips.forEach(function (strip, i) {
    var cards = Array.prototype.slice.call(strip.children);
    if (cards.length < 2) return;
    // two copies, so one full loop always fits inside the scrollable width, even on wide screens
    [1, 2].forEach(function () {
      cards.forEach(function (card) {
        var copy = card.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        copy.querySelectorAll("button, a").forEach(function (el) { el.setAttribute("tabindex", "-1"); });
        if (copy.matches("button, a")) copy.setAttribute("tabindex", "-1");
        strip.appendChild(copy);
      });
    });
    strip.classList.add("is-auto");

    var speed = 22;                      // px per second
    var dir = i % 2 === 0 ? 1 : -1;      // even rows drift left, odd rows drift right
    var pos = null, last = null, loop = 0;
    var onScreen = false, held = false, resumeAt = 0;

    function loopWidth() { return strip.children[cards.length].offsetLeft - strip.children[0].offsetLeft; }
    function hold() { held = true; }
    function release() { held = false; resumeAt = performance.now() + 1200; }

    strip.addEventListener("pointerenter", hold);
    strip.addEventListener("pointerleave", release);
    strip.addEventListener("touchstart", hold, { passive: true });
    strip.addEventListener("touchend", release, { passive: true });
    strip.addEventListener("focusin", hold);
    strip.addEventListener("focusout", release);
    strip.addEventListener("scroll", function () {
      // a scroll we didn't make: follow the user, then pause briefly
      if (pos !== null && Math.abs(strip.scrollLeft - pos) > 3) { pos = strip.scrollLeft; resumeAt = performance.now() + 2500; }
    }, { passive: true });

    function frame(t) {
      if (!onScreen) { last = null; return; }
      if (last !== null && !held && t > resumeAt) {
        if (!loop) loop = loopWidth();
        if (pos === null) pos = dir < 0 ? loop : strip.scrollLeft;
        pos += dir * speed * Math.min(t - last, 64) / 1000;
        if (pos >= loop) pos -= loop;
        if (pos <= 0) pos += loop;
        strip.scrollLeft = pos;
      }
      last = t;
      requestAnimationFrame(frame);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var was = onScreen;
        onScreen = entries[0].isIntersecting;
        if (onScreen && !was) requestAnimationFrame(frame);
      }).observe(strip);
    }
    window.addEventListener("resize", function () { loop = 0; });
  });

  /* Videos: load and play only while on screen */
  var videos = document.querySelectorAll("video[data-src]");
  if ("IntersectionObserver" in window) {
    var videoObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) {
          if (!v.src) v.src = v.getAttribute("data-src");
          if (!reduceMotion) v.play().catch(function () {});
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { rootMargin: "200px 0px", threshold: 0.2 });
    videos.forEach(function (v) { videoObs.observe(v); });
  } else {
    videos.forEach(function (v) { v.src = v.getAttribute("data-src"); });
  }

  /* Client index: highlight the client in view */
  var indexLinks = document.querySelectorAll(".client-index a");
  if (indexLinks.length && "IntersectionObserver" in window) {
    var clientObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        indexLinks.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + entry.target.id;
          a.classList.toggle("is-active", on);
          if (on && a.scrollIntoView) a.parentNode.scrollTo({ left: a.offsetLeft - 20, behavior: "smooth" });
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".client").forEach(function (c) { clientObs.observe(c); });
  }

  /* Hero: portrait tilt and chip parallax follow the pointer */
  var visual = document.querySelector(".hero-visual");
  var portrait = document.querySelector("[data-tilt]");
  var chips = document.querySelectorAll(".chip[data-depth]");
  if (visual && portrait && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelector(".hero").addEventListener("pointermove", function (e) {
      var r = visual.getBoundingClientRect();
      var x = (e.clientX - (r.left + r.width / 2)) / r.width;
      var y = (e.clientY - (r.top + r.height / 2)) / r.height;
      portrait.style.setProperty("--ry", (x * 8).toFixed(2) + "deg");
      portrait.style.setProperty("--rx", (-y * 8).toFixed(2) + "deg");
      chips.forEach(function (chip) {
        var d = parseFloat(chip.getAttribute("data-depth"));
        chip.style.setProperty("--px", (x * 22 * d).toFixed(1) + "px");
        chip.style.setProperty("--py", (y * 22 * d).toFixed(1) + "px");
      });
    });
  }

  /* Marquee: duplicate tiles so the loop is seamless */
  document.querySelectorAll(".marquee-track").forEach(function (track) {
    Array.prototype.slice.call(track.children).forEach(function (tile) {
      var copy = tile.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      copy.setAttribute("tabindex", "-1");
      track.appendChild(copy);
    });
  });

  /* Lightbox for posts, screenshots and videos */
  var box = document.querySelector(".lightbox");
  var boxBody = box && box.querySelector(".lightbox-body");
  function openBox(node) {
    if (!box || !box.showModal) return;
    boxBody.innerHTML = "";
    boxBody.appendChild(node);
    box.showModal();
  }
  if (box) {
    box.querySelector(".lightbox-close").addEventListener("click", function () { box.close(); });
    box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
    box.addEventListener("close", function () { boxBody.innerHTML = ""; });
  }
  document.addEventListener("click", function (e) {
    /* YouTube: swap the thumbnail for the player only when clicked */
    var film = e.target.closest("[data-yt]");
    if (film) {
      if (film.querySelector("iframe")) return;
      var frame = document.createElement("iframe");
      frame.src = "https://www.youtube-nocookie.com/embed/" + film.getAttribute("data-yt") + "?autoplay=1&rel=0&playsinline=1";
      frame.title = film.getAttribute("aria-label") || "YouTube video";
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
      film.appendChild(frame);
      return;
    }
    var trigger = e.target.closest("[data-full]");
    if (trigger) {
      var img = document.createElement("img");
      img.src = trigger.getAttribute("data-full");
      img.alt = trigger.querySelector("img") ? trigger.querySelector("img").alt : "";
      if (trigger.closest(".shots-wide")) img.className = "lightbox-wide";
      if (trigger.classList.contains("browser")) img.className = "lightbox-page";
      openBox(img);
      return;
    }
    var clip = e.target.closest(".clip");
    if (clip && clip.querySelector("video")) {
      var src = clip.querySelector("video").getAttribute("data-src");
      var v = document.createElement("video");
      v.src = src; v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.controls = true;
      openBox(v);
    }
  });

  /* Copy email */
  var toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  document.body.appendChild(toast);
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(function () { toast.classList.remove("is-on"); }, 2200);
  }
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { showToast("Email copied"); }, function () { showToast(text); });
      } else {
        showToast(text);
      }
    });
  });
})();
