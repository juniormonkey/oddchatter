/**
 * @fileoverview A model of the user, for display purposes.
 */
goog.module('oddsalon.oddchatter.user');

/**
 * @return {string} The signed-in user's UID.
 */
function getUid() { return firebase.auth().currentUser.uid; }

/**
 * @return {string|null} The signed-in user's display name.
 */
function getUserName() { return firebase.auth().currentUser.displayName; }

/**
 * @return {string} The signed-in user's profile Pic URL.
 */
function getProfilePicUrl() {
  return firebase.auth().currentUser.photoURL ||
         '/images/profile_placeholder.png';
}

exports = { getUid, getUserName, getProfilePicUrl, };
