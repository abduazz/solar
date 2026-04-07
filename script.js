let TRANSLATIONS = {};
const FALLBACK_LANG = "ru";

async function loadTranslations() {
  try {
    const response = await fetch("./translations.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load translations: ${response.status}`);
    }
    TRANSLATIONS = await response.json();
  } catch (error) {
    console.error(error);
    TRANSLATIONS = {};
  }
}

const burger = document.querySelector(".hc-burger");
const nav = document.querySelector(".hc-nav");
const langSwitch = document.getElementById("langSwitch");
let currentLang = localStorage.getItem("hcLang") || "ru";

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function setAttr(selector, attrs) {
  const el = document.querySelector(selector);
  if (!el) return;
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
}

function setSelectOptions(selector, values) {
  const select = document.querySelector(selector);
  if (!select || !values || values.length === 0) return;
  const current = select.value;
  select.innerHTML = "";
  values.forEach((item, index) => {
    const option = document.createElement("option");
    option.textContent = item;
    option.value = index === 0 ? "" : item;
    select.appendChild(option);
  });
  select.value = current;
}

function setLabelText(selector, text) {
  const label = document.querySelector(selector);
  if (!label) return;
  const control = label.querySelector("input, select, textarea");
  if (!control) {
    label.textContent = text;
    return;
  }
  label.innerHTML = "";
  label.append(text);
  label.append(document.createTextNode("\n              "));
  label.append(control);
}

function applyLanguage(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS[FALLBACK_LANG];
  if (!t) return;
  currentLang = lang;
  localStorage.setItem("hcLang", lang);
  document.documentElement.lang = lang;
  document.title = t.title;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) metaDescription.setAttribute("content", t.description);

  if (burger) burger.setAttribute("aria-label", t.burgerAria);
  if (nav) nav.setAttribute("aria-label", t.navAria);
  if (langSwitch) langSwitch.setAttribute("aria-label", t.langAria);

  Object.entries(t.text).forEach(([selector, value]) => setText(selector, value));
  Object.entries(t.attr).forEach(([selector, attrs]) => setAttr(selector, attrs));
  Object.entries(t.labels || {}).forEach(([selector, value]) => setLabelText(selector, value));
  Object.entries(t.options).forEach(([selector, values]) => setSelectOptions(selector, values));

  const statusEls = [document.getElementById("quickStatus"), document.getElementById("formStatus")];
  statusEls.forEach((el) => {
    if (el) el.textContent = "";
  });
}

if (burger && nav) {
  burger.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("hc-nav--open");
    burger.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 720) {
        nav.classList.remove("hc-nav--open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const targetId = link.getAttribute("href");
    if (!targetId || targetId === "#") return;
    const target = document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

function t(key) {
  const fallback = TRANSLATIONS[FALLBACK_LANG] || {};
  const active = TRANSLATIONS[currentLang] || fallback;
  return active[key] || fallback[key] || "";
}

function handleSimpleForm(formId, statusId) {
  const form = document.getElementById(formId);
  const status = document.getElementById(statusId);
  if (!form || !status) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const objectType = String(formData.get("objectType") || "").trim();
    const phonePattern = /^[+0-9()\-\s]{7,}$/;

    if (!phone) {
      status.textContent = t("phoneRequired");
      return;
    }
    if (!phonePattern.test(phone)) {
      status.textContent = t("phoneInvalid");
      return;
    }
    if (formId === "contactForm" && (!name || !objectType)) {
      status.textContent = t("requiredFields");
      return;
    }

    status.textContent = t("submitSuccess");
    form.reset();
  });
}

handleSimpleForm("quickForm", "quickStatus");
handleSimpleForm("contactForm", "formStatus");

const revealItems = document.querySelectorAll(".hc-section, .hc-card, .hc-steps li, .hc-hero-panel");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealItems.forEach((el) => {
  el.classList.add("will-reveal");
  observer.observe(el);
});

async function init() {
  await loadTranslations();
  if (!TRANSLATIONS[FALLBACK_LANG]) return;

  if (langSwitch) {
    if (!TRANSLATIONS[currentLang]) currentLang = FALLBACK_LANG;
    langSwitch.value = currentLang;
    langSwitch.addEventListener("change", (event) => {
      const nextLang = event.target.value;
      applyLanguage(nextLang);
    });
  }

  applyLanguage(currentLang);
}

init();
