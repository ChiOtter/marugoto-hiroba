import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  spOptions,
  type ProfileSetupInput,
  type UserProfile,
} from "../users";

type ProfileSetupModalProps = {
  profile: UserProfile;
  isSaving: boolean;
  onSave: (input: ProfileSetupInput) => Promise<void>;
};

type FormState = ProfileSetupInput;

type FormErrors = Partial<Record<keyof ProfileSetupInput, string>>;

const initialErrors: FormErrors = {};

function ProfileSetupModal({
  profile,
  isSaving,
  onSave,
}: ProfileSetupModalProps) {
  const [form, setForm] = useState<FormState>({
    nickname: profile.nickname,
    realName: profile.realName,
    grade: profile.grade,
    sp: profile.sp,
    iconUrl: profile.iconUrl,
    comment: profile.comment,
  });
  const [errors, setErrors] = useState<FormErrors>(initialErrors);

  useEffect(() => {
    setForm({
      nickname: profile.nickname,
      realName: profile.realName,
      grade: profile.grade,
      sp: profile.sp,
      iconUrl: profile.iconUrl,
      comment: profile.comment,
    });
    setErrors(initialErrors);
  }, [profile]);

  const validate = (values: FormState): FormErrors => {
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

  const handleChange = (
    key: keyof FormState,
    value: string,
  ) => {
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
    <div style={backdropStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <p style={eyebrowStyle}>初回プロフィール設定</p>
          <h2 style={titleStyle}>利用前に必須項目を入力してください</h2>
          <p style={descriptionStyle}>
            ホーム画面に入る前に、最低限のプロフィールを登録します。
          </p>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <Field
            label="ニックネーム / 表示名"
            required
            error={errors.nickname}
          >
            <input
              value={form.nickname}
              onChange={(event) => handleChange("nickname", event.target.value)}
              style={inputStyle}
              disabled={isSaving}
            />
          </Field>

          <Field label="本名" required error={errors.realName}>
            <input
              value={form.realName}
              onChange={(event) => handleChange("realName", event.target.value)}
              style={inputStyle}
              disabled={isSaving}
            />
          </Field>

          <Field label="学年" required error={errors.grade}>
            <input
              value={form.grade}
              onChange={(event) => handleChange("grade", event.target.value)}
              style={inputStyle}
              disabled={isSaving}
              placeholder="例: 1年"
            />
          </Field>

          <Field label="SP" required error={errors.sp}>
            <select
              value={form.sp}
              onChange={(event) => handleChange("sp", event.target.value)}
              style={inputStyle}
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

          <Field label="アイコン画像URL" error={errors.iconUrl}>
            <input
              value={form.iconUrl}
              onChange={(event) => handleChange("iconUrl", event.target.value)}
              style={inputStyle}
              disabled={isSaving}
              placeholder="https://..."
            />
          </Field>

          <Field label="一言" error={errors.comment}>
            <textarea
              value={form.comment}
              onChange={(event) => handleChange("comment", event.target.value)}
              style={textareaStyle}
              disabled={isSaving}
              rows={4}
            />
          </Field>

          <button type="submit" style={buttonStyle} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存する"}
          </button>
        </form>
      </div>
    </div>
  );
}

type FieldProps = {
  children: ReactNode;
  error?: string;
  label: string;
  required?: boolean;
};

function Field({ children, error, label, required = false }: FieldProps) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>
        {label}
        {required && <span style={requiredStyle}> *</span>}
      </span>
      {children}
      {error && <span style={errorStyle}>{error}</span>}
    </label>
  );
}

const backdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(11, 16, 32, 0.42)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  zIndex: 1000,
  backdropFilter: "blur(8px)",
};

const modalStyle: CSSProperties = {
  width: "100%",
  maxWidth: "560px",
  background: "#ffffff",
  borderRadius: "24px",
  boxShadow: "0 24px 80px rgba(15, 23, 42, 0.18)",
  padding: "32px",
  boxSizing: "border-box",
};

const headerStyle: CSSProperties = {
  marginBottom: "24px",
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  color: "#1d4ed8",
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: "10px 0 8px",
  fontSize: "28px",
  lineHeight: 1.2,
  color: "#0f172a",
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "14px",
  lineHeight: 1.6,
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "18px",
};

const fieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const labelStyle: CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#1e293b",
};

const requiredStyle: CSSProperties = {
  color: "#dc2626",
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  padding: "12px 14px",
  fontSize: "15px",
  color: "#0f172a",
  background: "#ffffff",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "96px",
  fontFamily: "inherit",
};

const buttonStyle: CSSProperties = {
  marginTop: "8px",
  border: "none",
  borderRadius: "999px",
  background: "#0f172a",
  color: "#ffffff",
  padding: "14px 18px",
  fontSize: "15px",
  fontWeight: 700,
  cursor: "pointer",
  opacity: 1,
};

const errorStyle: CSSProperties = {
  fontSize: "13px",
  color: "#dc2626",
};

export default ProfileSetupModal;
