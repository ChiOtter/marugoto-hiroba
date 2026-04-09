import {
  collection,
  doc,
  getDoc,
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
  sharedSeconds: number;
};

type DailyStatCallback = (stat: DailyStat | null) => void;
type DailyStatsCallback = (stats: DailyStat[]) => void;

const dailyStatsCollectionName = "dailyStats";
const dateRefreshIntervalMs = 60_000;

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
  sharedSeconds = 0,
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
        sharedSeconds: increment(sharedSeconds),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("INCREMENT TODAY ONLINE TIME FAILED =", error);
  }
};

export const ensureTodayStatExists = async (uid: string): Promise<void> => {
  if (!uid) {
    return;
  }

  try {
    const date = getTodayJstDateString();
    const dailyStatRef = doc(db, dailyStatsCollectionName, date, "users", uid);
    const dailyStatSnapshot = await getDoc(dailyStatRef);

    if (dailyStatSnapshot.exists()) {
      return;
    }

    await setDoc(
      dailyStatRef,
      {
        uid,
        date,
        onlineSeconds: 0,
        sharedSeconds: 0,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("ENSURE TODAY STAT EXISTS FAILED =", error);
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
            sharedSeconds: 0,
          });
          return;
        }

        const data = snapshot.data();
        callback({
          uid,
          date,
          onlineSeconds:
            typeof data.onlineSeconds === "number" ? data.onlineSeconds : 0,
          sharedSeconds:
            typeof data.sharedSeconds === "number" ? data.sharedSeconds : 0,
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

export const subscribeTodayAllStats = (
  callback: DailyStatsCallback,
): Unsubscribe => {
  let currentDate = getTodayJstDateString();
  let unsubscribeSnapshot: Unsubscribe | null = null;

  const subscribeForDate = (date: string) => {
    unsubscribeSnapshot?.();

    const dailyStatsRef = collection(db, dailyStatsCollectionName, date, "users");
    unsubscribeSnapshot = onSnapshot(
      dailyStatsRef,
      (snapshot) => {
        callback(
          snapshot.docs.map((docSnapshot) => {
            const data = docSnapshot.data();

            return {
              uid: docSnapshot.id,
              date,
              onlineSeconds:
                typeof data.onlineSeconds === "number" ? data.onlineSeconds : 0,
              sharedSeconds:
                typeof data.sharedSeconds === "number" ? data.sharedSeconds : 0,
            };
          }),
        );
      },
      (error) => {
        console.error("SUBSCRIBE TODAY ALL STATS FAILED =", error);
        callback([]);
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
