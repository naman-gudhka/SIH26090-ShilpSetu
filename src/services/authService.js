import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';

import { auth, db } from '../firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';
/**
 * authService.js
 * Firebase Authentication abstraction boundary.
 * Replace mock implementations with real Firebase Auth calls
 * when backend integration is ready.
 *
 * SECURITY NOTE: Client-side role assignment is for UI navigation only.
 * Actual authorization must be enforced via Firebase Custom Claims / Firestore Rules.
 * Current state: Mock auth with safe demo session persistence so refreshing
 * during presentations does not lose user state.
 *
 * Team 2 will replace this implementation with Firebase Auth SDK:
 * - signInWithEmailAndPassword(auth, email, password)
 * - createUserWithEmailAndPassword(auth, email, password)
 * - onAuthStateChanged(auth, callback)
 * - signOut(auth)
 *
 * SECURITY NOTE FOR TEAM 2:
 * Frontend role tracking is for UI/routing navigation only.
 * Production admin authorization MUST be enforced via Firebase Custom Claims
 * and checked in Firestore Security Rules:
 * request.auth.token.admin == true
 */

const AUTH_STORAGE_KEY = 'shilpsetu_demo_user';
const ROLE_STORAGE_KEY = 'shilpsetu_demo_role';

/**
 * Normalizes email by trimming and converting to lowercase.
 * Guarantees case-insensitivity so user@GMAIL.COM === user@gmail.com.
 */
export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

/**
 * Strict RFC-compliant email validator.
 * Enforces:
 * - Valid characters in local part and domain
 * - Domain name with at least one dot and an alphabetic TLD of >= 2 characters
 * - No consecutive dots ('..') in local part or domain
 * - No leading or trailing dots in local part or domain
 * - Domain labels must not start or end with a hyphen
 * - Maximum total length of 254 characters
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;

  // Strict regex: valid local part, alphanumeric/hyphen domain labels, alphabetic TLD >= 2 chars
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) return false;
  if (trimmed.includes('..')) return false;

  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0 || atIndex === trimmed.length - 1) return false;

  const localPart = trimmed.slice(0, atIndex);
  const domainPart = trimmed.slice(atIndex + 1);

  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) return false;

  const domainLabels = domainPart.split('.');
  if (domainLabels.some((label) => !label || label.startsWith('-') || label.endsWith('-'))) {
    return false;
  }

  return true;
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredRole() {
  try {
    return localStorage.getItem(ROLE_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

// Mock user store (simulates Firebase Auth state with safe demo session persistence)
let mockUser = getStoredUser();
let mockRole = getStoredRole();
const listeners = [];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function persistState(user, role) {
  mockUser = user;
  mockRole = role;
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      if (role) {
        localStorage.setItem(ROLE_STORAGE_KEY, role);
        localStorage.setItem(`shilpsetu_role_${user.uid}`, role);
      } else {
        localStorage.removeItem(ROLE_STORAGE_KEY);
        localStorage.removeItem(`shilpsetu_role_${user.uid}`);
      }
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(ROLE_STORAGE_KEY);
    }
  } catch {
    // Storage access error handling
  }
}

export const authService = {
  /**
   * Get the current authenticated user (mock).
   * Replace with: firebase.auth().currentUser
   */
  getCurrentUser() {
    return mockUser;
  },

  /**
   * Get current user role (UI-only, NOT a security boundary).
   * In production: read from Firebase Custom Claims or Firestore user document.
   */
  getCurrentRole() {
    return mockRole;
  },

  /**
   * Subscribe to auth state changes.
   * Replace with: firebase.auth().onAuthStateChanged(callback)
   */
  
  onAuthStateChanged(callback) {
    return firebaseOnAuthStateChanged(auth, (user) => {
      callback(user);
    });
  },

  /**
   * Sign in with email and password.
   * Replace with: signInWithEmailAndPassword(auth, email, password)
   */
async signInWithEmail(email, password) {
  const cleanEmail = normalizeEmail(email);

  if (!cleanEmail || !password) {
    throw new Error('Please enter your email and password.');
  }

  if (!isValidEmail(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      cleanEmail,
      password
    );

    const user = credential.user;
    

    // Keep the existing Team 1 return contract.
    // Role will be resolved from the user's saved role later.
    
    const savedRole = localStorage.getItem(`shilpsetu_role_${user.uid}`);

let role = savedRole || null;

if (!role) {
  const userDoc = await getDoc(doc(db, 'users', user.uid));

  if (userDoc.exists()) {
    role = userDoc.data().role || null;
  }
}

return { user, role };

  } catch (error) {
    // Keep UI-friendly errors instead of exposing Firebase internals.
    if (
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/user-not-found'
    ) {
      throw new Error('Incorrect email or password. Please try again.');
    }

    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many login attempts. Please try again later.');
    }

    throw new Error(error.message || 'Unable to sign in. Please try again.');
  }
},

  /**
   * Create a new account.
   * Replace with: createUserWithEmailAndPassword(auth, email, password)
   */
  async createAccount(email, password, displayName) {
    const cleanEmail = normalizeEmail(email);
    const cleanName = typeof displayName === 'string' ? displayName.trim() : '';

    if (!cleanEmail || !password || !cleanName) {
      throw new Error('All fields are required.');
    }

    if (!isValidEmail(cleanEmail)) {
      throw new Error('Please enter a valid email address.');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const user = credential.user;

      await firebaseUpdateProfile(user, {
        displayName: cleanName,
      });

      return { user };
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists.');
      }

      if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }

      if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use a stronger password.');
      }

      throw new Error(
        error.message || 'Unable to create your account. Please try again.'
      );
    }
  },

  /**
   * Send a password reset email.
   * Replace with: sendPasswordResetEmail(auth, email)
   */
  async sendPasswordReset(email) {
    await delay(500);
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) throw new Error('Please enter your email address.');
    if (!isValidEmail(cleanEmail)) throw new Error('Please enter a valid email address.');
    return { success: true };
  },

  /**
   * Send email verification to current user.
   * Replace with: sendEmailVerification(auth.currentUser)
   */
  async sendEmailVerification() {
    await delay(400);
    return { success: true };
  },

  /**
   * Set the user's role in Firestore.
   * UI-only role assignment — NOT a security boundary.
   * Replace with: setDoc(doc(db, 'users', uid), { role }, { merge: true })
   */
  async setUserRole(role) {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('You must be signed in to select a role.');
    }

    const allowedRoles = ['artisan', 'buyer'];

    if (!allowedRoles.includes(role)) {
      throw new Error('Invalid role selected.');
    }

    console.log('FIRESTORE ROLE WRITE START', user.uid, role);

    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        role,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return { success: true, role };
  },

  /**
   * Sign out.
   * Replace with: signOut(auth)
   */
  async signOut() {
    await delay(300);
    mockUser = null;
    mockRole = null;
    persistState(null, null);
    listeners.forEach((cb) => cb(null));
    return { success: true };
  },

  /**
   * Update user profile.
   * Replace with: updateProfile(auth.currentUser, { displayName, photoURL })
   */
  async updateProfile(displayName, photoURL) {
    await delay(400);
    if (mockUser) {
      mockUser = {
        ...mockUser,
        displayName: displayName || mockUser.displayName,
        photoURL: photoURL !== undefined ? photoURL : mockUser.photoURL,
      };
      persistState(mockUser, mockRole);
      listeners.forEach((cb) => cb(mockUser));
    }
    return { success: true };
  },
};
