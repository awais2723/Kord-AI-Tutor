/* Setting up Auth using the Firebase SDK. Here's a breakdown of what
each part is doing: */
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  createUserWithEmailAndPassword,
  UserCredential,
  updateProfile,
} from 'node_modules/firebase/auth';
// import * as Linking from 'expo-linking';

import { auth } from '@/firebase/config';

export const doCreateUserWithEmailAndPassword = async (
  username: string,
  email: string,
  password: string
): Promise<UserCredential> => {
  const userCredential: UserCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  await updateProfile(userCredential.user, {
    displayName: username,
  });
  return userCredential; // <-- Return this!
};

export const doSignInWithEmailAndPassword = async (email: string, password: string) =>
  await signInWithEmailAndPassword(auth, email, password);

export const doSignOut = async () => {
  auth.signOut();
};

export const doPasswordReset = async (email: string) => {
  try {
    // Remove window.location.origin — not valid in React Native
    await sendPasswordResetEmail(auth, email, {
      url: 'https://kord-ai-tutor.firebaseapp.com/login', // This must be whitelisted in Firebase Console
      handleCodeInApp: true,
    });
    // console.log('Password reset email sent!');
    return { success: true };
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    throw error; // Let UI handle message display
  }
};

export const doPasswordChange = async (password: string) => {
  if (auth.currentUser) {
    await updatePassword(auth.currentUser, password);
  }
};

export const doSendEmailVerification = async () => {
  try {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser, {
        url: 'https://kord-ai-tutor.firebaseapp.com',
      });
    }
    console.log(' Email verification sent!');
  } catch (error) {
    console.error(' Error sending email verification:', error);
  }
};

export const getErrorMessage = (errorCode: string) => {
  let errorMessage: string = '';
  switch (errorCode) {
    case 'auth/invalid-email':
      errorMessage = 'Invalid email address.';
      break;
    case 'auth/user-disabled':
      errorMessage = 'Your account has been disabled.';
      break;
    case 'auth/user-not-found':
      errorMessage = 'User not found.';
      break;
    case 'auth/wrong-password':
      errorMessage = 'Invalid password.';
      break;
    case 'auth/invalid-login-credentials':
      errorMessage = 'Email or password is incorrect';
      break;
    case 'auth/email-already-in-use':
      errorMessage = 'Email is already in use. Please use a different email or login.';
      break;
    case 'auth/weak-password':
      errorMessage = 'Password should be at least 6 characters.';
      break;
    case 'auth/operation-not-allowed':
      errorMessage = 'This operation is not allowed. Please contact support.';
      break;
    case 'auth/too-many-requests':
      errorMessage = 'Too many requests. Please try again later.';
      break;
    case 'auth/requires-recent-login':
      errorMessage = 'Please re-authenticate and try again.';
      break;
    case 'auth/network-request-failed':
      errorMessage = 'Network error. Please check your internet connection and try again.';
      break;
    case 'auth/invalid-verification-code':
      errorMessage = 'The verification code is invalid. Please try again.';
      break;
    case 'auth/invalid-verification-id':
      errorMessage = 'The verification ID is invalid. Please try again.';
      break;
    case 'auth/credential-already-in-use':
      errorMessage = 'This credential is already associated with a different user account.';
      break;
    case 'auth/invalid-credential':
      errorMessage = 'The provided authentication credential is invalid. Please try again.';
      break;
    case 'auth/expired-action-code':
      errorMessage = 'The action code has expired. Please try again.';
      break;
    case 'auth/missing-email':
      errorMessage = 'Please provide an email address.';
      break;
    case 'auth/internal-error':
      errorMessage = 'An internal error occurred. Please try again later.';
      break;
    default:
      errorMessage = 'An error occurred during authentication.';
  }
  return errorMessage;
};
