import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firestore";

export type LikeRecord = {
  fromUid: string;
  toUid: string;
  date: string;
};

const likesCollectionName = "likes";

export const getTodayDateStringJst = (): string => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
};

const createLikeDocumentId = (
  date: string,
  fromUid: string,
  toUid: string,
): string => {
  return `${date}_${fromUid}_${toUid}`;
};

export const canLikeToday = async (
  fromUid: string,
  toUid: string,
): Promise<boolean> => {
  if (!fromUid || !toUid || fromUid === toUid) {
    return false;
  }

  try {
    const date = getTodayDateStringJst();
    const likeRef = doc(
      db,
      likesCollectionName,
      createLikeDocumentId(date, fromUid, toUid),
    );
    const likeSnapshot = await getDoc(likeRef);
    return !likeSnapshot.exists();
  } catch (error) {
    console.error("CAN LIKE TODAY FAILED =", error);
    return false;
  }
};

export const sendLike = async (
  fromUid: string,
  toUid: string,
): Promise<boolean> => {
  if (!fromUid || !toUid || fromUid === toUid) {
    return false;
  }

  try {
    const date = getTodayDateStringJst();
    const likeRef = doc(
      db,
      likesCollectionName,
      createLikeDocumentId(date, fromUid, toUid),
    );
    const likeSnapshot = await getDoc(likeRef);

    if (likeSnapshot.exists()) {
      return false;
    }

    await setDoc(likeRef, {
      fromUid,
      toUid,
      date,
      createdAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("SEND LIKE FAILED =", error);
    return false;
  }
};
