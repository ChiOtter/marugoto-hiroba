import type { CSSProperties } from "react";
import type { UserBubbleData } from "./userBubbleData";
import "./UserBubble.css";

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

export default UserBubble;
