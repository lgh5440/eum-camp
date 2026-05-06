// Firebase 설정 가용성만 판단하는 경량 모듈.
// firebase SDK 자체를 import 하지 않으므로 로그인·셋업 화면에서 firestore 청크가 끌려오지 않는다.
const cfg = {
  apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId:      import.meta.env.VITE_FIREBASE_APP_ID,
};

export const cloudSyncEnabled = Boolean(
  cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId,
);
