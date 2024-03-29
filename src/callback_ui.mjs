/**
 * @fileoverview The callbacks we listen for.
 */

import * as callbacks from './callbacks.mjs';
import * as config from './config.mjs';
import * as logging from './logging.mjs';
import * as messages from './messages.mjs';
import * as ui from './ui.mjs';
import * as user from './user.mjs';

export class CallbackUi {
  /**
   * @param {callbacks.Callback} callback The callback this UI represents.
   */
  constructor(callback) {
    this.callback = callback;
    /** @type {number} */
    this.lastCalledTimestampMillis =
        Date.now() - config.CONFIG.callbackWindowMs(this.callback.weight);
    /** @type {function()|null} */
    this.unsubscribeFromFirestore = null;
    /** @type {CallbackProgress} The current progress bar. */
    this.progressBar = null;
  }

  /**
   * Initializes the audio elements.
   */
  initAudio() {
    this.callback.videoUrls.forEach(video => {
      const audioElement = document.createElement('audio');
      audioElement.id = video;
      audioElement.playsinline = true;
      audioElement.hidden = true;
      audioElement.preload = 'auto';
      audioElement.src = `video/${video}`;
      ui.hiddenAudioElement().appendChild(audioElement);
    });
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
                 Date.now() -
                 config.CONFIG.callbackWindowMs(this.callback.weight));
    /** @const {Array<firebase.firestore.QueryDocumentSnapshot>} */
    const docsWithinWindow = docs.filter(
        doc => getTimestampMillis_(doc.data()) > callbackWindowStartMillis);
    if (docsWithinWindow.length > 0) {
      const lastTimestampMillis = getTimestampMillis_(docs[0].data());
      if (lastTimestampMillis > 0) {
        // If the number of voices is above the threshold, hide the progress bar
        // and play the video.
        if (docsWithinWindow.length >=
            config.CONFIG.callbackThreshold(this.callback.weight)) {
          if (this.progressBar) {
            this.progressBar.div.remove();
            this.progressBar = null;
          }

          this.lastCalledTimestampMillis = lastTimestampMillis + 1000;
          this.displayVideo_(lastTimestampMillis + 1);
          logging.logEvent('screen_view',
                           {'screen_name': this.callback.getCollection()});
        } else {
          // Update progress bar, creating it first if necessary.
          const voices = docsWithinWindow.map(
              (doc) => ({
                uid: doc.id,
                userName: doc.data()['userName'],
                profilePhoto: doc.data()['profilePicUrl'],
              }));
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
      this.progressBar = new CallbackProgress(
          this.callback.buttonText,
          this.callback.getByline(),
          timestamp,
          this.callback.weight);
      this.progressBar.display();
    }
    for (const voice of voices) {
      this.progressBar.increment(voice.uid, voice.userName, voice.profilePhoto);
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
    const video =
        this.callback.videoUrls[Math.floor(Math.random() *
                                           this.callback.videoUrls.length)];
    const message = messages.createMessage(
        CALLBACK_ID.next(), new Date(timestamp), '', this.callback.getByline(),
        'images/adventureharvey.jpg', '', `video/${video}`);
    message.display();
    document.getElementById(video).play();
  }
}

/** @const @private */ const PROGRESS_TEMPLATE =
    '<div class="message-container">' +
    '  <div class="spacing"><div class="callback-emoji"></div></div>' +
    '  <div class="callback-progress">' +
    '    <div class="callback-progress-bar">' +
    '      <div class="callback-progress-callback"></div>' +
    '    </div>' +
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
   * @param {string} callbackText The full callback to use in the progress bar.
   * @param {number} timestamp The timestamp to display, in milliseconds since
   *     epoch.
   * @param {number} weight A multiplier to apply to the callback window size
   *     and threshold.
   */
  constructor(callbackEmoji, callbackText, timestamp, weight) {
    this.id = CALLBACK_ID.next();
    this.callbackEmoji = callbackEmoji;
    this.callbackText = callbackText;
    this.timestamp = timestamp;
    this.weight = weight;
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
    if (!document.getElementById(this.id)) {
      const container = document.createElement('div');
      container.innerHTML = PROGRESS_TEMPLATE;
      this.div = container.firstChild;
      this.div.setAttribute('id', this.id);
      this.div.setAttribute('timestamp', this.timestamp);

      this.div.querySelector('.callback-emoji').innerText = this.callbackEmoji;
      this.div.querySelector('.callback-progress-callback').innerText =
          this.callbackText;

      // Figure out where to insert new message.
      let nextDiv = ui.findDivToInsertBefore(this.timestamp);
      if (!nextDiv) {
        nextDiv = ui.lastMessageElement();
      }
      ui.messageListElement().insertBefore(this.div, nextDiv);
      // Show the card fading-in.
      setTimeout(() => {
        this.div.classList.add('visible');
      }, 1);

      // Start the progress bar fading out.
      setTimeout(() => {
        const progressBar = this.div.querySelector('.callback-progress-bar');
        progressBar.style.transition =
            `opacity ${config.CONFIG.callbackWindowMs(this.weight) -
                       1000}ms ease-in`;
        progressBar.style.opacity = 0;
      }, 1001);

      // When the window ends, flip the progress bar style.
      setTimeout(() => {
        const progressBar = this.div.querySelector('.callback-progress-bar');
        progressBar.classList.remove('callback-progress-bar');
        progressBar.classList.add('callback-progress-bar-expired');
        progressBar.removeAttribute('style');
      }, config.CONFIG.callbackWindowMs(this.weight));
    }

    if (ui.messageListElement().dataset.scrolledToEnd) {
      ui.lastMessageElement().scrollIntoView(false);
    }
  }

  /**
   * Adds a voice to the progress bar.
   * @param {string} uid The UID of the user whose voice to add.
   * @param {string} name The user's name, to show as a title text.
   * @param {string} photoUrl The URL of the user's profile photo.
   */
  increment(uid, name, photoUrl) {
    if (!this.voices.includes(uid)) {
      this.voices.push(uid);

      const progressBar = this.div.querySelector('.callback-progress-bar');

      // Adjust the width of the progress bar.
      progressBar.style.width =
          `${100 * this.voices.length /
            config.CONFIG.callbackThreshold(this.weight)}%`;

      // Add the profile photo to the progress bar.
      const authorPic = document.createElement('div');
      authorPic.className = 'callback-progress-voice';
      if (photoUrl) {
        authorPic.style.backgroundImage =
            `url(${ui.addSizeToGoogleProfilePic(photoUrl)})`;
        authorPic.title = name;
      }
      progressBar.insertBefore(
          authorPic, this.div.querySelector('.callback-progress-callback'));

      // Scroll down after displaying ...
      const scrollToBottom =
          // ... if we're already within one message of the
          // bottom, or ...
          ui.messageListElement().dataset.scrolledToEnd ||
          // ... if the author is the logged-in user.
          uid === user.getUid();
      if (scrollToBottom) {
        ui.lastMessageElement().scrollIntoView(false);
      }
    }
  }
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
