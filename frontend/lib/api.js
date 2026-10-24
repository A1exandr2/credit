export class ApiError extends Error {
  constructor(message, status = 0, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
const fieldLabels = {
  email: "Почта",
  password: "Пароль",
  full_name: "Имя",
  inn: "ИНН",
  requested_amount: "Сумма",
  term_months: "Срок",
  purpose: "Цель",
  revenue_annual: "Выручка",
  profit_annual: "Прибыль",
  expenses_annual: "Расходы",
  employees: "Сотрудники",
  current_debt: "Задолженность",
};
const known = {
  "Invalid email or password": "Неверная почта или пароль.",
  "User with this email already exists":
    "Эта почта уже зарегистрирована. Попробуйте войти.",
  "Company is not linked": "Сначала привяжите компанию по ИНН.",
  "User is already linked to another company":
    "К аккаунту уже привязана другая компания.",
  "Company provider is unavailable":
    "Сервис данных компании временно недоступен.",
  "Company not found": "Компания не найдена.",
  "Credit product not found": "Этот продукт недоступен. Обновите каталог.",
  "Application not found": "Заявка не найдена.",
  "Application decision not found": "Решение по заявке ещё не появилось.",
  "Reviewer role required": "Для этого действия нужны права проверяющего.",
};
function explain(data, code) {
  if (typeof data?.detail === "string" && Object.hasOwn(known, data.detail))
    return known[data.detail];
  if (code === 401) return "Сессия завершена. Войдите снова.";
  if (code === 403) return "Недостаточно прав для этого действия.";
  if (code === 409)
    return "Данные уже изменились. Обновите страницу и попробуйте снова.";
  if (code === 422) return "Проверьте заполненные поля и допустимые значения.";
  if (code === 404) return "Эти данные пока недоступны.";
  if (code === 502 || code === 503)
    return "Сервис временно недоступен. Попробуйте позже.";
  return "Не удалось выполнить запрос. Повторите попытку.";
}
export function createApi(token = "", sessionSignal) {
  async function request(path, method = "GET", body, long = false) {
    const timeout = AbortSignal.timeout(long ? 165000 : 15000);
    const signal = sessionSignal
      ? AbortSignal.any([timeout, sessionSignal])
      : timeout;
    let response;
    try {
      response = await fetch(`/backend/${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
        signal,
      });
    } catch (error) {
      if (sessionSignal?.aborted) throw error;
      throw new ApiError(
        timeout.aborted
          ? "Сервер отвечает дольше обычного. Обновите данные перед повторной отправкой."
          : "Нет связи с сервером. Проверьте, запущен ли бэкенд.",
      );
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const fields = {};
      if (Array.isArray(data?.detail))
        for (const item of data.detail) {
          const key = item.loc?.at(-1);
          if (fieldLabels[key])
            fields[key] = `${fieldLabels[key]}: проверьте значение`;
        }
      throw new ApiError(
        explain(data, response.status),
        response.status,
        fields,
      );
    }
    if (data === null)
      throw new ApiError("Сервер вернул ответ в неожиданном формате.");
    return data;
  }
  return {
    health: () => request("health"),
    register: (values) =>
      request("auth/register", "POST", {
        email: values.email.trim().toLowerCase(),
        password: values.password,
        full_name: values.full_name.trim(),
      }),
    login: (values) =>
      request("auth/login", "POST", {
        email: values.email.trim().toLowerCase(),
        password: values.password,
      }),
    me: () => request("auth/me"),
    company: () => request("company"),
    link: (inn) => request("company/link", "POST", { inn: inn.trim() }),
    financials: () => request("company/financials"),
    saveFinancials: (values) => request("company/financials", "PATCH", values),
    creditHistory: () => request("company/credit-history"),
    products: () => request("credit-products"),
    applications: () => request("applications"),
    application: (id) => request(`applications/${encodeURIComponent(id)}`),
    history: (id) => request(`applications/${encodeURIComponent(id)}/history`),
    decision: (id) =>
      request(`applications/${encodeURIComponent(id)}/decision`),
    createApplication: (values) => request("applications", "POST", values),
    updateApplication: (id, values) =>
      request(`applications/${encodeURIComponent(id)}`, "PATCH", values),
    submit: (id) =>
      request(
        `applications/${encodeURIComponent(id)}/submit`,
        "POST",
        undefined,
        true,
      ),
  };
}
