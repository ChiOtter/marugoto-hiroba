import { useEffect, useState } from "react";
import { canLikeToday, sendLike } from "../likes";
import type { UserProfile } from "../users";
import "./ProfileModal.css";

type ProfileViewModalProps = {
  currentUid: string;
  profile: UserProfile;
  onClose: () => void;
};

function ProfileViewModal({
  currentUid,
  profile,
  onClose,
}: ProfileViewModalProps) {
  const [isLikeAvailable, setIsLikeAvailable] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(true);
  const [isLikeSending, setIsLikeSending] = useState(false);
  const [likeMessage, setLikeMessage] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (currentUid === profile.uid) {
        setIsLikeAvailable(false);
        setIsLikeLoading(false);
        setLikeMessage("");
        return;
      }

      setIsLikeLoading(true);
      setLikeMessage("");
      const canLike = await canLikeToday(currentUid, profile.uid);
      setIsLikeAvailable(canLike);
      setIsLikeLoading(false);
    };

    void checkLikeStatus();
  }, [currentUid, profile.uid]);

  const imageUrl = profile.iconUrl || profile.photoURL || "";

  const handleLike = async () => {
    setIsLikeSending(true);
    setLikeMessage("");

    const isSent = await sendLike(currentUid, profile.uid);

    if (isSent) {
      setIsLikeAvailable(false);
      setLikeMessage("いいねを送りました。");
    } else {
      setLikeMessage("いいねの送信に失敗しました。");
      console.error("LIKE ACTION FAILED =", {
        fromUid: currentUid,
        toUid: profile.uid,
      });
    }

    setIsLikeSending(false);
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div
        className="profile-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="profile-modal__header">
          <div>
            <p className="profile-modal__eyebrow">Profile</p>
            <h2 className="profile-modal__title">プロフィール詳細</h2>
            <p className="profile-modal__description">
              いま同じ時間に開いている相手のプロフィールです。
            </p>
          </div>
          <div className="profile-modal__actions">
            {currentUid !== profile.uid && (
              <button
                type="button"
                className={`profile-like-icon${
                  !isLikeAvailable && !isLikeLoading && !isLikeSending
                    ? " profile-like-icon--sent"
                    : ""
                }`}
                disabled={!isLikeAvailable || isLikeLoading || isLikeSending}
                onClick={handleLike}
                aria-label={
                  isLikeLoading
                    ? "いいね状態を確認中"
                    : isLikeSending
                      ? "いいね送信中"
                      : isLikeAvailable
                        ? "いいねを送る"
                        : "今日のいいねは送信済み"
                }
                title={
                  isLikeLoading
                    ? "確認中..."
                    : isLikeSending
                      ? "送信中..."
                      : isLikeAvailable
                        ? "いいね"
                        : "送信済み"
                }
              >
                ♡
              </button>
            )}
            <button
              type="button"
              className="profile-modal__close"
              onClick={onClose}
              aria-label="閉じる"
            >
              ×
            </button>
          </div>
        </div>

        <div className="profile-modal__body">
          <div className="profile-summary">
            <div className="profile-summary__avatar">
              {imageUrl ? (
                <img src={imageUrl} alt={profile.nickname || profile.displayName} />
              ) : (
                <span>{getInitials(profile.nickname || profile.displayName)}</span>
              )}
            </div>
            <p className="profile-summary__name">
              {profile.nickname || profile.displayName || "Unknown User"}
            </p>
            {profile.comment && (
              <p className="profile-summary__comment">{profile.comment}</p>
            )}
          </div>

          <div className="profile-details">
            <DetailRow label="表示名" value={profile.nickname || profile.displayName} />
            <DetailRow label="本名" value={profile.realName} />
            <DetailRow label="メール" value={profile.email} />
            <DetailRow label="学年" value={profile.grade} />
            <DetailRow label="SP" value={profile.sp} />
            <DetailRow label="一言" value={profile.comment || "未設定"} />
          </div>
          {currentUid !== profile.uid && likeMessage && (
            <div className="profile-like">
              <p className="profile-like__message">{likeMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="profile-details__row">
      <span className="profile-details__label">{label}</span>
      <span className="profile-details__value">{value || "未設定"}</span>
    </div>
  );
}

const getInitials = (name: string): string => {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 2).toUpperCase() : "?";
};

export default ProfileViewModal;
