import type { CSSProperties } from "react";
import type { UserProfile } from "../users";
import "./UserBubble.css";

export type UserBubbleData = {
  uid: string;
  displayName: string;
  comment: string;
  imageUrl: string;
};

type UserBubbleProps = {
  className?: string;
  data: UserBubbleData;
  onClick: (uid: string) => void;
  style?: CSSProperties;
};

function UserBubble({ className = "", data, onClick, style }: UserBubbleProps) {
  const initials = getInitials(data.displayName);
  const bubbleClassName = ["user-bubble", className].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={bubbleClassName}
      style={style}
      onClick={() => onClick(data.uid)}
      title={data.displayName}
    >
      {data.comment && <p className="user-bubble__comment">{data.comment}</p>}
      <div className="user-bubble__avatar">
        {data.imageUrl ? (
          <img src={data.imageUrl} alt={data.displayName} />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <p className="user-bubble__name">{data.displayName}</p>
    </button>
  );
}

const getInitials = (name: string): string => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "?";
  }

  return trimmedName.slice(0, 2).toUpperCase();
};

export const toUserBubbleData = (profile: UserProfile): UserBubbleData => {
  return {
    uid: profile.uid,
    displayName: profile.nickname || profile.displayName || "Unknown User",
    comment: profile.comment,
    imageUrl: profile.iconUrl || profile.photoURL || "",
  };
};

export default UserBubble;
