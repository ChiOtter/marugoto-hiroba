import "./DateBadge.css";

type DateBadgeProps = {
  onClick?: () => void;
};

function DateBadge({ onClick }: DateBadgeProps) {
  const today = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());

  return (
    <button
      type="button"
      className="date-badge"
      aria-label={`今日の日付 ${today}`}
      onClick={onClick}
    >
      <span className="date-badge__label">Today</span>
      <strong className="date-badge__value">{today}</strong>
    </button>
  );
}

export default DateBadge;
