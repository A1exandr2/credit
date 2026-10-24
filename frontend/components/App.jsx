"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Building2,
  ChartNoAxesCombined,
  Check,
  CircleHelp,
  ClipboardList,
  FileDown,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Server,
  UserRound,
  X,
} from "lucide-react";
import Auth from "./Auth";
import {
  Badge,
  Brand,
  Button,
  Dialog,
  Empty,
  ErrorBox,
  PageHeading,
  Skeleton,
  Toast,
} from "./UI";
import {
  ApplicationDetail,
  ApplicationForm,
  Applications,
  Company,
  CreditHistory,
  Documents,
  Finances,
  LinkCompany,
  Overview,
  Products,
} from "./Views";
import { ApiError, createApi } from "../lib/api";
import { createDemo } from "../lib/demo";
import { money, time } from "../lib/format";
const TOKEN = "alfa-local-api-token",
  DEMO_SESSION = "alfa-local-demo-session";
const emptyData = () => ({
  company: null,
  financials: null,
  creditHistory: null,
  products: [],
  applications: [],
});
const emptyDetail = () => ({
  item: null,
  events: [],
  error: null,
  historyError: null,
  decision: null,
  decisionError: null,
  requiredFields: [],
  loading: false,
});
const nav = [
  ["overview", "Главная", LayoutDashboard],
  ["products", "Кредитные продукты", Landmark],
  ["applications", "Мои заявки", FileText],
  ["company", "Компания", Building2],
  ["finances", "Финансовые данные", ChartNoAxesCombined],
  ["credit-history", "Кредитная история", ClipboardList],
  ["documents", "Документы", FileDown],
];
const pending = [
  "SUBMITTED",
  "VALIDATION",
  "DATA_CHECK",
  "DATA_ENRICHMENT",
  "SCORING",
  "MANUAL_REVIEW",
];
function savedGet(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function savedSet(key, value) {
  try {
    value == null
      ? sessionStorage.removeItem(key)
      : sessionStorage.setItem(key, value);
  } catch {}
}
function parseRoute() {
  const [page, query] = (location.hash.slice(1) || "overview").split("?");
  const params = new URLSearchParams(query);
  return {
    page: [...nav.map((n) => n[0]), "new", "application"].includes(page)
      ? page
      : "overview",
    id: params.get("id") || "",
    product: params.get("product") || "",
  };
}
export default function App() {
  const demo = useMemo(() => createDemo(), []);
  const [mode, setMode] = useState("api"),
    [offline, setOffline] = useState(false),
    [ready, setReady] = useState(false);
  const [user, setUser] = useState(null),
    [token, setToken] = useState(""),
    [authError, setAuthError] = useState(null);
  const [data, setData] = useState(emptyData),
    [errors, setErrors] = useState({}),
    [loading, setLoading] = useState(false);
  const [route, setRoute] = useState({ page: "overview", id: "", product: "" }),
    [detail, setDetail] = useState(emptyDetail);
  const [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState(null),
    [menu, setMenu] = useState(false);
  const [modal, setModal] = useState(null),
    [health, setHealth] = useState(null),
    [toast, setToast] = useState(""),
    [revision, setRevision] = useState(0);
  const epoch = useRef(0),
    loadEpoch = useRef(0),
    controller = useRef(null),
    toastTimer = useRef(null);
  const gateway = useCallback(
    () =>
      mode === "demo" ? demo : createApi(token, controller.current?.signal),
    [mode, token, demo],
  );
  const notify = useCallback((message) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(""), 4200);
  }, []);
  const go = useCallback((page, params = {}) => {
    const next = { page, id: params.id || "", product: params.product || "" };
    const query = new URLSearchParams();
    if (next.id) query.set("id", next.id);
    if (next.product) query.set("product", next.product);
    setRoute(next);
    setMenu(false);
    setActionError(null);
    location.hash = page + (query.size ? "?" + query.toString() : "");
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  useEffect(() => {
    const change = () => {
      setRoute(parseRoute());
      setMenu(false);
      setActionError(null);
    };
    change();
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    const aborter = new AbortController();
    controller.current = aborter;
    let active = true;
    const isOffline = window.__ALFA_OFFLINE__ === true;
    setOffline(isOffline);
    async function restore() {
      try {
        if (savedGet(DEMO_SESSION) === "1") {
          const profile = await demo.me();
          if (active) {
            setMode("demo");
            setUser(profile);
          }
        } else if (!isOffline && savedGet(TOKEN)) {
          const stored = savedGet(TOKEN);
          const profile = await createApi(stored, aborter.signal).me();
          if (!profile?.id) throw new ApiError("Не удалось получить профиль.");
          if (active) {
            setToken(stored);
            setUser(profile);
          }
        } else if (isOffline) setMode("demo");
      } catch (error) {
        if (!active) return;
        if (error.status === 401) savedSet(TOKEN, null);
        setAuthError(
          new Error(
            error.status === 401
              ? "Сессия завершена. Войдите ещё раз."
              : error.message,
          ),
        );
      } finally {
        if (active) setReady(true);
      }
    }
    restore();
    return () => {
      active = false;
      aborter.abort();
      clearTimeout(toastTimer.current);
    };
  }, [demo]);
  function logout(message = "") {
    epoch.current++;
    loadEpoch.current++;
    controller.current?.abort();
    controller.current = new AbortController();
    savedSet(TOKEN, null);
    savedSet(DEMO_SESSION, null);
    setUser(null);
    setToken("");
    setData(emptyData());
    setErrors({});
    setDetail(emptyDetail());
    setBusy(false);
    setLoading(false);
    setActionError(null);
    setAuthError(message ? new Error(message) : null);
    setModal(null);
    setMenu(false);
    setMode(offline ? "demo" : "api");
    go("overview");
  }
  function expired(error) {
    if (error.status === 401 && mode === "api") {
      logout("Сессия завершена. Войдите ещё раз.");
      return true;
    }
    return false;
  }
  const loadAll = useCallback(async () => {
    if (!user) return;
    const current = epoch.current,
      requestId = ++loadEpoch.current;
    const api = gateway();
    setLoading(true);
    const jobs = [
      ["products", api.products],
      ["applications", api.applications],
    ];
    if (user.company_id)
      jobs.push(
        ["company", api.company],
        ["financials", api.financials],
        ["creditHistory", api.creditHistory],
      );
    const results = await Promise.allSettled(jobs.map(([, fn]) => fn()));
    if (current !== epoch.current || requestId !== loadEpoch.current) return;
    const denied = results.find(
      (r) => r.status === "rejected" && r.reason.status === 401,
    );
    if (denied) {
      epoch.current++;
      controller.current?.abort();
      controller.current = new AbortController();
      savedSet(TOKEN, null);
      setUser(null);
      setToken("");
      setAuthError(new Error("Сессия завершена. Войдите ещё раз."));
      setData(emptyData());
      setDetail(emptyDetail());
      setErrors({});
      setActionError(null);
      setBusy(false);
      setLoading(false);
      return;
    }
    const patch = {},
      nextErrors = {};
    results.forEach((result, i) => {
      if (result.status === "fulfilled") patch[jobs[i][0]] = result.value;
      else if (result.reason.name !== "AbortError")
        nextErrors[jobs[i][0]] = result.reason;
    });
    setData((old) => ({ ...old, ...patch }));
    setErrors(nextErrors);
    setLoading(false);
  }, [user?.id, user?.company_id, gateway]);
  useEffect(() => {
    if (user) loadAll();
  }, [loadAll, user?.id]);
  useEffect(() => {
    if (!user || !route.id || !["application", "new"].includes(route.page))
      return;
    let active = true;
    const current = epoch.current;
    const api = gateway();
    setDetail((old) => ({
      ...emptyDetail(),
      item: old.item?.id === route.id ? old.item : null,
      loading: true,
    }));
    Promise.allSettled([api.application(route.id), api.history(route.id)]).then(
      async (results) => {
        if (!active || current !== epoch.current) return;
        const denied = results.find(
          (r) => r.status === "rejected" && r.reason.status === 401,
        );
        if (denied) {
          logout("Сессия завершена. Войдите ещё раз.");
          return;
        }
        const item =
          results[0].status === "fulfilled" ? results[0].value : null;
        const events =
          results[1].status === "fulfilled" ? results[1].value : [];
        let decision = null;
        let decisionError = null;
        if (
          mode === "api" &&
          ["DECISION", "MANUAL_REVIEW", "REJECTED"].includes(item?.status)
        ) {
          try {
            decision = await api.decision(route.id);
          } catch (error) {
            if (!active || current !== epoch.current) return;
            if (error.status === 401) {
              logout("Сессия завершена. Войдите ещё раз.");
              return;
            }
            decisionError = error;
          }
        }
        if (!active || current !== epoch.current) return;
        const dataRequest = events
          .filter((event) => event.event_type === "APPLICATION_DATA_REQUIRED")
          .sort((a, b) => a.sequence - b.sequence)
          .at(-1);
        setDetail((old) => ({
          item:
            results[0].status === "fulfilled"
              ? results[0].value
              : results[0].reason.status === 404
                ? null
                : old.item,
          error: results[0].status === "rejected" ? results[0].reason : null,
          events,
          historyError:
            results[1].status === "rejected" ? results[1].reason : null,
          decision: item ? decision : old.decision,
          decisionError,
          requiredFields:
            item?.status === "NEED_MORE_DATA"
              ? dataRequest?.details?.required_fields || old.requiredFields
              : [],
          loading: false,
        }));
      },
    );
    return () => {
      active = false;
    };
  }, [route.page, route.id, user?.id, gateway, revision, mode]);
  useEffect(() => {
    if (
      !user ||
      route.page !== "application" ||
      !pending.includes(detail.item?.status) ||
      busy
    )
      return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") setRevision((n) => n + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, [route.page, user?.id, detail.item?.status, busy]);
  useEffect(() => {
    if (!menu) return;
    const before = document.body.style.overflow,
      previous = document.activeElement,
      sidebar = document.getElementById("app-sidebar");
    document.body.style.overflow = "hidden";
    const focusable = () =>
      [...sidebar.querySelectorAll("button:not([disabled]),a[href]")].filter(
        (el) => el.getClientRects().length,
      );
    focusable()[0]?.focus();
    const key = (e) => {
      if (e.key === "Escape") setMenu(false);
      if (e.key === "Tab") {
        const list = focusable();
        if (!list.length) return;
        if (e.shiftKey && document.activeElement === list[0]) {
          e.preventDefault();
          list.at(-1).focus();
        } else if (!e.shiftKey && document.activeElement === list.at(-1)) {
          e.preventDefault();
          list[0].focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus();
    };
  }, [menu]);
  async function authenticate(method, values) {
    const current = epoch.current;
    setBusy(true);
    setAuthError(null);
    try {
      const result = await gateway()[method](values);
      if (current !== epoch.current) return;
      if (!result?.user?.id || (mode === "api" && !result.access_token))
        throw new Error("Сервер вернул неполный ответ.");
      if (mode === "api") {
        setToken(result.access_token);
        savedSet(TOKEN, result.access_token);
        savedSet(DEMO_SESSION, null);
      } else savedSet(DEMO_SESSION, "1");
      setData(emptyData());
      setDetail(emptyDetail());
      setErrors({});
      setActionError(null);
      setUser(result.user);
      go(result.user.company_id ? "overview" : "company");
    } catch (error) {
      if (current === epoch.current) setAuthError(error);
    } finally {
      if (current === epoch.current) setBusy(false);
    }
  }
  async function enterDemo() {
    const current = ++epoch.current;
    controller.current?.abort();
    controller.current = new AbortController();
    setBusy(true);
    setAuthError(null);
    savedSet(TOKEN, null);
    setToken("");
    try {
      const profile = await demo.enter();
      if (current !== epoch.current) return;
      setMode("demo");
      savedSet(DEMO_SESSION, "1");
      setData(emptyData());
      setDetail(emptyDetail());
      setErrors({});
      setActionError(null);
      setUser(profile);
      go(profile.company_id ? "overview" : "company");
    } finally {
      if (current === epoch.current) setBusy(false);
    }
  }
  async function linkCompany(inn) {
    const current = epoch.current;
    setBusy(true);
    setActionError(null);
    try {
      const company = await gateway().link(inn);
      if (current !== epoch.current) return;
      setData((old) => ({ ...old, company }));
      setUser((old) => ({ ...old, company_id: company.id }));
      notify("Компания привязана");
    } catch (error) {
      if (current === epoch.current && !expired(error)) setActionError(error);
    } finally {
      if (current === epoch.current) setBusy(false);
    }
  }
  async function saveFinancials(values) {
    const current = epoch.current;
    setBusy(true);
    setActionError(null);
    try {
      const financials = await gateway().saveFinancials(values);
      if (current !== epoch.current) return false;
      setData((old) => ({ ...old, financials }));
      notify("Финансовые данные сохранены");
      return true;
    } catch (error) {
      if (current === epoch.current && !expired(error)) setActionError(error);
      return false;
    } finally {
      if (current === epoch.current) setBusy(false);
    }
  }
  function upsert(item) {
    setData((old) => ({
      ...old,
      applications: [item, ...old.applications.filter((a) => a.id !== item.id)],
    }));
    setDetail((old) => ({
      ...old,
      item,
      decision: item.decision === undefined ? old.decision : item.decision,
      requiredFields: item.required_fields || [],
    }));
  }
  async function saveApplication(values, send, id) {
    const current = epoch.current;
    setBusy(true);
    setActionError(null);
    let draft;
    try {
      const api = gateway();
      draft = id
        ? await api.updateApplication(id, values)
        : await api.createApplication(values);
      if (current !== epoch.current) return;
      upsert(draft);
      go("application", { id: draft.id });
      if (send) {
        const item = await api.submit(draft.id);
        if (current !== epoch.current) return;
        upsert(item);
        notify(
          item.status === "NEED_MORE_DATA"
            ? "Для рассмотрения нужно дополнить финансовые данные"
            : "Заявка отправлена",
        );
      } else notify("Черновик сохранён");
      setRevision((n) => n + 1);
    } catch (error) {
      if (current === epoch.current && !expired(error)) {
        setActionError(error);
        if (draft)
          notify(
            "Черновик сохранён. Обновите статус перед повторной отправкой.",
          );
      }
    } finally {
      if (current === epoch.current) setBusy(false);
    }
  }
  async function submitDraft() {
    if (!detail.item) return;
    const current = epoch.current;
    setBusy(true);
    setActionError(null);
    try {
      const item = await gateway().submit(detail.item.id);
      if (current !== epoch.current) return;
      upsert(item);
      setRevision((n) => n + 1);
      notify(
        item.status === "NEED_MORE_DATA"
          ? "Для рассмотрения нужно дополнить финансовые данные"
          : "Заявка отправлена",
      );
    } catch (error) {
      if (current === epoch.current && !expired(error)) setActionError(error);
    } finally {
      if (current === epoch.current) setBusy(false);
    }
  }
  async function demoAction(action) {
    if (mode !== "demo" || !detail.item) return;
    const current = epoch.current;
    setBusy(true);
    try {
      const item = await demo[action](detail.item.id);
      if (current !== epoch.current) return;
      upsert(item);
      setRevision((n) => n + 1);
      setModal(null);
      notify(
        action === "accept"
          ? "Демо-предложение принято"
          : "Открыт демонстрационный пример",
      );
    } catch (error) {
      setActionError(error);
    } finally {
      if (current === epoch.current) setBusy(false);
    }
  }
  function selectProduct(product, draft) {
    if (!product) {
      notify("Обновите каталог и выберите доступный продукт");
      go("products");
      return;
    }
    go("new", { product: product.id, id: draft?.id });
  }
  async function checkConnection() {
    setModal("connection");
    setHealth({ pending: true });
    try {
      const result = await createApi().health();
      setHealth({ ok: result.status === "ok" });
    } catch (error) {
      setHealth({ error: error.message });
    }
  }
  const refresh = () => {
    loadAll();
    setRevision((n) => n + 1);
    setActionError(null);
  };
  const linked = !!user?.company_id;
  let content = null;
  if (user) {
    if (route.page === "overview")
      content = (
        <Overview
          data={data}
          errors={errors}
          loading={loading}
          onNavigate={go}
          onSelect={selectProduct}
          onOpen={(id) => go("application", { id })}
          onRetry={refresh}
        />
      );
    else if (route.page === "products")
      content = (
        <Products
          products={data.products}
          error={errors.products}
          loading={loading}
          onSelect={selectProduct}
          onRetry={refresh}
        />
      );
    else if (route.page === "applications")
      content = (
        <Applications
          items={data.applications}
          products={data.products}
          error={errors.applications}
          loading={loading}
          onOpen={(id) => go("application", { id })}
          onCreate={() => go("products")}
          onRetry={refresh}
        />
      );
    else if (["company", "finances", "credit-history"].includes(route.page)) {
      const title =
        route.page === "company"
          ? "Компания в деталях."
          : route.page === "finances"
            ? "Цифры, на которые можно опереться."
            : "История вашего бизнеса.";
      content = (
        <>
          <PageHeading
            title={title}
            description={data.company?.name || "Данные вашей компании"}
            action={
              linked ? (
                <Button
                  variant="secondary"
                  icon={RefreshCw}
                  busy={loading}
                  onClick={refresh}
                >
                  Обновить
                </Button>
              ) : null
            }
          />
          {!linked ? (
            <LinkCompany onLink={linkCompany} busy={busy} error={actionError} />
          ) : route.page === "company" ? (
            <Company
              company={data.company}
              error={errors.company}
              loading={loading}
              onRetry={refresh}
              onNavigate={go}
            />
          ) : route.page === "finances" ? (
            <Finances
              financials={data.financials}
              error={errors.financials}
              loading={loading}
              onRetry={refresh}
              onSave={saveFinancials}
              busy={busy}
              saveError={actionError}
            />
          ) : (
            <CreditHistory
              data={data.creditHistory}
              error={errors.creditHistory}
              loading={loading}
              onRetry={refresh}
            />
          )}
        </>
      );
    } else if (route.page === "documents") content = <Documents data={data} />;
    else if (route.page === "new") {
      const draft =
        route.id && detail.item?.id === route.id ? detail.item : null;
      const product =
        data.products.find(
          (p) => p.id === (route.product || draft?.product_id),
        ) || data.products[0];
      if (!linked)
        content = (
          <>
            <PageHeading
              title="Познакомимся с вашим бизнесом."
              description="Для заявки нужна привязанная компания."
            />
            <LinkCompany onLink={linkCompany} busy={busy} error={actionError} />
          </>
        );
      else if (route.id && detail.error)
        content = <ErrorBox error={detail.error} onRetry={refresh} />;
      else if (loading || (route.id && !draft))
        content = <Skeleton className="large-skeleton" />;
      else if (draft && draft.status !== "DRAFT")
        content = (
          <Empty
            icon={FileText}
            title="Эта заявка уже отправлена"
            action={
              <Button onClick={() => go("application", { id: draft.id })}>
                Открыть заявку
              </Button>
            }
          >
            Редактировать можно только черновики.
          </Empty>
        );
      else if (!product)
        content = (
          <Empty
            icon={Landmark}
            title="Сначала выберите продукт"
            action={<Button onClick={() => go("products")}>К продуктам</Button>}
          >
            Обновите каталог и выберите доступное предложение.
          </Empty>
        );
      else
        content = (
          <ApplicationForm
            key={`${draft?.id || "new"}-${product.id}`}
            product={product}
            products={data.products}
            draft={draft}
            onSave={saveApplication}
            busy={busy}
            error={actionError}
            onBack={() => go("products")}
            onProduct={selectProduct}
          />
        );
    } else if (route.page === "application") {
      if (!route.id)
        content = (
          <Empty
            icon={FileText}
            title="Выберите заявку"
            action={
              <Button onClick={() => go("applications")}>Мои заявки</Button>
            }
          >
            Здесь появится её карточка.
          </Empty>
        );
      else if (detail.error && !detail.item)
        content = <ErrorBox error={detail.error} onRetry={refresh} />;
      else if (!detail.item || detail.item.id !== route.id)
        content = <Skeleton className="large-skeleton" />;
      else
        content = (
          <>
            <ErrorBox
              error={actionError || detail.error}
              onRetry={refresh}
              title={actionError ? "Не удалось выполнить действие" : undefined}
            />
            <ApplicationDetail
              item={detail.item}
              products={data.products}
              events={detail.events}
              historyError={detail.historyError}
              decision={detail.decision}
              decisionError={detail.decisionError}
              requiredFields={detail.requiredFields}
              loading={detail.loading}
              onRefresh={refresh}
              onEdit={() =>
                selectProduct(
                  data.products.find((p) => p.id === detail.item.product_id) ||
                    data.products[0],
                  detail.item,
                )
              }
              onSubmit={submitDraft}
              onExample={() => demoAction("exampleOffer")}
              onAccept={() => setModal("accept")}
              onBack={() => go("applications")}
              onFinancials={() => go("finances")}
              busy={busy}
              demo={mode === "demo"}
            />
          </>
        );
    }
  }
  return (
    <>
      {!user ? (
        <Auth
          onAuth={authenticate}
          onDemo={enterDemo}
          onHelp={() => setModal("help")}
          onConnection={checkConnection}
          error={authError}
          clearError={() => setAuthError(null)}
          ready={ready}
          busy={busy}
          mode={mode}
          offline={offline}
        />
      ) : (
        <div className="workspace">
          <a className="skip-link" href="#main-content">
            Перейти к содержимому
          </a>
          {menu && (
            <button
              className="sidebar-backdrop"
              aria-label="Закрыть меню"
              onClick={() => setMenu(false)}
            />
          )}
          <aside
            id="app-sidebar"
            role={menu ? "dialog" : undefined}
            aria-modal={menu ? true : undefined}
            aria-label="Навигация"
            className={`sidebar ${menu ? "is-open" : ""}`}
          >
            <a
              href="#overview"
              className="brand-link"
              onClick={() => go("overview")}
              aria-label="Альфа — главная"
            >
              <Brand />
            </a>
            <button
              className="sidebar-close icon-button"
              aria-label="Закрыть меню"
              onClick={() => setMenu(false)}
            >
              <X size={21} />
            </button>
            <span className="nav-eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</span>
            <nav aria-label="Основное меню">
              {nav.map(([id, label, Icon]) => (
                <button
                  key={id}
                  className={
                    route.page === id ||
                    (id === "applications" && route.page === "application") ||
                    (id === "products" && route.page === "new")
                      ? "active"
                      : ""
                  }
                  aria-current={route.page === id ? "page" : undefined}
                  onClick={() => go(id)}
                >
                  <Icon size={19} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            <button className="sidebar-help" onClick={() => setModal("help")}>
              <strong>Один кабинет.</strong>
              <span>Больше возможностей.</span>
              <ArrowMark />
            </button>
            <div className="sidebar-bottom">
              <span>На вашей стороне.</span>
              <button
                className="icon-button"
                onClick={() => logout()}
                aria-label="Выйти из аккаунта"
              >
                <LogOut size={17} />
              </button>
            </div>
          </aside>
          <div className="workspace-body" inert={menu}>
            <header className="workspace-header">
              <button
                className="mobile-menu icon-button"
                aria-label="Открыть меню"
                aria-expanded={menu}
                onClick={() => setMenu(!menu)}
              >
                <Menu size={22} />
              </button>
              <button className="company-switch" onClick={() => go("company")}>
                <Building2 size={23} />
                <span>
                  <strong>
                    {data.company?.name ||
                      (linked ? "Ваша компания" : "Добавить компанию")}
                  </strong>
                  <small>
                    {data.company?.inn
                      ? `ИНН ${data.company.inn}`
                      : "Кабинет предпринимателя"}
                  </small>
                </span>
              </button>
              <div className="header-actions">
                <button
                  className={`mode-pill ${mode === "demo" ? "demo" : ""}`}
                  onClick={() => setModal("mode")}
                >
                  <span />
                  {mode === "demo" ? "Демо-режим" : "Сервер команды"}
                </button>
                <button
                  className="icon-button"
                  aria-label="События заявок"
                  onClick={() => setModal("notifications")}
                >
                  <Bell size={20} />
                </button>
                <button
                  className="profile-button"
                  aria-label="Открыть профиль"
                  onClick={() => setModal("profile")}
                >
                  {user.full_name
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "А"}
                </button>
              </div>
            </header>
            {mode === "demo" && (
              <div className="demo-banner">
                <span>
                  Демонстрация: все данные и предложения — примеры. Изменения
                  сохраняются в этом браузере.
                </span>
                <button onClick={() => setModal("mode")}>
                  О режиме
                  <CircleHelp size={13} />
                </button>
              </div>
            )}
            {mode === "api" && data.company?.data_source === "DEMO" && (
              <div className="source-banner">
                Сервис компании возвращает демонстрационные сведения.
              </div>
            )}
            <main id="main-content" className="main-content">
              {content}
            </main>
            <footer className="workspace-footer">
              <span>Альфа · Бизнес начинается с вас.</span>
              <button onClick={() => setModal("help")}>
                Помощь
                <CircleHelp size={13} />
              </button>
            </footer>
          </div>
        </div>
      )}
      {modal === "help" && (
        <Dialog
          title="От первого входа к большим планам."
          onClose={() => setModal(null)}
        >
          <div className="help-items">
            <section>
              <UserRound size={22} />
              <div>
                <h3>Создайте аккаунт</h3>
                <p>
                  Укажите имя, почту и пароль. Если аккаунт уже есть — войдите.
                </p>
              </div>
            </section>
            <section>
              <Building2 size={22} />
              <div>
                <h3>Добавьте компанию</h3>
                <p>
                  Привяжите её по ИНН, проверьте реквизиты и финансовые
                  показатели.
                </p>
              </div>
            </section>
            <section>
              <FileText size={22} />
              <div>
                <h3>Выберите подходящий продукт</h3>
                <p>
                  Сохраните черновик или отправьте заявку. Её история и статус
                  появятся в кабинете.
                </p>
              </div>
            </section>
          </div>
          <button className="text-button" onClick={checkConnection}>
            <Server size={16} />
            Проверить подключение к серверу
          </button>
        </Dialog>
      )}
      {modal === "connection" && (
        <Dialog title="Подключение к сервису" onClose={() => setModal(null)}>
          <div className="connection-state">
            <Server size={29} />
            <h3>
              {health?.pending
                ? "Проверяем подключение…"
                : health?.ok
                  ? "Сервер доступен"
                  : "Нет подключения"}
            </h3>
            <p>
              {health?.error ||
                "Для входа и работы с данными нужен запущенный сервер команды."}
            </p>
          </div>
          <p className="muted">
            {offline
              ? "Этот файл работает без сервера. Для подключения к API запустите START-WINDOWS.cmd в папке проекта."
              : "Адрес сервера задаётся в frontend/.env.local через BACKEND_URL. По умолчанию используется http://127.0.0.1:8080."}
          </p>
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={checkConnection}
            busy={health?.pending}
          >
            Проверить ещё раз
          </Button>
        </Dialog>
      )}
      {modal === "mode" && (
        <Dialog title="Режим работы" onClose={() => setModal(null)}>
          <div className="mode-explanation">
            <h3>Демонстрация</h3>
            <p>
              Позволяет посмотреть все экраны без сервера. Здесь используются
              примеры данных. Пароли не проверяются, данные не отправляются в
              API.
            </p>
            <h3>Сервер команды</h3>
            <p>
              Регистрация, данные компании и заявки работают через API. Статусы
              возвращает сервер; демонстрационные предложения в этом режиме не
              появляются.
            </p>
            {offline && (
              <p>
                Для подключения к серверу используйте START-WINDOWS.cmd из папки
                проекта.
              </p>
            )}
          </div>
          <div className="dialog-footer">
            <Button
              variant="secondary"
              onClick={() => {
                setModal(null);
                logout();
              }}
            >
              Выйти на страницу входа
            </Button>
          </div>
        </Dialog>
      )}
      {modal === "profile" && user && (
        <Dialog
          title="Ваш аккаунт"
          onClose={() => setModal(null)}
          footer={
            <Button variant="secondary" icon={LogOut} onClick={() => logout()}>
              Выйти из аккаунта
            </Button>
          }
        >
          <dl className="profile-details">
            <div>
              <dt>Имя и фамилия</dt>
              <dd>{user.full_name}</dd>
            </div>
            <div>
              <dt>Почта</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Компания</dt>
              <dd>{data.company?.name || "Не привязана"}</dd>
            </div>
          </dl>
          <Badge tone={mode === "demo" ? "pending" : "good"}>
            {mode === "demo" ? "Демонстрационный профиль" : "Аккаунт сервера"}
          </Badge>
        </Dialog>
      )}
      {modal === "notifications" && (
        <Dialog title="События ваших заявок" onClose={() => setModal(null)}>
          {data.applications.length ? (
            <div className="notification-list">
              {data.applications.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setModal(null);
                    go("application", { id: item.id });
                  }}
                >
                  <FileText size={19} />
                  <span>
                    <strong>{money(item.requested_amount)}</strong>
                    <small>{time(item.updated_at)}</small>
                  </span>
                  <Badge value={item.status} />
                </button>
              ))}
            </div>
          ) : (
            <Empty icon={Bell} title="Здесь пока тихо">
              После создания заявки здесь появятся её события.
            </Empty>
          )}
        </Dialog>
      )}
      {modal === "accept" && (
        <Dialog
          title="Принять демо-предложение?"
          onClose={() => {
            if (!busy) setModal(null);
          }}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setModal(null)}
                disabled={busy}
              >
                Вернуться
              </Button>
              <Button onClick={() => demoAction("accept")} busy={busy}>
                Принять пример
              </Button>
            </>
          }
        >
          <p>
            В демонстрации заявка получит статус «Завершено». Это пример
            интерфейса: изменения останутся только в вашем браузере.
          </p>
        </Dialog>
      )}
      <Toast message={toast} />
    </>
  );
}
function ArrowMark() {
  return (
    <span aria-hidden="true">
      <ArrowUpRight size={16} />
    </span>
  );
}
