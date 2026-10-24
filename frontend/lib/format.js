export const money = (value) =>
  Number.isFinite(Number(value))
    ? new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
      }).format(Number(value))
    : "—";
export const number = (value) =>
  value == null ? "—" : new Intl.NumberFormat("ru-RU").format(Number(value));
export const date = (value) =>
  value && Number.isFinite(new Date(value).getTime())
    ? new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Moscow",
      }).format(new Date(value))
    : "—";
export const time = (value) =>
  value && Number.isFinite(new Date(value).getTime())
    ? new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Moscow",
      }).format(new Date(value))
    : "—";
export const payment = (amount, months, rate) => {
  const r = Number(rate) / 1200;
  return months > 0
    ? Math.round(
        r === 0
          ? amount / months
          : (amount * r) / (1 - Math.pow(1 + r, -months)),
      )
    : 0;
};
export const status = {
  DRAFT: ["Черновик", "neutral"],
  SUBMITTED: ["Заявка отправлена", "pending"],
  VALIDATION: ["Проверка данных", "pending"],
  DATA_CHECK: ["Проверка данных", "pending"],
  DATA_ENRICHMENT: ["Подготовка данных", "pending"],
  SCORING: ["Оценка риска", "pending"],
  DECISION: ["Решение получено", "good"],
  MANUAL_REVIEW: ["Ручная проверка", "pending"],
  OFFER: ["Есть предложение", "good"],
  APPROVED: ["Предварительно одобрено", "good"],
  CONDITIONAL_APPROVAL: ["Требуется ручная проверка", "pending"],
  NEED_MORE_DATA: ["Нужны данные", "pending"],
  REJECTED: ["Не одобрено", "danger"],
  COMPLETED: ["Завершено", "good"],
  CANCELLED: ["Отменено", "neutral"],
};
export function download(name, data, mime = "application/json;charset=utf-8") {
  const content =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
