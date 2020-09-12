/**
 * @fileoverview The callbacks we listen for.
 */

import * as callbacks from './callbacks.js';
import * as config from './config.js';
import * as logging from './logging.js';
import * as messages from './messages.js';
import * as ui from './ui.js';
import * as user from './user.js';

export class CallbackUi {
  /**
   * @param {callbacks.Callback} callback The callback this UI represents.
   */
  constructor(callback) {
    this.callback = callback;
    /** @type {number} */
    this.lastCalledTimestampMillis =
        Date.now() - config.CONFIG.callback_window_ms;
    /** @type {function()|null} */
    this.unsubscribeFromFirestore = null;
    /** @type {CallbackProgress} The current progress bar. */
    this.progressBar = null;
  }

  /**
   * @param {Array<firebase.firestore.QueryDocumentSnapshot>} docs
   */
  handleFirestoreSnapshot(docs) {
    if (!docs) {
      return;
    }
    /** @const {number} */
    const callbackWindowStartMillis =
        Math.max(this.lastCalledTimestampMillis,
                 Date.now() - config.CONFIG.callback_window_ms);
    /** @const {Array<firebase.firestore.QueryDocumentSnapshot>} */
    const docsWithinWindow = docs.filter(
        doc => getTimestampMillis_(doc.data()) > callbackWindowStartMillis);
    if (docsWithinWindow.length > 0) {
      const lastTimestampMillis = getTimestampMillis_(docs[0].data());
      if (lastTimestampMillis > 0) {
        // If the number of voices is above the threshold, hide the progress bar and play the video.
        if (docsWithinWindow.length >= config.CONFIG.callback_threshold) {
          if (this.progressBar) {
            this.progressBar.div.remove();
            this.progressBar = null;
          }

          this.lastCalledTimestampMillis = lastTimestampMillis + 1000;
          this.displayVideo_(lastTimestampMillis + 1);
          logging.logEvent('screen_view',
                           {screen_name : this.callback.getCollection()});
        } else {
          // Update progress bar, creating it first if necessary.
          const voices = docsWithinWindow.map(
              (doc) =>
                  ({uid : doc.id, profilePhoto : doc.data()['profilePicUrl']}));
          this.displayProgress_(lastTimestampMillis, voices,
                                callbackWindowStartMillis);
        }
      }
    }
  }

  /**
   * Updates callback progress towards playing the actual video.
   *
   * @param {number} timestamp The timestamp to display, in milliseconds since
   *     epoch.
   * @param {!Array<Object>} voices The users whose voices to display in the
   *     progress bar.
   * @param {number} callbackWindowStartMillis The start of the timestamp window
   *     to consider.
   * @private
   */
  displayProgress_(timestamp, voices, callbackWindowStartMillis) {
    if (!this.progressBar ||
        this.progressBar.timestamp < callbackWindowStartMillis) {
      this.progressBar =
          new CallbackProgress(this.callback.buttonText, timestamp);
      this.progressBar.display();
    }
    for (const voice of voices) {
      this.progressBar.increment(voice.uid, voice.profilePhoto);
    }
  }

  /**
   * Plays the video for this callback.
   *
   * @param {number} timestamp The timestamp to display, in milliseconds since
   *     epoch.
   * @private
   */
  displayVideo_(timestamp) {
    // Scroll down after displaying if we're already within one message of the
    // bottom.
    const scrollToVideo =
        ui.messageListElement().scrollTop >=
        (ui.messageListElement().scrollHeight -
         ui.messageListElement().clientHeight - 60);

    const video = `video/${
        this.callback.videoUrls[Math.floor(Math.random() *
                                           this.callback.videoUrls.length)]}`;
    const message = messages.createMessage(
        CALLBACK_ID.next(), new Date(timestamp),
        '', this.callback.getByline(), 'images/adventureharvey.jpg', '', video);
    message.display();
    if (scrollToVideo) {
      ui.messageListElement().scrollTop = ui.messageListElement().scrollHeight;
    }
    this.callback.audioElement().play();
  }
}

/** @const @private */ const PROGRESS_TEMPLATE =
    '<div class="message-container">' +
    '  <div class="spacing"><div class="callback-emoji"></div></div>' +
    '  <div class="callback-progress">' +
    '    <div class="callback-progress-bar"></div>' +
    '  </div>' +
    '</div>';

/** @const @private */ const CALLBACK_ID =
    new ui.IncrementingId('callback-message-');

/**
 * Represents a progress bar UI showing progress towards the callback video.
 */
class CallbackProgress {
  /**
   * @param {string} callbackEmoji The single-character emoji to use as a label.
   * @param {number} timestamp The timestamp to display, in milliseconds since
   *     epoch.
   */
  constructor(callbackEmoji, timestamp) {
    this.id = CALLBACK_ID.next();
    this.callbackEmoji = callbackEmoji;
    this.timestamp = timestamp;
    this.div = null;
    this.voices = [];
  }

  /**
   * Displays the progress bar; or does nothing if this progress is already
   * displayed.
   */
  display() {
    // Scroll down after displaying if we're already within one message of the
    // bottom.
    const scrollToProgressBar =
        ui.messageListElement().scrollTop >=
        (ui.messageListElement().scrollHeight -
         ui.messageListElement().clientHeight - 60);

    if (!document.getElementById(this.id)) {
      const container = document.createElement('div');
      container.innerHTML = PROGRESS_TEMPLATE;
      this.div = container.firstChild;
      this.div.setAttribute('id', this.id);
      this.div.setAttribute('timestamp', this.timestamp);

      this.div.querySelector('.callback-emoji').innerText = this.callbackEmoji;

      // Figure out where to insert new message.
      const nextDiv = ui.findDivToInsertBefore(this.timestamp);
      if (nextDiv) {
        ui.messageListElement().insertBefore(this.div, nextDiv);
      } else {
        ui.messageListElement().appendChild(this.div);
      }
      // Show the card fading-in.
      setTimeout(() => { this.div.classList.add('visible'); }, 1);
    }

    if (scrollToProgressBar) {
      ui.messageListElement().scrollTop = ui.messageListElement().scrollHeight;
    }
  }

  /**
   * Adds a voice to the progress bar.
   * @param {string} uid The UID of the user whose voice to add.
   * @param {string} photoUrl The URL of the user's profile photo.
   */
  increment(uid, photoUrl) {
    if (!this.voices.includes(uid)) {
      this.voices.push(uid);

      const progressBar = this.div.querySelector('.callback-progress-bar');

      // Adjust the width of the progress bar.
      progressBar.style.width =
          (100 * this.voices.length / config.CONFIG.callback_threshold) + '%';

      // Add the profile photo to the progress bar.
      const authorPic = document.createElement('div');
      authorPic.className = 'callback-progress-voice';
      authorPic.style.backgroundImage =
          `url(${ui.addSizeToGoogleProfilePic(photoUrl)})`;
      progressBar.appendChild(authorPic);

      // TODO: scroll to the bottom if UID is the current user.

      // Scroll down after displaying ...
      const scrollToBottom =
          // ... if we're already within one message of the
          // bottom, or ...
          (ui.messageListElement().scrollTop >=
           (ui.messageListElement().scrollHeight -
            ui.messageListElement().clientHeight - 60)) ||
          // ... if the author is the logged-in user.
          uid === user.getUid();
      if (scrollToBottom) {
        ui.messageListElement().scrollTop =
            ui.messageListElement().scrollHeight;
      }
    }
  }
}

/**
 * @param {number} from
 * @param {number} to
 * @return {number} A random number in the inclusive range [from, to].
 * @private
 */
function randomNumberBetween_(from, to) {
  return from + Math.floor(Math.random() * (to - from + 1));
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

/**
 * CallbackUi objects for all the Callbacks that we listen for.
 *
 * @const
 */
export const CALLBACKS =
    callbacks.CALLBACKS.map((callback) => new CallbackUi(callback));
