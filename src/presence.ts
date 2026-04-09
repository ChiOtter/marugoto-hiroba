import {
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  collection,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firestore";

export type PresenceRecord = {
  uid: string;
  online: boolean;
  lastActive?: Timestamp;
  currentSessionStartedAt?: Timestamp;
};

type OnlineUsersCallback = (users: PresenceRecord[]) => void;

const presenceCollectionName = "presence";
const heartbeatIntervalMs = 60_000;
const onlineThresholdMs = 180_000;
const refreshIntervalMs = 60_000;

const heartbeatTimers = new Map<string, number>();
const beforeUnloadHandlers = new Map<string, () => void>();

const toPresenceRecord = (uid: string, data: DocumentData): PresenceRecord => {
  return {
    uid,
    online: data.online === true,
    lastActive: data.lastActive instanceof Timestamp ? data.lastActive : undefined,
    currentSessionStartedAt:
      data.currentSessionStartedAt instanceof Timestamp
        ? data.currentSessionStartedAt
        : undefined,
  };
};

const isCurrentlyOnline = (presence: PresenceRecord): boolean => {
  if (!presence.online || !presence.lastActive) {
    return false;
  }

  return Date.now() - presence.lastActive.toMillis() <= onlineThresholdMs;
};

const updateHeartbeat = async (uid: string): Promise<void> => {
  try {
    const presenceRef = doc(db, presenceCollectionName, uid);
    await setDoc(
      presenceRef,
      {
        uid,
        online: true,
        lastActive: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("PRESENCE HEARTBEAT FAILED =", error);
  }
};

export const startPresence = async (uid: string): Promise<void> => {
  if (heartbeatTimers.has(uid)) {
    return;
  }

  try {
    const presenceRef = doc(db, presenceCollectionName, uid);

    await setDoc(
      presenceRef,
      {
        uid,
        online: true,
        lastActive: serverTimestamp(),
        currentSessionStartedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("START PRESENCE FAILED =", error);
  }

  const intervalId = window.setInterval(() => {
    void updateHeartbeat(uid);
  }, heartbeatIntervalMs);

  heartbeatTimers.set(uid, intervalId);

  const handleBeforeUnload = () => {
    void stopPresence(uid);
  };

  beforeUnloadHandlers.set(uid, handleBeforeUnload);
  window.addEventListener("beforeunload", handleBeforeUnload);
};

export const stopPresence = async (uid: string): Promise<void> => {
  const intervalId = heartbeatTimers.get(uid);
  if (intervalId) {
    window.clearInterval(intervalId);
    heartbeatTimers.delete(uid);
  }

  const beforeUnloadHandler = beforeUnloadHandlers.get(uid);
  if (beforeUnloadHandler) {
    window.removeEventListener("beforeunload", beforeUnloadHandler);
    beforeUnloadHandlers.delete(uid);
  }

  try {
    const presenceRef = doc(db, presenceCollectionName, uid);
    await updateDoc(presenceRef, {
      online: false,
      lastActive: serverTimestamp(),
    });
  } catch (error) {
    console.error("STOP PRESENCE FAILED =", error);
  }
};

export const subscribeOnlineUsers = (
  currentUid: string,
  callback: OnlineUsersCallback,
): Unsubscribe => {
  const presenceQuery = query(
    collection(db, presenceCollectionName),
    where("online", "==", true),
  );

  let latestUsers: PresenceRecord[] = [];

  const emitOnlineUsers = () => {
    callback(
      latestUsers.filter(
        (presence) =>
          presence.uid !== currentUid && isCurrentlyOnline(presence),
      ),
    );
  };

  const unsubscribe = onSnapshot(
    presenceQuery,
    (snapshot) => {
      latestUsers = snapshot.docs.map((docSnapshot) =>
        toPresenceRecord(docSnapshot.id, docSnapshot.data()),
      );
      emitOnlineUsers();
    },
    (error) => {
      console.error("SUBSCRIBE ONLINE USERS FAILED =", error);
      callback([]);
    },
  );

  const refreshId = window.setInterval(() => {
    emitOnlineUsers();
  }, refreshIntervalMs);

  return () => {
    window.clearInterval(refreshId);
    unsubscribe();
  };
};
