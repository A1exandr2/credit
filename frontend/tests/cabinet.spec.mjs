import { test, expect } from "@playwright/test";
async function demo(page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Открыть демонстрацию", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Хороший день для больших планов." }),
  ).toBeVisible();
  await expect(page.locator(".metrics")).toContainText("12");
}
async function nav(page, label) {
  const menu = page.getByRole("button", { name: "Открыть меню", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("navigation", { name: "Основное меню" })
    .getByRole("button", { name: label, exact: true })
    .click();
}
function errors(page) {
  const list = [];
  page.on("pageerror", (e) => list.push(e.message));
  return list;
}
test("demo: all sections, finance editing, search and document export", async ({
  page,
}) => {
  const js = errors(page);
  await demo(page);
  await nav(page, "Компания");
  await expect(
    page.getByRole("heading", { name: "Компания в деталях." }),
  ).toBeVisible();
  await expect(page.locator(".detail-list")).toContainText("7701234567");
  await nav(page, "Финансовые данные");
  await page.getByRole("button", { name: "Изменить", exact: true }).click();
  await page.locator("input[name=profit_annual]").fill("-12000");
  await page
    .getByRole("button", { name: "Сохранить изменения", exact: true })
    .click();
  await expect(page.locator(".finance-values")).toContainText("12");
  await expect(
    page.getByRole("button", { name: "Изменить", exact: true }),
  ).toBeVisible();
  await nav(page, "Кредитная история");
  await expect(
    page.getByRole("heading", { name: "Кредитная история компании" }),
  ).toBeVisible();
  await nav(page, "Документы");
  const download = page.waitForEvent("download");
  await page
    .locator(".document-card")
    .first()
    .getByRole("button", { name: "Скачать файл" })
    .click();
  expect((await download).suggestedFilename()).toBe("company.json");
  await nav(page, "Мои заявки");
  await page
    .getByRole("textbox", { name: "Поиск заявок" })
    .fill("ничего-такого");
  await expect(
    page.getByRole("heading", { name: "Ничего не нашлось" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Сбросить фильтры" }).click();
  await expect(page.locator(".application-row")).toHaveCount(3);
  await page
    .getByRole("combobox", { name: "Фильтр по статусу" })
    .selectOption("DRAFT");
  await expect(page.locator(".application-row")).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Ваши планы в работе." }),
  ).toBeVisible();
  expect(js).toEqual([]);
});
test("demo: draft, edit, submit, explicit example offer and accept", async ({
  page,
}) => {
  const js = errors(page);
  await demo(page);
  await nav(page, "Кредитные продукты");
  await page
    .locator(".product-card")
    .first()
    .getByRole("button", { name: "Выбрать продукт" })
    .click();
  await page.locator("input[name=requested_amount]").fill("1500000");
  await page
    .locator("textarea[name=purpose]")
    .fill("Проверка демонстрационного сценария");
  await page
    .getByRole("button", { name: "Сохранить черновик", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Изменить черновик", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Изменить черновик", exact: true })
    .click();
  await page.locator("input[name=requested_amount]").fill("1700000");
  await page
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Ожидаем решение по заявке",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Показать демо-предложение" }).click();
  await expect(
    page.getByRole("heading", { name: "Ваше предложение", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Принять демо-предложение", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Принять демо-предложение", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Принять пример", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Предложение принято", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Предложение принято", exact: true }),
  ).toBeVisible();
  expect(js).toEqual([]);
});
test("mobile navigation and overflow at 320, 390, 768 and 1440", async ({
  page,
}) => {
  const js = errors(page);
  await demo(page);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Хороший день для больших планов." }),
    ).toBeVisible();
    for (const label of [
      "Главная",
      "Кредитные продукты",
      "Мои заявки",
      "Компания",
      "Финансовые данные",
      "Кредитная история",
      "Документы",
    ]) {
      await nav(page, label);
      await page.waitForTimeout(160);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}px ${label}`,
      ).toBe(true);
    }
    await nav(page, "Мои заявки");
    await page.locator(".application-row").first().click();
    await expect(
      page.getByRole("heading", { name: "Ваше предложение", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await nav(page, "Главная");
  }
  expect(js).toEqual([]);
});
test("server: registration, linking INN, real resources, finance, draft and submit", async ({
  page,
}) => {
  test.skip(
    process.env.LIVE_BACKEND !== "1",
    "Requires the team backend in an isolated test environment",
  );
  const js = errors(page),
    posted = [];
  page.on("request", (req) => {
    if (req.url().endsWith("/backend/auth/register"))
      posted.push(req.postDataJSON());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Регистрация", exact: true }).click();
  await page.locator("input[name=full_name]").fill("Проверка фронтенда");
  await page
    .locator("input[name=email]")
    .fill(`frontend-${Date.now()}@example.com`);
  await page.locator("input[name=password]").fill("FrontendCheck123!");
  await page
    .getByRole("button", { name: "Создать аккаунт", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Привязать компанию", exact: true }),
  ).toBeVisible();
  expect(Object.keys(posted[0]).sort()).toEqual([
    "email",
    "full_name",
    "password",
  ]);
  expect(await page.locator("input[name=inn]").count()).toBe(1);
  await page.locator("input[name=inn]").fill("7700000000");
  await page
    .getByRole("button", { name: "Привязать компанию", exact: true })
    .click();
  await expect(page.locator(".company-details")).toContainText("7700000000");
  await nav(page, "Финансовые данные");
  await page.getByRole("button", { name: "Изменить", exact: true }).click();
  await page.locator("input[name=revenue_annual]").fill("13000000");
  await page.locator("input[name=profit_annual]").fill("2300000");
  await page
    .getByRole("button", { name: "Сохранить изменения", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Изменить", exact: true }),
  ).toBeVisible();
  await nav(page, "Кредитные продукты");
  await page
    .locator(".product-card")
    .first()
    .getByRole("button", { name: "Выбрать продукт" })
    .click();
  await page
    .locator("textarea[name=purpose]")
    .fill("Проверка интеграции интерфейса с API");
  await page
    .getByRole("button", { name: "Сохранить черновик", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Изменить черновик", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Результат скоринга",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Показать демо-предложение" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Принять демо-предложение", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Результат рассмотрения заявки.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".history-list li")).not.toHaveCount(0);
  await page
    .getByRole("button", { name: "Открыть профиль", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Выйти из аккаунта", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "С возвращением." }),
  ).toBeVisible();
  expect(js).toEqual([]);
});
test("server: partial outage, submit recovery without duplicate, expired session and login", async ({
  page,
}) => {
  test.skip(
    process.env.LIVE_BACKEND !== "1",
    "Requires the team backend in an isolated test environment",
  );
  const js = errors(page),
    email = `recovery-${Date.now()}@example.com`,
    password = "RecoveryCheck123!";
  const created = await page.request.post("/backend/auth/register", {
    data: { email, password, full_name: "Проверка восстановления" },
  });
  expect(created.status()).toBe(201);
  const auth = await created.json();
  const linked = await page.request.post("/backend/company/link", {
    headers: { Authorization: `Bearer ${auth.access_token}` },
    data: { inn: "7712345678" },
  });
  expect(linked.ok()).toBe(true);
  await page.addInitScript(
    (token) => sessionStorage.setItem("alfa-local-api-token", token),
    auth.access_token,
  );
  await page.route(
    "**/backend/company/financials",
    (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Unavailable" }),
      }),
    { times: 1 },
  );
  await page.goto("/");
  await expect(page.locator(".error-box")).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(3);
  await page
    .locator(".error-box")
    .getByRole("button", { name: "Повторить" })
    .click();
  await expect(page.locator(".finance-chart")).toBeVisible();
  let drafts = 0;
  page.on("request", (req) => {
    if (
      req.method() === "POST" &&
      new URL(req.url()).pathname === "/backend/applications"
    )
      drafts++;
  });
  await nav(page, "Кредитные продукты");
  await page
    .locator(".product-card")
    .first()
    .getByRole("button", { name: "Выбрать продукт" })
    .click();
  await page
    .locator("textarea[name=purpose]")
    .fill("Сценарий восстановления после сбоя");
  await page.route(
    "**/backend/applications/*/submit",
    (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Unavailable" }),
      }),
    { times: 1 },
  );
  await page
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  await expect(page.locator(".error-box")).toContainText(
    "Сервис временно недоступен",
  );
  await expect(
    page.getByRole("button", { name: "Изменить черновик", exact: true }),
  ).toBeVisible();
  expect(drafts).toBe(1);
  await page
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Результат скоринга",
      exact: true,
    }),
  ).toBeVisible();
  expect(drafts).toBe(1);
  await nav(page, "Компания");
  await page.route(
    "**/backend/company",
    (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Invalid token" }),
      }),
    { times: 1 },
  );
  await page.getByRole("button", { name: "Обновить", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "С возвращением." }),
  ).toBeVisible();
  await expect(page.locator(".form-error")).toContainText("Сессия завершена");
  await page.locator("input[name=email]").fill(email);
  await page.locator("input[name=password]").fill("wrong-password");
  await page
    .getByRole("button", { name: "Войти в кабинет", exact: true })
    .click();
  await expect(page.locator(".form-error")).toContainText("Неверная почта");
  await page.locator("input[name=password]").fill(password);
  await page
    .getByRole("button", { name: "Войти в кабинет", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Хороший день для больших планов." }),
  ).toBeVisible();
  expect(js).toEqual([]);
});
