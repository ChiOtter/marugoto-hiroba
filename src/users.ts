import type { User } from "firebase/auth";
import {
  collection,
  documentId,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  Timestamp,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firestore";

export const spOptions = [
  "SEPTENI",
  "Sansan",
  "富士通",
  "ロート",
  "デロイト",
  "MIXI",
  "セコム",
  "CTC",
  "RICOH",
  "SONY",
  "SoftBank",
] as const;

export type UserProfile = {
  uid: string;
  nickname: string;
  displayName: string;
  realName: string;
  email: string;
  grade: string;
  sp: string;
  iconUrl: string;
  comment: string;
  photoURL: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type ProfileSetupInput = {
  nickname: string;
  realName: string;
  grade: string;
  sp: string;
  iconUrl: string;
  comment: string;
};

const usersCollectionName = "users";

const toUserProfile = (uid: string, data: DocumentData): UserProfile => {
  return {
    uid,
    nickname: typeof data.nickname === "string" ? data.nickname : "",
    displayName: typeof data.displayName === "string" ? data.displayName : "",
    realName: typeof data.realName === "string" ? data.realName : "",
    email: typeof data.email === "string" ? data.email : "",
    grade: typeof data.grade === "string" ? data.grade : "",
    sp: typeof data.sp === "string" ? data.sp : "",
    iconUrl: typeof data.iconUrl === "string" ? data.iconUrl : "",
    comment: typeof data.comment === "string" ? data.comment : "",
    photoURL: typeof data.photoURL === "string" ? data.photoURL : "",
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : undefined,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : undefined,
  };
};

export const createUserIfNotExists = async (
  user: User,
): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, usersCollectionName, user.uid);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      return toUserProfile(userSnapshot.id, userSnapshot.data());
    }

    const displayName = user.displayName ?? "";
    const profilePayload = {
      uid: user.uid,
      nickname: displayName,
      displayName,
      realName: displayName,
      email: user.email ?? "",
      grade: "",
      sp: "",
      iconUrl: "",
      comment: "",
      photoURL: user.photoURL ?? "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, profilePayload);

    return {
      ...profilePayload,
      createdAt: undefined,
      updatedAt: undefined,
    };
  } catch (error) {
    console.error("CREATE USER IF NOT EXISTS FAILED =", error);
    return null;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, usersCollectionName, uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      return null;
    }

    return toUserProfile(userSnapshot.id, userSnapshot.data());
  } catch (error) {
    console.error("GET USER PROFILE FAILED =", error);
    return null;
  }
};

export const getUserProfiles = async (uids: string[]): Promise<UserProfile[]> => {
  if (uids.length === 0) {
    return [];
  }

  try {
    const uniqueUids = Array.from(new Set(uids));
    const snapshots = await Promise.all(
      chunkArray(uniqueUids, 10).map(async (uidChunk) => {
        const usersQuery = query(
          collection(db, usersCollectionName),
          where(documentId(), "in", uidChunk),
        );

        return getDocs(usersQuery);
      }),
    );

    return snapshots.flatMap((snapshot) =>
      snapshot.docs.map((docSnapshot) =>
        toUserProfile(docSnapshot.id, docSnapshot.data()),
      ),
    );
  } catch (error) {
    console.error("GET USER PROFILES FAILED =", error);
    return [];
  }
};

export const isProfileSetupComplete = (profile: UserProfile | null): boolean => {
  if (!profile) {
    return false;
  }

  return [profile.nickname, profile.realName, profile.grade, profile.sp].every(
    (value) => value.trim() !== "",
  );
};

export const updateUserProfile = async (
  uid: string,
  input: ProfileSetupInput,
): Promise<boolean> => {
  try {
    const userRef = doc(db, usersCollectionName, uid);

    await updateDoc(userRef, {
      nickname: input.nickname.trim(),
      displayName: input.nickname.trim(),
      realName: input.realName.trim(),
      grade: input.grade.trim(),
      sp: input.sp.trim(),
      iconUrl: input.iconUrl.trim(),
      comment: input.comment.trim(),
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("UPDATE USER PROFILE FAILED =", error);
    return false;
  }
};

const chunkArray = <T,>(items: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
};
