(function () {
  function data() {
    return window.ceilingApp.loadData();
  }

  function save(next) {
    window.ceilingApp.saveData(next);
    window.ceilingApp.render();
    toast("Зміни збережено");
  }

  function toast(message) {
    const node = document.querySelector(".toast");
    node.textContent = message;
    node.classList.add("show");
    window.setTimeout(() => node.classList.remove("show"), 2600);
  }

  async function requireAuth() {
    const login = document.querySelector("[data-admin-login]");
    const app = document.querySelector("[data-admin-app]");
    let isAuthed = false;
    try {
      const response = await fetch("/api/session");
      const result = await response.json();
      isAuthed = Boolean(result.authenticated);
    } catch (error) {
      isAuthed = false;
    }
    login.hidden = isAuthed;
    app.hidden = !isAuthed;
    if (isAuthed) renderAdmin();
  }

  function fields(prefix, entity) {
    return `
      <div class="grid grid--2">
        <div class="field"><label>Назва UA</label><input name="${prefix}TitleUk" value="${entity.uk?.title || ""}"></div>
        <div class="field"><label>Название RU</label><input name="${prefix}TitleRu" value="${entity.ru?.title || ""}"></div>
      </div>
      <div class="grid grid--2">
        <div class="field"><label>Опис UA</label><textarea name="${prefix}TextUk">${entity.uk?.text || entity.uk?.note || entity.uk?.meta || ""}</textarea></div>
        <div class="field"><label>Описание RU</label><textarea name="${prefix}TextRu">${entity.ru?.text || entity.ru?.note || entity.ru?.meta || ""}</textarea></div>
      </div>
    `;
  }

  function imageName(entity) {
    if (entity.imageName) return entity.imageName;
    if (!entity.image) return "файл ще не обрано";
    if (entity.image.startsWith("data:")) return "завантажене фото";
    return entity.image.split("/").pop() || "завантажене фото";
  }

  function imageField(entity) {
    return `
      <div class="field">
        <label>Фото</label>
        <div class="meta">Поточний файл: ${imageName(entity)}</div>
        <input type="file" name="image" accept="image/*">
      </div>
    `;
  }

  function renderContact() {
    const next = data();
    const node = document.querySelector("[data-admin-panel='contact']");
    node.innerHTML = `
      <h2>Контакти</h2>
      <form class="admin-list" data-contact-form>
        <div class="grid grid--2">
          <div class="field"><label>Телефон</label><input name="phone" value="${next.contact.phone}"></div>
          <div class="field"><label>Email</label><input name="email" value="${next.contact.email}"></div>
        </div>
        <div class="grid grid--2">
          <div class="field"><label>Місто UA</label><input name="cityUk" value="${next.contact.cityUk}"></div>
          <div class="field"><label>Город RU</label><input name="cityRu" value="${next.contact.cityRu}"></div>
        </div>
        <div class="grid grid--2">
          <div class="field"><label>Facebook</label><input name="facebook" value="${next.contact.facebook}"></div>
          <div class="field"><label>Telegram</label><input name="telegram" value="${next.contact.telegram}"></div>
        </div>
        <button class="btn" type="submit">Зберегти контакти</button>
      </form>
    `;
  }

  function renderPrices() {
    const next = data();
    const node = document.querySelector("[data-admin-panel='prices']");
    node.innerHTML = `
      <h2>Ціни</h2>
      <div class="admin-list">
        ${next.prices.map((price, index) => `
          <form class="admin-item" data-price-form="${index}">
            ${fields("price", price)}
            <div class="field"><label>Ціна</label><input name="value" value="${price.value}"></div>
            <button class="btn" type="submit">Зберегти</button>
          </form>
        `).join("")}
      </div>
    `;
  }

  function renderServices() {
    const next = data();
    const node = document.querySelector("[data-admin-panel='services']");
    node.innerHTML = `
      <h2>Послуги</h2>
      <div class="admin-list">
        ${next.services.map((service, index) => `
          <form class="admin-item" data-service-form="${index}">
            ${fields("service", service)}
            ${imageField(service)}
            <button class="btn" type="submit">Зберегти</button>
          </form>
        `).join("")}
      </div>
    `;
  }

  function renderWorks() {
    const next = data();
    const node = document.querySelector("[data-admin-panel='works']");
    node.innerHTML = `
      <h2>Роботи</h2>
      <form class="admin-item" data-work-add>
        <h3>Додати роботу</h3>
        <div class="grid grid--2">
          <div class="field"><label>Назва UA</label><input name="titleUk" required></div>
          <div class="field"><label>Название RU</label><input name="titleRu" required></div>
        </div>
        <div class="grid grid--2">
          <div class="field"><label>Опис UA</label><input name="metaUk"></div>
          <div class="field"><label>Описание RU</label><input name="metaRu"></div>
        </div>
        <div class="field">
          <label>Фото</label>
          <div class="meta">Поточний файл: файл ще не обрано</div>
          <input type="file" name="image" accept="image/*">
        </div>
        <button class="btn" type="submit">Додати</button>
      </form>
      <div class="admin-list">
        ${next.works.map((work, index) => `
          <form class="admin-item" data-work-form="${index}">
            ${fields("work", work)}
            ${imageField(work)}
            <div class="grid grid--2">
              <button class="btn" type="submit">Зберегти</button>
              <button class="btn btn--ghost" type="button" data-delete-work="${index}">Видалити</button>
            </div>
          </form>
        `).join("")}
      </div>
    `;
  }

  function renderReviews() {
    const next = data();
    const node = document.querySelector("[data-admin-panel='reviews']");
    node.innerHTML = `
      <h2>Відгуки</h2>
      <form class="admin-item" data-review-add>
        <h3>Додати відгук</h3>
        <div class="field"><label>Ім'я</label><input name="name" required></div>
        <div class="grid grid--2">
          <div class="field"><label>Текст UA</label><textarea name="uk" required></textarea></div>
          <div class="field"><label>Текст RU</label><textarea name="ru" required></textarea></div>
        </div>
        <button class="btn" type="submit">Додати</button>
      </form>
      <div class="admin-list">
        ${next.reviews.map((review, index) => `
          <form class="admin-item" data-review-form="${index}">
            <div class="field"><label>Ім'я</label><input name="name" value="${review.name}"></div>
            <div class="grid grid--2">
              <div class="field"><label>Текст UA</label><textarea name="uk">${review.uk}</textarea></div>
              <div class="field"><label>Текст RU</label><textarea name="ru">${review.ru}</textarea></div>
            </div>
            <div class="grid grid--2">
              <button class="btn" type="submit">Зберегти</button>
              <button class="btn btn--ghost" type="button" data-delete-review="${index}">Видалити</button>
            </div>
          </form>
        `).join("")}
      </div>
    `;
  }

  function renderLeads() {
    const node = document.querySelector("[data-admin-panel='leads']");
    node.innerHTML = `
      <h2>Заявки</h2>
      <div class="admin-list"><p>Завантаження заявок...</p></div>
    `;

    fetch("/api/leads")
      .then((response) => {
        if (!response.ok) throw new Error("Unauthorized");
        return response.json();
      })
      .then((result) => {
        const leads = result.leads || [];
        const list = node.querySelector(".admin-list");
        list.innerHTML = leads.length ? leads.map((lead) => `
          <div class="admin-item">
            <strong>${lead.name} · ${lead.phone}</strong>
            <p>${lead.message || ""}</p>
            <span class="meta">${new Date(`${lead.created_at}Z`).toLocaleString()}</span>
            <button class="btn btn--ghost" type="button" data-delete-lead="${lead.id}">Видалити</button>
          </div>
        `).join("") : "<p>Поки заявок немає.</p>";
      })
      .catch(() => {
        node.querySelector(".admin-list").innerHTML = "<p>Не вдалося завантажити заявки. Увійдіть ще раз.</p>";
      });
  }

  function renderAdmin() {
    renderContact();
    renderPrices();
    renderServices();
    renderWorks();
    renderReviews();
    renderLeads();
  }

  function fileToDataUrl(file) {
    return new Promise((resolve) => {
      if (!file) resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  document.addEventListener("submit", async (event) => {
    const login = event.target.closest("[data-admin-login] form");
    if (login) {
      event.preventDefault();
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: login.password.value })
      });
      if (response.ok) {
        requireAuth();
      } else {
        toast("Невірний пароль");
      }
      return;
    }

    const contact = event.target.closest("[data-contact-form]");
    if (contact) {
      event.preventDefault();
      const next = data();
      next.contact = {
        phone: contact.phone.value,
        email: contact.email.value,
        cityUk: contact.cityUk.value,
        cityRu: contact.cityRu.value,
        facebook: contact.facebook.value,
        telegram: contact.telegram.value
      };
      save(next);
      return;
    }

    const priceForm = event.target.closest("[data-price-form]");
    if (priceForm) {
      event.preventDefault();
      const next = data();
      const item = next.prices[Number(priceForm.dataset.priceForm)];
      item.uk.title = priceForm.priceTitleUk.value;
      item.ru.title = priceForm.priceTitleRu.value;
      item.uk.note = priceForm.priceTextUk.value;
      item.ru.note = priceForm.priceTextRu.value;
      item.value = priceForm.value.value;
      save(next);
      return;
    }

    const serviceForm = event.target.closest("[data-service-form]");
    if (serviceForm) {
      event.preventDefault();
      const next = data();
      const item = next.services[Number(serviceForm.dataset.serviceForm)];
      item.uk.title = serviceForm.serviceTitleUk.value;
      item.ru.title = serviceForm.serviceTitleRu.value;
      item.uk.text = serviceForm.serviceTextUk.value;
      item.ru.text = serviceForm.serviceTextRu.value;
      const image = await fileToDataUrl(serviceForm.image.files[0]);
      if (image) {
        item.image = image;
        item.imageName = serviceForm.image.files[0].name;
      }
      save(next);
      renderServices();
      return;
    }

    const workAdd = event.target.closest("[data-work-add]");
    if (workAdd) {
      event.preventDefault();
      const next = data();
      const image = await fileToDataUrl(workAdd.image.files[0]);
      next.works.unshift({
        id: `work-${Date.now()}`,
        image: image || "assets/photos/matte-living.jpg",
        imageName: workAdd.image.files[0]?.name || "matte-living.jpg",
        uk: { title: workAdd.titleUk.value, meta: workAdd.metaUk.value },
        ru: { title: workAdd.titleRu.value, meta: workAdd.metaRu.value }
      });
      save(next);
      renderWorks();
      return;
    }

    const workForm = event.target.closest("[data-work-form]");
    if (workForm) {
      event.preventDefault();
      const next = data();
      const item = next.works[Number(workForm.dataset.workForm)];
      item.uk.title = workForm.workTitleUk.value;
      item.ru.title = workForm.workTitleRu.value;
      item.uk.meta = workForm.workTextUk.value;
      item.ru.meta = workForm.workTextRu.value;
      const image = await fileToDataUrl(workForm.image.files[0]);
      if (image) {
        item.image = image;
        item.imageName = workForm.image.files[0].name;
      }
      save(next);
      renderWorks();
      return;
    }

    const reviewAdd = event.target.closest("[data-review-add]");
    if (reviewAdd) {
      event.preventDefault();
      const next = data();
      next.reviews.unshift({ name: reviewAdd.name.value, uk: reviewAdd.uk.value, ru: reviewAdd.ru.value });
      save(next);
      renderReviews();
      return;
    }

    const reviewForm = event.target.closest("[data-review-form]");
    if (reviewForm) {
      event.preventDefault();
      const next = data();
      const item = next.reviews[Number(reviewForm.dataset.reviewForm)];
      item.name = reviewForm.name.value;
      item.uk = reviewForm.uk.value;
      item.ru = reviewForm.ru.value;
      save(next);
      renderReviews();
    }
  });

  document.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-admin-tab]");
    if (tab) {
      document.querySelectorAll("[data-admin-panel]").forEach((panel) => panel.classList.remove("active"));
      document.querySelector(`[data-admin-panel='${tab.dataset.adminTab}']`)?.classList.add("active");
    }

    const logout = event.target.closest("[data-admin-logout]");
    if (logout) {
      fetch("/api/logout", { method: "POST" }).finally(() => requireAuth());
    }

    const deleteLead = event.target.closest("[data-delete-lead]");
    if (deleteLead) {
      fetch(`/api/leads/${deleteLead.dataset.deleteLead}`, { method: "DELETE" })
        .then(() => renderLeads());
    }

    if (logout || deleteLead) {
      return;
    }

    const legacyLogout = false;
    if (legacyLogout) {
      requireAuth();
    }

    const deleteWork = event.target.closest("[data-delete-work]");
    if (deleteWork) {
      const next = data();
      next.works.splice(Number(deleteWork.dataset.deleteWork), 1);
      save(next);
      renderWorks();
    }

    const deleteReview = event.target.closest("[data-delete-review]");
    if (deleteReview) {
      const next = data();
      next.reviews.splice(Number(deleteReview.dataset.deleteReview), 1);
      save(next);
      renderReviews();
    }
  });

  document.addEventListener("DOMContentLoaded", requireAuth);
})();
