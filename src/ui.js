/**
 * @fileoverview A model of the UI, for interacting with DOM elements.
 */

goog.require('goog.array');

/**
 * A utility class to keep generating the next ID in an incrementing sequence.
 */
export class IncrementingId {
  /**
   * @param {string} text Some prefix text to use in the ID.

   */
  constructor(text) {
    this.text = text;
    this.index = 0;
  }

  /**
   * @return {string} The next ID in the sequence.
   */
  next() {
    return this.text + this.index++;
  }
}

/**
 * Adds a size to Google Profile pics URLs.
 *
 * @param {string} url The profile pic URL to edit.
 * @return {string} A new profile pic URL with the size param added.
 */
export function addSizeToGoogleProfilePic(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return `${url}?sz=150`;
  }
  return url;
}

/**
 * Finds the right place to insert a new message to keep the message list
 * sorted by timestamp.
 * @param {number} timestamp The timestamp of the message to insert, in
 *     milliseconds since epoch.
 * @return {Element} The element before which to insert the new message, or
 *     null if the new message should be appended at the end of the list.
 */
export function findDivToInsertBefore(timestamp) {
  const existingMessages =
      messageListElement().querySelectorAll('.message-container');
  if (existingMessages.length === 0) {
    return null;
  } else {
    const insertionPoint = goog.array.binarySearch(
        existingMessages, timestamp, (targetTime, node) => {
          const nodeTime = parseInt(node.getAttribute('timestamp'), 10);

          if (!nodeTime) {
            throw new Error(`Child ${node.id} has no 'timestamp' attribute`);
          }
          return targetTime - nodeTime;
        });

    if (insertionPoint >= existingMessages.length ||
        insertionPoint < -(existingMessages.length)) {
      // The message is newer than all existing messages.
      return null;
    } else if (insertionPoint >= 0) {
      // Found a message with the same timestamp as the new message; insert
      // the new message after it.
      return existingMessages[insertionPoint + 1];
    } else {
      // goog.array.binarySearch() returns a negative index if the timestamp
      // was not matched; '-(index + 1)' provides the right place to insert
      // the new message.
      return existingMessages[-(insertionPoint + 1)];
    }
  }
}

/**
 * A handler function for use with an IntersectionObserver.
 *
 * @param {Array<IntersectionObserverEntry>} entries Targets reporting a
 *     change in their intersection status.
 * @param {IntersectionObserver} _observer The calling IntersectionObserver.
 */
export function messageIntersectionHandler(entries, _observer) {
  if (entries[0].isIntersecting) {
    messageListElement().dataset.scrolledToEnd = true;
    scrollContainerElement().setAttribute('hidden', true);
  } else {
    delete messageListElement().dataset.scrolledToEnd;
    if (messageListElement().querySelectorAll('.message').length > 0) {
      scrollContainerElement().removeAttribute('hidden');
    }
  }
}

// Shortcuts to DOM Elements.
/** @return {Element} */ export const outerContainerElement = () =>
    document.getElementById('outer-container');
/** @return {Element} */ export const promoElement = () =>
    document.getElementById('promo');
/** @return {Element} */ export const errorContainerElement = () =>
    document.getElementById('error-container');
/** @return {Element} */ export const errorLinkElement = () =>
    document.getElementById('error-link');
/** @return {Element} */ export const introContainerElement = () =>
    document.getElementById('intro-container');
/** @return {Element} */ export const introButtonElement = () =>
    document.getElementById('intro-button');
/** @return {Element} */ export const messageListElement = () =>
    document.getElementById('messages');
/** @return {Element} */ export const lastMessageElement = () =>
    document.getElementById('last-message');
/** @return {Element} */ export const messageFormElement = () =>
    document.getElementById('message-form');
/** @return {Element} */ export const messageInputElement = () =>
    document.getElementById('message');
/** @return {Element} */ export const submitButtonElement = () =>
    document.getElementById('submit');
/** @return {Element} */ export const userPicElement = () =>
    document.getElementById('user-pic');
/** @return {Element} */ export const userNameElement = () =>
    document.getElementById('user-name');
/** @return {Element} */ export const signInButtonElement = () =>
    document.getElementById('sign-in');
/** @return {Element} */ export const signOutButtonElement = () =>
    document.getElementById('sign-out');
/** @return {Element} */ export const kebabMenuElement = () =>
    document.getElementById('kebab-menu');
/** @return {Element} */ export const notificationsToggleElement = () =>
    document.getElementById('notifications-switch');
/** @return {Element} */ export const signInSnackbarElement = () =>
    document.getElementById('must-signin-snackbar');
/** @return {Element} */ export const splashScreenElement = () =>
    document.getElementById('signin-splashscreen');
/** @return {Element} */ export const signInSplashButtonElement = () =>
    document.getElementById('sign-in-splash');
/** @return {Element} */ export const messagesCardContainerElement = () =>
    document.getElementById('messages-card-container');
/** @return {Element} */ export const youtubeStreamContainerElement = () =>
    document.getElementById('youtube-stream-container');
/** @return {Element} */ export const youtubeVideoIframeElement = () =>
    document.getElementById('youtube-video');
/** @return {Element} */ export const youtubeChatIframeElement = () =>
    document.getElementById('youtube-chat');

/** @return {Element} */ export const hiddenAudioElement = () =>
    document.getElementById('hidden-audio');

/** @return {Element} */ export const scienceButtonElement = () =>
document.getElementById('science');
/** @return {Element} */ export const scienceFormElement = () =>
    document.getElementById('science-form');
/** @return {Element} */ export const artButtonElement = () =>
    document.getElementById('art');
/** @return {Element} */ export const artFormElement = () =>
    document.getElementById('art-form');
/** @return {Element} */ export const mapsButtonElement = () =>
    document.getElementById('maps');
/** @return {Element} */ export const mapsFormElement = () =>
    document.getElementById('maps-form');
/** @return {Element} */ export const shipsButtonElement = () =>
    document.getElementById('ships');
/** @return {Element} */ export const shipsFormElement = () =>
    document.getElementById('ships-form');
/** @return {Element} */ export const applauseButtonElement = () =>
    document.getElementById('applause');
/** @return {Element} */ export const applauseFormElement = () =>
    document.getElementById('applause-form');
/** @return {Element} */ export const booButtonElement = () =>
    document.getElementById('boo');
/** @return {Element} */ export const booFormElement = () =>
    document.getElementById('boo-form');
/** @return {Element} */ export const steenButtonElement = () =>
    document.getElementById('steen');
/** @return {Element} */ export const steenFormElement = () =>
    document.getElementById('steen-form');

/** @return {Element} */ export const scrollFormElement = () =>
    document.getElementById('scroll-down-form');
/** @return {Element} */ export const scrollContainerElement = () =>
    document.getElementById('scroll-down-container');
