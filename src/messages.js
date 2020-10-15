/**
 * @fileoverview Code for handling messages in chat.
 */

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
                         '<div class="byline">' +
                         '<div class="timestamp"></div>' +
                         '<div class="name"></div>' +
                         '</div>' +
                         '</div>';

const CALLBACK_STRINGS =
    callbacks.CALLBACKS.map(callback => callback.getMessage());

export class Message {

  /**
   * @param {string} id A unique string ID.
   * @param {!Date} timestamp The timestamp of the message.
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
    /* eslint-disable-next-line closure/no-undef */
    this.autolinker = new Autolinker(
        {newWindow: true, stripPrefix: false, stripTrailingSlash: false});
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
   * Displays the message in the UI. Unless running in admin mode, skips
   * messages that matche one of the CALLBACK_STRINGS; these are handled in
   * aggregate by callback_ui.js.
   */
  display() {
    if (!config.isAdminMode() && CALLBACK_STRINGS.includes(this.text)) {
      return;
    }
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
    if (this.timestamp && this.timestamp.getTime() > 10000) {
      div.querySelector('.timestamp').textContent =
          `${this.timestamp.toLocaleDateString()} ${
              this.timestamp.toLocaleTimeString()}`;
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
      const byline = div.querySelector('.byline');
      byline.insertBefore(deleteLine, byline.childNodes[0]);
    }

    if (this.text) { // If the message is text.
      messageElement.textContent = this.text;
      // Run DOMPurify to sanitize the message text.
      /* eslint-disable-next-line closure/no-undef */
      messageElement.innerHTML = DOMPurify.sanitize(messageElement.innerHTML);
      // Autolink URLs in the message text.
      messageElement.innerHTML = this.autolinker.link(messageElement.innerHTML);
      // Replace all line breaks by <br>.
      messageElement.innerHTML =
          messageElement.innerHTML.replace(/\n/g, '<br>');
    } else if (this.videoUrl) { // If the message is a video.
      const video = document.createElement('video');
      video.addEventListener('load', () => {
        if (scrollAfterDisplaying) {
          ui.messageListElement().scrollTop =
              ui.messageListElement().scrollHeight;
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
          ui.messageListElement().scrollTop =
              ui.messageListElement().scrollHeight;
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
    if (ui.messageInputElement()) {
      ui.messageInputElement().focus();
    }
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

    div.setAttribute('timestamp', this.timestampMillis_());

    // Figure out where to insert new message.
    const nextDiv = ui.findDivToInsertBefore(this.timestampMillis_());
    if (nextDiv) {
      ui.messageListElement().insertBefore(div, nextDiv);
    } else {
      ui.messageListElement().appendChild(div);
    }

    return div;
  }

  /**
   * @return {number} The timestamp of the message, in milliseconds since epoch.
   * @private
   */
  timestampMillis_() {
    // If timestamp is null, assume we've gotten a brand new message.
    // https://stackoverflow.com/a/47781432/4816918
    if (!this.timestamp) {
      this.timestamp = new Date();
    }
    return this.timestamp.getTime();
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
 * Loads chat messages history and listens for upcoming ones. If
 * oldestTimestamp is passed, only loads messages since that timestamp; if
 * newestTimestamp is also passed, only loads messages between those two
 * timestamps, and loads them in ascending rather than descending timestamp
 * order.
 *
 * @param {Date=} oldestTimestamp
 * @param {Date=} newestTimestamp
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
 * @param {!Date} timestamp The timestamp of the message.
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
  // QuerySnapshot.docChanges is not available in tests. :(
  if (!snapshot.docChanges) {
    return;
  }
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'removed') {
      messages.get(change.doc.id).remove();
    } else {
      const firebaseData = change.doc.data();
      const date =
          firebaseData['timestamp'] ? firebaseData['timestamp'].toDate() : null;
      const message =
          createMessage(change.doc.id, date, firebaseData['uid'],
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
