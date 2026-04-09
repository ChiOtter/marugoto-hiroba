import type { UserProfile } from "../users";

export type UserBubbleData = {
  uid: string;
  displayName: string;
  comment: string;
  imageUrl: string;
  onlineTimeLabel: string;
};

export const toUserBubbleData = (
  profile: UserProfile,
  onlineTimeLabel = "0分",
): UserBubbleData => {
  return {
    uid: profile.uid,
    displayName: profile.nickname || profile.displayName || "Unknown User",
    comment: profile.comment,
    imageUrl: profile.iconUrl || profile.photoURL || "",
    onlineTimeLabel,
  };
};
