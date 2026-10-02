const btn = document.querySelector(".menu-btn");
const nav = document.querySelector(".nav-links");

if (btn && nav) {
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Open menu");
    });
  });

  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target) && !btn.contains(event.target)) {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Open menu");
    }
  });
}

// Reviews screenshot lightbox
const reviewLightbox = document.getElementById("reviewLightbox");
if (reviewLightbox) {
  const lightboxImage = reviewLightbox.querySelector("img");
  const closeReviewLightbox = () => {
    reviewLightbox.classList.remove("open");
    reviewLightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
    document.body.style.overflow = "";
  };

  document.querySelectorAll("[data-review-image]").forEach((button) => {
    button.addEventListener("click", () => {
      lightboxImage.src = button.dataset.reviewImage;
      reviewLightbox.classList.add("open");
      reviewLightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    });
  });

  const closeButton = reviewLightbox.querySelector(".review-lightbox-close");
  if (closeButton) closeButton.addEventListener("click", closeReviewLightbox);
  reviewLightbox.addEventListener("click", (event) => {
    if (event.target === reviewLightbox) closeReviewLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && reviewLightbox.classList.contains("open")) closeReviewLightbox();
  });
}

// Discreet Choose Plan guidance on hover/focus/touch.
(() => {
  const buttons = [...document.querySelectorAll('[data-plan-help="true"]')];
  if (!buttons.length) return;

  const tooltip = document.createElement("div");
  tooltip.className = "plan-help-tooltip";
  tooltip.id = "choose-plan-help";
  tooltip.setAttribute("role", "tooltip");
  tooltip.innerHTML = "<strong>Before you continue:</strong> Choose Plan opens our official X messages. Your selected plan message is copied automatically — paste it in the DM so we know exactly which service you want.";
  document.body.appendChild(tooltip);

  let hideTimer;
  const place = (button) => {
    const r = button.getBoundingClientRect();
    const margin = 10;
    const w = Math.min(340, window.innerWidth - 28);
    tooltip.style.width = w + "px";
    tooltip.style.left = Math.max(14, Math.min(window.innerWidth - w - 14, r.left + (r.width - w) / 2)) + "px";
    tooltip.classList.add("show");
    const h = tooltip.offsetHeight;
    let top = r.top - h - margin;
    if (top < 12) top = Math.min(window.innerHeight - h - 12, r.bottom + margin);
    tooltip.style.top = top + "px";
  };
  const show = (button, autoHide = false) => {
    clearTimeout(hideTimer);
    place(button);
    if (autoHide) hideTimer = setTimeout(() => tooltip.classList.remove("show"), 2200);
  };
  const hide = () => {
    clearTimeout(hideTimer);
    tooltip.classList.remove("show");
  };

  buttons.forEach((button) => {
    button.addEventListener("mouseenter", () => show(button));
    button.addEventListener("mouseleave", hide);
    button.addEventListener("focus", () => show(button));
    button.addEventListener("blur", hide);
    button.addEventListener("touchstart", () => show(button, true), { passive: true });
    button.addEventListener("click", () => show(button, true));
  });

  window.addEventListener("resize", hide);
  window.addEventListener("scroll", hide, { passive: true });
})();


// Version 10.5: reliable dropdown interaction + topic FAQ accordions
(() => {
  const dropdowns = [...document.querySelectorAll('.nav-dropdown')];
  const desktop = () => window.innerWidth > 900;

  const setOpen = (drop, open) => {
    const toggle = drop.querySelector('.nav-dropdown-toggle');
    drop.classList.toggle('open', open);
    if (toggle) toggle.setAttribute('aria-expanded', String(open));
  };

  const resetState = (drop) => {
    drop.dataset.pinned = 'false';
    drop.dataset.suppressHover = 'false';
  };

  const closeDrop = (drop) => {
    setOpen(drop, false);
    resetState(drop);
  };

  const closeOthers = (except) => {
    dropdowns.forEach((drop) => {
      if (drop !== except) closeDrop(drop);
    });
  };

  dropdowns.forEach((drop) => {
    const toggle = drop.querySelector('.nav-dropdown-toggle');
    if (!toggle) return;
    resetState(drop);

    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!desktop()) {
        const willOpen = !drop.classList.contains('open');
        closeOthers(drop);
        setOpen(drop, willOpen);
        return;
      }

      // On desktop the menu may already be open because of hover. The first
      // click pins it open; the second click closes it even while the pointer
      // is still over the control.
      const pinned = drop.dataset.pinned === 'true';
      if (pinned) {
        drop.dataset.pinned = 'false';
        drop.dataset.suppressHover = 'true';
        setOpen(drop, false);
      } else {
        closeOthers(drop);
        drop.dataset.pinned = 'true';
        drop.dataset.suppressHover = 'false';
        setOpen(drop, true);
      }
    });

    drop.addEventListener('mouseenter', () => {
      if (!desktop() || drop.dataset.suppressHover === 'true') return;
      closeOthers(drop);
      setOpen(drop, true);
    });

    drop.addEventListener('mouseleave', () => {
      if (!desktop()) return;
      drop.dataset.suppressHover = 'false';
      if (drop.dataset.pinned !== 'true') setOpen(drop, false);
    });
  });

  document.addEventListener('click', (event) => {
    dropdowns.forEach((drop) => {
      if (!drop.contains(event.target)) closeDrop(drop);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') dropdowns.forEach(closeDrop);
  });

  window.addEventListener('resize', () => {
    dropdowns.forEach(closeDrop);
  });

  document.querySelectorAll('.faq-question').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      if (!item) return;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach((openItem) => {
        openItem.classList.remove('open');
        const openButton = openItem.querySelector('.faq-question');
        if (openButton) openButton.setAttribute('aria-expanded','false');
      });
      if (!isOpen) {
        item.classList.add('open');
        button.setAttribute('aria-expanded','true');
      }
    });
  });
})();



// Version 10.2: Articles mega-menu + nested mobile article categories.
(() => {
  document.querySelectorAll('.article-category-toggle').forEach((toggle) => {
    toggle.addEventListener('click', (event) => {
      if (window.innerWidth > 900) return;
      event.preventDefault();
      event.stopPropagation();
      const group = toggle.closest('.article-menu-group');
      if (!group) return;
      const open = group.classList.toggle('subopen');
      toggle.setAttribute('aria-expanded', String(open));
    });
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      document.querySelectorAll('.article-menu-group.subopen').forEach(g => g.classList.remove('subopen'));
      document.querySelectorAll('.article-category-toggle').forEach(b => b.setAttribute('aria-expanded','false'));
    }
  });
})();


// Portfolio video: autoplay only while meaningfully visible in the viewport.
// Browsers generally require autoplaying media to begin muted; users can unmute/pause via native controls.
(() => {
  const video = document.querySelector('video[data-autoplay-in-view="true"]');
  if (!video) return;

  // Keep startup browser-compatible on desktop and mobile.
  video.muted = true;
  video.playsInline = true;

  let userPausedWhileVisible = false;
  let isVisible = false;

  video.addEventListener('pause', () => {
    if (isVisible && !video.ended) userPausedWhileVisible = true;
  });
  video.addEventListener('play', () => {
    userPausedWhileVisible = false;
  });

  const playIfAllowed = () => {
    if (userPausedWhileVisible || !video.paused) return;
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.35;

      if (isVisible) {
        playIfAllowed();
      } else if (!video.paused) {
        // This programmatic pause should not count as a user's pause.
        userPausedWhileVisible = false;
        video.pause();
        userPausedWhileVisible = false;
      }
    }, { threshold: [0, 0.35, 0.6, 1] });

    observer.observe(video);
  } else {
    // Safe fallback for older browsers.
    playIfAllowed();
  }
})();
