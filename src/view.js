/**
 * @fileoverview UI code for displaying data in the DOM. If we consider this app
 * as a MVC, then this is the View.
 */

import * as callbackUi from './callback_ui.js';
import * as callbacks from './callbacks.js';
import * as config from './config.js';
import * as logging from './logging.js';
import * as messages from './messages.js';
import * as ui from './ui.js';
import * as user from './user.js';

/**
 * Updates the UI in response to a config change.
 *
 * @param {config.Configuration} config
 */
export function applyNewConfiguration(config) {
  // If we're in admin mode, redirect non-admin users to the regular app.
  // TODO: this is not actual security. Replace this with real security.
  if (window.ADMIN_MODE && !config.admin_users.includes(user.getUid())) {
    window.location.href = 'https://odd-chatter.web.app/';
    return;
  }
  // Show only the splash screen if the app is not enabled.
  if (!config.enabled() && ui.promoElement()) {
    ui.promoElement().removeAttribute('hidden');
    ui.outerContainerElement().setAttribute('hidden', true);
    ui.errorContainerElement().setAttribute('hidden', true);
    logging.logEvent('screen_view', {screen_name: 'promo'});
    return;
  }

  // If we've set a fallback URL, show the error screen with a link to that URL.
  if (config.fallback_url && ui.errorLinkElement()) {
    ui.errorContainerElement().removeAttribute('hidden');
    ui.outerContainerElement().setAttribute('hidden', true);
    ui.promoElement().setAttribute('hidden', true);
    ui.errorLinkElement().setAttribute('href', config.fallback_url);
    logging.logEvent('screen_view', {screen_name: 'error'});
    return;
  }

  // Else, hide the splash screen and show the chat container.
  if (ui.outerContainerElement().hasAttribute('hidden')) {
    ui.outerContainerElement().removeAttribute('hidden');
    if (ui.promoElement()) {
      ui.promoElement().setAttribute('hidden', true);
    }
    if (ui.errorContainerElement()) {
      ui.errorContainerElement().setAttribute('hidden', true);
    }
    logging.logEvent('screen_view', {screen_name: 'main'});
  }

  // If there's a YouTube stream ID, show the embedded player.
  if (ui.youtubeVideoIframeElement()) {
    if (config.youtube_video) {
      ui.youtubeVideoIframeElement().src =
          `https://www.youtube.com/embed/${config.youtube_video}`;
      ui.youtubeVideoIframeElement().removeAttribute('hidden');
    } else {
      ui.youtubeVideoIframeElement().setAttribute('hidden', true);
    }
  }

  // If there's a YouTube chat ID, show the embedded chat widget.
  if (ui.youtubeChatIframeElement()) {
    if (config.youtube_chat) {
      ui.youtubeChatIframeElement().src =
          `https://www.youtube.com/live_chat?v=${
              config.youtube_chat}&embed_domain=${window.location.hostname}`;
      ui.youtubeChatIframeElement().removeAttribute('hidden');
    } else {
      ui.youtubeChatIframeElement().setAttribute('hidden', true);
    }
  }

  // If there's either a YouTube stream ID or chat ID, show the container that
  // wraps both of these elements.
  if (ui.youtubeStreamContainerElement()) {
    if (config.youtube_video || config.youtube_chat) {
      ui.youtubeStreamContainerElement().removeAttribute('hidden');
    } else {
      ui.youtubeStreamContainerElement().setAttribute('hidden', true);
    }
  }
}

/**
 * Updates the UI in response to an auth state change, for instance when the
 * user signs-in or signs-out.
 *
 * @param {firebase.User} firebaseUser
 */
export async function applyNewAuthState(firebaseUser) {
  if (firebaseUser) { // User is signed in!
    // Get the signed-in user's profile pic and name.
    const profilePicUrl = user.getProfilePicUrl();
    const userName = user.getUserName();

    // Set the user's profile pic and name.
    ui.userPicElement().style.backgroundImage =
        `url(${ui.addSizeToGoogleProfilePic(profilePicUrl)})`;
    ui.userNameElement().textContent = userName;

    // Show user's profile and sign-out button.
    ui.userNameElement().removeAttribute('hidden');
    ui.userPicElement().removeAttribute('hidden');
    ui.signOutButtonElement().removeAttribute('hidden');

    // Hide sign-in button.
    ui.signInButtonElement().setAttribute('hidden', 'true');

    // Hide the sign-in UI
    ui.splashScreenElement().setAttribute('hidden', 'true');

    // Show the messages UI, or the introduction if it hasn't been seen yet
    if (config.CONFIG.intro_seen || !ui.introContainerElement()) {
      showMessagesCard_();
    } else {
      await showIntroduction_();
      showMessagesCard_();
    }
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    ui.userNameElement().setAttribute('hidden', 'true');
    ui.userPicElement().setAttribute('hidden', 'true');
    ui.signOutButtonElement().setAttribute('hidden', 'true');

    // Show sign-in button.
    ui.signInButtonElement().removeAttribute('hidden');

    // Show the sign-in UI
    ui.splashScreenElement().removeAttribute('hidden');

    // Hide the messages UI
    ui.messagesCardContainerElement().setAttribute('hidden', 'true');

    // Remove the firestore snapshot listeners.
    for (const callback of callbackUi.CALLBACKS) {
      if (callback.unsubscribeFromFirestore) {
        callback.unsubscribeFromFirestore();
        callback.unsubscribeFromFirestore = null;
      }
    }
    messages.unload();
  }
}

/**
 * @private
 */
function showMessagesCard_() {
  ui.messagesCardContainerElement().removeAttribute('hidden');
  if (ui.introContainerElement()) {
    ui.introContainerElement().setAttribute('hidden', true);
  }

  if (ui.messageInputElement()) {
    ui.messageInputElement().removeAttribute('disabled');
    ui.messageInputElement().focus();
  }

  // Load the messages.
  if (!window.ADMIN_MODE) {
    loadCallbacks_();
  }
  messages.load(config.CONFIG.event_start);

  logging.logEvent('screen_view', {screen_name: 'chat'});
}

/**
 * @return {Promise} A promise that is resolved by the intro click handler.
 *
 * @private
 */
function showIntroduction_() {
  ui.introContainerElement().removeAttribute('hidden');
  ui.messagesCardContainerElement().setAttribute('hidden', true);
  logging.logEvent('screen_view', {screen_name: 'introduction'});

  /* eslint-disable-next-line no-unused-vars */
  return new Promise((resolve, reject) => {
    ui.introButtonElement().addEventListener('click', () => {
      // Play all the sounds, at volume 0, for mobile browsers.
      for (const callback of callbacks.CALLBACKS) {
        const audio = callback.audioElement();
        audio.volume = 0;
        audio.muted = true;
        audio.playbackRate = 2;
        audio.onended = () => {
          audio.volume = 1;
          audio.muted = false;
          audio.playbackRate = 1;
          audio.onended = null;
        };
        audio.play();
        callback.enableButton();
      }
      config.CONFIG.intro_seen = true;
      resolve();
    });
  });
}

/**
 * Loads callback timestamps and listens for upcoming ones.
 * @private
 */
function loadCallbacks_() {
  for (const callback of callbackUi.CALLBACKS) {
    const query = window.firebase.firestore()
                      .collection(callback.callback.getCollection())
                      .orderBy('timestamp', 'desc')
                      .limit(config.CONFIG.callback_threshold);

    if (!callback.unsubscribeFromFirestore) {
      callback.unsubscribeFromFirestore = query.onSnapshot(
          (snapshot) => {
            callback.handleFirestoreSnapshot(snapshot.docs);
          },
          (error) => {
            console.error('Error querying Firestore: ', error);
          });
    }
  }
}