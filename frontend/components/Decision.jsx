import { Badge, Button, ErrorBox, Skeleton } from "./UI";
import { number, time } from "../lib/format";

const outcomes = {
  APPROVED: ["Положительное решение", "good"],
  CONDITIONAL_APPROVAL: ["Нужна ручная проверка", "pending"],
  REJECTED: ["Заявка не одобрена", "danger"],
};
const riskLevels = { Low: "Низкий", Medium: "Средний", High: "Высокий" };
const fieldNames = { "financials.revenue_annual": "Выручка за год" };

export default function Decision({
  item,
  decision,
  error,
  requiredFields,
  loading,
  busy,
  onRefresh,
  onFinancials,
  onSubmit,
}) {
  if (item.status === "NEED_MORE_DATA") {
    return (
      <section className="panel decision-panel">
        <Badge value={item.status} />
        <h2>Дополните финансовые данные</h2>
        <p>
          Для рассмотрения заявки не хватает показателей компании. Исправьте их
          в разделе финансов, затем вернитесь к этой заявке и отправьте её
          снова.
        </p>
        {!!requiredFields.length && (
          <ul className="decision-list">
            {requiredFields.map((field) => (
              <li key={field}>{fieldNames[field] || field}</li>
            ))}
          </ul>
        )}
        <div className="stack-actions">
          <Button variant="secondary" onClick={onFinancials} disabled={busy}>
            Исправить финансовые данные
          </Button>
          <Button onClick={onSubmit} busy={busy}>
            Повторить рассмотрение
          </Button>
        </div>
      </section>
    );
  }

  if (!["DECISION", "MANUAL_REVIEW", "REJECTED"].includes(item.status)) {
    return null;
  }

  if (error) return <ErrorBox error={error} onRetry={onRefresh} />;
  if (!decision && loading) return <Skeleton className="table-skeleton" />;
  if (!decision) return null;

  const [label, tone] = outcomes[decision.outcome] || [
    decision.outcome,
    "neutral",
  ];
  const wasReviewed =
    decision.outcome === "CONDITIONAL_APPROVAL" &&
    item.status !== "MANUAL_REVIEW";

  return (
    <section className="panel decision-panel">
      <div className="section-heading">
        <h2>Результат скоринга</h2>
        <span className="mini-label">
          {decision.source === "AI" ? "Модель" : "Правила"}
        </span>
      </div>
      <Badge tone={tone}>{label}</Badge>
      <p>{decision.explanation}</p>
      {wasReviewed && (
        <p className="decision-review-note">
          Ручная проверка завершена. Текущий статус заявки — «
          {item.status === "DECISION" ? "Решение получено" : "Не одобрено"}».
          Ниже сохранена исходная рекомендация скоринга.
        </p>
      )}
      <dl className="summary-list">
        <div>
          <dt>Оценка риска</dt>
          <dd>{number(decision.risk_score)} из 100</dd>
        </div>
        <div>
          <dt>Уровень риска</dt>
          <dd>{riskLevels[decision.risk_level] || decision.risk_level}</dd>
        </div>
        <div>
          <dt>Рекомендуемый продукт</dt>
          <dd>{decision.recommended_product}</dd>
        </div>
        <div>
          <dt>Дата решения</dt>
          <dd>{time(decision.created_at)}</dd>
        </div>
      </dl>
      {!!decision.top_factors?.length && (
        <>
          <h3>Что повлияло на оценку</h3>
          <ul className="decision-list">
            {decision.top_factors.map((factor, index) => (
              <li key={index}>{factor}</li>
            ))}
          </ul>
        </>
      )}
      {!!decision.conditions?.length && (
        <>
          <h3>Условия проверки</h3>
          <ul className="decision-list">
            {decision.conditions.map((condition, index) => (
              <li key={index}>{condition}</li>
            ))}
          </ul>
        </>
      )}
      <h3>Следующий шаг</h3>
      <p>{decision.next_step}</p>
      <p className="muted">
        Результат рассмотрения не содержит банковского предложения.
        Окончательные условия кредита в этом ответе отсутствуют.
      </p>
    </section>
  );
}
