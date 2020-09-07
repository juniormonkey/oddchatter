/**
 * @fileoverview A model of the UI, for interacting with DOM elements.
 */

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
  next() { return this.text + this.index++; }
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

// Shortcuts to DOM Elements.
/** @const */ export const outerContainerElement = () =>
    document.getElementById('outer-container');
/** @const */ export const promoElement = () =>
    document.getElementById('promo');
/** @const */ export const errorContainerElement = () =>
    document.getElementById('error-container');
/** @const */ export const errorLinkElement = () =>
    document.getElementById('error-link');
/** @const */ export const introContainerElement = () =>
    document.getElementById('intro-container');
/** @const */ export const introButtonElement = () =>
    document.getElementById('intro-button');
/** @const */ export const messageListElement = () =>
    document.getElementById('messages');
/** @const */ export const messageFormElement = () =>
    document.getElementById('message-form');
/** @const */ export const messageInputElement = () =>
    document.getElementById('message');
/** @const */ export const submitButtonElement = () =>
    document.getElementById('submit');
/** @const */ export const scienceButtonElement = () =>
    document.getElementById('science');
/** @const */ export const artButtonElement = () =>
    document.getElementById('art');
/** @const */ export const mapsButtonElement = () =>
    document.getElementById('maps');
/** @const */ export const shipsButtonElement = () =>
    document.getElementById('ships');
/** @const */ export const applauseButtonElement = () =>
    document.getElementById('applause');
/** @const */ export const booButtonElement = () =>
    document.getElementById('boo');
/** @const */ export const userPicElement = () =>
    document.getElementById('user-pic');
/** @const */ export const userNameElement = () =>
    document.getElementById('user-name');
/** @const */ export const signInButtonElement = () =>
    document.getElementById('sign-in');
/** @const */ export const signOutButtonElement = () =>
    document.getElementById('sign-out');
/** @const */ export const signInSnackbarElement = () =>
    document.getElementById('must-signin-snackbar');
/** @const */ export const splashScreenElement = () =>
    document.getElementById('signin-splashscreen');
/** @const */ export const signInSplashButtonElement = () =>
    document.getElementById('sign-in-splash');
/** @const */ export const messagesCardContainerElement = () =>
    document.getElementById('messages-card-container');
/** @const */ export const youtubeStreamContainerElement = () =>
    document.getElementById('youtube-stream-container');
/** @const */ export const youtubeVideoIframeElement = () =>
    document.getElementById('youtube-video');
/** @const */ export const youtubeChatIframeElement = () =>
    document.getElementById('youtube-chat');

/** @const */ export const scienceAudioElement = () =>
    document.getElementById('science-audio');
/** @const */ export const artAudioElement = () =>
    document.getElementById('art-audio');
/** @const */ export const mapsAudioElement = () =>
    document.getElementById('maps-audio');
/** @const */ export const shipsAudioElement = () =>
    document.getElementById('ships-audio');
/** @const */ export const applauseAudioElement = () =>
    document.getElementById('applause-audio');
/** @const */ export const booAudioElement = () =>
    document.getElementById('boo-audio');

/** @const */ export const scienceFormElement = () =>
    document.getElementById('science-form');
/** @const */ export const artFormElement = () =>
    document.getElementById('art-form');
/** @const */ export const mapsFormElement = () =>
    document.getElementById('maps-form');
/** @const */ export const shipsFormElement = () =>
    document.getElementById('ships-form');
/** @const */ export const applauseFormElement = () =>
    document.getElementById('applause-form');
/** @const */ export const booFormElement = () =>
    document.getElementById('boo-form');
