import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { createUserIfNotExists } from "./users";

const provider = new GoogleAuthProvider();

export const login = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const email = result.user.email;

    console.log("LOGIN USER =", result.user);
    console.log("LOGIN EMAIL =", email);

    if (!email?.endsWith("@kamiyama.ac.jp")) {
      await signOut(auth);
      alert("kamiyama.ac.jp のアカウントのみ利用できます");
      return null;
    }

    await createUserIfNotExists(result.user);

    alert("ログイン成功");
    return result.user;
  } catch (error) {
    console.error("LOGIN FAILED =", error);
    alert("ログイン失敗。Console を確認してください。");
    return null;
  }
};

export const logout = async () => {
  await signOut(auth);
};
