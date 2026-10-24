import { test, expect } from "@playwright/test";

test.skip(
  process.env.LIVE_BACKEND !== "1",
  "Needs an isolated running backend",
);

async function prepare(page, financials) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const registration = await page.request.post("/backend/auth/register", {
    data: {
      email: `decision-${suffix}@example.com`,
      password: "DecisionCheck123!",
      full_name: "Проверка решения",
    },
  });
  expect(registration.status()).toBe(201);
  const auth = await registration.json();
  expect(auth.user.role).toBe("USER");
  const headers = { Authorization: `Bearer ${auth.access_token}` };
  const company = await page.request.post("/backend/company/link", {
    headers,
    data: { inn: `77${String(Date.now()).slice(-8)}` },
  });
  expect(company.ok()).toBe(true);
  const updated = await page.request.patch("/backend/company/financials", {
    headers,
    data: financials,
  });
  expect(updated.ok()).toBe(true);
  const products = await (
    await page.request.get("/backend/credit-products")
  ).json();
  const product = products[0];
  const draft = await page.request.post("/backend/applications", {
    headers,
    data: {
      product_id: product.id,
      requested_amount: String(product.min_amount),
      term_months: product.min_term_months,
      purpose: "Проверка ответа актуального API",
    },
  });
  expect(draft.status()).toBe(201);
  const item = await draft.json();
  await page.addInitScript(
    (token) => sessionStorage.setItem("alfa-local-api-token", token),
    auth.access_token,
  );
  return { headers, item };
}

async function navigate(page, label) {
  await page
    .getByRole("navigation", { name: "Основное меню" })
    .getByRole("button", { name: label, exact: true })
    .click();
}

test("missing revenue survives reload and resubmits the same application", async ({
  page,
}) => {
  const { headers, item } = await prepare(page, {
    revenue_annual: "0",
    profit_annual: "0",
    current_debt: "0",
  });
  const submitted = await page.request.post(
    `/backend/applications/${item.id}/submit`,
    { headers },
  );
  expect(submitted.ok()).toBe(true);
  expect((await submitted.json()).required_fields).toEqual([
    "financials.revenue_annual",
  ]);
  await page.goto(`/#application?id=${item.id}`);
  await expect(
    page.getByRole("heading", {
      name: "Дополните финансовые данные",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".decision-list")).toContainText("Выручка за год");
  await page.reload();
  await expect(page.locator(".decision-list")).toContainText("Выручка за год");
  await page
    .getByRole("button", { name: "Исправить финансовые данные", exact: true })
    .click();
  await page.getByRole("button", { name: "Изменить", exact: true }).click();
  await page.locator("input[name=revenue_annual]").fill("13000000");
  await page.locator("input[name=profit_annual]").fill("3000000");
  await page
    .getByRole("button", { name: "Сохранить изменения", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Изменить", exact: true }),
  ).toBeVisible();
  await navigate(page, "Мои заявки");
  await page.locator(".application-row").click();
  await page
    .getByRole("button", { name: "Повторить рассмотрение", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Результат скоринга", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".decision-panel")).toContainText(
    "Положительное решение",
  );
  await expect(page).toHaveURL(new RegExp(`id=${item.id}`));
  const applications = await (
    await page.request.get("/backend/applications", { headers })
  ).json();
  expect(applications).toHaveLength(1);
});

test("decision request can fail and retry without losing the application", async ({
  page,
}) => {
  const { headers, item } = await prepare(page, {
    revenue_annual: "13000000",
    profit_annual: "3000000",
    current_debt: "0",
  });
  expect(
    (
      await page.request.post(`/backend/applications/${item.id}/submit`, {
        headers,
      })
    ).ok(),
  ).toBe(true);
  await page.route(
    `**/backend/applications/${item.id}/decision`,
    (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Unavailable" }),
      }),
    { times: 1 },
  );
  await page.goto(`/#application?id=${item.id}`);
  await expect(page.locator(".error-box")).toContainText(
    "Сервис временно недоступен",
  );
  await expect(page.locator(".request-summary")).toBeVisible();
  await page
    .locator(".error-box")
    .getByRole("button", { name: "Повторить" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Результат скоринга", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".decision-panel")).toContainText(
    "Положительное решение",
  );
  await page.setViewportSize({ width: 320, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Принять предложение", exact: true }),
  ).toHaveCount(0);
});

for (const scenario of [
  {
    profit: "0",
    debt: "0",
    status: "MANUAL_REVIEW",
    text: "Нужна ручная проверка",
  },
  {
    profit: "-1000000",
    debt: "26000000",
    status: "REJECTED",
    text: "Заявка не одобрена",
  },
]) {
  test(`server outcome: ${scenario.status}`, async ({ page }) => {
    const { headers, item } = await prepare(page, {
      revenue_annual: "13000000",
      profit_annual: scenario.profit,
      current_debt: scenario.debt,
    });
    const submitted = await page.request.post(
      `/backend/applications/${item.id}/submit`,
      { headers },
    );
    expect(submitted.ok()).toBe(true);
    expect((await submitted.json()).status).toBe(scenario.status);
    await page.goto(`/#application?id=${item.id}`);
    await page.reload();
    await expect(page.locator(".decision-panel")).toContainText(scenario.text);
    await expect(
      page.getByRole("button", {
        name: "Принять демо-предложение",
        exact: true,
      }),
    ).toHaveCount(0);
    if (scenario.status === "MANUAL_REVIEW") {
      const forbidden = await page.request.post(
        `/backend/applications/${item.id}/review`,
        {
          headers,
          data: { outcome: "APPROVED" },
        },
      );
      expect(forbidden.status()).toBe(403);
    }
  });
}
