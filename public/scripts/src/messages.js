/**
 * @fileoverview Code for handling messages in chat.
 */
goog.module('oddsalon.oddchatter.messages');

const config = goog.require('oddsalon.oddchatter.config');
const ui = goog.require('oddsalon.oddchatter.ui');
const user = goog.require('oddsalon.oddchatter.user');

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

class Message {

  /**
   * @param {string} id A unique string ID.
   * @param {!firebase.firestore.Timestamp} timestamp The timestamp of the
   *     message.
   * @param {string} authorUid The UID of the message author.
   * @param {string} authorName The name of the message author.
   * @param {string} authorPic The URL of the author's profile pic.
   * @param {string|null} text The content of the message.
   * @param {string|null} videoUrl The URL of the callback video to play.
   * */
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
    const div =
        document.getElementById(this.id) || this.createAndInsertElement_();

    const scrollAfterDisplaying =
        /*
         * Scroll down after displaying if we're already at the bottom, or ...
         */
        ui.messageListElement.scrollTop ===
            (ui.messageListElement.scrollHeight -
             ui.messageListElement.clientHeight) ||
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
          ui.messageListElement.scrollTop = ui.messageListElement.scrollHeight;
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
   * Creates a new Message in the UI.
   *
   * @return {Node} The new message element.
   * @private
   */
  createAndInsertElement_() {
    /** @const */ const container = document.createElement('div');
    container.innerHTML = MESSAGE_TEMPLATE;
    /** @const */ const div = container.firstChild;
    div.setAttribute('id', this.id);

    // If timestamp is null, assume we've gotten a brand new message.
    // https://stackoverflow.com/a/47781432/4816918
    const timestampMillis =
        this.timestamp ? this.timestamp.toMillis() : Date.now();
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

  //  displayMessage_(CALLBACK_ID.next(), Timestamp.fromMillis(timestamp), '',
  //                  callback.getByline(), '', 'images/adventureharvey.jpg',
  //                  video);
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
 * Loads chat messages history and listens for upcoming ones.
 */
function load() {
  // Create the query to load the last 12 messages and listen for new
  // ones.
  const query = firebase.firestore()
                    .collection('messages')
                    .orderBy('timestamp', 'desc')
                    .limit(12);

  // Start listening to the query.
  if (unsubscribe_.length == 0) {
    unsubscribe_.push(
        query.onSnapshot(handleMessagePageSnapshot_, handleFirebaseError_));
  }
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
      const message = change.doc.data();
      messages.set(change.doc.id,
                   new Message(change.doc.id, message['timestamp'],
                               message['uid'], message['name'],
                               message['profilePicUrl'], message['text'],
                               message['videoUrl']));
      messages.get(change.doc.id).display();
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
function unload() {
  for (const unsubscribe of unsubscribe_) {
    unsubscribe();
  }
  unsubscribe_ = [];
}

exports = {
  Message,
  load,
  unload,
};
