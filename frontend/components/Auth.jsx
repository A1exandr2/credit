import { useState } from "react";
import {
  Building2,
  Mail,
  LockKeyhole,
  UserRound,
  Eye,
  EyeOff,
  CircleHelp,
} from "lucide-react";
import { Brand, Button, Field, ErrorBox } from "./UI";
export default function Auth({
  onAuth,
  onDemo,
  onHelp,
  onConnection,
  error,
  clearError,
  ready,
  busy,
  mode,
  offline,
}) {
  const [register, setRegister] = useState(false),
    [visible, setVisible] = useState(false),
    [values, setValues] = useState({ email: "", password: "", full_name: "" });
  const [validation, setValidation] = useState("");
  function update(e) {
    setValues((old) => ({ ...old, [e.target.name]: e.target.value }));
    setValidation("");
    clearError();
  }
  function change(next) {
    setRegister(next);
    setVisible(false);
    setValidation("");
    clearError();
    setValues((old) => ({ ...old, password: "" }));
  }
  function submit(e) {
    e.preventDefault();
    if (register && !values.full_name.trim()) {
      setValidation("Укажите имя и фамилию.");
      return;
    }
    onAuth(register ? "register" : "login", values);
  }
  return (
    <div className="auth-shell">
      <header className="auth-header">
        <a className="brand-link" href="#" aria-label="Альфа — кабинет бизнеса">
          <Brand />
        </a>
        <span className="brand-caption">
          <i />
          ДЛЯ ТЕХ, КТО ДЕЛАЕТ
        </span>
        <button className="help-button" onClick={onHelp}>
          <span>Нужна помощь?</span>
          <CircleHelp size={18} />
        </button>
      </header>
      <main className="auth-main">
        <section className="auth-card" aria-labelledby="auth-heading">
          <div className="auth-eyebrow">
            <span />
            КАБИНЕТ БИЗНЕСА
          </div>
          <h1 id="auth-heading">
            {register ? "Создайте аккаунт" : "С возвращением"}
            <em>.</em>
          </h1>
          <p className="auth-description">
            {register
              ? "Первый шаг к большим планам."
              : "Войдите, чтобы продолжить с главного."}
          </p>
          <div className="auth-tabs" aria-label="Вход или регистрация">
            <span
              className={register ? "active-register" : ""}
              aria-hidden="true"
            />
            {["Войти", "Регистрация"].map((label, i) => (
              <button
                type="button"
                key={label}
                aria-pressed={register === !!i}
                onClick={() => change(!!i)}
                disabled={busy || !ready}
              >
                {label}
              </button>
            ))}
          </div>
          <form onSubmit={submit} aria-busy={busy || !ready}>
            <fieldset disabled={busy || !ready}>
              {register && (
                <Field
                  label="Имя и фамилия"
                  icon={UserRound}
                  error={error?.fields?.full_name}
                >
                  <input
                    name="full_name"
                    value={values.full_name}
                    onChange={update}
                    required
                    maxLength={255}
                    autoComplete="name"
                    placeholder="Иван Иванов"
                  />
                </Field>
              )}
              <Field
                label="Электронная почта"
                icon={Mail}
                error={error?.fields?.email}
              >
                <input
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={update}
                  required
                  maxLength={320}
                  autoCapitalize="none"
                  spellCheck={false}
                  autoComplete={register ? "email" : "username"}
                  placeholder="you@company.ru"
                />
              </Field>
              <Field
                label="Пароль"
                hint={register ? "От 8 символов" : null}
                icon={LockKeyhole}
                error={error?.fields?.password}
              >
                <input
                  name="password"
                  type={visible ? "text" : "password"}
                  value={values.password}
                  onChange={update}
                  required
                  minLength={register ? 8 : 1}
                  maxLength={128}
                  autoComplete={register ? "new-password" : "current-password"}
                  placeholder={register ? "Придумайте пароль" : "Ваш пароль"}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
                  aria-pressed={visible}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </Field>
            </fieldset>
            {(error || validation) && (
              <p className="form-error" role="alert">
                {validation || error.message}
              </p>
            )}
            <Button type="submit" busy={busy || !ready} className="auth-submit">
              {!ready
                ? "Проверяем сессию…"
                : register
                  ? "Создать аккаунт"
                  : "Войти в кабинет"}
            </Button>
            <p className="auth-note">
              <LockKeyhole size={12} />
              {mode === "demo"
                ? "Демо-режим: данные остаются в этом браузере"
                : "Ваше пространство для работы с бизнесом"}
            </p>
          </form>
          <div className="auth-demo">
            <button onClick={onDemo} disabled={busy || !ready}>
              <Building2 size={16} />
              Открыть демонстрацию
            </button>
            <span>Все экраны без регистрации и сервера</span>
          </div>
          <div className="auth-card-footer">
            <span>На вашей стороне.</span>
            <button onClick={onConnection}>Подключение</button>
          </div>
        </section>
      </main>
      <footer className="auth-footer">
        <span>Альфа · Бизнес начинается с вас.</span>
        <span>
          {offline ? "Локальная демонстрация" : "Кабинет предпринимателя"}
        </span>
      </footer>
    </div>
  );
}
