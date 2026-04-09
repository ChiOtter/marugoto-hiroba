import { useEffect } from "react";
import type { DailySummary } from "../mocks/dailySummary";
import "./ProfileModal.css";

type DailySummaryModalProps = {
  summary: DailySummary;
  onClose: () => void;
};

function DailySummaryModal({ summary, onClose }: DailySummaryModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div
        className="profile-modal profile-modal--wide"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="profile-modal__header">
          <div>
            <p className="profile-modal__eyebrow">Daily Summary</p>
            <h2 className="profile-modal__title">今日のふりかえり</h2>
            <p className="profile-modal__description">
              今日の接続状況をもとにした、概算ベースのふりかえりです。
            </p>
          </div>
          <button
            type="button"
            className="profile-modal__close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="profile-modal__body">
          <div className="daily-summary__hero">
            <span className="daily-summary__date">{summary.dateLabel}</span>
          </div>

          <div className="daily-summary__stats">
            <StatCard label="自分の接続時間" value={summary.ownConnectionTime} />
            <StatCard
              label="他人との接続時間合計"
              value={summary.sharedConnectionTime}
            />
            <StatCard
              label="接続時間差"
              value={summary.timeDifference}
            />
          </div>

          <section className="daily-summary__closest">
            <div className="daily-summary__closest-header">
              <p className="daily-summary__closest-label">最も接続時間が近かった人</p>
              <h3 className="daily-summary__closest-title">
                {summary.closestPerson.displayName}
              </h3>
            </div>

            <div className="daily-summary__person">
              <div className="daily-summary__avatar">
                {summary.closestPerson.iconUrl || summary.closestPerson.photoURL ? (
                  <img
                    src={summary.closestPerson.iconUrl || summary.closestPerson.photoURL}
                    alt={summary.closestPerson.displayName}
                  />
                ) : (
                  <span>{getInitials(summary.closestPerson.displayName)}</span>
                )}
              </div>

              <div className="daily-summary__person-info">
                <p className="daily-summary__person-name">
                  {summary.closestPerson.displayName}
                </p>
                <p className="daily-summary__person-meta">
                  {summary.closestPerson.grade} / {summary.closestPerson.sp}
                </p>
                <p className="daily-summary__person-comment">
                  {summary.closestPerson.comment || "一言はまだありません"}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="daily-summary__stat-card">
      <span className="daily-summary__stat-label">{label}</span>
      <strong className="daily-summary__stat-value">{value}</strong>
    </div>
  );
}

const getInitials = (name: string): string => {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 2).toUpperCase() : "?";
};

export default DailySummaryModal;
