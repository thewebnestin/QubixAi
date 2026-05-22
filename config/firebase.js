const admin = require('firebase-admin');

let db = null;

if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });

    db = admin.firestore();
    console.log(`[Firebase] ${new Date().toISOString()} Admin SDK initialized Firestore database successfully`);
  } catch (error) {
    console.error(`[Firebase] ${new Date().toISOString()} Initialization Error:`, error.message);
  }
} else {
  console.warn(`[Firebase] ${new Date().toISOString()} WARNING: Missing Firebase environment variables. Database falls back to local data.`);
}

module.exports = { db };
