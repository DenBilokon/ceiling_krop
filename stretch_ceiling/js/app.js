(function () {
  const storeKey = "stretchCeilingSiteData";
  const langKey = "stretchCeilingLang";
  const defaults = window.ceilingDefaults;
  let serverData = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadData() {
    if (serverData) return clone(serverData);
    const saved = localStorage.getItem(storeKey);
    if (!saved) return clone(defaults);
    try {
      const data = Object.assign(clone(defaults), JSON.parse(saved));
      migrateImages(data);
      return data;
    } catch (error) {
      return clone(defaults);
    }
  }

  function migrateImages(data) {
    const oldImages = new Set([
      "assets/hero-ceiling.svg",
      "assets/work-matte.svg",
      "assets/work-shadow.svg",
      "assets/work-light.svg",
      "assets/work-demount.svg"
    ]);

    if (oldImages.has(data.heroImage)) data.heroImage = defaults.heroImage;

    ["services", "works"].forEach((group) => {
      data[group].forEach((item, index) => {
        if (oldImages.has(item.image) && defaults[group][index]) {
          item.image = defaults[group][index].image;
        }
      });
    });
  }

  function saveData(data) {
    const next = clone(data);
    migrateImages(next);
    serverData = next;
    localStorage.setItem(storeKey, JSON.stringify(data));
    return fetch(apiUrl("site-content"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: next })
    }).catch((error) => {
      console.warn("Site content was saved locally only.", error);
      return { ok: false };
    });
  }

  function loadServerData() {
    return fetch(apiUrl("site-content"))
      .then((response) => {
        if (!response.ok) throw new Error("Content API unavailable");
        return response.json();
      })
      .then((result) => {
        if (!result.content) return;
        const next = Object.assign(clone(defaults), result.content);
        migrateImages(next);
        serverData = next;
        localStorage.setItem(storeKey, JSON.stringify(next));
      })
      .catch(() => {});
  }

  function lang() {
    return localStorage.getItem(langKey) || "uk";
  }

  function setLang(next) {
    localStorage.setItem(langKey, next);
    document.documentElement.lang = next === "uk" ? "uk" : "ru";
    render();
  }

  const copy = {
    uk: {
      navHome: "Головна",
      navServices: "Послуги",
      navPrices: "Ціни",
      navPortfolio: "Роботи",
      navContacts: "Контакти",
      call: "Замовити замір",
      heroEyebrow: "Монтаж і демонтаж натяжних стель",
      heroTitle: "Натяжні стелі під ключ у Кропивницькому",
      heroLead: "Рівні матові, тіньові та світлові стелі для квартир, будинків і комерційних приміщень. Виїзд на замір, чесний прорахунок і акуратний монтаж.",
      portfolio: "Переглянути роботи",
      fact1: "1 день",
      fact1Text: "монтаж типової кімнати",
      fact2: "4 см",
      fact2Text: "середня втрата висоти",
      fact3: "Мінімум пилу",
      fact3Text: "акуратна робота",
      benefitsTitle: "Що важливо в роботі",
      benefitsLead: "Сайт побудований навколо практичних причин, через які клієнти обирають натяжні стелі: швидкість, чистота, світло і передбачуваний результат.",
      servicesTitle: "Послуги",
      servicesLead: "Базові рішення можна комбінувати: класична стеля, тіньовий профіль, світлові лінії, трекові системи та демонтаж.",
      pricesTitle: "Орієнтовні ціни",
      pricesLead: "Фінальний кошторис формується після заміру з урахуванням площі, профілю, освітлення та складності монтажу.",
      worksTitle: "Приклади робіт",
      worksLead: "Добірка прикладів для натхнення: класичні, тіньові та світлові рішення для різних приміщень.",
      stepsTitle: "Як проходить замовлення",
      reviewsTitle: "Відгуки",
      faqTitle: "Питання",
      contactsTitle: "Почнемо з безкоштовної консультації",
      contactsLead: "Телефонуйте або пишіть у Viber/Telegram: 095 194 08 27. Додатковий номер: 068 001 63 91.",
      name: "Ім'я",
      phone: "Телефон",
      message: "Що потрібно зробити",
      send: "Надіслати заявку",
      sent: "Заявку збережено. Для публічного сайту підключимо відправку в Telegram або CRM.",
      brandTag: "Кропивницький",
      footer: "Натяжні стелі KROP. Монтаж, демонтаж, ремонт."
    },
    ru: {
      navHome: "Главная",
      navServices: "Услуги",
      navPrices: "Цены",
      navPortfolio: "Работы",
      navContacts: "Контакты",
      call: "Заказать замер",
      heroEyebrow: "Монтаж и демонтаж натяжных потолков",
      heroTitle: "Натяжные потолки под ключ в Кропивницком",
      heroLead: "Ровные матовые, теневые и световые потолки для квартир, домов и коммерческих помещений. Выезд на замер, честный расчет и аккуратный монтаж.",
      portfolio: "Посмотреть работы",
      fact1: "1 день",
      fact1Text: "монтаж типовой комнаты",
      fact2: "4 см",
      fact2Text: "средняя потеря высоты",
      fact3: "Минимум пыли",
      fact3Text: "аккуратная работа",
      benefitsTitle: "Что важно в работе",
      benefitsLead: "Сайт построен вокруг практичных причин, по которым клиенты выбирают натяжные потолки: скорость, чистота, свет и предсказуемый результат.",
      servicesTitle: "Услуги",
      servicesLead: "Базовые решения можно комбинировать: классический потолок, теневой профиль, световые линии, трековые системы и демонтаж.",
      pricesTitle: "Ориентировочные цены",
      pricesLead: "Финальная смета формируется после замера с учетом площади, профиля, освещения и сложности монтажа.",
      worksTitle: "Примеры работ",
      worksLead: "Подборка примеров для вдохновения: классические, теневые и световые решения для разных помещений.",
      stepsTitle: "Как проходит заказ",
      reviewsTitle: "Отзывы",
      faqTitle: "Вопросы",
      contactsTitle: "Начнем с бесплатной консультации",
      contactsLead: "Звоните или пишите в Viber/Telegram: 095 194 08 27. Дополнительный номер: 068 001 63 91.",
      name: "Имя",
      phone: "Телефон",
      message: "Что нужно сделать",
      send: "Отправить заявку",
      sent: "Заявка сохранена. Для публичного сайта подключим отправку в Telegram или CRM.",
      brandTag: "Кропивницкий",
      footer: "Натяжные потолки KROP. Монтаж, демонтаж, ремонт."
    }
  };

  const benefits = {
    uk: [
      ["Акуратність", "Працюємо так, щоб після монтажу не залишались пил, обрізки та зайві сліди ремонту."],
      ["Чесний прорахунок", "Пояснюємо, що входить у ціну: полотно, профіль, кути, освітлення, складність монтажу."],
      ["Світло під ключ", "Готуємо закладні, допомагаємо зі схемою світильників і монтуємо сучасні LED-рішення."],
      ["Демонтаж без хаосу", "Знімаємо полотно для доступу до проводки, труб або ремонту та повертаємо стелю на місце."]
    ],
    ru: [
      ["Аккуратность", "Работаем так, чтобы после монтажа не оставались пыль, обрезки и лишние следы ремонта."],
      ["Честный расчет", "Объясняем, что входит в цену: полотно, профиль, углы, освещение, сложность монтажа."],
      ["Свет под ключ", "Готовим закладные, помогаем со схемой светильников и монтируем современные LED-решения."],
      ["Демонтаж без хаоса", "Снимаем полотно для доступа к проводке, трубам или ремонту и возвращаем потолок на место."]
    ]
  };

  const steps = {
    uk: [
      ["Заявка", "Клієнт залишає контакт або пише у Facebook/Telegram."],
      ["Заміри", "Уточнюємо площу, кути, профіль, освітлення та побажання."],
      ["Кошторис", "Фіксуємо матеріали, вартість, строки та дату монтажу."],
      ["Монтаж", "Встановлюємо профіль, полотно, світильники й здаємо чистий результат."]
    ],
    ru: [
      ["Заявка", "Клиент оставляет контакт или пишет в Facebook/Telegram."],
      ["Замеры", "Уточняем площадь, углы, профиль, освещение и пожелания."],
      ["Смета", "Фиксируем материалы, стоимость, сроки и дату монтажа."],
      ["Монтаж", "Устанавливаем профиль, полотно, светильники и сдаем чистый результат."]
    ]
  };

  function t(key) {
    return copy[lang()][key] || key;
  }

  function local(item, field) {
    const current = lang();
    return item[current] && item[current][field] ? item[current][field] : "";
  }

  function renderText() {
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll("[data-placeholder]").forEach((node) => {
      node.placeholder = t(node.dataset.placeholder);
    });
    document.querySelectorAll("[data-lang]").forEach((node) => {
      node.classList.toggle("active", node.dataset.lang === lang());
    });
  }

  function renderServices(data) {
    const target = document.querySelector("[data-render='services']");
    if (!target) return;
    target.innerHTML = data.services.map((service) => `
      <article class="card service-card">
        <div class="service-card__image"><img src="${service.image}" alt="${local(service, "title")}"></div>
        <div>
          <h3>${local(service, "title")}</h3>
          <p>${local(service, "text")}</p>
        </div>
      </article>
    `).join("");
  }

  function renderPrices(data) {
    const target = document.querySelector("[data-render='prices']");
    if (!target) return;
    target.innerHTML = data.prices.map((price) => `
      <div class="price">
        <div>
          <h3>${local(price, "title")}</h3>
          <p>${local(price, "note")}</p>
        </div>
        <strong>${price.value}</strong>
      </div>
    `).join("");
  }

  function renderWorks(data) {
    const target = document.querySelector("[data-render='works']");
    if (!target) return;
    target.innerHTML = data.works.map((work) => `
      <article class="card work-card">
        <div class="work-card__image"><img src="${work.image}" alt="${local(work, "title")}"></div>
        <div class="work-card__body">
          <h3>${local(work, "title")}</h3>
          <div class="meta">${local(work, "meta")}</div>
        </div>
      </article>
    `).join("");
  }

  function renderReviews(data) {
    const target = document.querySelector("[data-render='reviews']");
    if (!target) return;
    target.innerHTML = data.reviews.map((review) => `
      <article class="card testimonial">
        <p class="quote">“${review[lang()]}”</p>
        <strong>${review.name}</strong>
      </article>
    `).join("");
  }

  function renderFaq(data) {
    const target = document.querySelector("[data-render='faq']");
    if (!target) return;
    target.innerHTML = data.faq.map((item) => `
      <details>
        <summary>${item[lang()].q}</summary>
        <p>${item[lang()].a}</p>
      </details>
    `).join("");
  }

  function renderBenefits() {
    const target = document.querySelector("[data-render='benefits']");
    if (!target) return;
    target.innerHTML = benefits[lang()].map(([title, text]) => `
      <article class="card">
        <h3>${title}</h3>
        <p>${text}</p>
      </article>
    `).join("");
  }

  function renderSteps() {
    const target = document.querySelector("[data-render='steps']");
    if (!target) return;
    target.innerHTML = steps[lang()].map(([title, text]) => `
      <article class="card step">
        <h3>${title}</h3>
        <p>${text}</p>
      </article>
    `).join("");
  }

  function renderContact(data) {
    function telegramUrl(value) {
      const raw = String(value || "").trim();
      if (!raw || raw === "#") return "#";
      if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
      const handle = raw.replace(/^@/, "");
      return `https://t.me/${handle}`;
    }

    document.querySelectorAll("[data-contact='phone']").forEach((node) => {
      node.textContent = data.contact.phone;
      node.href = "tel:+380951940827";
    });
    document.querySelectorAll("[data-contact='facebook']").forEach((node) => {
      node.href = data.contact.facebook;
    });
    document.querySelectorAll("[data-contact='telegram']").forEach((node) => {
      node.href = telegramUrl(data.contact.telegram);
    });
    document.querySelectorAll("[data-contact='email']").forEach((node) => {
      node.textContent = data.contact.email;
      node.href = `mailto:${data.contact.email}`;
    });
    document.querySelectorAll("[data-contact='city']").forEach((node) => {
      node.textContent = lang() === "uk" ? data.contact.cityUk : data.contact.cityRu;
    });
    document.querySelectorAll("[data-hero-image]").forEach((img) => {
      img.src = data.heroImage;
    });
  }

  function render() {
    const data = loadData();
    renderText();
    renderContact(data);
    renderBenefits();
    renderServices(data);
    renderPrices(data);
    renderWorks(data);
    renderReviews(data);
    renderFaq(data);
    renderSteps();
  }

  function toast(message) {
    const node = document.querySelector(".toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("show");
    window.setTimeout(() => node.classList.remove("show"), 3200);
  }

  function apiUrl(name) {
    const local = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
    if (local) {
      return {
        "submit-lead": "/api/leads",
        "site-content": "/api/site-content"
      }[name];
    }
    return `/.netlify/functions/${name}`;
  }

  document.addEventListener("click", (event) => {
    const langButton = event.target.closest("[data-lang]");
    if (langButton) setLang(langButton.dataset.lang);

    const navToggle = event.target.closest("[data-nav-toggle]");
    if (navToggle) document.querySelector(".nav")?.classList.toggle("open");
  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-lead-form]");
    if (!form) return;
    event.preventDefault();
    const lead = {
      name: form.name.value,
      phone: form.phone.value,
      message: form.message.value
    };

    fetch(apiUrl("submit-lead"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead)
    })
      .then((response) => {
        if (!response.ok) throw new Error("Lead was not saved");
        form.reset();
        toast(t("sent"));
      })
      .catch(() => {
        const leads = JSON.parse(localStorage.getItem("stretchCeilingLeads") || "[]");
        leads.push({ ...lead, createdAt: new Date().toISOString() });
        localStorage.setItem("stretchCeilingLeads", JSON.stringify(leads));
        form.reset();
        toast(t("sent"));
      });
  });

  window.ceilingApp = { loadData, saveData, render, storeKey, lang, t };
  document.documentElement.lang = lang() === "uk" ? "uk" : "ru";
  document.addEventListener("DOMContentLoaded", () => {
    render();
    loadServerData().then(render);
  });
})();
