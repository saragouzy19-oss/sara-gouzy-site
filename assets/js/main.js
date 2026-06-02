/* =====================================================================
   Sara Gouzy — site engine
   ===================================================================== */

/* ---------- Content loading (from editable JSON files) ----------
   All content is edited via the CMS (the /admin page) and stored in:
     content/settings.json, content/texts.json, content/concerts.json,
     content/videos.json, content/reviews.json, assets/data/ui.json
   They are fetched at startup and assembled into the globals the site uses. */
function deepMerge(a, b) {
  const out = Object.assign({}, a);
  for (const k in b) {
    const bv = b[k];
    if (bv && typeof bv === "object" && !Array.isArray(bv) && a && typeof a[k] === "object" && !Array.isArray(a[k])) {
      out[k] = deepMerge(a[k], bv);
    } else {
      out[k] = bv;
    }
  }
  return out;
}
async function loadContent() {
  const j = (u) => fetch(u, { cache: "no-cache" }).then((r) => r.json());
  const [ui, texts, settings, concerts, videos, reviews] = await Promise.all([
    j("assets/data/ui.json"),
    j("content/texts.json"),
    j("content/settings.json"),
    j("content/concerts.json"),
    j("content/videos.json"),
    j("content/reviews.json"),
  ]);
  window.CONFIG = settings;
  window.CONCERTS = concerts.concerts || [];
  window.VIDEOS = videos.videos || [];
  window.REVIEWS = reviews.reviews || [];
  window.I18N = {};
  ["fr", "en", "de"].forEach((L) => {
    const t = texts[L] || {};
    window.I18N[L] = deepMerge(ui[L] || {}, {
      hero: { role: t.hero_role, tagline: t.hero_tagline },
      home: { statement: t.home_statement },
      bio: { lead: t.bio_lead, figcap: t.bio_figcap, paras: t.bio_paras },
      coaching: { lead: t.coaching_lead, intro: t.coaching_intro, offers: t.coaching_offers, who: t.coaching_who, form_note: t.coaching_form_note },
      contact: { lead: t.contact_lead, based: t.contact_based },
      cta: { title: t.cta_title, text: t.cta_text },
    });
  });
}


/* Signal that JS is active — enables the reveal-on-scroll hiding.
   Without this class, all .reveal content stays visible (no-JS safety). */
document.documentElement.classList.add("js");

/* ---------- Language state ---------- */
const LANGS = ["de", "fr", "en"];
function detectLang() {
  const saved = localStorage.getItem("sg_lang");
  if (saved && LANGS.includes(saved)) return saved;
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  return LANGS.includes(nav) ? nav : "en";
}
let LANG = detectLang();

function dict() { return window.I18N[LANG]; }
function t(path) {
  return path.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : null), dict());
}

/* ---------- Apply translations to static markup ---------- */
function applyStatic() {
  document.documentElement.lang = LANG;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const val = t(el.getAttribute("data-i18n"));
    if (val != null) el.textContent = val;
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    const val = t(el.getAttribute("data-i18n-ph"));
    if (val != null) el.setAttribute("placeholder", val);
  });

  const page = document.documentElement.getAttribute("data-page") || "home";
  const title = t("meta." + page);
  if (title) document.title = title;
}

/* ---------- Render array-driven content ---------- */
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function renderDynamic() {
  /* Biography paragraphs */
  const paras = document.getElementById("bio-paras");
  if (paras) {
    paras.innerHTML = "";
    (t("bio.paras") || []).forEach((p) => paras.appendChild(el("p", null, esc(p))));
  }

  /* Selected roles (biography) — built from past concerts */
  const facts = document.getElementById("facts");
  if (facts) {
    facts.innerHTML = "";
    (window.CONCERTS || []).filter((c) => c.past || isPast(c)).slice(0, 6).forEach((c) => {
      const li = el("li");
      li.appendChild(el("span", "f-role", esc(c.program)));
      li.appendChild(el("span", "f-where", esc(c.venue + ", " + c.city)));
      facts.appendChild(li);
    });
  }

  /* Reviews */
  renderReviews(document.getElementById("reviews-home"), 1);
  renderReviews(document.getElementById("reviews-all"), 99);

  /* Coaching offers + who */
  const offers = document.getElementById("offers");
  if (offers) {
    offers.innerHTML = "";
    (t("coaching.offers") || []).forEach((o) => {
      const card = el("article", "offer reveal");
      card.appendChild(el("div", "num", esc(o.n)));
      card.appendChild(el("h3", "h-sm", esc(o.t)));
      card.appendChild(el("p", null, esc(o.d)));
      offers.appendChild(card);
    });
  }
  const who = document.getElementById("who");
  if (who) {
    who.innerHTML = "";
    (t("coaching.who") || []).forEach((w) => who.appendChild(el("li", null, esc(w))));
  }

  /* Form select options (level) */
  document.querySelectorAll('select[data-opts="level"]').forEach((sel) => {
    const cur = sel.value;
    sel.innerHTML = "";
    (t("form.level_opts") || []).forEach((o) => {
      const opt = el("option", null, esc(o));
      opt.value = o;
      sel.appendChild(opt);
    });
    if (cur) sel.value = cur;
  });

  /* Concerts agenda */
  renderConcerts();

  /* Video gallery */
  renderVideos();
}

function renderReviews(container, limit) {
  if (!container) return;
  const home = container.id === "reviews-home";
  container.innerHTML = "";
  (window.REVIEWS || []).slice(0, limit).forEach((r) => {
    if (home) {
      const wrap = el("figure", "pullquote");
      wrap.appendChild(el("span", "mark", "&ldquo;"));
      wrap.appendChild(el("blockquote", null, esc(r.quote)));
      wrap.appendChild(el("cite", null, "<b>" + esc(r.source) + "</b> &nbsp;·&nbsp; " + esc(r.context)));
      container.appendChild(wrap);
    } else {
      const rev = el("figure", "review");
      rev.appendChild(el("p", null, esc(r.quote)));
      rev.appendChild(el("footer", null, "<b>" + esc(r.source) + "</b> &nbsp; " + esc(r.context)));
      container.appendChild(rev);
    }
  });
}

/* ---------- Concerts ---------- */
function isPast(c) {
  if (c.past) return true;
  if (!c.date) return false;
  return new Date(c.date) < new Date(new Date().toDateString());
}
const MONTHS = {
  de: ["Jan", "Feb", "März", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
  fr: ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};
function dateBlock(c) {
  if (!c.date) return '<span class="m">&middot;</span>';
  const d = new Date(c.date);
  return (
    '<span class="d">' + d.getDate() + "</span>" +
    '<span class="m">' + MONTHS[LANG][d.getMonth()] + "</span> " +
    '<span class="y">' + d.getFullYear() + "</span>"
  );
}
function agendaItem(c) {
  const item = el("article", "agenda-item reveal");
  item.appendChild(el("div", "agenda-date", dateBlock(c)));
  const main = el("div", "agenda-main");
  main.appendChild(el("div", "prog", esc(c.program)));
  if (c.role) main.appendChild(el("div", "role", esc(c.role)));
  main.appendChild(el("div", "venue", '<span class="city">' + esc(c.venue) + "</span> &nbsp;·&nbsp; " + esc(c.city) + (c.country ? ", " + esc(c.country) : "")));
  item.appendChild(main);
  const cta = el("div", "agenda-cta");
  if (c.ticket) cta.innerHTML = '<a class="btn btn--ghost" href="' + esc(c.ticket) + '" target="_blank" rel="noopener">' + esc(t("concerts.tickets")) + "</a>";
  item.appendChild(cta);
  return item;
}
function renderConcerts() {
  const list = (window.CONCERTS || []);
  const upcoming = list.filter((c) => !isPast(c)).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = list.filter(isPast).sort((a, b) => new Date(b.date) - new Date(a.date));

  /* Full agenda (concerts page) */
  const up = document.getElementById("agenda-upcoming");
  const pa = document.getElementById("agenda-past");
  if (up) {
    up.innerHTML = "";
    if (upcoming.length) upcoming.forEach((c) => up.appendChild(agendaItem(c)));
    else up.appendChild(el("div", "agenda-empty", esc(t("concerts.empty_upcoming"))));
  }
  if (pa) {
    pa.innerHTML = "";
    if (past.length) past.forEach((c) => pa.appendChild(agendaItem(c)));
    else pa.appendChild(el("div", "agenda-empty", esc(t("concerts.empty_past"))));
  }

  /* Home preview (first 3 upcoming, else first 3 past) */
  const prev = document.getElementById("agenda-preview");
  if (prev) {
    prev.innerHTML = "";
    const src = upcoming.length ? upcoming : past;
    if (src.length) src.slice(0, 3).forEach((c) => prev.appendChild(agendaItem(c)));
    else prev.appendChild(el("div", "agenda-empty", esc(t("concerts.empty_upcoming"))));
  }

  observeReveals();
}

/* ---------- Language switcher ---------- */
function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  LANG = lang;
  localStorage.setItem("sg_lang", lang);
  document.querySelectorAll(".lang button").forEach((b) =>
    b.classList.toggle("active", b.dataset.lang === lang)
  );
  applyStatic();
  renderDynamic();
}

/* ---------- Header scrolled state (no scroll listener — sentinel) ---------- */
function initHeaderState() {
  const sentinel = el("div");
  sentinel.style.cssText = "position:absolute;top:0;height:8px;width:1px;pointer-events:none;";
  document.body.prepend(sentinel);
  const header = document.querySelector(".site-header");
  if (!header || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(
    ([e]) => header.classList.toggle("scrolled", !e.isIntersecting)
  ).observe(sentinel);
}

/* ---------- Reveal on scroll ---------- */
let revealObserver;
function observeReveals() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach((e) => e.classList.add("in"));
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
  }
  document.querySelectorAll(".reveal:not(.in)").forEach((e) => revealObserver.observe(e));
}

/* ---------- Video lightbox ---------- */
function initVideo() {
  const lb = el("div", "lightbox");
  lb.innerHTML =
    '<button class="lightbox-close" aria-label="Close">&#10005;</button>' +
    '<div class="lightbox-inner"></div>';
  document.body.appendChild(lb);
  const inner = lb.querySelector(".lightbox-inner");
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lastOrigin = null;

  const iframeFor = (id) =>
    '<iframe src="https://www.youtube.com/embed/' + (id || CONFIG.videoId) +
    '?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="Sara Gouzy" ' +
    'allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>';

  // Map the lightbox player back onto the clicked thumbnail (FLIP technique).
  const transformToOrigin = (originEl) => {
    const first = originEl.getBoundingClientRect();
    const last = inner.getBoundingClientRect();
    if (!last.width || !first.width) return null;
    const dx = (first.left + first.width / 2) - (last.left + last.width / 2);
    const dy = (first.top + first.height / 2) - (last.top + last.height / 2);
    const s = Math.max(first.width / last.width, first.height / last.height);
    return "translate(" + dx + "px," + dy + "px) scale(" + s + ")";
  };

  const open = (id, originEl) => {
    lastOrigin = originEl || null;
    inner.innerHTML = iframeFor(id);
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    if (originEl && !reduceMotion()) {
      requestAnimationFrame(() => {
        const t = transformToOrigin(originEl);
        if (!t) return;
        inner.style.transition = "none";
        inner.style.transformOrigin = "center center";
        inner.style.transform = t;       // start: shrunk onto the thumbnail
        inner.style.opacity = "0.5";
        inner.getBoundingClientRect();    // force reflow
        requestAnimationFrame(() => {     // animate: expand to full screen
          inner.style.transition = "transform 0.62s var(--ease), opacity 0.45s ease";
          inner.style.transform = "translate(0,0) scale(1)";
          inner.style.opacity = "1";
        });
      });
    }
  };

  const reset = () => {
    lb.classList.remove("open");
    inner.innerHTML = "";
    inner.style.cssText = "";
    document.body.style.overflow = "";
  };
  const close = () => {
    if (lastOrigin && !reduceMotion() && inner.getBoundingClientRect().width) {
      const t = transformToOrigin(lastOrigin);
      lb.classList.remove("open");           // backdrop fades (CSS)
      if (t) {
        inner.style.transition = "transform 0.5s var(--ease), opacity 0.4s ease";
        inner.style.transform = t;           // shrink back onto the thumbnail
        inner.style.opacity = "0";
      }
      setTimeout(reset, 500);
    } else {
      reset();
    }
  };

  // Delegated so dynamically-rendered video tiles work too.
  document.addEventListener("click", (e) => {
    const t = e.target.closest && e.target.closest("[data-video]");
    if (t) open(t.getAttribute("data-video-id"), t);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const t = e.target.closest && e.target.closest("[data-video]");
      if (t && t.tagName !== "BUTTON") { e.preventDefault(); open(t.getAttribute("data-video-id"), t); }
    }
  });
  makeVideoTriggersFocusable();
  lb.querySelector(".lightbox-close").addEventListener("click", close);
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}

function makeVideoTriggersFocusable() {
  document.querySelectorAll("[data-video]:not(button)").forEach((b) => {
    b.setAttribute("role", "button");
    if (!b.hasAttribute("tabindex")) b.setAttribute("tabindex", "0");
  });
}

/* ---------- Video gallery ---------- */
function renderVideos() {
  const grid = document.getElementById("video-grid");
  if (!grid) return;
  grid.innerHTML = "";
  (window.VIDEOS || []).forEach((v) => {
    const tile = el("article", "video-tile reveal");
    tile.setAttribute("data-video", "");
    tile.setAttribute("data-video-id", v.id);
    tile.setAttribute("aria-label", v.title);
    tile.innerHTML =
      '<div class="vthumb">' +
        '<img loading="lazy" alt="' + esc(v.title) + '" ' +
        'src="https://i.ytimg.com/vi/' + v.id + '/maxresdefault.jpg" ' +
        "onerror=\"this.onerror=null;this.src='https://i.ytimg.com/vi/" + v.id + "/hqdefault.jpg'\" >" +
        '<span class="play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span>' +
      '</div>' +
      '<div class="vmeta"><div class="vt">' + esc(v.title) + '</div><div class="vs">' + esc(v.sub) + "</div></div>";
    grid.appendChild(tile);
  });
  makeVideoTriggersFocusable();
  initTilt();
  observeReveals();
}

/* ---------- 3D tilt on video tiles ---------- */
function initTilt() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(hover: none)").matches) return; // skip on touch devices
  document.querySelectorAll(".video-tile").forEach((tile) => {
    if (tile.__tilt) return;
    tile.__tilt = true;
    const thumb = tile.querySelector(".vthumb");
    if (!thumb) return;
    let raf;
    tile.addEventListener("mousemove", (e) => {
      const r = tile.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        thumb.style.transform =
          "perspective(900px) rotateX(" + (-py * 5).toFixed(2) + "deg) rotateY(" +
          (px * 6).toFixed(2) + "deg) scale(1.02)";
      });
    });
    tile.addEventListener("mouseleave", () => {
      cancelAnimationFrame(raf);
      thumb.style.transform = "";
    });
  });
}

/* ---------- Fade-out transition on internal navigation ---------- */
function initPageTransition() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || !href.endsWith(".html")) return;
    if (a.target === "_blank" || href.startsWith("http")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return; // allow open-in-new-tab
    e.preventDefault();
    document.body.classList.add("leaving");
    setTimeout(() => { window.location.href = href; }, 300);
  });
}

/* ---------- Mobile menu ---------- */
function initMenu() {
  const burger = document.querySelector(".burger");
  if (!burger) return;
  const toggle = () => document.body.classList.toggle("menu-open");
  burger.addEventListener("click", toggle);
  document.querySelectorAll(".mobile-panel a").forEach((a) =>
    a.addEventListener("click", () => document.body.classList.remove("menu-open"))
  );
}

/* ---------- Concerts sub-tabs ---------- */
function initTabs() {
  const tabs = document.querySelector(".subtabs");
  if (!tabs) return;
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
    const target = btn.dataset.tab;
    document.querySelectorAll("[data-panel]").forEach((p) =>
      (p.style.display = p.dataset.panel === target ? "" : "none")
    );
  });
}

/* ---------- Links from CONFIG (email / socials / form action) ---------- */
function initConfigLinks() {
  document.querySelectorAll('[data-link="email"]').forEach((a) => {
    a.href = "mailto:" + CONFIG.email;
    if (a.dataset.text !== "keep") a.textContent = CONFIG.email;
  });
  [["instagram", CONFIG.instagram], ["youtube", CONFIG.youtube], ["facebook", CONFIG.facebook]].forEach(
    ([key, url]) => {
      document.querySelectorAll('[data-link="' + key + '"]').forEach((a) => {
        if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; }
        else a.style.display = "none";
      });
    }
  );
  document.querySelectorAll("form[data-form]").forEach((f) => (f.action = CONFIG.formspree));
}

/* ---------- Forms (Formspree) ---------- */
function initForms() {
  document.querySelectorAll("form[data-form]").forEach((form) => {
    const status = form.querySelector(".form-status");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (status) { status.className = "form-status"; status.textContent = t("form.sending"); }
      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          if (status) { status.textContent = t("form.ok"); status.classList.add("ok"); }
          form.reset();
          renderDynamic(); // restore translated select options
        } else throw new Error("bad response");
      } catch (err) {
        if (status) { status.textContent = t("form.err"); status.classList.add("err"); }
      }
    });
  });
}

/* ---------- Intro overlay (home entrance) ---------- */
function initIntro() {
  const intro = document.getElementById("intro");
  if (!intro) return;
  const force = /[?&]intro=force/.test(location.search); // visit ?intro=force to preview the entrance again
  // Only show the entrance once per browsing session (unless forced for preview).
  if (!force && sessionStorage.getItem("sg_entered")) { intro.remove(); return; }

  document.body.style.overflow = "hidden";
  const enterBtn = intro.querySelector(".intro-enter");

  let done = false;
  const reveal = () => {
    if (done) return;
    done = true;
    if (!force) { try { sessionStorage.setItem("sg_entered", "1"); } catch (e) {} }
    intro.classList.add("revealed");          // photo slides up (curtain rises)
    document.body.style.overflow = "";
    setTimeout(() => intro.remove(), 1100);
  };

  if (enterBtn) {
    enterBtn.addEventListener("mouseenter", reveal);  // hovering the symbol lifts the photo
    enterBtn.addEventListener("click", reveal);
    enterBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reveal(); }
    });
    setTimeout(() => { try { enterBtn.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }
  intro.addEventListener("click", reveal);            // clicking the photo also enters
  setTimeout(reveal, 9000);                           // safety: never trap the visitor
}

/* ---------- Footer year ---------- */
function initYear() {
  document.querySelectorAll("[data-year]").forEach((e) => (e.textContent = new Date().getFullYear()));
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  try { await loadContent(); }            // fetch all editable content first
  catch (e) { console.error("Content failed to load", e); }

  // language buttons
  document.querySelectorAll(".lang button").forEach((b) =>
    b.addEventListener("click", () => setLang(b.dataset.lang))
  );
  document.querySelectorAll(".lang button").forEach((b) =>
    b.classList.toggle("active", b.dataset.lang === LANG)
  );

  applyStatic();
  renderDynamic();

  initIntro();
  initHeaderState();
  initVideo();
  initMenu();
  initTabs();
  initConfigLinks();
  initForms();
  initYear();
  initPageTransition();
  observeReveals();
});
