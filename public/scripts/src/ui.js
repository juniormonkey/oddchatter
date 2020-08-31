/**
 * @fileoverview A model of the UI, for interacting with DOM elements.
 */
goog.module('oddsalon.oddchatter.ui');

/**
 * A utility class to keep generating the next ID in an incrementing sequence.
 */
class IncrementingId {
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

exports = {IncrementingId};

// Shortcuts to DOM Elements.
/** @const */ exports.outerContainerElement =
    document.getElementById('outer-container');
/** @const */ exports.promoElement = document.getElementById('promo');
/** @const */ exports.errorContainerElement =
    document.getElementById('error-container');
/** @const */ exports.errorLinkElement = document.getElementById('error-link');
/** @const */ exports.introContainerElement =
    document.getElementById('intro-container');
/** @const */ exports.introButtonElement =
    document.getElementById('intro-button');
/** @const */ exports.messageListElement = document.getElementById('messages');
/** @const */ exports.messageFormElement =
    document.getElementById('message-form');
/** @const */ exports.messageInputElement = document.getElementById('message');
/** @const */ exports.submitButtonElement = document.getElementById('submit');
/** @const */ exports.scienceButtonElement = document.getElementById('science');
/** @const */ exports.artButtonElement = document.getElementById('art');
/** @const */ exports.mapsButtonElement = document.getElementById('maps');
/** @const */ exports.shipsButtonElement = document.getElementById('ships');
/** @const */ exports.applauseButtonElement =
    document.getElementById('applause');
/** @const */ exports.booButtonElement = document.getElementById('boo');
/** @const */ exports.userPicElement = document.getElementById('user-pic');
/** @const */ exports.userNameElement = document.getElementById('user-name');
/** @const */ exports.signInButtonElement = document.getElementById('sign-in');
/** @const */ exports.signOutButtonElement =
    document.getElementById('sign-out');
/** @const */ exports.signInSnackbarElement =
    document.getElementById('must-signin-snackbar');
/** @const */ exports.splashScreenElement =
    document.getElementById('signin-splashscreen');
/** @const */ exports.signInSplashButtonElement =
    document.getElementById('sign-in-splash');
/** @const */ exports.messagesCardContainerElement =
    document.getElementById('messages-card-container');
/** @const */ exports.youtubeStreamContainerElement =
    document.getElementById('youtube-stream-container');
/** @const */ exports.youtubeVideoIframeElement =
    document.getElementById('youtube-video');
/** @const */ exports.youtubeChatIframeElement =
    document.getElementById('youtube-chat');

/** @const */ exports.scienceAudioElement =
    document.getElementById('science-audio');
/** @const */ exports.artAudioElement = document.getElementById('art-audio');
/** @const */ exports.mapsAudioElement = document.getElementById('maps-audio');
/** @const */ exports.shipsAudioElement =
    document.getElementById('ships-audio');
/** @const */ exports.applauseAudioElement =
    document.getElementById('applause-audio');
/** @const */ exports.booAudioElement = document.getElementById('boo-audio');

/** @const */ exports.scienceFormElement =
    document.getElementById('science-form');
/** @const */ exports.artFormElement = document.getElementById('art-form');
/** @const */ exports.mapsFormElement = document.getElementById('maps-form');
/** @const */ exports.shipsFormElement = document.getElementById('ships-form');
/** @const */ exports.applauseFormElement =
    document.getElementById('applause-form');
/** @const */ exports.booFormElement = document.getElementById('boo-form');
