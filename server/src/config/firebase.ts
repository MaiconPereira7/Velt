import { initializeApp, cert, applicationDefault, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

function createApp(): App {
  if (getApps().length) return getApps()[0]!;

  const serviceAccountJson = process.env['FIREBASE_SERVICE_ACCOUNT'];
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    return initializeApp({ credential: cert(serviceAccount) });
  }

  const projectId = process.env['FIREBASE_PROJECT_ID'];
  const clientEmail = process.env['FIREBASE_CLIENT_EMAIL'];
  const privateKey = process.env['FIREBASE_PRIVATE_KEY'];
  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  }

  return initializeApp({ credential: applicationDefault() });
}

const app = createApp();
export const db: Firestore = getFirestore(app);
