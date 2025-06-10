// src/lib/firebase-admin.ts (using environment variables)
import * as admin from 'firebase-admin';

// Check if a Firebase app is already initialized
if (!admin.apps.length) {
  try {
    // Access environment variables
    const firebaseAdminConfig = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // Firebase private key usually contains '\n' characters that need to be handled
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    // Basic check to ensure required environment variables are set
    if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
        throw new Error('Missing Firebase Admin SDK environment variables.');
    }


    admin.initializeApp({
      credential: admin.credential.cert(firebaseAdminConfig),
      // Add other options if needed
    });

    console.log('Firebase Admin SDK initialized successfully (using environment variables).');

  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    // Handle the error appropriately
  }
}

// Export the initialized admin instance
export { admin };
