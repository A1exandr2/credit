import { useEffect, useRef } from "react";
import {
  ArrowRight,
  LoaderCircle,
  X,
  AlertCircle,
  RotateCcw,
  Check,
} from "lucide-react";
import { status } from "../lib/format";
export function Brand() {
  return (
    <span className="brand">
      <svg width="30" height="39" viewBox="0 0 32 40" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M12 0h8l12 31h-8l-2-6H10l-2 6H0L12 0Zm0 19h8L16 8l-4 11Z"
        />
        <path d="M1 36h30v4H1z" />
      </svg>
      <span>
        альфа<small>бизнес</small>
      </span>
    </span>
  );
}
export function Button({
  children,
  variant = "primary",
  busy = false,
  icon: Icon,
  arrow = true,
  className = "",
  ...props
}) {
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      className={`button button-${variant} ${className}`}
    >
      <span>
        {Icon && <Icon size={17} aria-hidden="true" />}
        {children}
      </span>
      {busy ? (
        <LoaderCircle size={18} className="spin" aria-hidden="true" />
      ) : Icon ? null : arrow ? (
        <span className="button-arrow">
          <ArrowRight size={17} aria-hidden="true" />
        </span>
      ) : null}
    </button>
  );
}
export function Badge({ value, children, tone }) {
  const meta = status[value] || [value || "", "neutral"];
  return (
    <span className={`badge badge-${tone || meta[1]}`}>
      <span />
      {children || meta[0]}
    </span>
  );
}
export function ErrorBox({
  error,
  onRetry,
  title = "Не получилось загрузить данные",
}) {
  if (!error) return null;
  return (
    <div className="error-box" role="alert">
      <AlertCircle size={19} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{typeof error === "string" ? error : error.message}</p>
        {onRetry && (
          <button className="text-button" onClick={onRetry}>
            <RotateCcw size={14} />
            Повторить
          </button>
        )}
      </div>
    </div>
  );
}
export function Empty({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      {Icon && (
        <span className="empty-icon">
          <Icon size={27} />
        </span>
      )}
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Skeleton({ className = "" }) {
  return (
    <div
      className={`skeleton ${className}`}
      aria-label="Загрузка данных"
      role="status"
    />
  );
}
export function Dialog({ title, children, onClose, footer }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const old = document.activeElement;
    el.showModal();
    return () => {
      el.close();
      if (old?.isConnected) old.focus();
    };
  }, []);
  return (
    <dialog
      className="dialog"
      ref={ref}
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        <h2 id="dialog-title">{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Закрыть">
          <X size={20} />
        </button>
      </div>
      <div className="dialog-body">{children}</div>
      {footer && <div className="dialog-footer">{footer}</div>}
    </dialog>
  );
}
export function PageHeading({ title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <h1 tabIndex={-1} id="page-title">
          {title}
        </h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Source({ value }) {
  return value === "DEMO" ? (
    <span className="source">Демонстрационные данные</span>
  ) : value === "USER_VERIFIED" ? (
    <span className="source">Данные компании</span>
  ) : null;
}
export function Field({ label, hint, error, icon: Icon, children }) {
  return (
    <label className={`field ${error ? "field-error" : ""}`}>
      <span className="field-label">
        {label}
        {hint && <span>{hint}</span>}
      </span>
      <span className="input-wrap">
        {Icon && <Icon size={18} aria-hidden="true" />}
        {children}
      </span>
      {error && <span className="field-message">{error}</span>}
    </label>
  );
}
export function Toast({ message }) {
  return message ? (
    <div className="toast" role="status">
      <Check size={17} />
      {message}
    </div>
  ) : null;
}
