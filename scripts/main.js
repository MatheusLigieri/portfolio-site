(() => {
  "use strict";

  const CONTENT = window.PORTFOLIO_CONTENT;
  const STORAGE_KEY = "portfolio-language";
  const DEFAULT_LANG = "pt-br";
  const LINKS = {
    email: "matheusligieri@gmail.com",
    linkedin: "https://www.linkedin.com/in/ligieri/",
    github: "https://github.com/MatheusLigieri",
  };

  const app = document.getElementById("app");
  const dialog = document.getElementById("case-dialog");
  let currentLang = DEFAULT_LANG;
  let marqueePaused = false;

  // ---------- helpers ----------
  const SVG_NS = "http://www.w3.org/2000/svg";

  function h(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null || value === false) continue;
      if (key === "class") el.className = value;
      else if (key === "text") el.textContent = value;
      else if (key.startsWith("on")) el.addEventListener(key.slice(2).toLowerCase(), value);
      else el.setAttribute(key, value === true ? "" : value);
    }
    [].concat(children).forEach((child) => {
      if (child == null || child === false) return;
      el.append(child instanceof Node ? child : document.createTextNode(child));
    });
    return el;
  }

  function icon(path, size = 16, stroke = 2.5) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", stroke);
    svg.setAttribute("aria-hidden", "true");
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", path);
    svg.append(p);
    return svg;
  }

  const ICONS = {
    external: "M7 17 17 7M8 7h9v9",
    pause: "M8 5v14M16 5v14",
    play: "M7 5l12 7-12 7z",
    github: "M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21",
  };

  const get = (obj, path) => path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);

  function readLang() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved && CONTENT[saved] ? saved : null;
    } catch (_) {
      return null;
    }
  }

  function saveLang(lang) {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) {
      /* armazenamento indisponível: segue sem persistir */
    }
  }

  function laser(style, modifier = "") {
    return h("div", { class: `laser${modifier ? ` laser--${modifier}` : ""}`, "aria-hidden": "true", style });
  }

  // ---------- seções ----------
  function sectionHead(title, aside) {
    return h("div", { class: "section__head" }, [h("h2", { text: title }), aside]);
  }

  function renderHero(c) {
    const [first, second] = c.hero.titleLines;

    return h("section", { id: "topo", class: "hero" }, [
      laser("left: -10%; width: 120%; top: 18%; transform: rotate(-9deg)"),
      laser("left: -10%; width: 120%; top: 12%; transform: rotate(6deg)", "ink"),
      laser("left: -10%; width: 120%; top: 30%; transform: rotate(14deg)", "blue"),
      h("div", { class: "hero__inner wrap" }, [
        h("h1", {}, [first, h("br"), second]),
        h("p", { class: "lead", text: c.hero.subtitle }),
        h("div", { class: "hero__actions" }, [
          h("a", { class: "btn", href: "#casos", text: c.hero.ctaCases }),
          h("a", { class: "btn btn--quiet", href: LINKS.github, target: "_blank", rel: "noreferrer" }, [icon(ICONS.github, 16, 2), "GitHub"]),
        ]),
      ]),
    ]);
  }

  function renderMarquee(c) {
    const items = [];
    for (let i = 0; i < 2; i += 1) {
      c.marquee.forEach((item) => {
        items.push(h("span", { text: item }), h("span", { text: "/" }));
      });
    }
    const band = h("div", { class: `marquee${marqueePaused ? " marquee--paused" : ""}` });
    const toggle = h("button", { type: "button", class: "marquee__toggle" });
    const syncToggle = () => {
      toggle.setAttribute("aria-label", marqueePaused ? c.marqueeControls.play : c.marqueeControls.pause);
      toggle.replaceChildren(icon(marqueePaused ? ICONS.play : ICONS.pause, 18, 2));
    };
    toggle.addEventListener("click", () => {
      marqueePaused = !marqueePaused;
      band.classList.toggle("marquee--paused", marqueePaused);
      syncToggle();
    });
    syncToggle();
    band.append(h("div", { class: "marquee__track", "aria-hidden": "true" }, items), toggle);
    return band;
  }

  function detailsButton(c, item) {
    return h("button", {
      type: "button",
      class: "case__more",
      "aria-label": `${c.cases.details}: ${item.title}`,
      text: c.cases.details,
      onClick: () => openCase(item),
    });
  }

  function caseVisual(item) {
    return h("figure", { class: "case__visual" }, [
      h("img", { class: "case__img", src: item.image, alt: item.imageAlt || "", loading: "lazy" }),
      h("figcaption", { class: "tarja", text: item.stack }),
    ]);
  }

  function caseFigures(item) {
    if (!item.figures) return null;
    return h("div", { class: "figures" }, item.figures.map((figure) =>
      h("div", { class: "figures__item" }, [
        h("span", { class: "figures__value", text: figure.value }),
        h("span", { class: "figures__text", text: figure.text }),
      ])
    ));
  }

  function caseBody(c, item) {
    return [
      h("h3", { class: "case__title", text: item.title }),
      h("p", { class: "case__sector", text: item.sector }),
      h("p", { class: "case__summary", text: item.summary }),
      caseFigures(item),
      h("p", { class: "case__impact" }, [h("strong", { text: `${c.cases.labels.impact}: ` }), item.impact]),
      detailsButton(c, item),
    ];
  }

  function renderCases(c) {
    const [lead, ...others] = c.cases.items.filter((item) => item.featured);
    const bSide = c.cases.items.filter((item) => !item.featured);

    return h("section", { id: "casos", class: "section--alt" }, [
      h("div", { class: "section__inner wrap" }, [
        sectionHead(c.cases.title),
        h("article", { class: "case case--lead" }, [
          caseVisual(lead),
          h("div", { class: "case__body" }, caseBody(c, lead)),
        ]),
        h("div", { class: "cases-pair" }, others.map((item) =>
          h("article", { class: "case" }, [caseVisual(item), ...caseBody(c, item)])
        )),
        h("div", { class: "bside" }, [
          h("h3", { class: "bside__title", text: c.cases.bSide }),
          h("ol", { class: "bside__list" }, bSide.map((item) =>
            h("li", { class: "bside__row" }, [
              h("div", { class: "bside__heading" }, [
                h("h4", { text: item.title }),
                h("p", { class: "case__sector", text: item.sector }),
              ]),
              h("div", { class: "bside__copy" }, [
                h("p", { class: "case__summary", text: item.summary }),
                h("p", { class: "stack-line", text: item.stack }),
              ]),
              detailsButton(c, item),
            ])
          )),
        ]),
      ]),
    ]);
  }

  function renderTimeline(c) {
    return h("section", { id: "trajetoria" }, [
      h("div", { class: "section__inner wrap" }, [
        sectionHead(c.timeline.title, h("p", { class: "section__lead", text: c.timeline.text })),
        h("ol", { class: "timeline" }, c.timeline.items.map((item) =>
          h("li", { class: `timeline__item${item.current ? " timeline__item--current" : ""}` }, [
            h("span", { class: "timeline__period", text: item.period }),
            h("span", { class: "timeline__company", text: item.company }),
            h("span", { class: "timeline__role", text: item.role }),
          ])
        )),
      ]),
    ]);
  }

  function renderStack(c) {
    return h("section", { id: "cardapio", class: "section--alt" }, [
      h("div", { class: "section__inner wrap" }, [
        sectionHead(c.stack.title),
        h("div", { class: "stack-groups" }, c.stack.groups.map((group) =>
          h("div", { class: "stack-group" }, [
            h("h3", { text: group.title }),
            h("ul", {}, group.items.map((item) => h("li", { text: item }))),
          ])
        )),
      ]),
    ]);
  }

  function contactLink(label, value, href, external) {
    return h("a", { class: "contact__link", href, target: external ? "_blank" : null, rel: external ? "noreferrer" : null }, [
      h("span", { class: "contact__label", text: label }),
      h("span", { class: "contact__value", text: value }),
      icon(ICONS.external, 26, 2),
    ]);
  }

  function renderContact(c) {
    return h("section", { id: "contato", class: "contact" }, [
      laser("left: -10%; width: 120%; top: 5%; transform: rotate(-6deg)"),
      laser("left: -10%; width: 120%; top: 9%; transform: rotate(5deg)", "blue"),
      h("div", { class: "contact__inner wrap" }, [
        h("h2", { text: c.contact.title }),
        h("p", { class: "contact__text", text: c.contact.text }),
        h("p", { class: "tarja contact__status", text: c.contact.status }),
        h("div", { class: "contact__links" }, [
          contactLink(c.contact.labels.email, LINKS.email, `mailto:${LINKS.email}`, false),
          contactLink(c.contact.labels.linkedin, "/in/ligieri", LINKS.linkedin, true),
          contactLink(c.contact.labels.github, "@MatheusLigieri", LINKS.github, true),
        ]),
      ]),
    ]);
  }

  function renderFooter(c) {
    return h("footer", { class: "footer" }, [
      h("div", { class: "footer__inner wrap" }, [
        h("span", { text: c.footer[0] }),
        h("span", { text: `${c.footer[1]} | ${new Date().getFullYear()}` }),
      ]),
    ]);
  }

  // ---------- modal ----------
  function openCase(item) {
    const c = CONTENT[currentLang];
    document.getElementById("case-dialog-tag").textContent = item.sector;
    document.getElementById("case-dialog-title").textContent = item.title;
    document.getElementById("case-dialog-stack").textContent = item.stack;
    const body = document.getElementById("case-dialog-body");
    body.replaceChildren(
      ...["context", "challenge", "contribution", "result"]
        .filter((key) => item[key])
        .flatMap((key) => [h("dt", { text: c.cases.labels[key] }), h("dd", { text: item[key] })])
    );
    document.getElementById("case-dialog-close").setAttribute("aria-label", c.cases.close);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeCase() {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  document.getElementById("case-dialog-close").addEventListener("click", closeCase);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeCase();
  });

  // ---------- idioma ----------
  function applyStaticCopy(c, lang) {
    document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
    document.title = c.meta.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", c.meta.description);

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const value = get(c, el.dataset.i18n);
      if (value) el.textContent = value;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const value = get(c, el.dataset.i18nAria);
      if (value) el.setAttribute("aria-label", value);
    });
    document.querySelectorAll(".lang__btn").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
    });
  }

  function render(lang) {
    currentLang = CONTENT[lang] ? lang : DEFAULT_LANG;
    const c = CONTENT[currentLang];
    applyStaticCopy(c, currentLang);
    app.replaceChildren(
      renderHero(c),
      renderMarquee(c),
      renderCases(c),
      renderTimeline(c),
      renderStack(c),
      renderContact(c),
      renderFooter(c)
    );
  }

  document.querySelectorAll(".lang__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.lang === currentLang) return;
      saveLang(btn.dataset.lang);
      render(btn.dataset.lang);
    });
  });

  render(readLang() || DEFAULT_LANG);
})();
