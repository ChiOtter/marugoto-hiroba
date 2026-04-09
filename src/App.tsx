import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebase";
import { login, logout } from "./auth";
import "./App.css";
import {
  ensureTodayStatExists,
  formatOnlineSeconds,
  getTodayJstDateLabel,
  incrementTodayOnlineTime,
  subscribeTodayAllStats,
  subscribeTodayStats,
  type DailyStat,
} from "./dailyStats";
import DailySummaryModal from "./components/DailySummaryModal";
import HomeCanvas from "./components/HomeCanvas";
import ProfileEditModal from "./components/ProfileEditModal";
import ProfileSetupModal from "./components/ProfileSetupModal";
import ProfileViewModal from "./components/ProfileViewModal";
import { getDailySummaryMock } from "./mocks/dailySummary";
import {
  startPresence,
  stopPresence,
  subscribeOnlineUsers,
} from "./presence";
import {
  createUserIfNotExists,
  getUserProfiles,
  getUserProfile,
  isProfileSetupComplete,
  updateUserProfile,
  type ProfileSetupInput,
  type UserProfile,
} from "./users";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [onlineProfiles, setOnlineProfiles] = useState<UserProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [activeModal, setActiveModal] = useState<"view" | "edit" | "daily" | null>(null);
  const [todayStat, setTodayStat] = useState<DailyStat | null>(null);
  const [allTodayStats, setAllTodayStats] = useState<DailyStat[]>([]);
  const [closestProfile, setClosestProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) {
        setProfile(null);
        setSelectedProfile(null);
        setActiveModal(null);
        setIsProfileLoading(false);
        return;
      }

      setIsProfileLoading(true);
      const nextProfile =
        (await createUserIfNotExists(user)) ?? (await getUserProfile(user.uid));
      setProfile(nextProfile);
      setIsProfileLoading(false);
    };

    void loadUserProfile();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void startPresence(user.uid);
    const unsubscribe = subscribeOnlineUsers(user.uid, (users) => {
      setOnlineUserIds(users.map((onlineUser) => onlineUser.uid));
    });

    return () => {
      unsubscribe();
      void stopPresence(user.uid);
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void ensureTodayStatExists(user.uid);
    const unsubscribe = subscribeTodayStats(user.uid, (stat) => {
      setTodayStat(stat);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void ensureTodayStatExists(user.uid);
    const unsubscribe = subscribeTodayAllStats((stats) => {
      setAllTodayStats(stats);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void incrementTodayOnlineTime(user.uid, 60, onlineUserIds.length * 60);
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [onlineUserIds.length, user]);

  useEffect(() => {
    const loadOnlineProfiles = async () => {
      if (onlineUserIds.length === 0) {
        setOnlineProfiles([]);
        return;
      }

      const profiles = await getUserProfiles(onlineUserIds);
      const profileMap = new Map(profiles.map((item) => [item.uid, item]));
      setOnlineProfiles(
        onlineUserIds
          .map((uid) => profileMap.get(uid))
          .filter((item): item is UserProfile => !!item),
      );
    };

    void loadOnlineProfiles();
  }, [onlineUserIds]);

  useEffect(() => {
    const loadClosestProfile = async () => {
      if (!user || !todayStat) {
        setClosestProfile(null);
        return;
      }

      const closestStat = allTodayStats
        .filter((stat) => stat.uid !== user.uid)
        .sort(
          (left, right) =>
            Math.abs(left.onlineSeconds - todayStat.onlineSeconds) -
            Math.abs(right.onlineSeconds - todayStat.onlineSeconds),
        )[0];

      if (!closestStat) {
        setClosestProfile(null);
        return;
      }

      const nextProfile = await getUserProfile(closestStat.uid);
      setClosestProfile(nextProfile);
    };

    void loadClosestProfile();
  }, [allTodayStats, todayStat, user]);

  const handleSaveProfile = async (input: ProfileSetupInput) => {
    if (!user) {
      return;
    }

    setIsProfileSaving(true);
    const isUpdated = await updateUserProfile(user.uid, input);

    if (isUpdated) {
      const nextProfile = await getUserProfile(user.uid);
      setProfile(nextProfile);
      setActiveModal(null);
    }

    setIsProfileSaving(false);
  };

  const handleOpenUserProfile = async (uid: string) => {
    console.log("USER ICON CLICKED =", uid);

    const targetProfile =
      onlineProfiles.find((onlineProfile) => onlineProfile.uid === uid) ??
      (await getUserProfile(uid));

    if (!targetProfile) {
      return;
    }

    setSelectedProfile(targetProfile);
    setActiveModal("view");
  };

  const handleOpenSelfProfile = (uid: string) => {
    console.log("SELF ICON CLICKED =", uid);

    if (!profile) {
      return;
    }

    setActiveModal("edit");
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedProfile(null);
  };

  const handleOpenDailySummary = () => {
    setSelectedProfile(null);
    setActiveModal("daily");
  };

  const shouldShowProfileSetup =
    !!user &&
    !isProfileLoading &&
    !!profile &&
    !isProfileSetupComplete(profile);
  const currentUid = user?.uid ?? null;
  const closestStat = currentUid
    ? allTodayStats
        .filter((stat) => stat.uid !== currentUid)
        .sort(
          (left, right) =>
            Math.abs(left.onlineSeconds - (todayStat?.onlineSeconds ?? 0)) -
            Math.abs(right.onlineSeconds - (todayStat?.onlineSeconds ?? 0)),
        )[0] ?? null
    : null;
  const dailySummary = getDailySummaryMock({
    dateLabel: getTodayJstDateLabel(),
    ownConnectionTime: formatOnlineSeconds(todayStat?.onlineSeconds ?? 0),
    sharedConnectionTime: formatOnlineSeconds(todayStat?.sharedSeconds ?? 0),
    timeDifference: formatOnlineSeconds(
      Math.abs(
        (todayStat?.onlineSeconds ?? 0) - (closestStat?.onlineSeconds ?? 0),
      ),
    ),
    closestPerson: closestProfile
      ? {
          displayName:
            closestProfile.nickname ||
            closestProfile.displayName ||
            "Unknown User",
          grade: closestProfile.grade || "未設定",
          sp: closestProfile.sp || "未設定",
          comment: closestProfile.comment,
          iconUrl: closestProfile.iconUrl,
          photoURL: closestProfile.photoURL,
        }
      : {
          displayName: "まだいません",
          grade: "-",
          sp: "-",
          comment: "今日はまだ比較できる相手がいません",
          iconUrl: "",
          photoURL: "",
        },
  });

  return (
    <div className="app-shell">
      {!user ? (
        <main className="auth-screen">
          <div className="auth-screen__card">
            <p className="auth-screen__eyebrow">Marugoto Hiroba</p>
            <h1 className="auth-screen__title">同じ時間に開いている人が見えるホーム</h1>
            <p className="auth-screen__description">
              ログインすると、いま作業している学生たちがホーム画面上にゆるく浮かび上がります。
            </p>
            <button className="auth-screen__button" onClick={login}>
              Googleログイン
            </button>
          </div>
        </main>
      ) : (
        <>
          <HomeCanvas
            currentUser={profile}
            onlineUsers={onlineProfiles}
            onClickDate={handleOpenDailySummary}
            onClickSelf={handleOpenSelfProfile}
            onClickUser={handleOpenUserProfile}
          />
          <button className="logout-button" onClick={logout}>
            ログアウト
          </button>
        </>
      )}

      {shouldShowProfileSetup && profile && (
        <ProfileSetupModal
          key={profile.uid}
          profile={profile}
          isSaving={isProfileSaving}
          onSave={handleSaveProfile}
        />
      )}

      {activeModal === "view" && selectedProfile && currentUid && (
        <ProfileViewModal
          currentUid={currentUid}
          profile={selectedProfile}
          onClose={handleCloseModal}
        />
      )}

      {activeModal === "edit" && profile && (
        <ProfileEditModal
          key={profile.uid}
          profile={profile}
          isSaving={isProfileSaving}
          onClose={handleCloseModal}
          onSave={handleSaveProfile}
        />
      )}

      {activeModal === "daily" && (
        <DailySummaryModal
          summary={dailySummary}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default App;
