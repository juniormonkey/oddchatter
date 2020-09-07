/**
 * @fileoverview Code for handling messages in chat.
 */

goog.require('goog.array');

import * as callbacks from './callbacks.js';
import * as config from './config.js';
import * as ui from './ui.js';
import * as user from './user.js';

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

const CALLBACK_STRINGS =
    callbacks.CALLBACKS.map(callback => callback.getMessage());

export class Message {

  /**
   * @param {string} id A unique string ID.
   * @param {!firebase.firestore.Timestamp} timestamp The timestamp of the
   *     message.
   * @param {string} authorUid The UID of the message author.
   * @param {string} authorName The name of the message author.
   * @param {string} authorPic The URL of the author's profile pic.
   * @param {string|null} text The content of the message.
   * @param {string|null} videoUrl The URL of the callback video to play.
   * @protected
   */
  constructor(id, timestamp, authorUid, authorName, authorPic, text, videoUrl) {
    this.id = id;
    this.timestamp = timestamp;
    this.authorUid = authorUid;
    this.authorName = authorName;
    this.authorPic = authorPic;
    this.text = text;
    this.videoUrl = videoUrl;
  }

  /**
   * Remove the message from the UI.
   */
  remove() {
    const div = document.getElementById(this.id);
    // If an element for that message exists we delete it.
    if (div) {
      div.parentNode.removeChild(div);
    }
  }

  /**
   * Displays the message in the UI.
   */
  display() {
    if (CALLBACK_STRINGS.includes(this.text)) {
      this.displayAsCallback_();
    } else {
      this.displayAsMessage_();
    }
  }

  /**
   * Displays the message as one of a collection of calls in the UI.
   * @private
   */
  displayAsCallback_() {
    const div = this.findOrCreateCallbackElement_();

    // Scroll down after displaying...
    const scrollAfterDisplaying =
        /*
         * ... if we're already within one message of the bottom, or ...
         */
        ui.messageListElement().scrollTop >=
            (ui.messageListElement().scrollHeight -
             ui.messageListElement().clientHeight - div.clientHeight) ||
        /*
         * ... if it's the newest message, and the author is the logged-in user.
         */
        (div.nextElementSibling === null && this.authorUid === user.getUid());

    div.querySelector('.pic').style.backgroundImage =
        `url(${ui.addSizeToGoogleProfilePic('images/adventureharvey.jpg')})`;

    div.querySelector('.name').textContent = this.text;
    if (this.timestamp && this.timestamp.toMillis() > 10000) {
      div.querySelector('.timestamp').textContent =
          `${this.timestamp.toDate().toLocaleDateString()} ${
              this.timestamp.toDate().toLocaleTimeString()}`;
    }
    const messageElement = div.querySelector('.message');

    // TODO: a progress bar or something.
    // maybe use a big emoji for the author image, and small author images in
    // place of the text? maybe even a slightly different template?
    // TODO: somehow this makes a few too many entries when a new message comes
    // in.
    if (messageElement.textContent.endsWith('!!')) {
      messageElement.textContent = messageElement.textContent.concat(' ');
    }
    messageElement.textContent = messageElement.textContent.concat(this.text);

    // Remove all line breaks.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '');

    // Show the card fading-in and scroll to view the new message.
    setTimeout(() => {
      div.classList.add('visible');
    }, 1);
    if (scrollAfterDisplaying) {
      ui.messageListElement().scrollTop = ui.messageListElement().scrollHeight;
    }
    ui.messageInputElement().focus();
  }

  /**
   * Displays the message as an individual message in the UI.
   * @private
   */
  displayAsMessage_() {
    const div =
        document.getElementById(this.id) || this.createAndInsertElement_();

    // Scroll down after displaying...
    const scrollAfterDisplaying =
        /*
         * ... if we're already within one message of the bottom, or ...
         */
        ui.messageListElement().scrollTop >=
            (ui.messageListElement().scrollHeight -
             ui.messageListElement().clientHeight - div.clientHeight) ||
        /*
         * ... if it's the newest message, and the author is the logged-in user.
         */
        (div.nextElementSibling === null && this.authorUid === user.getUid());

    // profile picture
    if (this.authorPic) {
      div.querySelector('.pic').style.backgroundImage =
          `url(${ui.addSizeToGoogleProfilePic(this.authorPic)})`;
    }

    div.querySelector('.name').textContent = this.authorName;
    if (this.timestamp && this.timestamp.toMillis() > 10000) {
      div.querySelector('.timestamp').textContent =
          `${this.timestamp.toDate().toLocaleDateString()} ${
              this.timestamp.toDate().toLocaleTimeString()}`;
    }
    const messageElement = div.querySelector('.message');

    // If the current user is an admin, add a delete link to all Firebase
    // messages.
    // (This ACL is also enforced by Firestore.)
    if (config.CONFIG.admin_users.includes(user.getUid()) &&
        // Callbacks aren't in the DB so they don't need this.
        !this.id.startsWith('callback-message-') &&
        // Don't add a duplicate admin div.
        !div.querySelector('.admin')) {
      const deleteLine = document.createElement('a');
      deleteLine.className = 'admin';
      deleteLine.setAttribute('href', '#');
      deleteLine.textContent = 'delete';
      deleteLine.addEventListener('click', () => {
        firebase.firestore()
            .collection('messages')
            .doc(this.id)
            .delete()
            .catch((error) => {
              console.error('Error removing message: ', error);
            });
      });
      div.appendChild(deleteLine);
    }

    if (this.text) { // If the message is text.
      messageElement.textContent = this.text;
      // Replace all line breaks by <br>.
      messageElement.innerHTML =
          messageElement.innerHTML.replace(/\n/g, '<br>');
    } else if (this.videoUrl) { // If the message is a video.
      const video = document.createElement('video');
      video.addEventListener('load', () => {
        if (scrollAfterDisplaying) {
          ui.messageListElement().scrollTop = ui.messageListElement().scrollHeight;
        }
      });
      video.playsInline = true;
      video.autoplay = true;
      video.muted = true;
      video.className = 'callback-video';
      const mp4 = document.createElement('source');
      mp4.src = this.videoUrl;
      mp4.type = 'video/mp4';
      const fallback = document.createTextNode(
          'Your browser does not support the video tag.');
      video.innerHTML = '';
      video.appendChild(mp4);
      video.appendChild(fallback);
      video.onloadedmetadata = () => {
        if (scrollAfterDisplaying) {
          ui.messageListElement().scrollTop = ui.messageListElement().scrollHeight;
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
      ui.messageListElement().scrollTop = ui.messageListElement().scrollHeight;
    }
    ui.messageInputElement().focus();
  }

  /**
   * Finds the current callback message element in the UI, or creates it if it
   * doesn't exit.
   *
   * @return {Node} The message element.
   * @private
   */
  findOrCreateCallbackElement_() {
    // If timestamp is null, assume we've gotten a brand new message.
    // https://stackoverflow.com/a/47781432/4816918
    const timestampMillis =
        this.timestamp ? this.timestamp.toMillis() : Date.now();

    // Figure out where to insert new callback.
    const existingMessages = ui.messageListElement().children;
    const insertionPoint = goog.array.binarySearch(
        existingMessages, timestampMillis, (targetTime, node) => {
          const nodeTime = node.getAttribute('timestamp');

          if (!nodeTime) {
            throw new Error(`Child ${node.id} has no 'timestamp' attribute`);
          }
          return targetTime - nodeTime;
        });

    let div = null;
    if (insertionPoint >= existingMessages.length ||
        insertionPoint < -(existingMessages.length)) {
      // The callback is newer than all existing messages.
      div = existingMessages[existingMessages.length - 1];
    } else if (insertionPoint >= 0) {
      // Found a message with the same timestamp as the new callback.
      div = existingMessages[insertionPoint];
    } else if (insertionPoint < 0) {
      // goog.array.binarySearch() returns a negative index if the timestamp
      // was not matched; the absolute value of this index provides the
      // right place to insert the new callback.
      div = existingMessages[-(insertionPoint)];
    }
    if (!div || div.getAttribute('callback') != this.text) {
      console.log('no element found, text=', this.text, ', div=', div,
                  ', insertionPoint=', insertionPoint,
                  ', length=', existingMessages.length);
      div = this.createAndInsertElement_();
      div.setAttribute('callback', this.text);
    }

    return div;
  }

  /**
   * Creates a new Message in the UI.
   *
   * @return {Node} The new message element.
   * @private
   */
  createAndInsertElement_() {
    const container = document.createElement('div');
    container.innerHTML = MESSAGE_TEMPLATE;
    const div = container.firstChild;
    div.setAttribute('id', this.id);

    // If timestamp is null, assume we've gotten a brand new message.
    // https://stackoverflow.com/a/47781432/4816918
    const timestampMillis =
        this.timestamp ? this.timestamp.toMillis() : Date.now();
    div.setAttribute('timestamp', timestampMillis);

    // figure out where to insert new message
    const existingMessages = ui.messageListElement().children;
    if (existingMessages.length === 0) {
      ui.messageListElement().appendChild(div);
    } else {
      const insertionPoint = goog.array.binarySearch(
          existingMessages, timestampMillis, (targetTime, node) => {
            const nodeTime = node.getAttribute('timestamp');

            if (!nodeTime) {
              throw new Error(`Child ${node.id} has no 'timestamp' attribute`);
            }
            return targetTime - nodeTime;
          });

      if (insertionPoint >= existingMessages.length ||
          insertionPoint < -(existingMessages.length)) {
        // The message is newer than all existing messages.
        ui.messageListElement().appendChild(div);
      } else if (insertionPoint >= 0) {
        // Found a message with the same timestamp as the new message; insert
        // the new message after it.
        ui.messageListElement().insertBefore(div,
                                           existingMessages[insertionPoint]);
      } else {
        // goog.array.binarySearch() returns a negative index if the timestamp
        // was not matched; the absolute value of this index provides the
        // right place to insert the new message.
        ui.messageListElement().insertBefore(div,
                                           existingMessages[-(insertionPoint)]);
      }
    }

    return div;
  }
}

/**
 * @const {Map<string, Message>}
 */
const messages = new Map();

/**
 * @type {!Array<function()>}
 */
let unsubscribe_ = [];

/**
 * Loads chat messages history and listens for upcoming ones. If oldestTimestamp
 * is passed, only loads messages since that timestamp; if newestTimestamp is
 * also passed, only loads messages between those two timestamps, and loads them
 * in ascending rather than descending timestamp order.
 *
 * @param {firebase.firestore.Timestamp=} oldestTimestamp
 * @param {firebase.firestore.Timestamp=} newestTimestamp
 */
export function load(oldestTimestamp = undefined, newestTimestamp = undefined) {
  // Create the query to load the last 12 messages and listen for new
  // ones.
  let query = firebase.firestore().collection('messages').limit(8);

  if (oldestTimestamp) {
    query = query.where('timestamp', '>', oldestTimestamp);
  }
  if (newestTimestamp) {
    query = query.where('timestamp', '<', newestTimestamp)
                .orderBy('timestamp', 'asc');
  } else {
    query = query.orderBy('timestamp', 'desc');
  }

  // Start listening to the query.
  if (unsubscribe_.length == 0) {
    unsubscribe_.push(
        query.onSnapshot(handleMessagePageSnapshot_, handleFirebaseError_));
  }
}

/**
 * Creates a new Message object, and stores it in the map and list caches.
 *
 * @param {string} id A unique string ID.
 * @param {!firebase.firestore.Timestamp} timestamp The timestamp of the
 *     message.
 * @param {string} authorUid The UID of the message author.
 * @param {string} authorName The name of the message author.
 * @param {string} authorPic The URL of the author's profile pic.
 * @param {string|null} text The content of the message.
 * @param {string|null} videoUrl The URL of the callback video to play.
 * @return {Message} the newly created message.
 */
export function createMessage(id, timestamp, authorUid, authorName, authorPic,
                              text, videoUrl) {
  const message = new Message(id, timestamp, authorUid, authorName, authorPic,
                              text, videoUrl);
  messages.set(id, message);
  return message;
}

/**
 * Handles a Firebase QuerySnapshot for one page of messages.
 * @param {firebase.firestore.QuerySnapshot} snapshot
 * @private
 */
function handleMessagePageSnapshot_(snapshot) {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'removed') {
      messages.get(change.doc.id).remove();
    } else {
      const firebaseData = change.doc.data();
      const message = createMessage(
          change.doc.id, firebaseData['timestamp'], firebaseData['uid'],
          firebaseData['name'], firebaseData['profilePicUrl'],
          firebaseData['text'], firebaseData['videoUrl']);
      message.display();
    }
  });
  if (!snapshot.empty) {
    unsubscribe_.push(
        snapshot.query.startAfter(snapshot.docs[snapshot.size - 1])
            .onSnapshot(handleMessagePageSnapshot_, handleFirebaseError_));
  }
}

/**
 * Handles a Firebase error.
 * @param {Error} error
 * @private
 */
function handleFirebaseError_(error) {
  console.error('Error querying Firestore: ', error);
}

/**
 * Cleans up the firestore messages listener.
 */
export function unload() {
  for (const unsubscribe of unsubscribe_) {
    unsubscribe();
  }
  unsubscribe_ = [];
}
