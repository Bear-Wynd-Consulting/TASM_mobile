import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// IMPORTANT: Replace with your actual Web Client ID from Firebase/Google Cloud Console
const WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID_FROM_GOOGLE_SERVICES_JSON_OR_CLOUD_CONSOLE';

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  offlineAccess: true, 
});

export const signInWithGoogle = async (): Promise<FirebaseAuthTypes.UserCredential | null> => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const { idToken } = await GoogleSignin.signIn();
    if (!idToken) throw new Error('Google Sign-In failed: No ID token received.');
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);
    console.log('User signed in with Google:', userCredential.user.displayName);
    return userCredential;
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) console.log('Google Sign-In cancelled.');
    else if (error.code === statusCodes.IN_PROGRESS) console.log('Google Sign-In in progress.');
    else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) console.log('Google Play Services not available.');
    else console.error('Google Sign-In Error:', error.message, error.code);
    return null;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await auth().signOut();
    if (await GoogleSignin.isSignedIn()) {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    }
    console.log('User signed out successfully!');
  } catch (error) { console.error('Sign Out Error:', error); }
};

export const getCurrentUser = (): FirebaseAuthTypes.User | null => auth().currentUser;
export const onAuthStateChanged = (cb: (user: FirebaseAuthTypes.User | null) => void): (() => void) => auth().onAuthStateChanged(cb);
export type User = FirebaseAuthTypes.User;
Output:
