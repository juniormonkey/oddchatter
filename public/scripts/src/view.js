/**
 * @fileoverview UI code for displaying data in the DOM. If we consider this app
 * as a MVC, then this is the View.
 */
goog.module('oddsalon.oddchatter.view');

const callbacks = goog.require('oddsalon.oddchatter.callbacks');
const config = goog.require('oddsalon.oddchatter.config');
const logging = goog.require('oddsalon.oddchatter.logging');
const messages = goog.require('oddsalon.oddchatter.messages');
const ui = goog.require('oddsalon.oddchatter.ui');
const user = goog.require('oddsalon.oddchatter.user');

const Timestamp = firebase.firestore.Timestamp;

/** @const @private */ const CALLBACK_ID =
    new ui.IncrementingId('callback-message-');

/**
 * Updates the UI in response to a config change.
 *
 * @param {config.Configuration} config
 */
function applyNewConfiguration(config) {
  // Show only the splash screen if the app is not enabled.
  if (!config.enabled) {
    ui.promoElement.removeAttribute('hidden');
    ui.outerContainerElement.setAttribute('hidden', true);
    ui.errorContainerElement.setAttribute('hidden', true);
    logging.logEvent('screen_view', {screen_name: 'promo'});
    return;
  }

  // If we've set a fallback URL, show the error screen with a link to that URL.
  if (config.fallback_url) {
    ui.errorContainerElement.removeAttribute('hidden');
    ui.outerContainerElement.setAttribute('hidden', true);
    ui.promoElement.setAttribute('hidden', true);
    ui.errorLinkElement.setAttribute('href', config.fallback_url);
    logging.logEvent('screen_view', {screen_name: 'error'});
    return;
  }

  // Else, hide the splash screen and show the chat container.
  if (ui.outerContainerElement.hasAttribute('hidden')) {
    ui.outerContainerElement.removeAttribute('hidden');
    ui.promoElement.setAttribute('hidden', true);
    ui.errorContainerElement.setAttribute('hidden', true);
    logging.logEvent('screen_view', {screen_name: 'main'});
  }

  // If there's a YouTube stream ID, show the embedded player.
  if (config.youtube_video) {
    ui.youtubeVideoIframeElement.src =
        `https://www.youtube.com/embed/${config.youtube_video}`;
    ui.youtubeVideoIframeElement.removeAttribute('hidden');
  } else {
    ui.youtubeVideoIframeElement.setAttribute('hidden', true);
  }

  // If there's a YouTube chat ID, show the embedded chat widget.
  if (config.youtube_chat) {
    ui.youtubeChatIframeElement.src = `https://www.youtube.com/live_chat?v=${
        config.youtube_chat}&embed_domain=${window.location.hostname}`;
    ui.youtubeChatIframeElement.removeAttribute('hidden');
  } else {
    ui.youtubeChatIframeElement.setAttribute('hidden', true);
  }

  // If there's either a YouTube stream ID or chat ID, show the container that
  // wraps both of these elements.
  if (config.youtube_video || config.youtube_chat) {
    ui.youtubeStreamContainerElement.removeAttribute('hidden');
  } else {
    ui.youtubeStreamContainerElement.setAttribute('hidden', true);
  }
}

/**
 * Updates the UI in response to an auth state change, for instance when the
 * user signs-in or signs-out.
 *
 * @param {firebase.User} firebaseUser
 */
async function applyNewAuthState(firebaseUser) {
  if (firebaseUser) { // User is signed in!
    // Get the signed-in user's profile pic and name.
    const profilePicUrl = user.getProfilePicUrl();
    const userName = user.getUserName();

    // Set the user's profile pic and name.
    ui.userPicElement.style.backgroundImage =
        `url(${ui.addSizeToGoogleProfilePic(profilePicUrl)})`;
    ui.userNameElement.textContent = userName;

    // Show user's profile and sign-out button.
    ui.userNameElement.removeAttribute('hidden');
    ui.userPicElement.removeAttribute('hidden');
    ui.signOutButtonElement.removeAttribute('hidden');

    // Hide sign-in button.
    ui.signInButtonElement.setAttribute('hidden', 'true');

    // Hide the sign-in UI
    ui.splashScreenElement.setAttribute('hidden', 'true');

    // Show the messages UI, or the introduction if it hasn't been seen yet
    if (config.CONFIG.intro_seen) {
      showMessagesCard_();
    } else {
      await showIntroduction_();
      showMessagesCard_();
    }
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    ui.userNameElement.setAttribute('hidden', 'true');
    ui.userPicElement.setAttribute('hidden', 'true');
    ui.signOutButtonElement.setAttribute('hidden', 'true');

    // Show sign-in button.
    ui.signInButtonElement.removeAttribute('hidden');

    // Show the sign-in UI
    ui.splashScreenElement.removeAttribute('hidden');

    // Hide the messages UI
    ui.messagesCardContainerElement.setAttribute('hidden', 'true');

    // Remove the firestore snapshot listeners.
    for (const callback of callbacks.CALLBACKS) {
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
  ui.messagesCardContainerElement.removeAttribute('hidden');
  ui.introContainerElement.setAttribute('hidden', true);

  ui.messageInputElement.removeAttribute('disabled');
  ui.messageInputElement.focus();

  // Load the messages.
  loadCallbacks_();
  messages.load();

  logging.logEvent('screen_view', {screen_name: 'chat'});
}

/**
 * @return {Promise} A promise that is resolved by the intro click handler.
 *
 * @private
 */
function showIntroduction_() {
  ui.introContainerElement.removeAttribute('hidden');
  ui.messagesCardContainerElement.setAttribute('hidden', true);
  logging.logEvent('screen_view', {screen_name: 'introduction'});

  /* eslint-disable-next-line no-unused-vars */
  return new Promise((resolve, reject) => {
    ui.introButtonElement.addEventListener('click', () => {
      // Play all the sounds, at volume 0, for mobile browsers.
      for (const callback of callbacks.CALLBACKS) {
        const audio = callback.audioElement;
        audio.volume = 0;
        audio.muted = true;
        audio.playbackRate = 2;
        audio.onended = () => {
          window.console.log('resetting element: ', audio);
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
  for (const callback of callbacks.CALLBACKS) {
    const voices = firebase.firestore()
                       .collection(callback.getCollection())
                       .orderBy('timestamp', 'desc')
                       .limit(config.CONFIG.callback_threshold);

    if (!callback.unsubscribeFromFirestore) {

      callback.unsubscribeFromFirestore = voices.onSnapshot(
          (snapshot) => {
            const callbackWindowStartMillis =
                Math.max(callback.lastCalledTimestampMillis,
                         Date.now() - config.CONFIG.callback_window_ms);
            if (snapshot.size >= config.CONFIG.callback_threshold) {
              const firstTimestampMillis = getTimestampMillis_(
                  snapshot.docs[config.CONFIG.callback_threshold - 1].data());
              if (firstTimestampMillis > callbackWindowStartMillis) {
                const lastTimestampMillis =
                    getTimestampMillis_(snapshot.docs[0].data());
                if (lastTimestampMillis > 0) {
                  callback.lastCalledTimestampMillis =
                      lastTimestampMillis + 1000;
                  displayCallback_(lastTimestampMillis + 1, callback);
                  logging.logEvent('screen_view',
                                   {screen_name: callback.getCollection()});
                }
              }
            }
          },
          (error) => {
            console.error('Error querying Firestore: ', error);
          });
    }
  }
}

/**
 * @param {number} timestamp The timestamp to display, in milliseconds since
 *     epoch.
 * @param {!callbacks.Callback} callback The callback to display.
 * @private
 */
function displayCallback_(timestamp, callback) {
  const video = `video/${
      callback
          .videoUrls[Math.floor(Math.random() * callback.videoUrls.length)]}`;
  const message = new messages.Message(
      CALLBACK_ID.next(), Timestamp.fromMillis(timestamp), '',
      callback.getByline(), 'images/adventureharvey.jpg', '', video);
  message.display();
  callback.audioElement.play();
}

/**
 * Safely get the timestamp from a Firestore data object.
 * @param {Object} data An object retrieved from Firestore.
 * @return {number} The value of the object's 'timestamp' field, in
 *     milliseconds since epoch
 * @private
 */
function getTimestampMillis_(data) {
  if (!data) {
    return -1;
  }
  if (!data['timestamp']) {
    return -1;
  }
  if (!data['timestamp'].toMillis) {
    return -1;
  }
  return data['timestamp'].toMillis();
}

exports = {
  applyNewConfiguration,
  applyNewAuthState,
};
