export type DailySummaryClosestProfile = {
  comment: string;
  displayName: string;
  grade: string;
  iconUrl: string;
  sp: string;
  photoURL?: string;
};

export type DailySummary = {
  closestPerson: DailySummaryClosestProfile;
  dateLabel: string;
  ownConnectionTime: string;
  sharedConnectionTime: string;
  timeDifference: string;
};

export const getDailySummaryMock = (
  overrides?: Partial<DailySummary>,
): DailySummary => {
  const dateLabel = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());

  return {
    dateLabel,
    ownConnectionTime: "4時間20分",
    sharedConnectionTime: "2時間05分",
    timeDifference: "15分差",
    closestPerson: {
      displayName: "Minori",
      grade: "2年",
      sp: "Sansan",
      comment: "UIの細部を詰めています",
      iconUrl: "",
    },
    ...overrides,
  };
};
