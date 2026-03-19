import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let initialized = false;

const getAdminConfig = () => {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  return {
    projectId,
    clientEmail,
    privateKey,
  };
};

const initializeFirebaseAdmin = () => {
  if (initialized || getApps().length > 0) {
    initialized = true;
    return;
  }

  const { projectId, clientEmail, privateKey } = getAdminConfig();

  if (projectId && clientEmail && privateKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
    initialized = true;
    return;
  }

  if (process.env.FIREBASE_ADMIN_USE_DEFAULT_CREDENTIALS === 'true') {
    initializeApp({ projectId });
    initialized = true;
    return;
  }

  throw new Error(
    'Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY env vars.'
  );
};

export const getAdminDb = () => {
  initializeFirebaseAdmin();
  return getFirestore();
};
