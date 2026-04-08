import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  spOptions,
  type ProfileSetupInput,
  type UserProfile,
} from "../users";
import "./ProfileModal.css";

type ProfileEditModalProps = {
  isSaving: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSave: (input: ProfileSetupInput) => Promise<void>;
};

type FormErrors = Partial<Record<keyof ProfileSetupInput, string>>;

function ProfileEditModal({
  isSaving,
  profile,
  onClose,
  onSave,
}: ProfileEditModalProps) {
  const [form, setForm] = useState<ProfileSetupInput>({
    nickname: profile.nickname,
    realName: profile.realName,
    grade: profile.grade,
    sp: profile.sp,
    iconUrl: profile.iconUrl,
    comment: profile.comment,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setForm({
      nickname: profile.nickname,
      realName: profile.realName,
      grade: profile.grade,
      sp: profile.sp,
      iconUrl: profile.iconUrl,
      comment: profile.comment,
    });
    setErrors({});
  }, [profile]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const validate = (values: ProfileSetupInput): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!values.nickname.trim()) {
      nextErrors.nickname = "ニックネームを入力してください。";
    }
    if (!values.realName.trim()) {
      nextErrors.realName = "本名を入力してください。";
    }
    if (!values.grade.trim()) {
      nextErrors.grade = "学年を入力してください。";
    }
    if (!values.sp.trim()) {
      nextErrors.sp = "SPを選択してください。";
    }

    return nextErrors;
  };

  const handleChange = (key: keyof ProfileSetupInput, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSave(form);
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div
        className="profile-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="profile-modal__header">
          <div>
            <p className="profile-modal__eyebrow">Edit Profile</p>
            <h2 className="profile-modal__title">プロフィールを編集</h2>
            <p className="profile-modal__description">
              保存するとホーム画面の表示にもすぐ反映されます。
            </p>
          </div>
          <button
            type="button"
            className="profile-modal__close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="profile-modal__body">
          <form className="profile-form" onSubmit={handleSubmit}>
            <Field label="メールアドレス">
              <div className="profile-form__readonly">{profile.email}</div>
            </Field>

            <Field label="ニックネーム / 表示名" required error={errors.nickname}>
              <input
                className="profile-form__input"
                value={form.nickname}
                onChange={(event) => handleChange("nickname", event.target.value)}
                disabled={isSaving}
              />
            </Field>

            <Field label="本名" required error={errors.realName}>
              <input
                className="profile-form__input"
                value={form.realName}
                onChange={(event) => handleChange("realName", event.target.value)}
                disabled={isSaving}
              />
            </Field>

            <Field label="学年" required error={errors.grade}>
              <input
                className="profile-form__input"
                value={form.grade}
                onChange={(event) => handleChange("grade", event.target.value)}
                disabled={isSaving}
              />
            </Field>

            <Field label="SP" required error={errors.sp}>
              <select
                className="profile-form__input"
                value={form.sp}
                onChange={(event) => handleChange("sp", event.target.value)}
                disabled={isSaving}
              >
                <option value="">選択してください</option>
                {spOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="アイコン画像URL">
              <input
                className="profile-form__input"
                value={form.iconUrl}
                onChange={(event) => handleChange("iconUrl", event.target.value)}
                disabled={isSaving}
                placeholder="https://..."
              />
            </Field>

            <Field label="一言">
              <textarea
                className="profile-form__textarea"
                value={form.comment}
                onChange={(event) => handleChange("comment", event.target.value)}
                disabled={isSaving}
              />
            </Field>

            <div className="profile-form__actions">
              <button
                type="submit"
                className="profile-form__button"
                disabled={isSaving}
              >
                {isSaving ? "保存中..." : "保存する"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  children,
  error,
  label,
  required = false,
}: {
  children: ReactNode;
  error?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="profile-form__field">
      <span className="profile-form__label">
        {label}
        {required && <span className="profile-form__required"> *</span>}
      </span>
      {children}
      {error && <span className="profile-form__error">{error}</span>}
    </label>
  );
}

export default ProfileEditModal;
