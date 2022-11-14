/**
 * @fileoverview A model of the user, for display purposes.
 */

/**
 * @return {string} The signed-in user's UID.
 */
export function getUid() {
  return window.firebase.auth().currentUser.uid;
}

/**
 * @return {string|null} The signed-in user's display name.
 */
export function getUserName() {
  return window.firebase.auth().currentUser.displayName;
}

/**
 * @return {string} The signed-in user's profile Pic URL.
 */
export function getProfilePicUrl() {
  return window.firebase.auth().currentUser.photoURL ||
         '/images/profile_placeholder.png';
}

/**
 * @return {boolean} If a user is signed in.
 */
export function isSignedIn() {
  return !!window.firebase.auth().currentUser;
}
