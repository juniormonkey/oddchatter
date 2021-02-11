/**
 * @fileoverview UI code for handling interaction with the UI. If we consider
 * this app as a MVC, this is the Controller.
 */

import * as callbacks from './callbacks.js';
import * as logging from './logging.js';
import * as notifications from './notifications.js';
import * as presence from './presence.js';
import * as ui from './ui.js';
import * as user from './user.js';

/**
 * Initializes all the event listeners.
 */
export function init() {
  // Saves message on form submit.
  if (ui.messageFormElement()) {
    ui.messageFormElement().addEventListener('submit', onMessageFormSubmit_);
  }
  ui.signOutButtonElement().addEventListener('click', signOut_);
  ui.signInButtonElement().addEventListener('click', signIn_);
  ui.signInSplashButtonElement().addEventListener('click', signIn_);

  if (ui.notificationsToggleElement()) {
    ui.notificationsToggleElement().addEventListener('click', (e) => {
      if (e.target.checked) {
        notifications.saveMessagingDeviceToken();
      } else {
        notifications.clearMessagingDeviceToken();
      }
    });
  }

  for (const callback of callbacks.CALLBACKS) {
    if (callback.formElement()) {
      callback.formElement().addEventListener(
          'submit', goog.partial(onCallbackFormSubmit_, callback));
    }
  }

  // Toggle for the button.
  if (ui.messageInputElement()) {
    ui.messageInputElement().addEventListener('keyup', toggleButton_);
    ui.messageInputElement().addEventListener('change', toggleButton_);
  }

  // Handle message scrolling.
  if (ui.lastMessageElement()) {
    const messageIntersectionOptions = {
      'root': ui.messageListElement(),
      'rootMargin': '0px',
      'threshold': 0.1,
    };
    const messageIntersectionObserver = new window.IntersectionObserver(
      ui.messageIntersectionHandler,
      messageIntersectionOptions);
    messageIntersectionObserver.observe(
      /** @type {!Element} */ (ui.lastMessageElement()));

    if (ui.scrollFormElement()) {
      ui.scrollFormElement().addEventListener('submit', (e) => {
        e.preventDefault();
        ui.lastMessageElement().scrollIntoView(false);
      });
    }
  }
}

/**
 * Signs-in Odd Chatter.
 * @private
 */
function signIn_() {
  // Sign in Firebase with credential from the Google user.
  /** @const */ const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider);
  logging.logEvent('login', {'method': ''});
}

/**
 * Signs-out of Odd Chatter.
 * @private
 */
function signOut_() {

  // When the user signs out, take their session offline first; they will
  // still be authenticated, meaning Security Rules allow us to clean up
  // Realtime Database records:
  presence.sessionManager().goOffline().then(() =>
    // AFTER disconnecting their session, use Authentication for sign-out.
    // The ordering is important for database records to be properly cleaned up.
    firebase.auth().signOut());
}

/**
 * Compares the given message text against all the registered callbacks,
 * and updates the timestamp for any callback that matches.
 *
 * @param {string} text The message text to check for the presence of a
 *     callback.
 * @private
 */
function checkForCallbacks_(text) {
  callbacks.CALLBACKS.forEach((callback) => {
    if (text !== callback.getMessage()) {
      return;
    }

    window.firebase.firestore()
        .collection(callback.getCollection())
        .doc(user.getUid())
        .set({
          'profilePicUrl': user.getProfilePicUrl(),
          'userName': user.getUserName(),
          'timestamp': window.firebase.firestore.FieldValue.serverTimestamp(),
        })
        .catch((error) => {
          console.error('Error writing new message to database', error);
        });
  });
}

/**
 * Saves a new message on the Firebase DB.
 *
 * @param {string} messageText The message text to save.
 * @return {Promise} A promise that is resolved when the message is saved.
 * @private
 */
function saveMessage_(messageText) {
  checkForCallbacks_(messageText);

  // Add a new message entry to the database.
  return window.firebase.firestore()
      .collection('messages')
      .add({
        'uid': user.getUid(),
        'name': user.getUserName(),
        'text': messageText,
        'profilePicUrl': user.getProfilePicUrl(),
        'timestamp': window.firebase.firestore.FieldValue.serverTimestamp(),
      })
      .catch((error) => {
        console.error('Error writing new message to database', error);
      });
}

/**
 * Triggered when the send new message form is submitted.
 * @param {!Event} e
 * @private
 */
async function onMessageFormSubmit_(e) {
  e.preventDefault();
  logging.logEvent('share', {
    'method': 'chat',
    'content_type': 'freeform',
    'content_id': '',
  });
  await onMessageSubmitted_(ui.messageInputElement().value);
}

/**
 * Triggered when a callback form is submitted.
 * @param {callbacks.Callback} callback
 * @param {!Event} e
 * @private
 */
async function onCallbackFormSubmit_(callback, e) {
  e.preventDefault();
  logging.logEvent('share', {
    'method': 'chat',
    'content_type': callback.getCollection(),
    'content_id': '',
  });
  await onMessageSubmitted_(callback.getMessage());
  callback.buttonElement().setAttribute('disabled', 'true');
  setTimeout(() => callback.enableButton(), 1000);
}

/**
 * Handles the submitting of a new message (including the callbacks.)
 * @param {string} message The message to submit.
 * @private
 */
async function onMessageSubmitted_(message) {
  // Check that the user entered a message and is signed in.
  if (message && checkSignedInWithMessage_()) {
    await saveMessage_(message);
    // Clear message text field and re-enable the SEND button.
    resetMaterialTextfield_(ui.messageInputElement());
    toggleButton_();
  }
}

/**
 * @return {boolean} true if user is signed-in. Otherwise false and displays a
 *     message.
 * @private
 */
function checkSignedInWithMessage_() {
  // Return true if the user is signed in Firebase
  if (user.isSignedIn()) {
    return true;
  }

  // Display a message to the user using a Toast.
  const data = {message: 'You must sign-in first', timeout: 2000};
  /** @type {MaterialSnackbar} */ (
  ui.signInSnackbarElement()['MaterialSnackbar'])
      .showSnackbar(data);
  return false;
}

/**
 * Resets the given MaterialTextfield.
 *
 * @param {Element} element The text field element to reset.
 * @private
 */
function resetMaterialTextfield_(element) {
  element.value = '';
  if (element.parentNode['MaterialTextfield']) {
    /** @type {MaterialTextfield} */ (element.parentNode['MaterialTextfield'])
        .boundUpdateClassesHandler();
  }
}

/**
 * Toggles the enabled state of the submit button.
 * @private
 */
function toggleButton_() {
  if (ui.messageInputElement().value) {
    ui.submitButtonElement().removeAttribute('disabled');
  } else {
    ui.submitButtonElement().setAttribute('disabled', 'true');
  }
}
