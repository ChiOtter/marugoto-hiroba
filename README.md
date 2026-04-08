# marugoto-hiroba

学年横断交流可視化アプリのフロントエンドです。React + Vite + TypeScript + Firebase で構成されています。

## Firebase / Firestore

このアプリは Firebase Authentication と Firestore を使います。
ローカル起動やデプロイ前に `VITE_FIREBASE_*` 環境変数を設定してください。

## Environment Variables

`.env` はコミットしないでください。共有用テンプレートとして `.env.example` を使ってください。

必要な値:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Scripts

- `npm run dev`: 開発サーバー起動
- `npm run build`: 本番ビルド
- `npm run preview`: ビルド確認
- `npm run deploy`: Firebase Hosting へデプロイ

## Firebase Hosting

このプロジェクトには Firebase Hosting 用の設定を入れています。

- `firebase.json`: `dist` を公開
- `.firebaserc`: Firebase project `puroen2260408` を既定に設定

初回公開時の流れ:

```bash
npm install
npm run build
firebase login
firebase deploy --only hosting
```

もしくは:

```bash
npm run deploy
```

## Important Notes

- Google Sign-In を使う場合は、公開 URL を Firebase Authentication の authorized domains に追加してください。
- Firestore Rules は本番公開前に必ず見直してください。
- `VITE_FIREBASE_*` はブラウザで使われる前提なので、保護は Firestore Rules / Auth 設定で行います。
