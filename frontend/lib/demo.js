import { payment } from "./format";
import { ApiError } from "./api";
const KEY = "alfa-local-demo-v2";
const company = {
  id: "demo-company",
  name: "ООО «Ромашка»",
  inn: "7701234567",
  ogrn: "1234567890123",
  registration_date: "2019-04-15",
  status: "ACTIVE",
  director_name: "Иванов Иван Андреевич",
  okved: "56.10",
  data_source: "DEMO",
};
export const demoProducts = [
  {
    id: "00000000-0000-0000-0000-000000000101",
    name: "Оборотный кредит",
    description: "Закупки, сезонный спрос и ежедневные задачи бизнеса.",
    min_amount: 100000,
    max_amount: 5000000,
    min_term_months: 6,
    max_term_months: 36,
    interest_rate: 18.9,
    is_active: true,
    data_source: "DEMO",
  },
  {
    id: "00000000-0000-0000-0000-000000000102",
    name: "Кредит на развитие бизнеса",
    description: "Оборудование, новая точка и большие планы.",
    min_amount: 500000,
    max_amount: 20000000,
    min_term_months: 12,
    max_term_months: 60,
    interest_rate: 16.5,
    is_active: true,
    data_source: "DEMO",
  },
  {
    id: "00000000-0000-0000-0000-000000000103",
    name: "Экспресс-кредит",
    description: "Небольшие расходы, которые не хочется откладывать.",
    min_amount: 50000,
    max_amount: 1000000,
    min_term_months: 3,
    max_term_months: 12,
    interest_rate: 21.5,
    is_active: true,
    data_source: "DEMO",
  },
];
function seed() {
  const now = new Date();
  const day = (n) => new Date(now.getTime() - n * 86400000).toISOString();
  return {
    version: 2,
    user: {
      id: "demo-user",
      full_name: "Иван Иванов",
      email: "ivan@company.ru",
      company_id: company.id,
    },
    company,
    financials: {
      revenue_annual: 12000000,
      profit_annual: 2500000,
      expenses_annual: 9500000,
      employees: 24,
      current_debt: 800000,
      source: "DEMO",
      updated_at: day(0),
    },
    creditHistory: {
      active_credits: 2,
      closed_credits: 5,
      overdue_count: 0,
      overdue_amount: 0,
      source: "DEMO",
      updated_at: day(0),
    },
    applications: [
      {
        id: "demo-offer",
        product_id: demoProducts[0].id,
        company_id: company.id,
        requested_amount: "1500000.00",
        term_months: 18,
        purpose: "Пополнение оборотных средств",
        status: "APPROVED",
        created_at: day(2),
        updated_at: day(0),
        offer: {
          amount: 1500000,
          months: 18,
          rate: 18.5,
          monthly_payment: payment(1500000, 18, 18.5),
        },
      },
      {
        id: "demo-review",
        product_id: demoProducts[1].id,
        company_id: company.id,
        requested_amount: "2400000.00",
        term_months: 24,
        purpose: "Покупка оборудования",
        status: "SCORING",
        created_at: day(1),
        updated_at: day(0),
      },
      {
        id: "demo-draft",
        product_id: demoProducts[2].id,
        company_id: company.id,
        requested_amount: "300000.00",
        term_months: 6,
        purpose: "Подготовка к сезону",
        status: "DRAFT",
        created_at: day(0),
        updated_at: day(0),
      },
    ],
    history: {},
  };
}
export function createDemo() {
  let state = null;
  const clone = (value) => structuredClone(value);
  function load() {
    if (state) return state;
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (
        saved?.version === 2 &&
        saved.user &&
        Array.isArray(saved.applications)
      )
        state = saved;
    } catch {}
    return (state ||= seed());
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }
  function getApp(id) {
    const found = load().applications.find((item) => item.id === id);
    if (!found) throw new ApiError("Заявка не найдена.", 404);
    return found;
  }
  function event(app, event_type, from, to) {
    const item = {
      id: crypto.randomUUID(),
      sequence: (load().history[app.id]?.length || 0) + 1,
      event_type,
      from_status: from,
      to_status: to,
      actor_type: "USER",
      occurred_at: new Date().toISOString(),
      details: {},
    };
    (load().history[app.id] ||= []).push(item);
  }
  function validate(values) {
    const p = demoProducts.find((item) => item.id === values.product_id);
    if (
      !p ||
      Number(values.requested_amount) < p.min_amount ||
      Number(values.requested_amount) > p.max_amount ||
      !Number.isInteger(Number(values.term_months)) ||
      values.term_months < p.min_term_months ||
      values.term_months > p.max_term_months ||
      !values.purpose?.trim()
    )
      throw new ApiError("Проверьте сумму, срок и цель кредита.", 422);
  }
  const method =
    (fn) =>
    async (...args) => {
      await new Promise((resolve) => setTimeout(resolve, 110));
      return clone(fn(...args));
    };
  return {
    enter: method(() => load().user),
    me: method(() => load().user),
    health: method(() => ({ status: "ok" })),
    register: method((values) => {
      state = seed();
      state.user = {
        id: "demo-user",
        full_name: values.full_name.trim(),
        email: values.email.trim().toLowerCase(),
        company_id: null,
      };
      state.company = null;
      state.applications = [];
      state.history = {};
      save();
      return { user: state.user };
    }),
    login: method((values) => {
      load().user.email = values.email.trim().toLowerCase();
      save();
      return { user: state.user };
    }),
    company: method(() => {
      if (!load().company)
        throw new ApiError("Сначала привяжите компанию по ИНН.", 404);
      return state.company;
    }),
    link: method((inn) => {
      if (!/^\d{10}(\d{2})?$/.test(inn))
        throw new ApiError("ИНН должен содержать 10 или 12 цифр.", 422);
      load().company = { ...company, inn };
      state.user.company_id = company.id;
      save();
      return state.company;
    }),
    financials: method(() => load().financials),
    creditHistory: method(() => load().creditHistory),
    products: method(() => demoProducts),
    saveFinancials: method((values) => {
      load().financials = {
        ...state.financials,
        ...values,
        source: "USER_VERIFIED",
        updated_at: new Date().toISOString(),
      };
      save();
      return state.financials;
    }),
    applications: method(() => load().applications),
    application: method(getApp),
    history: method((id) => {
      const app = getApp(id);
      if (load().history[id]?.length) return state.history[id];
      const items = [
        {
          id: id + "created",
          sequence: 1,
          event_type: "APPLICATION_CREATED",
          from_status: null,
          to_status: "DRAFT",
          actor_type: "USER",
          occurred_at: app.created_at,
          details: {},
        },
      ];
      if (app.status !== "DRAFT")
        items.push({
          id: id + "submitted",
          sequence: 2,
          event_type: "STATUS_CHANGED",
          from_status: "DRAFT",
          to_status: "SCORING",
          actor_type: "SYSTEM",
          occurred_at: app.created_at,
          details: {},
        });
      if (app.status === "APPROVED" || app.status === "COMPLETED")
        items.push({
          id: id + "offer",
          sequence: 3,
          event_type: "STATUS_CHANGED",
          from_status: "SCORING",
          to_status: "APPROVED",
          actor_type: "SYSTEM",
          occurred_at: app.updated_at,
          details: {},
        });
      return items;
    }),
    createApplication: method((values) => {
      validate(values);
      if (!load().company)
        throw new ApiError("Сначала привяжите компанию.", 404);
      const now = new Date().toISOString();
      const app = {
        ...values,
        id: crypto.randomUUID(),
        company_id: state.company.id,
        status: "DRAFT",
        created_at: now,
        updated_at: now,
      };
      state.applications.unshift(app);
      event(app, "APPLICATION_CREATED", null, "DRAFT");
      save();
      return app;
    }),
    updateApplication: method((id, values) => {
      const app = getApp(id);
      if (app.status !== "DRAFT")
        throw new ApiError("Редактировать можно только черновик.", 409);
      validate({ ...app, ...values });
      Object.assign(app, values, { updated_at: new Date().toISOString() });
      save();
      return app;
    }),
    submit: method((id) => {
      const app = getApp(id);
      if (app.status === "DRAFT") {
        validate(app);
        event(app, "STATUS_CHANGED", "DRAFT", "SUBMITTED");
        event(app, "STATUS_CHANGED", "SUBMITTED", "VALIDATION");
        event(app, "STATUS_CHANGED", "VALIDATION", "DATA_ENRICHMENT");
        event(app, "STATUS_CHANGED", "DATA_ENRICHMENT", "SCORING");
        app.status = "SCORING";
        app.updated_at = new Date().toISOString();
        save();
      }
      return app;
    }),
    exampleOffer: method((id) => {
      const app = getApp(id);
      if (app.status === "DRAFT" || app.status === "COMPLETED")
        throw new ApiError("Откройте отправленную демо-заявку.");
      event(app, "DEMO_OFFER_SHOWN", app.status, "APPROVED");
      app.status = "APPROVED";
      app.offer = {
        amount: Number(app.requested_amount),
        months: app.term_months,
        rate: 18.5,
        monthly_payment: payment(
          Number(app.requested_amount),
          app.term_months,
          18.5,
        ),
      };
      app.updated_at = new Date().toISOString();
      save();
      return app;
    }),
    accept: method((id) => {
      const app = getApp(id);
      if (!app.offer || app.status !== "APPROVED")
        throw new ApiError("Предложение уже изменилось.", 409);
      event(app, "DEMO_OFFER_ACCEPTED", app.status, "COMPLETED");
      app.status = "COMPLETED";
      app.updated_at = new Date().toISOString();
      save();
      return app;
    }),
  };
}
