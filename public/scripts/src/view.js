/**
 * @fileoverview UI code for displaying data in the DOM. If we consider this app
 * as a MVC, then this is the View.
 */
goog.module('oddsalon.oddchatter.view');

const callbacks = goog.require('oddsalon.oddchatter.callbacks');
const config = goog.require('oddsalon.oddchatter.config');
const logging = goog.require('oddsalon.oddchatter.logging');
const ui = goog.require('oddsalon.oddchatter.ui');
const user = goog.require('oddsalon.oddchatter.user');

const Timestamp = firebase.firestore.Timestamp;

/** @const @private */ const CALLBACK_ID =
    new ui.IncrementingId('callback-message-');

/**
 * Template for messages.
 * @const
 * @private
 */
const MESSAGE_TEMPLATE = '<div class="message-container">' +
                         '<div class="spacing"><div class="pic"></div></div>' +
                         '<div class="message"></div>' +
                         '<div class="name"></div>' +
                         '<div class="timestamp"></div>' +
                         '</div>';

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
        `url(${addSizeToGoogleProfilePic_(profilePicUrl)})`;
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
    if (unsubscribeMessages_) {
      unsubscribeMessages_();
      unsubscribeMessages_ = null;
    }
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
  loadMessages_();

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
 * @private {function()|null}
 */
let unsubscribeMessages_ = null;

/**
 * Loads chat messages history and listens for upcoming ones.
 * @private
 */
function loadMessages_() {
  // Create the query to load the last 12 messages and listen for new
  // ones.
  const query = firebase.firestore()
                    .collection('messages')
                    .orderBy('timestamp', 'desc')
                    .limit(12);

  // Start listening to the query.
  if (!unsubscribeMessages_) {
    unsubscribeMessages_ = query.onSnapshot(
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'removed') {
            deleteMessage_(change.doc.id);
          } else {
            const message = change.doc.data();
            displayMessage_(change.doc.id, message['timestamp'], message['uid'],
                            message['name'], message['text'],
                            message['profilePicUrl'], message['imageUrl']);
          }
        });
      },
      (error) => {
        console.error('Error querying Firestore: ', error);
      });
  }
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
                callback.lastCalledTimestampMillis = lastTimestampMillis + 1000;
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
 * Adds a size to Google Profile pics URLs.
 *
 * @param {string} url The profile pic URL to edit.
 * @return {string} A new profile pic URL with the size param added.
 * @private
 */
function addSizeToGoogleProfilePic_(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return `${url}?sz=150`;
  }
  return url;
}

/**
 * Delete a Message from the UI.
 *
 * @param {string} id The ID of the message to delete.
 * @private
 */
function deleteMessage_(id) {
  const div = document.getElementById(id);
  // If an element for that message exists we delete it.
  if (div) {
    div.parentNode.removeChild(div);
  }
}

/**
 * Creates a new Message in the UI.
 *
 * @param {string} id The ID of the message to create.
 * @param {firebase.firestore.Timestamp|undefined} timestamp The timestamp of
 *     the existing message, or undefined if it's a brand new message.
 * @return {Node} The new message element.
 * @private
 */
function createAndInsertMessage_(id, timestamp) {
  /** @const */ const container = document.createElement('div');
  container.innerHTML = MESSAGE_TEMPLATE;
  /** @const */ const div = container.firstChild;
  div.setAttribute('id', id);

  // If timestamp is null, assume we've gotten a brand new message.
  // https://stackoverflow.com/a/47781432/4816918
  const timestampMillis = timestamp ? timestamp.toMillis() : Date.now();
  div.setAttribute('timestamp', timestampMillis);

  // figure out where to insert new message
  /** @const */ const existingMessages = ui.messageListElement.children;
  if (existingMessages.length === 0) {
    ui.messageListElement.appendChild(div);
  } else {
    let messageListNode = existingMessages[0];

    while (messageListNode) {
      /** @const */ const messageListNodeTime =
          messageListNode.getAttribute('timestamp');

      if (!messageListNodeTime) {
        throw new Error(
            `Child ${messageListNode.id} has no 'timestamp' attribute`);
      }

      if (messageListNodeTime > timestampMillis) {
        break;
      }

      messageListNode = messageListNode.nextSibling;
    }

    ui.messageListElement.insertBefore(div, messageListNode);
  }

  return div;
}

/**
 * Displays a Message in the UI.
 *
 * @param {string} id The ID of the message to display.
 * @param {!firebase.firestore.Timestamp} timestamp The timestamp of the
 *     message to display.
 * @param {string} uid The UID of the author.
 * @param {string} name The name of the author.
 * @param {string|null} text The content of the message.
 * @param {string} picUrl The URL of the author's profile pic.
 * @param {string|null} videoUrl The URL of the callback video to play.
 * @private
 */
function displayMessage_(id, timestamp, uid, name, text, picUrl, videoUrl) {
  const scrollAfterDisplaying =
      /* Scroll down after displaying if we're already at the bottom, or ... */
      ui.messageListElement.scrollTop ===
          (ui.messageListElement.scrollHeight -
              ui.messageListElement.clientHeight) ||
      /* ... if the author of the new message is the logged-in user. */
     uid === user.getUid();

  const div =
      document.getElementById(id) || createAndInsertMessage_(id, timestamp);

  // profile picture
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage =
        `url(${addSizeToGoogleProfilePic_(picUrl)})`;
  }

  div.querySelector('.name').textContent = name;
  if (timestamp && timestamp.toMillis() > 10000) {
    div.querySelector('.timestamp').textContent =
        `${timestamp.toDate().toLocaleDateString()} ${
            timestamp.toDate().toLocaleTimeString()}`;
  }
  const messageElement = div.querySelector('.message');

  // If the current user is an admin, add a delete link to all Firebase
  // messages.
  // (This ACL is also enforced by Firestore.)
  if (config.CONFIG.admin_users.includes(user.getUid()) &&
      // Callbacks aren't in the DB so they don't need this.
      !id.startsWith('callback-message-') &&
      // Don't add a duplicate admin div.
      !div.querySelector('.admin')) {
    const deleteLine = document.createElement('a');
    deleteLine.className = 'admin';
    deleteLine.setAttribute('href', '#');
    deleteLine.textContent = 'delete';
    deleteLine.addEventListener('click', () => {
      firebase.firestore()
          .collection('messages')
          .doc(id)
          .delete()
          .catch(
              (error) => {
                console.error('Error removing message: ', error);
              });
    });
    div.appendChild(deleteLine);
  }

  if (text) { // If the message is text.
    messageElement.textContent = text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else if (videoUrl) { // If the message is a video.
    const video = document.createElement('video');
    video.addEventListener('load', () => {
      if (scrollAfterDisplaying) {
        ui.messageListElement.scrollTop = ui.messageListElement.scrollHeight;
      }
    });
    video.playsInline = true;
    video.autoplay = true;
    video.muted = true;
    video.className = 'callback-video';
    const mp4 = document.createElement('source');
    mp4.src = videoUrl;
    mp4.type = 'video/mp4';
    const fallback =
        document.createTextNode('Your browser does not support the video tag.');
    video.innerHTML = '';
    video.appendChild(mp4);
    video.appendChild(fallback);
    video.onloadedmetadata = () => {
      if (scrollAfterDisplaying) {
        ui.messageListElement.scrollTop = ui.messageListElement.scrollHeight;
      }
    };
    messageElement.innerHTML = '';
    messageElement.appendChild(video);
  }
  // Show the card fading-in and scroll to view the new message.
  setTimeout(() => {
    div.classList.add('visible');
  }, 1);
  if (scrollAfterDisplaying) {
    ui.messageListElement.scrollTop = ui.messageListElement.scrollHeight;
  }
  ui.messageInputElement.focus();
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
  displayMessage_(CALLBACK_ID.next(), Timestamp.fromMillis(timestamp), '',
                  callback.getByline(), '', 'images/adventureharvey.jpg',
                  video);
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
