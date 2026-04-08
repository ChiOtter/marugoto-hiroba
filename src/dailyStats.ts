import {
  doc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firestore";

export type DailyStat = {
  uid: string;
  date: string;
  onlineSeconds: number;
};

type DailyStatCallback = (stat: DailyStat | null) => void;

const dailyStatsCollectionName = "dailyStats";
const dateRefreshIntervalMs = 30_000;

export const getTodayJstDateString = (): string => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
};

export const getTodayJstDateLabel = (): string => {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());
};

export const formatOnlineSeconds = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}分`;
  }

  return `${hours}時間${minutes.toString().padStart(2, "0")}分`;
};

export const incrementTodayOnlineTime = async (
  uid: string,
  seconds: number,
): Promise<void> => {
  if (!uid || seconds <= 0) {
    return;
  }

  try {
    const date = getTodayJstDateString();
    const dailyStatRef = doc(db, dailyStatsCollectionName, date, "users", uid);

    await setDoc(
      dailyStatRef,
      {
        uid,
        date,
        onlineSeconds: increment(seconds),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("INCREMENT TODAY ONLINE TIME FAILED =", error);
  }
};

export const subscribeTodayStats = (
  uid: string,
  callback: DailyStatCallback,
): Unsubscribe => {
  if (!uid) {
    callback(null);
    return () => undefined;
  }

  let currentDate = getTodayJstDateString();
  let unsubscribeSnapshot: Unsubscribe | null = null;

  const subscribeForDate = (date: string) => {
    unsubscribeSnapshot?.();

    const dailyStatRef = doc(db, dailyStatsCollectionName, date, "users", uid);
    unsubscribeSnapshot = onSnapshot(
      dailyStatRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          callback({
            uid,
            date,
            onlineSeconds: 0,
          });
          return;
        }

        const data = snapshot.data();
        callback({
          uid,
          date,
          onlineSeconds:
            typeof data.onlineSeconds === "number" ? data.onlineSeconds : 0,
        });
      },
      (error) => {
        console.error("SUBSCRIBE TODAY STATS FAILED =", error);
        callback(null);
      },
    );
  };

  subscribeForDate(currentDate);

  const refreshId = window.setInterval(() => {
    const nextDate = getTodayJstDateString();
    if (nextDate === currentDate) {
      return;
    }

    currentDate = nextDate;
    subscribeForDate(nextDate);
  }, dateRefreshIntervalMs);

  return () => {
    window.clearInterval(refreshId);
    unsubscribeSnapshot?.();
  };
};
