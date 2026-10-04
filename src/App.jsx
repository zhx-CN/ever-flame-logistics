import { useEffect, useMemo, useRef, useState } from "react";
import { airportGroups, companyConfig, content } from "./content.js";
import { cleanPath, createSitePaths } from "./routing.js";

const { resolveRoute, pathFor, assetPath } = createSitePaths(import.meta.env.BASE_URL);

const IMAGE = {
  hero: assetPath("images/hero-air-cargo-loading.png"),
  airport: assetPath("images/airport-to-airport.png"),
  door: assetPath("images/door-to-door.png"),
  warehouse: assetPath("images/cargo-warehouse.png"),
};

const imageAlt = {
  en: {
    hero: "Secured air cargo pallets being loaded into an unbranded freighter aircraft.",
    airport: "Secured air cargo pallet beside an unbranded cargo aircraft on an airport apron.",
    door: "Unbranded box truck and secured pallets at a cargo warehouse loading bay.",
    warehouse: "Secured general-cargo pallets staged inside an air cargo warehouse.",
  },
  zh: {
    hero: "已固定的空运货盘正在装入无品牌货机。",
    airport: "机场停机坪上的空运货盘与无品牌货机。",
    door: "货运仓库装卸口的无品牌厢式货车与货盘。",
    warehouse: "空运仓库内整齐待运的普货货盘。",
  },
};

function useRoute() {
  const [route, setRoute] = useState(() => resolveRoute(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setRoute(resolveRoute(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (page, locale = route.locale) => {
    const target = pathFor(page, locale);
    if (cleanPath(window.location.pathname) !== cleanPath(target)) {
      window.history.pushState({}, "", target);
      setRoute({ page, locale });
    }
  };

  return { ...route, navigate };
}

function SiteLink({ page, locale, currentPage, currentLocale, navigate, onNavigate, children, className = "", ...rest }) {
  const targetLocale = locale || currentLocale;
  const href = pathFor(page, targetLocale);
  const active = page === currentPage && targetLocale === currentLocale;

  const onClick = (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(page, targetLocale);
    onNavigate?.();
  };

  return (
    <a href={href} onClick={onClick} className={className} aria-current={active ? "page" : undefined} {...rest}>
      {children}
    </a>
  );
}

function Header({ route }) {
  const t = content[route.locale];
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef(null);

  const closeMenus = () => {
    setOpenDropdown(null);
    setMobileOpen(false);
  };

  useEffect(() => closeMenus(), [route.page, route.locale]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) setOpenDropdown(null);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeMenus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", mobileOpen);
    return () => document.body.classList.remove("menu-open");
  }, [mobileOpen]);

  const linkProps = {
    currentPage: route.page,
    currentLocale: route.locale,
    navigate: route.navigate,
    onNavigate: closeMenus,
  };

  const dropdown = (name, label, items) => (
    <div className="nav-group">
      <button
        type="button"
        className="nav-trigger"
        aria-expanded={openDropdown === name}
        aria-controls={`${name}-menu`}
        onClick={() => setOpenDropdown((value) => (value === name ? null : name))}
      >
        {label}
      </button>
      {openDropdown === name && (
        <div className="nav-dropdown" id={`${name}-menu`} role="menu">
          {items.map(([page, itemLabel]) => (
            <SiteLink key={page} page={page} className="dropdown-link" role="menuitem" {...linkProps}>
              {itemLabel}
            </SiteLink>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <header className="site-header" ref={headerRef}>
      <a className="skip-link" href="#main-content">{route.locale === "zh" ? "跳到主要内容" : "Skip to main content"}</a>
      <div className="header-inner">
        <SiteLink page="home" className="wordmark" {...linkProps} aria-label={`${companyConfig.brand} home`}>
          {companyConfig.brand}
        </SiteLink>

        <nav className="desktop-nav" aria-label={route.locale === "zh" ? "主导航" : "Primary navigation"}>
          {dropdown("services", t.nav.services, [
            ["services", t.nav.airFreight],
            ["cargo", t.nav.capabilities],
          ])}
          {dropdown("destinations", t.nav.destinations, [
            ["india", t.nav.india],
            ["malaysia", t.nav.malaysia],
          ])}
          <SiteLink page="cargo" className="nav-link" {...linkProps}>{t.nav.cargo}</SiteLink>
          <SiteLink page="about" className="nav-link" {...linkProps}>{t.nav.about}</SiteLink>
          <SiteLink page="contact" className="nav-link" {...linkProps}>{t.nav.contact}</SiteLink>
          <SiteLink
            page={route.page === "notFound" ? "home" : route.page}
            locale={route.locale === "en" ? "zh" : "en"}
            className="language-link"
            {...linkProps}
            aria-label={route.locale === "en" ? "切换到中文" : "Switch to English"}
          >
            {t.nav.language}
          </SiteLink>
        </nav>

        <button
          type="button"
          className="mobile-menu-button"
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileOpen((value) => !value)}
        >
          {mobileOpen ? t.nav.close : t.nav.menu}
        </button>
      </div>

      {mobileOpen && (
        <nav id="mobile-navigation" className="mobile-nav" aria-label={route.locale === "zh" ? "手机导航" : "Mobile navigation"}>
          <div className="mobile-nav-group">
            <p>{t.nav.services}</p>
            <SiteLink page="services" {...linkProps}>{t.nav.airFreight}</SiteLink>
            <SiteLink page="cargo" {...linkProps}>{t.nav.capabilities}</SiteLink>
          </div>
          <div className="mobile-nav-group">
            <p>{t.nav.destinations}</p>
            <SiteLink page="india" {...linkProps}>{t.nav.india}</SiteLink>
            <SiteLink page="malaysia" {...linkProps}>{t.nav.malaysia}</SiteLink>
          </div>
          <SiteLink page="about" {...linkProps}>{t.nav.about}</SiteLink>
          <SiteLink page="contact" {...linkProps}>{t.nav.contact}</SiteLink>
          <SiteLink
            page={route.page === "notFound" ? "home" : route.page}
            locale={route.locale === "en" ? "zh" : "en"}
            {...linkProps}
          >
            {t.nav.language}
          </SiteLink>
        </nav>
      )}
    </header>
  );
}

function Reveal({ children, className = "", as: Tag = "div" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px 120px", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${visible ? "is-visible" : ""} ${className}`.trim()}>
      {children}
    </Tag>
  );
}

function ActionLink({ page, kind = "primary", route, children }) {
  return (
    <SiteLink
      page={page}
      currentPage={route.page}
      currentLocale={route.locale}
      navigate={route.navigate}
      className={`button button-${kind}`}
    >
      {children}
    </SiteLink>
  );
}

function AirportRail({ locale, detailed = false, market = "all" }) {
  const groups = market === "all" ? ["india", "malaysia"] : [market];
  return (
    <div className={`airport-rail ${detailed ? "airport-rail-detailed" : ""}`}>
      {groups.flatMap((group) => airportGroups[group]).map((airport) => (
        <div className="airport-code" key={airport.code}>
          <strong>{airport.code}</strong>
          {detailed && <span>{airport.city[locale]}</span>}
        </div>
      ))}
    </div>
  );
}

function CtaBand({ route, title, body }) {
  const t = content[route.locale];
  return (
    <Reveal as="section" className="cta-band" aria-labelledby="cta-title">
      <div>
        <h2 id="cta-title">{title}</h2>
        <p>{body}</p>
      </div>
      <ActionLink page="contact" route={route}>{t.common.primaryCta}</ActionLink>
    </Reveal>
  );
}

function HomePage({ route }) {
  const t = content[route.locale];
  const h = t.home;
  return (
    <main id="main-content">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="eyebrow">{h.eyebrow}</p>
          <h1>{h.title}</h1>
          <p className="hero-intro">{h.intro}</p>
          <div className="hero-actions">
            <ActionLink page="contact" route={route}>{t.common.primaryCta}</ActionLink>
            <ActionLink page="services" kind="secondary" route={route}>{t.common.secondaryCta}</ActionLink>
          </div>
        </div>
        <div className="home-hero-media">
          <img src={IMAGE.hero} alt={imageAlt[route.locale].hero} fetchPriority="high" />
        </div>
      </section>

      <Reveal as="section" className="route-section" aria-labelledby="route-title">
        <p className="route-statement" id="route-title">{h.statement}</p>
        <p className="section-kicker">{h.airportLabel}</p>
        <AirportRail locale={route.locale} />
      </Reveal>

      <section className="service-editorial" aria-label={route.locale === "zh" ? "主要服务" : "Core services"}>
        <Reveal className="editorial-row">
          <div className="editorial-copy">
            <p className="section-number">{h.serviceOne.number}</p>
            <h2>{h.serviceOne.title}</h2>
            <p>{h.serviceOne.body}</p>
            <SiteLink page="services" currentPage={route.page} currentLocale={route.locale} navigate={route.navigate} className="text-link">
              {t.common.learnMore}
            </SiteLink>
          </div>
          <img src={IMAGE.airport} alt={imageAlt[route.locale].airport} loading="lazy" />
        </Reveal>

        <Reveal className="editorial-row editorial-row-reverse">
          <img src={IMAGE.door} alt={imageAlt[route.locale].door} loading="lazy" />
          <div className="editorial-copy">
            <p className="section-number">{h.serviceTwo.number}</p>
            <h2>{h.serviceTwo.title}</h2>
            <p>{h.serviceTwo.body}</p>
            <SiteLink page="services" currentPage={route.page} currentLocale={route.locale} navigate={route.navigate} className="text-link">
              {t.common.learnMore}
            </SiteLink>
          </div>
        </Reveal>
      </section>

      <Reveal as="section" className="process-section" aria-labelledby="process-title">
        <p className="section-kicker" id="process-title">{h.stepsTitle}</p>
        <ol className="process-list">
          {h.steps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal as="section" className="cargo-band" aria-labelledby="cargo-band-title">
        <div>
          <h2 id="cargo-band-title">{h.cargoTitle}</h2>
          <p>{h.cargoBody}</p>
          <SiteLink page="cargo" currentPage={route.page} currentLocale={route.locale} navigate={route.navigate} className="text-link">
            {t.common.learnMore}
          </SiteLink>
        </div>
        <img src={IMAGE.warehouse} alt={imageAlt[route.locale].warehouse} loading="lazy" />
      </Reveal>

      <CtaBand route={route} title={h.ctaTitle} body={h.ctaBody} />
    </main>
  );
}

function InnerHero({ eyebrow, title, intro, image, alt, compact = false }) {
  return (
    <section className={`inner-hero ${compact ? "inner-hero-compact" : ""}`}>
      <div className="inner-hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="hero-intro">{intro}</p>
      </div>
      <img src={image} alt={alt} fetchPriority="high" />
    </section>
  );
}

function ServiceModeTabs({ locale, modes, label }) {
  const [mode, setMode] = useState("airport");
  const buttons = useRef([]);
  const order = ["airport", "door"];
  const selected = modes[mode];

  const onKeyDown = (event, index) => {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % order.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + order.length) % order.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = order.length - 1;
    else return;
    event.preventDefault();
    setMode(order[next]);
    buttons.current[next]?.focus();
  };

  return (
    <div className="service-mode">
      <div className="mode-tabs" role="tablist" aria-label={label}>
        {order.map((key, index) => (
          <button
            key={key}
            ref={(node) => { buttons.current[index] = node; }}
            type="button"
            role="tab"
            id={`tab-${key}`}
            aria-selected={mode === key}
            aria-controls={`panel-${key}`}
            tabIndex={mode === key ? 0 : -1}
            onClick={() => setMode(key)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {modes[key].label}
          </button>
        ))}
      </div>
      <div className="mode-panel" role="tabpanel" id={`panel-${mode}`} aria-labelledby={`tab-${mode}`} tabIndex="0">
        <div>
          <p className="section-number">{mode === "airport" ? "01" : "02"}</p>
          <h2>{selected.title}</h2>
          <p>{selected.body}</p>
          <ul className="check-list">
            {selected.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </div>
        <img src={mode === "airport" ? IMAGE.airport : IMAGE.door} alt={mode === "airport" ? imageAlt[locale].airport : imageAlt[locale].door} />
      </div>
    </div>
  );
}

function ServicesPage({ route }) {
  const t = content[route.locale];
  const p = t.services;
  return (
    <main id="main-content">
      <InnerHero eyebrow={p.eyebrow} title={p.title} intro={p.intro} image={IMAGE.hero} alt={imageAlt[route.locale].hero} />
      <Reveal as="section" className="page-section mode-section">
        <ServiceModeTabs locale={route.locale} modes={p.modes} label={p.modeLabel} />
      </Reveal>
      <Reveal as="section" className="page-section" aria-labelledby="chain-title">
        <div className="section-heading">
          <p className="section-kicker">{t.common.routeFocus}</p>
          <h2 id="chain-title">{p.chainTitle}</h2>
        </div>
        <ol className="service-chain">
          {p.chain.map(([title, body], index) => (
            <li key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{title}</h3><p>{body}</p></div>
            </li>
          ))}
        </ol>
      </Reveal>
      <Notice title={p.noteTitle} body={p.noteBody} />
      <CtaBand route={route} title={t.home.ctaTitle} body={t.home.ctaBody} />
    </main>
  );
}

function Notice({ title, body, tone = "light" }) {
  return (
    <Reveal as="section" className={`notice notice-${tone}`}>
      <h2>{title}</h2>
      <p>{body}</p>
    </Reveal>
  );
}

function DestinationPage({ route, market }) {
  const t = content[route.locale];
  const p = t[market];
  const isIndia = market === "india";
  return (
    <main id="main-content">
      <InnerHero
        eyebrow={p.eyebrow}
        title={p.title}
        intro={p.intro}
        image={isIndia ? IMAGE.airport : IMAGE.hero}
        alt={isIndia ? imageAlt[route.locale].airport : imageAlt[route.locale].hero}
      />
      <Reveal as="section" className="page-section airport-section" aria-labelledby={`${market}-airports`}>
        <div className="section-heading">
          <p className="section-kicker">{t.common.routeFocus}</p>
          <h2 id={`${market}-airports`}>{p.airportsTitle}</h2>
        </div>
        <AirportRail locale={route.locale} detailed market={market} />
        <p className="availability-note">{t.common.availability}</p>
      </Reveal>
      <Reveal as="section" className="destination-services" aria-labelledby={`${market}-services`}>
        <div className="destination-intro">
          <h2 id={`${market}-services`}>{p.serviceTitle}</h2>
          <p>{p.serviceBody}</p>
        </div>
        <div className="destination-items">
          {p.items.map(([title, body], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </Reveal>
      <Notice title={p.noteTitle} body={p.noteBody} tone="navy" />
      <CtaBand route={route} title={t.home.ctaTitle} body={t.home.ctaBody} />
    </main>
  );
}

function CargoPage({ route }) {
  const t = content[route.locale];
  const p = t.cargo;
  const [open, setOpen] = useState(() => new Set(["general"]));

  const toggle = (id) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <main id="main-content">
      <InnerHero eyebrow={p.eyebrow} title={p.title} intro={p.intro} image={IMAGE.warehouse} alt={imageAlt[route.locale].warehouse} />
      <Reveal as="section" className="page-section cargo-accordion-section" aria-labelledby="cargo-categories">
        <div className="section-heading">
          <p className="section-kicker">{t.common.routeFocus}</p>
          <h2 id="cargo-categories">{p.accordionLabel}</h2>
        </div>
        <div className="accordion-list">
          {p.categories.map((category, index) => {
            const expanded = open.has(category.id);
            return (
              <article className="accordion-item" key={category.id}>
                <button
                  type="button"
                  className="accordion-trigger"
                  aria-expanded={expanded}
                  aria-controls={`cargo-${category.id}`}
                  onClick={() => toggle(category.id)}
                >
                  <span className="section-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="accordion-title"><strong>{category.title}</strong><small>{category.summary}</small></span>
                  <span className="accordion-state">{expanded ? (route.locale === "zh" ? "收起说明" : "Hide details") : (route.locale === "zh" ? "展开说明" : "Show details")}</span>
                </button>
                {expanded && (
                  <div className="accordion-panel" id={`cargo-${category.id}`}>
                    <p>{category.body}</p>
                    <ul className="check-list">
                      {category.checks.map((check) => <li key={check}>{check}</li>)}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </Reveal>
      <Notice title={p.warningTitle} body={p.warningBody} tone="navy" />
      <CtaBand route={route} title={t.home.ctaTitle} body={t.home.ctaBody} />
    </main>
  );
}

function AboutPage({ route }) {
  const t = content[route.locale];
  const p = t.about;
  return (
    <main id="main-content">
      <InnerHero eyebrow={p.eyebrow} title={p.title} intro={p.intro} image={IMAGE.hero} alt={imageAlt[route.locale].hero} />
      <Reveal as="section" className="about-story" aria-labelledby="story-title">
        <p className="section-number">01</p>
        <div><h2 id="story-title">{p.storyTitle}</h2><p>{p.storyBody}</p></div>
      </Reveal>
      <Reveal as="section" className="page-section" aria-labelledby="model-title">
        <div className="section-heading"><p className="section-number">02</p><h2 id="model-title">{p.modelTitle}</h2></div>
        <div className="model-list">
          {p.modelItems.map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}
        </div>
      </Reveal>
      <Reveal as="section" className="principles" aria-labelledby="principles-title">
        <div><p className="section-number">03</p><h2 id="principles-title">{p.principlesTitle}</h2></div>
        <ol>{p.principles.map((principle, index) => <li key={principle}><span>{String(index + 1).padStart(2, "0")}</span>{principle}</li>)}</ol>
      </Reveal>
      <CtaBand route={route} title={t.home.ctaTitle} body={t.home.ctaBody} />
    </main>
  );
}

function validateField(name, value, t) {
  const required = ["name", "email", "origin", "destination", "message"];
  if (required.includes(name) && !value.trim()) return t.required;
  if (name === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t.invalidEmail;
  if (name === "contact" && value && !/^[A-Za-z0-9+\-_.@\s]{5,}$/.test(value)) return t.invalidContact;
  return "";
}

function ContactForm({ locale, copy }) {
  const initialValues = { name: "", company: "", email: "", contact: "", origin: "", destination: "", message: "" };
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const successRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);
  useEffect(() => { if (status === "success") successRef.current?.focus(); }, [status]);

  const updateError = (name, value) => {
    const error = validateField(name, value, copy);
    setErrors((current) => ({ ...current, [name]: error }));
    return error;
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (touched[name]) updateError(name, value);
  };

  const onBlur = (event) => {
    const { name, value } = event.target;
    setTouched((current) => ({ ...current, [name]: true }));
    updateError(name, value);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const nextTouched = Object.fromEntries(Object.keys(values).map((key) => [key, true]));
    const nextErrors = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, validateField(key, value, copy)]));
    setTouched(nextTouched);
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors).find((key) => nextErrors[key]);
    if (firstInvalid) {
      document.querySelector(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    setStatus("submitting");
    timerRef.current = window.setTimeout(() => setStatus("success"), 700);
  };

  if (status === "success") {
    return (
      <div className="form-success" role="status" tabIndex="-1" ref={successRef}>
        <p className="section-number">01</p>
        <h2>{copy.successTitle}</h2>
        <p>{copy.successBody}</p>
        <button type="button" className="button button-secondary" onClick={() => { setValues(initialValues); setTouched({}); setErrors({}); setStatus("idle"); }}>
          {copy.another}
        </button>
      </div>
    );
  }

  const fields = ["name", "company", "email", "contact", "origin", "destination"];
  return (
    <form className="contact-form" noValidate onSubmit={onSubmit}>
      <div className="form-grid">
        {fields.map((name) => {
          const [label, placeholder] = copy.fields[name];
          const invalid = Boolean(touched[name] && errors[name]);
          return (
            <div className="field" key={name}>
              <label htmlFor={name}>{label}{["name", "email", "origin", "destination"].includes(name) && <span aria-hidden="true"> *</span>}</label>
              <input
                id={name}
                name={name}
                type={name === "email" ? "email" : "text"}
                value={values[name]}
                placeholder={placeholder}
                autoComplete={name === "name" ? "name" : name === "company" ? "organization" : name === "email" ? "email" : "off"}
                aria-invalid={invalid}
                aria-describedby={invalid ? `${name}-error` : undefined}
                onChange={onChange}
                onBlur={onBlur}
              />
              {invalid && <p className="field-error" id={`${name}-error`}>{errors[name]}</p>}
            </div>
          );
        })}
        <div className="field field-full">
          <label htmlFor="message">{copy.fields.message[0]}<span aria-hidden="true"> *</span></label>
          <textarea
            id="message"
            name="message"
            rows="6"
            value={values.message}
            placeholder={copy.fields.message[1]}
            aria-invalid={Boolean(touched.message && errors.message)}
            aria-describedby={touched.message && errors.message ? "message-error" : undefined}
            onChange={onChange}
            onBlur={onBlur}
          />
          {touched.message && errors.message && <p className="field-error" id="message-error">{errors.message}</p>}
        </div>
      </div>
      <p className="form-demo-note">{locale === "zh" ? "带 * 的字段为必填。" : "Fields marked * are required."}</p>
      <button className="button button-primary" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}

function ContactPage({ route }) {
  const t = content[route.locale];
  const p = t.contact;
  const hasDirectChannels = Object.values(companyConfig.contact).some(Boolean);
  return (
    <main id="main-content">
      <section className="contact-hero">
        <div><p className="eyebrow">{p.eyebrow}</p><h1>{p.title}</h1><p className="hero-intro">{p.intro}</p></div>
        <img src={IMAGE.hero} alt={imageAlt[route.locale].hero} fetchPriority="high" />
      </section>
      <Reveal as="section" className="contact-layout">
        <aside className="contact-aside">
          <p className="section-number">01</p>
          <h2>{p.channelTitle}</h2>
          {!hasDirectChannels && <p>{p.channelUnavailable}</p>}
          <p className="prototype-label">{t.common.demo}</p>
        </aside>
        <div className="form-shell">
          <p className="section-number">02</p>
          <h2>{p.formTitle}</h2>
          <ContactForm locale={route.locale} copy={p} />
        </div>
      </Reveal>
    </main>
  );
}

function PrivacyPage({ route }) {
  const t = content[route.locale];
  const p = t.privacyPage;
  return (
    <main id="main-content">
      <section className="legal-hero"><p className="eyebrow">{p.eyebrow}</p><h1>{p.title}</h1><p className="hero-intro">{p.intro}</p></section>
      <section className="legal-content">
        {p.sections.map(([title, body], index) => (
          <Reveal as="article" key={title}>
            <span className="section-number">{String(index + 1).padStart(2, "0")}</span>
            <div><h2>{title}</h2><p>{body}</p></div>
          </Reveal>
        ))}
      </section>
    </main>
  );
}

function NotFoundPage({ route }) {
  const zh = route.locale === "zh";
  return (
    <main id="main-content" className="not-found">
      <p className="eyebrow">404</p>
      <h1>{zh ? "页面不存在" : "Page not found"}</h1>
      <p>{zh ? "请返回首页继续浏览服务。" : "Return to the homepage to continue exploring our services."}</p>
      <ActionLink page="home" route={route}>{zh ? "返回首页" : "Return home"}</ActionLink>
    </main>
  );
}

function Footer({ route }) {
  const t = content[route.locale];
  const linkProps = { currentPage: route.page, currentLocale: route.locale, navigate: route.navigate };
  return (
    <footer className="site-footer">
      <div className="footer-primary">
        <div><strong className="wordmark">{companyConfig.brand}</strong><p>{t.common.footerNote}</p></div>
        <nav aria-label={route.locale === "zh" ? "页脚导航" : "Footer navigation"}>
          <SiteLink page="services" {...linkProps}>{t.nav.services}</SiteLink>
          <SiteLink page="india" {...linkProps}>{t.common.india}</SiteLink>
          <SiteLink page="malaysia" {...linkProps}>{t.common.malaysia}</SiteLink>
          <SiteLink page="cargo" {...linkProps}>{t.nav.cargo}</SiteLink>
          <SiteLink page="about" {...linkProps}>{t.nav.about}</SiteLink>
          <SiteLink page="contact" {...linkProps}>{t.nav.contact}</SiteLink>
        </nav>
      </div>
      <div className="footer-legal">
        <span>{route.locale === "zh" ? companyConfig.legalNameZh : companyConfig.legalNameEn}</span>
        <SiteLink page="privacy" {...linkProps}>{t.common.privacy}</SiteLink>
      </div>
    </footer>
  );
}

function RouteView({ route }) {
  switch (route.page) {
    case "home": return <HomePage route={route} />;
    case "services": return <ServicesPage route={route} />;
    case "india": return <DestinationPage route={route} market="india" />;
    case "malaysia": return <DestinationPage route={route} market="malaysia" />;
    case "cargo": return <CargoPage route={route} />;
    case "about": return <AboutPage route={route} />;
    case "contact": return <ContactPage route={route} />;
    case "privacy": return <PrivacyPage route={route} />;
    default: return <NotFoundPage route={route} />;
  }
}

export function App() {
  const route = useRoute();
  const t = content[route.locale];
  const seo = useMemo(() => t.seo[route.page] || [companyConfig.brand, t.common.footerNote], [route.page, t]);

  useEffect(() => {
    document.documentElement.lang = route.locale === "zh" ? "zh-CN" : "en";
    document.title = seo[0];
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", seo[1]);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [route.page, route.locale, seo]);

  return (
    <div className="app-shell">
      <Header route={route} />
      <RouteView route={route} />
      <Footer route={route} />
    </div>
  );
}
