import { useState } from "react";
import Decision from "./Decision";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Building2,
  Check,
  CheckCheck,
  ChartNoAxesCombined,
  Clock3,
  Download,
  FileText,
  Landmark,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  Empty,
  ErrorBox,
  Field,
  PageHeading,
  Skeleton,
  Source,
} from "./UI";
import {
  date,
  download,
  money,
  number,
  payment,
  status,
  time,
} from "../lib/format";
const productIcons = [Landmark, ChartNoAxesCombined, Wallet];
const productName = (id, products) =>
  products?.find((item) => item.id === id)?.name || "Кредитный продукт";
export function ProductCard({
  product,
  index = 0,
  onSelect,
  compact = false,
  featured = false,
}) {
  const Icon = productIcons[index % 3];
  return (
    <article
      className={`product-card ${featured ? "featured" : ""} ${compact ? "compact" : ""}`}
    >
      <div className="product-card-top">
        <span className="product-icon">
          <Icon size={23} />
        </span>
        {product.data_source === "DEMO" && (
          <span className="mini-label">Демо-продукт</span>
        )}
      </div>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div className="product-limit">до {money(product.max_amount)}</div>
      {compact ? (
        <p className="product-summary">
          До {product.max_term_months} месяцев
          <span>от {number(product.interest_rate)}%</span>
        </p>
      ) : (
        <dl className="product-terms">
          <div>
            <dt>Сумма</dt>
            <dd>от {money(product.min_amount)}</dd>
          </div>
          <div>
            <dt>Срок</dt>
            <dd>
              {product.min_term_months}–{product.max_term_months} мес.
            </dd>
          </div>
          <div>
            <dt>Ставка</dt>
            <dd>от {number(product.interest_rate)}%</dd>
          </div>
        </dl>
      )}
      <Button
        variant={featured ? "primary" : "secondary"}
        onClick={() => onSelect(product)}
      >
        {compact ? "Подробнее" : "Выбрать продукт"}
      </Button>
    </article>
  );
}
export function Overview({
  data,
  errors,
  loading,
  onNavigate,
  onSelect,
  onOpen,
  onRetry,
}) {
  const f = data.financials;
  const values = [
    ["Выручка за год", f?.revenue_annual, money, ChartNoAxesCombined],
    ["Прибыль за год", f?.profit_annual, money, Wallet],
    ["Сотрудники", f?.employees, number, Users],
    ["Текущая задолженность", f?.current_debt, money, Banknote],
  ];
  const scale = Math.max(
    Number(f?.revenue_annual) || 1,
    Number(f?.expenses_annual) || 1,
    Math.abs(Number(f?.profit_annual)) || 1,
  );
  return (
    <>
      <PageHeading
        title="Хороший день для больших планов."
        description="Компания, финансы и ваши заявки — всё под рукой."
        action={
          <Button onClick={() => onNavigate("products")}>Подать заявку</Button>
        }
      />
      {!data.company && !loading && (
        <div className="link-callout">
          <Building2 size={30} />
          <div>
            <h3>Познакомимся с вашим бизнесом?</h3>
            <p>
              Привяжите компанию по ИНН — появятся её данные и возможность
              подать заявку.
            </p>
          </div>
          <Button onClick={() => onNavigate("company")}>
            Добавить компанию
          </Button>
        </div>
      )}
      <ErrorBox error={errors.financials} onRetry={onRetry} />
      <div className="metrics">
        {values.map(([label, value, format, Icon]) => (
          <article className="metric-card" key={label}>
            <div>
              <span>{label}</span>
              <Icon size={17} />
            </div>
            {loading && !f ? (
              <Skeleton />
            ) : (
              <strong>{value == null ? "—" : format(value)}</strong>
            )}
            <small>
              {value == null
                ? "Данные появятся после привязки компании"
                : label === "Сотрудники"
                  ? "Команда вашей компании"
                  : "Годовые показатели компании"}
            </small>
          </article>
        ))}
      </div>
      {f && (
        <section className="panel finance-chart">
          <div>
            <h2>Финансы в движении</h2>
            <p>Годовые показатели вашей компании</p>
            <Source value={f.source} />
          </div>
          <div className="chart-bars">
            {[
              ["Выручка", f.revenue_annual, "red"],
              ["Расходы", f.expenses_annual, "peach"],
              ["Прибыль", f.profit_annual, "green"],
            ].map(([label, value, color]) => (
              <div className="chart-column" key={label}>
                <strong>{money(value)}</strong>
                <div className="bar-track">
                  <div
                    className={`bar bar-${Number(value) < 0 ? "red" : color}`}
                    style={{
                      height:
                        Math.max(5, (Math.abs(Number(value)) / scale) * 100) +
                        "%",
                    }}
                  />
                </div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="section-heading">
        <h2>Под задачи вашего бизнеса</h2>
        <button className="text-button" onClick={() => onNavigate("products")}>
          Все продукты
          <ArrowUpRight size={15} />
        </button>
      </div>
      <ErrorBox error={errors.products} onRetry={onRetry} />
      <div className="product-grid">
        {loading && !data.products.length
          ? [0, 1, 2].map((i) => (
              <Skeleton key={i} className="product-skeleton" />
            ))
          : data.products
              .slice(0, 3)
              .map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={i}
                  compact
                  featured={i === 0}
                  onSelect={onSelect}
                />
              ))}
      </div>
      {!loading && !errors.products && !data.products.length && (
        <Empty icon={Landmark} title="Каталог пока пуст">
          Продукты появятся здесь, когда они станут доступны.
        </Empty>
      )}
      <div className="section-heading">
        <h2>Ваши заявки</h2>
        <button
          className="text-button"
          onClick={() => onNavigate("applications")}
        >
          Все заявки
          <ArrowUpRight size={15} />
        </button>
      </div>
      <ErrorBox error={errors.applications} onRetry={onRetry} />
      <ApplicationTable
        items={data.applications.slice(0, 3)}
        products={data.products}
        onOpen={onOpen}
        loading={loading}
        onCreate={() => onNavigate("products")}
      />
    </>
  );
}
export function Products({ products, error, loading, onSelect, onRetry }) {
  return (
    <>
      <PageHeading
        title="Для следующего шага."
        description="Выберите кредитный продукт под задачи вашего бизнеса."
      />
      <ErrorBox error={error} onRetry={onRetry} />
      <div className="product-grid catalog">
        {loading && !products.length
          ? [0, 1, 2].map((i) => (
              <Skeleton key={i} className="product-skeleton" />
            ))
          : products.map((p, i) => (
              <ProductCard
                product={p}
                key={p.id}
                index={i}
                featured={i === 0}
                onSelect={onSelect}
              />
            ))}
      </div>
      {!loading && !error && !products.length && (
        <Empty icon={Landmark} title="Продуктов пока нет">
          Обновите каталог позже.
        </Empty>
      )}
      <div className="panel product-note">
        <ShieldCheck size={28} />
        <div>
          <h3>Ваши планы — в центре внимания.</h3>
          <p>
            Итоговые условия появятся после рассмотрения заявки. Отправка заявки
            не обязывает принимать предложение.
          </p>
        </div>
      </div>
    </>
  );
}
export function LinkCompany({ onLink, busy, error }) {
  const [inn, setInn] = useState("");
  return (
    <section className="panel company-link">
      <span className="empty-icon">
        <Building2 size={30} />
      </span>
      <h2>Всё начинается с вашей компании.</h2>
      <p>
        Укажите ИНН, чтобы получить данные организации и продолжить работу с
        заявками.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onLink(inn);
        }}
      >
        <Field label="ИНН компании" hint="10 или 12 цифр" icon={Building2}>
          <input
            name="inn"
            inputMode="numeric"
            pattern="[0-9]{10}([0-9]{2})?"
            title="Введите 10 или 12 цифр"
            maxLength={12}
            required
            placeholder="7700000000"
            value={inn}
            onChange={(e) => setInn(e.target.value)}
            disabled={busy}
          />
        </Field>
        {error && (
          <p className="form-error" role="alert">
            {error.message}
          </p>
        )}
        <Button busy={busy} type="submit">
          Привязать компанию
        </Button>
      </form>
    </section>
  );
}
export function Company({ company, error, loading, onRetry, onNavigate }) {
  if (loading && !company) return <Skeleton className="large-skeleton" />;
  if (error) return <ErrorBox error={error} onRetry={onRetry} />;
  if (!company) return null;
  const entries = [
    ["Название", company.name],
    ["ИНН", company.inn],
    ["ОГРН", company.ogrn],
    ["Дата регистрации", date(company.registration_date)],
    ["Статус", company.status === "ACTIVE" ? "Действует" : company.status],
    ["ОКВЭД", company.okved],
    ["Руководитель", company.director_name],
  ];
  return (
    <>
      <div className="company-tabs">
        <span className="active">Реквизиты</span>
        <button onClick={() => onNavigate("finances")}>
          Финансовые данные
        </button>
        <button onClick={() => onNavigate("credit-history")}>
          Кредитная история
        </button>
      </div>
      <div className="company-grid">
        <section className="panel company-details">
          <div className="section-heading">
            <h2>Данные компании</h2>
            <Badge tone="good">
              {company.status === "ACTIVE"
                ? "Действующая компания"
                : company.status}
            </Badge>
          </div>
          <Source value={company.data_source} />
          <dl className="detail-list">
            {entries.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || "Не указано"}</dd>
              </div>
            ))}
          </dl>
        </section>
        <aside className="panel company-aside">
          <span className="product-icon">
            <ChartNoAxesCombined size={25} />
          </span>
          <h2>Картина вашего бизнеса</h2>
          <p>
            Проверьте финансовые показатели перед подачей заявки. Изменения
            сохраняются в профиле компании.
          </p>
          <Button onClick={() => onNavigate("finances")}>
            Посмотреть финансы
          </Button>
          <button
            className="text-button"
            onClick={() => onNavigate("credit-history")}
          >
            Кредитная история
            <ArrowRight size={15} />
          </button>
        </aside>
      </div>
    </>
  );
}
const financeFields = [
  ["revenue_annual", "Выручка за год", "₽", 0],
  ["profit_annual", "Прибыль за год", "₽", undefined],
  ["expenses_annual", "Расходы за год", "₽", 0],
  ["employees", "Количество сотрудников", "чел.", 0],
  ["current_debt", "Текущая задолженность", "₽", 0],
];
export function Finances({
  financials,
  error,
  loading,
  onRetry,
  onSave,
  busy,
  saveError,
}) {
  const [editing, setEditing] = useState(false),
    [draft, setDraft] = useState({});
  if (loading && !financials) return <Skeleton className="large-skeleton" />;
  if (error) return <ErrorBox error={error} onRetry={onRetry} />;
  if (!financials) return null;
  function edit() {
    setDraft(
      Object.fromEntries(
        financeFields.map(([key]) => [key, String(financials[key] ?? 0)]),
      ),
    );
    setEditing(true);
  }
  async function submit(e) {
    e.preventDefault();
    const changed = {};
    for (const [key] of financeFields)
      if (Number(draft[key]) !== Number(financials[key]))
        changed[key] = Number(draft[key]);
    if (!Object.keys(changed).length) {
      setEditing(false);
      return;
    }
    if (await onSave(changed)) setEditing(false);
  }
  return (
    <section className="panel finance-panel">
      <div className="section-heading">
        <div>
          <h2>Финансовые показатели</h2>
          <p>Обновлено {date(financials.updated_at)}</p>
        </div>
        {!editing && (
          <Button variant="secondary" icon={Pencil} onClick={edit}>
            Изменить
          </Button>
        )}
      </div>
      <Source value={financials.source} />
      {editing ? (
        <form onSubmit={submit}>
          <fieldset disabled={busy} className="finance-fields">
            {financeFields.map(([key, label, hint, min]) => (
              <Field
                key={key}
                label={label}
                hint={hint}
                error={saveError?.fields?.[key]}
              >
                <input
                  type="number"
                  name={key}
                  min={min}
                  step={key === "employees" ? "1" : "0.01"}
                  required
                  value={draft[key]}
                  onChange={(e) =>
                    setDraft((old) => ({ ...old, [key]: e.target.value }))
                  }
                />
              </Field>
            ))}
          </fieldset>
          {saveError && (
            <p className="form-error" role="alert">
              {saveError.message}
            </p>
          )}
          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(false)}
              disabled={busy}
              arrow={false}
            >
              Отменить
            </Button>
            <Button type="submit" busy={busy}>
              Сохранить изменения
            </Button>
          </div>
        </form>
      ) : (
        <dl className="finance-values">
          {financeFields.map(([key, label]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>
                {key === "employees"
                  ? number(financials[key])
                  : money(financials[key])}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
export function CreditHistory({ data, error, loading, onRetry }) {
  if (loading && !data) return <Skeleton className="large-skeleton" />;
  if (error) return <ErrorBox error={error} onRetry={onRetry} />;
  if (!data) return null;
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Кредитная история компании</h2>
          <p>Обновлено {date(data.updated_at)}</p>
        </div>
        <ShieldCheck size={26} />
      </div>
      <Source value={data.source} />
      <dl className="finance-values">
        {[
          ["Действующие кредиты", number(data.active_credits)],
          ["Закрытые кредиты", number(data.closed_credits)],
          ["Количество просрочек", number(data.overdue_count)],
          ["Сумма просрочек", money(data.overdue_amount)],
        ].map(([a, b]) => (
          <div key={a}>
            <dt>{a}</dt>
            <dd>{b}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
export function ApplicationTable({
  items,
  products,
  onOpen,
  loading,
  onCreate,
}) {
  if (loading && !items.length) return <Skeleton className="table-skeleton" />;
  if (!items.length)
    return (
      <div className="panel">
        <Empty
          icon={FileText}
          title="У ваших планов ещё нет заявки"
          action={<Button onClick={onCreate}>Выбрать продукт</Button>}
        >
          Начните с подходящего продукта. Черновик можно сохранить и заполнить
          позже.
        </Empty>
      </div>
    );
  return (
    <div className="application-table panel">
      <div className="table-header">
        <span>Заявка и цель</span>
        <span>Сумма и срок</span>
        <span>Статус</span>
        <span />
      </div>
      {items.map((item) => (
        <button
          className="application-row"
          key={item.id}
          onClick={() => onOpen(item.id)}
        >
          <span>
            <strong>{productName(item.product_id, products)}</strong>
            <small>{item.purpose}</small>
            <em>{date(item.created_at)}</em>
          </span>
          <span>
            <strong>{money(item.requested_amount)}</strong>
            <small>{item.term_months} мес.</small>
          </span>
          <Badge value={item.status} />
          <ArrowUpRight size={19} />
        </button>
      ))}
    </div>
  );
}
export function Applications({
  items,
  products,
  error,
  loading,
  onOpen,
  onCreate,
  onRetry,
}) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all");
  const filtered = items.filter(
    (item) =>
      (filter === "all" ||
        (filter === "review"
          ? [
              "SUBMITTED",
              "VALIDATION",
              "DATA_CHECK",
              "DATA_ENRICHMENT",
              "SCORING",
              "MANUAL_REVIEW",
            ].includes(item.status)
          : filter === "decision"
            ? ["DECISION", "REJECTED"].includes(item.status)
            : filter === "offer"
              ? ["APPROVED", "OFFER"].includes(item.status)
              : item.status === filter)) &&
      `${item.purpose} ${productName(item.product_id, products)} ${item.id}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        title="Ваши планы в работе."
        description="Черновики, отправленные заявки и предложения — в одном месте."
        action={<Button onClick={onCreate}>Новая заявка</Button>}
      />
      <div className="list-toolbar">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Поиск заявок"
            placeholder="Найти заявку"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="filter-field">
          <span className="sr-only">Фильтр по статусу</span>
          <select
            aria-label="Фильтр по статусу"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Все статусы</option>
            <option value="DRAFT">Черновики</option>
            <option value="review">На рассмотрении</option>
            <option value="NEED_MORE_DATA">Нужны данные</option>
            <option value="decision">Решение получено</option>
            <option value="offer">Есть предложение</option>
            <option value="COMPLETED">Завершённые</option>
          </select>
        </label>
      </div>
      <ErrorBox error={error} onRetry={onRetry} />
      {items.length && !filtered.length ? (
        <div className="panel">
          <Empty
            icon={Search}
            title="Ничего не нашлось"
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                Сбросить фильтры
              </Button>
            }
          >
            Попробуйте изменить запрос или выбрать другой статус.
          </Empty>
        </div>
      ) : (
        <ApplicationTable
          items={filtered}
          products={products}
          onOpen={onOpen}
          onCreate={onCreate}
          loading={loading}
        />
      )}
    </>
  );
}
export function ApplicationForm({
  product,
  products,
  draft,
  onSave,
  busy,
  error,
  onBack,
  onProduct,
}) {
  const [values, setValues] = useState({
    requested_amount:
      draft?.requested_amount ||
      String(
        Math.min(product.max_amount, Math.max(product.min_amount, 1500000)),
      ),
    term_months: String(
      draft?.term_months ||
        Math.min(
          product.max_term_months,
          Math.max(product.min_term_months, 18),
        ),
    ),
    purpose: draft?.purpose || "Пополнение оборотных средств",
  });
  const [validation, setValidation] = useState("");
  const amount = Number(values.requested_amount),
    months = Number(values.term_months);
  const estimated = payment(amount, months, product.interest_rate);
  function submit(e, send) {
    e.preventDefault();
    if (!values.purpose.trim()) {
      setValidation("Опишите цель кредита.");
      return;
    }
    setValidation("");
    onSave(
      {
        product_id: product.id,
        requested_amount: amount.toFixed(2),
        term_months: months,
        purpose: values.purpose.trim(),
      },
      send,
      draft?.id,
    );
  }
  return (
    <>
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} />К продуктам
      </button>
      <PageHeading
        title={draft ? "Продолжим ваши планы." : "Расскажите о своих планах."}
        description={
          draft
            ? "Изменения сохраняются в черновик."
            : "Заполните заявку. Её можно сохранить и отправить позже."
        }
      />
      <div className="application-form-grid">
        <section className="panel">
          <h2>Параметры кредита</h2>
          <form onSubmit={(e) => submit(e, true)}>
            <fieldset disabled={busy}>
              <Field label="Кредитный продукт">
                <select
                  name="product_id"
                  value={product.id}
                  onChange={(e) =>
                    onProduct(
                      products.find((p) => p.id === e.target.value),
                      draft,
                    )
                  }
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Сумма кредита"
                hint={`До ${money(product.max_amount)}`}
                error={error?.fields?.requested_amount}
              >
                <input
                  name="requested_amount"
                  type="number"
                  inputMode="decimal"
                  min={product.min_amount}
                  max={product.max_amount}
                  step="0.01"
                  required
                  value={values.requested_amount}
                  onChange={(e) =>
                    setValues((old) => ({
                      ...old,
                      requested_amount: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field
                label="Срок кредита"
                hint="Месяцы"
                error={error?.fields?.term_months}
              >
                <select
                  name="term_months"
                  value={values.term_months}
                  onChange={(e) =>
                    setValues((old) => ({
                      ...old,
                      term_months: e.target.value,
                    }))
                  }
                >
                  {Array.from(
                    {
                      length:
                        product.max_term_months - product.min_term_months + 1,
                    },
                    (_, i) => i + product.min_term_months,
                  ).map((n) => (
                    <option value={n} key={n}>
                      {n} мес.
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Цель кредита"
                hint={`${values.purpose.length}/500`}
                error={error?.fields?.purpose}
              >
                <textarea
                  name="purpose"
                  required
                  maxLength={500}
                  value={values.purpose}
                  onChange={(e) =>
                    setValues((old) => ({ ...old, purpose: e.target.value }))
                  }
                  placeholder="На что вы планируете направить средства"
                />
              </Field>
            </fieldset>
            {(validation || error) && (
              <p className="form-error" role="alert">
                {validation || error.message}
              </p>
            )}
            <p className="form-helper">
              <LockKeyhole size={14} />
              Перед отправкой проверьте сумму, срок и данные компании.
            </p>
            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                busy={busy}
                onClick={(e) => {
                  const form = e.currentTarget.form;
                  if (form.reportValidity()) submit(e, false);
                }}
              >
                Сохранить черновик
              </Button>
              <Button type="submit" busy={busy}>
                Отправить заявку
              </Button>
            </div>
          </form>
        </section>
        <aside className="panel application-summary">
          <span className="product-icon">
            <Landmark size={24} />
          </span>
          <h2>{product.name}</h2>
          <Source value={product.data_source} />
          <dl className="summary-list">
            <div>
              <dt>Сумма</dt>
              <dd>{money(amount)}</dd>
            </div>
            <div>
              <dt>Срок</dt>
              <dd>{months} мес.</dd>
            </div>
            <div>
              <dt>Ставка по продукту</dt>
              <dd>от {number(product.interest_rate)}%</dd>
            </div>
          </dl>
          <div className="payment-estimate">
            <span>Ориентир платежа в месяц</span>
            <strong>{money(estimated)}</strong>
          </div>
          <p>
            Это предварительный расчёт по ставке продукта. Итоговые условия
            определяются после рассмотрения заявки.
          </p>
        </aside>
      </div>
    </>
  );
}
function EventHistory({ events, error, loading, onRetry }) {
  return (
    <section className="panel history-panel">
      <h2>История заявки</h2>
      <p>Действия и изменения статуса</p>
      <ErrorBox error={error} onRetry={onRetry} />
      {loading && !events.length ? (
        <Skeleton className="table-skeleton" />
      ) : !events.length ? (
        <p className="muted">История пока не появилась.</p>
      ) : (
        <ol className="history-list">
          {events
            .slice()
            .sort((a, b) => a.sequence - b.sequence)
            .map((e, i) => {
              let label =
                e.event_type === "APPLICATION_CREATED"
                  ? "Черновик создан"
                  : e.event_type === "DEMO_OFFER_ACCEPTED"
                    ? "Демо-предложение принято"
                    : e.to_status
                      ? status[e.to_status]?.[0] || "Статус обновлён"
                      : "Данные заявки обновлены";
              return (
                <li key={e.id}>
                  <span
                    className={`history-dot ${i === events.length - 1 ? "current" : ""}`}
                  >
                    <Check size={13} />
                  </span>
                  <div>
                    <strong>{label}</strong>
                    <time>{time(e.occurred_at)}</time>
                  </div>
                </li>
              );
            })}
        </ol>
      )}
    </section>
  );
}
export function ApplicationDetail({
  item,
  products,
  events,
  historyError,
  decision,
  decisionError,
  requiredFields = [],
  loading,
  onRefresh,
  onEdit,
  onSubmit,
  onExample,
  onAccept,
  onBack,
  onFinancials,
  busy,
  demo,
}) {
  const hasOffer = demo && !!item.offer,
    completed = item.status === "COMPLETED";
  return (
    <>
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} />К моим заявкам
      </button>
      <PageHeading
        title={
          completed
            ? "Ваши планы получили поддержку."
            : hasOffer
              ? "Хорошие новости для ваших планов."
              : item.status === "DRAFT"
                ? "Планы можно дополнить."
                : item.status === "NEED_MORE_DATA"
                  ? "Дополните данные для рассмотрения."
                  : item.status === "MANUAL_REVIEW"
                    ? "Заявка на ручной проверке."
                    : ["DECISION", "REJECTED"].includes(item.status)
                      ? "Результат рассмотрения заявки."
                      : "Ваша заявка уже в работе."
        }
        description={`Заявка ${item.id.slice(0, 8).toUpperCase()} · ${productName(item.product_id, products)}`}
        action={
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={onRefresh}
            busy={loading || busy}
          >
            Обновить
          </Button>
        }
      />
      {(hasOffer || completed) && (
        <div className="result-hero">
          <span>
            <CheckCheck size={29} />
          </span>
          <div>
            <h2>
              {completed ? "Предложение принято" : "Предварительно одобрено"}
            </h2>
            <p>
              {demo
                ? "Демонстрационный пример. Действия сохраняются только в этом браузере."
                : "Информация о статусе получена от сервера."}
            </p>
          </div>
          <Badge value={item.status} />
        </div>
      )}
      <div className="application-detail-grid">
        <section className="panel request-summary">
          <Badge value={item.status} />
          <h2>{productName(item.product_id, products)}</h2>
          <dl className="summary-list">
            <div>
              <dt>Сумма кредита</dt>
              <dd>{money(item.requested_amount)}</dd>
            </div>
            <div>
              <dt>Срок</dt>
              <dd>{item.term_months} мес.</dd>
            </div>
            <div>
              <dt>Дата подачи</dt>
              <dd>{date(item.created_at)}</dd>
            </div>
            <div>
              <dt>Цель кредита</dt>
              <dd>{item.purpose}</dd>
            </div>
          </dl>
          {item.status === "DRAFT" ? (
            <div className="stack-actions">
              <Button onClick={onEdit} variant="secondary" busy={busy}>
                Изменить черновик
              </Button>
              <Button onClick={onSubmit} busy={busy}>
                Отправить заявку
              </Button>
            </div>
          ) : (
            <p className="form-helper">
              <Clock3 size={15} />
              {completed
                ? "Рассмотрение завершено."
                : item.status === "NEED_MORE_DATA"
                  ? "После исправления финансовых данных повторите рассмотрение."
                  : ["DECISION", "REJECTED"].includes(item.status)
                    ? "Результат рассмотрения получен от сервера."
                    : "Статус обновляется автоматически, пока страница открыта."}
            </p>
          )}
          <button
            className="text-button download-summary"
            onClick={() => download(`application-${item.id}.json`, item)}
          >
            <Download size={15} />
            Скачать сводку заявки
          </button>
        </section>
        {hasOffer ? (
          <section className="panel offer-panel">
            <div className="section-heading">
              <h2>Ваше предложение</h2>
              <span className="mini-label">Демо-пример</span>
            </div>
            <dl className="offer-values">
              {[
                ["Сумма", money(item.offer.amount)],
                ["Срок", `${item.offer.months} мес.`],
                ["Ставка", `${number(item.offer.rate)}% годовых`],
                ["Ежемесячный платёж", money(item.offer.monthly_payment)],
              ].map(([a, b]) => (
                <div key={a}>
                  <dt>{a}</dt>
                  <dd>{b}</dd>
                </div>
              ))}
            </dl>
            {!completed && (
              <Button onClick={onAccept} busy={busy}>
                Принять демо-предложение
              </Button>
            )}
            <Button
              variant="secondary"
              icon={Download}
              onClick={() =>
                download("demo-offer.json", {
                  type: "DEMO",
                  application_id: item.id,
                  offer: item.offer,
                })
              }
            >
              Скачать пример условий
            </Button>
          </section>
        ) : (
          <div>
            {!demo &&
            [
              "DECISION",
              "MANUAL_REVIEW",
              "REJECTED",
              "NEED_MORE_DATA",
            ].includes(item.status) ? (
              <Decision
                item={item}
                decision={decision}
                error={decisionError}
                requiredFields={requiredFields}
                loading={loading}
                busy={busy}
                onRefresh={onRefresh}
                onFinancials={onFinancials}
                onSubmit={onSubmit}
              />
            ) : (
              <div className="panel processing-note">
                <span className="processing-icon">
                  <Clock3 size={23} />
                </span>
                <div>
                  <h3>
                    {item.status === "DRAFT"
                      ? "Черновик сохранён"
                      : completed
                        ? "Заявка завершена"
                        : item.status === "REJECTED"
                          ? "Получено решение"
                          : item.status === "NEED_MORE_DATA"
                            ? "Нужно дополнить данные"
                            : "Ожидаем решение по заявке"}
                  </h3>
                  <p>
                    {item.status === "DRAFT"
                      ? "Можно вернуться к заполнению и отправить заявку позже."
                      : completed
                        ? "Подробности доступны в сохранённой сводке заявки."
                        : item.status === "REJECTED"
                          ? "По этой заявке получен отказ. Уточните доступные варианты у команды проекта."
                          : item.status === "NEED_MORE_DATA"
                            ? "Уточните сведения о компании и проверьте финансовые показатели."
                            : "Как только решение и условия появятся, вы увидите их здесь. Пока заявку не нужно отправлять повторно."}
                  </p>
                  {demo && item.status !== "DRAFT" && !completed && (
                    <button
                      className="text-button"
                      onClick={onExample}
                      disabled={busy}
                    >
                      Показать демо-предложение
                      <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              </div>
            )}
            <EventHistory
              events={events}
              error={historyError}
              loading={loading}
              onRetry={onRefresh}
            />
          </div>
        )}
      </div>
      {hasOffer && (
        <EventHistory
          events={events}
          error={historyError}
          loading={loading}
          onRetry={onRefresh}
        />
      )}
    </>
  );
}
export function Documents({ data }) {
  const docs = [
    {
      title: "Карточка компании",
      description: "Реквизиты и сведения о компании",
      value: data.company,
      file: "company.json",
      icon: Building2,
    },
    {
      title: "Финансовые показатели",
      description: "Выручка, прибыль, расходы и обязательства",
      value: data.financials,
      file: "financials.json",
      icon: ChartNoAxesCombined,
    },
    {
      title: "Мои заявки",
      description: "Заявки, суммы, сроки и текущие статусы",
      value: data.applications,
      file: "applications.json",
      icon: FileText,
    },
  ];
  return (
    <>
      <PageHeading
        title="Всё важное под рукой."
        description="Сохраните свои данные и сводки заявок на компьютер."
      />
      <div className="document-grid">
        {docs.map((d) => (
          <article className="panel document-card" key={d.file}>
            <span className="product-icon">
              <d.icon size={23} />
            </span>
            <span className="document-type">JSON</span>
            <h2>{d.title}</h2>
            <p>{d.description}</p>
            <Button
              variant="secondary"
              icon={Download}
              onClick={() => download(d.file, d.value)}
              disabled={!d.value}
            >
              {d.value ? "Скачать файл" : "Нет данных"}
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}
