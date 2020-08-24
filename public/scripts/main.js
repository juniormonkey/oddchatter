/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const DEFAULT_CALLBACK_WINDOW_MS = 10000;
const DEFAULT_CALLBACK_THRESHOLD = 3;

var CALLBACK_WINDOW_MS = DEFAULT_CALLBACK_WINDOW_MS;
var CALLBACK_THRESHOLD = DEFAULT_CALLBACK_THRESHOLD;
var YOUTUBE_VIDEO = '';

// Load the configuration from Firestore before doing anything else.
loadConfiguration();

const Timestamp = firebase.firestore.Timestamp;

class IncrementingId {
  constructor(text) {
    this.text = text;
    this.index = 0;
  }

  next() { return this.text + this.index++; }
}

const onboardingId = new IncrementingId('onboarding-message-');
const callbackId = new IncrementingId('callback-message-');

// Signs-in Odd Chatter.
function signIn() {
  // Sign in Firebase with credential from the Google user.
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider);
}

// Signs-out of Odd Chatter.
function signOut() {
  // Sign out of Firebase.
  firebase.auth().signOut();
}

// Initiate firebase auth.
function initFirebaseAuth() {
  // Listen to auth state changes.
  firebase.auth().onAuthStateChanged(authStateObserver);
}

// Returns the signed-in user's profile Pic URL.
function getProfilePicUrl() {
  return firebase.auth().currentUser.photoURL ||
         '/images/profile_placeholder.png';
}

function getUid() { return firebase.auth().currentUser.uid; }

// Returns the signed-in user's display name.
function getUserName() { return firebase.auth().currentUser.displayName; }

// Returns true if a user is signed-in.
function isUserSignedIn() { return !!firebase.auth().currentUser; }

function checkForCallbacks(text) {
  callbacks.forEach((callback) => {
    if (text !== callback.getMessage()) {
      return;
    }

    firebase.firestore()
        .collection(callback.getCollection())
        .doc(getUid())
        .set({timestamp : firebase.firestore.FieldValue.serverTimestamp()})
        .catch(function(error) {
          console.error('Error writing new message to database', error);
        });
  });
}

// Saves a new message on the Firebase DB.
function saveMessage(messageText) {
  checkForCallbacks(messageText);

  // Add a new message entry to the database.
  return firebase.firestore()
      .collection('messages')
      .add({
        uid : getUid(),
        name : getUserName(),
        text : messageText,
        profilePicUrl : getProfilePicUrl(),
        timestamp : firebase.firestore.FieldValue.serverTimestamp()
      })
      .catch(function(error) {
        console.error('Error writing new message to database', error);
      });
}

const waitFor = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

async function displayOnBoardingMessage(timestamp, message) {
  displayMessage(onboardingId.next(), Timestamp.fromMillis(timestamp), 'Harvey',
                 message, 'images/adventureharvey.jpg', null);
  await waitFor(100);
}

// Introduces everything and initializes the background audio.
async function
onBoarding() {
  // Use a artificially low timestamp so that all real messages appear after the
  // onboarding.
  let timestamp = 1;
  await displayOnBoardingMessage(timestamp++,
                                 'Welcome to the Odd Chatter room!');
  await displayOnBoardingMessage(
      timestamp++,
      'This is not a quiet event - if enough folks shout the same callout in chat, we\'ll all hear it.');
  await displayOnBoardingMessage(timestamp++,
                                 'Let me show you how it works...');
  for (const callback of callbacks) {
    await callback.onboard();
  }
  await displayOnBoardingMessage(
      timestamp++,
      'Remember, the chat is public - so don\'t share your bank account password.');
  await displayOnBoardingMessage(timestamp++,
                                 'Now you\'re ready to learn something weird!');
  waitFor(250);

  scienceButtonElement.removeAttribute('disabled');
  artButtonElement.removeAttribute('disabled');
  mapsButtonElement.removeAttribute('disabled');
  shipsButtonElement.removeAttribute('disabled');
  applauseButtonElement.removeAttribute('disabled');
  booButtonElement.removeAttribute('disabled');
  messageInputElement.removeAttribute('disabled');
  messageInputElement.focus();

  return waitFor(1);
}

class Callback {
  constructor(text, onboardingMessage, buttonText, videoUrls, audioElement) {
    this.text = text;
    this.onboardingMessage = onboardingMessage;
    this.buttonText = buttonText;
    this.videoUrls = videoUrls;
    this.audioElement = audioElement;
    this.lastCalledTimestampMillis = Date.now() - CALLBACK_WINDOW_MS;
  }

  listenInChat() {
    let voices = firebase.firestore()
                     .collection(this.getCollection())
                     .orderBy('timestamp', 'desc')
                     .limit(CALLBACK_THRESHOLD);

    let callback = this;
    voices.onSnapshot((snapshot) => {
      let callbackWindowStartMillis = Math.max(
          callback.lastCalledTimestampMillis, Date.now() - CALLBACK_WINDOW_MS);
      if (snapshot.size >= CALLBACK_THRESHOLD) {
        let firstTimestampMillis =
            snapshot.docs[CALLBACK_THRESHOLD - 1].data().timestamp.toMillis();
        if (firstTimestampMillis > callbackWindowStartMillis) {
          let lastTimestampMillis =
              snapshot.docs[0].data().timestamp.toMillis();
          callback.lastCalledTimestampMillis = lastTimestampMillis + 1000;
          callback.display(lastTimestampMillis + 1);
        }
      }
    });
  }

  async onboard(timestamp) {
    await displayOnBoardingMessage(timestamp, this.onboardingMessage);
    await this.displayOnBoardingButton(timestamp);
    await waitFor(this.audioElement.duration * 1000);
  }

  async displayOnBoardingButton(timestamp) {
    let div = createAndInsertMessage(onboardingId.next(),
                                     Timestamp.fromMillis(timestamp));

    div.querySelector('.name').textContent = 'Harvey';
    div.querySelector('.pic').style.backgroundImage =
        'url(' + addSizeToGoogleProfilePic('images/adventureharvey.jpg') + ')';
    let messageElement = div.querySelector('.message');

    let button = document.createElement('button');
    button.className = 'mdl-button mdl-js-button mdl-button--raised';
    button.textContent = this.buttonText;
    messageElement.innerHTML = '';
    messageElement.appendChild(button);

    // Show the card fading-in and scroll to view the new message.
    setTimeout(function() { div.classList.add('visible') }, 1);
    messageListElement.scrollTop = messageListElement.scrollHeight;
    messageInputElement.focus();

    let callback = this;
    return new Promise((resolve, reject) => {
      button.addEventListener('click', (e) => {
        callback.display(timestamp);
        resolve();
      });
    });
  }

  display(timestamp) {
    let video =
        'video/' +
        this.videoUrls[Math.floor(Math.random() * this.videoUrls.length)];
    displayMessage(callbackId.next(), Timestamp.fromMillis(timestamp),
                   this.getByline(), '', 'images/adventureharvey.jpg', video);
    this.audioElement.play();
  }

  getByline() {
    if (this.text === '👏' || this.text === '👎') {
      return this.text.repeat(randomNumberBetween(3, 6));
    }

    return '!'.repeat(randomNumberBetween(2, 4)) + this.text +
           '!'.repeat(randomNumberBetween(1, 3)) +
           '1'.repeat(randomNumberBetween(0, 2)) +
           '!'.repeat(randomNumberBetween(1, 2));
  }

  getMessage() {
    if (this.text === '👏' || this.text === '👎') {
      return this.text;
    }

    return this.text + '!!';
  }

  getCollection() {
    if (this.text === '👏') {
      return 'APPLAUSE';
    }

    if (this.text === '👎') {
      return 'BOO';
    }

    return this.text;
  }
}

function randomNumberBetween(from, to) {
  return from + Math.floor(Math.random() * (to - from + 1));
}

// Loads the callback thresholds and YouTube ID, and listens for changes.
function loadConfiguration() {
  let query = firebase.firestore()
                  .collection('configuration')
                  .orderBy('timestamp', 'desc')
                  .limit(1);

  query.onSnapshot((snapshot) => {
    if (snapshot.size > 0) {
      let config = snapshot.docs[0].data();
      if (!config.enabled) {
        window.location.href = 'https://www.oddsalon.com';
        return;
      }
      if (outerContainerElement.hasAttribute('hidden')) {
        outerContainerElement.removeAttribute('hidden');
        spinnerElement.setAttribute('hidden', true);
      }

      CALLBACK_WINDOW_MS = config.callback_window_ms;
      CALLBACK_THRESHOLD = config.callback_threshold;

      if (config.youtube_video !== YOUTUBE_VIDEO) {
        YOUTUBE_VIDEO = config.youtube_video;
      }
      if (YOUTUBE_VIDEO) {
        youtubeStreamIframeElement.src =
            "https://www.youtube.com/live_chat?v=" + YOUTUBE_VIDEO +
            "&embed_domain=" + window.location.hostname;
        youtubeStreamContainerElement.removeAttribute('hidden');
      } else {
        youtubeStreamContainerElement.setAttribute('hidden', true);
      }
    }
  });
}

// Loads chat messages history and listens for upcoming ones.
function loadMessages() {
  // Create the query to load the last 12 messages and listen for new
  // ones.
  let query = firebase.firestore()
                  .collection('messages')
                  .orderBy('timestamp', 'desc')
                  .limit(12);

  // Start listening to the query.
  query.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'removed') {
        deleteMessage(change.doc.id);
      } else {
        let message = change.doc.data();
        displayMessage(change.doc.id, message.timestamp, message.name,
                       message.text, message.profilePicUrl, message.imageUrl);
      }
    });
  });

  callbacks.forEach((callback) => callback.listenInChat());
}

// Triggered when the send new message form is submitted.
function onMessageFormSubmit(e) {
  e.preventDefault();
  onMessageSubmitted(messageInputElement.value);
}

function onScienceFormSubmit(e) {
  e.preventDefault();
  onMessageSubmitted('SCIENCE!!');
  scienceButtonElement.setAttribute('disabled', 'true');
  setTimeout(() => scienceButtonElement.removeAttribute('disabled'), 1000);
}

function onArtFormSubmit(e) {
  e.preventDefault();
  onMessageSubmitted('ART!!');
  artButtonElement.setAttribute('disabled', 'true');
  setTimeout(() => artButtonElement.removeAttribute('disabled'), 1000);
}

function onMapsFormSubmit(e) {
  e.preventDefault();
  onMessageSubmitted('MAPS!!');
  mapsButtonElement.setAttribute('disabled', 'true');
  setTimeout(() => mapsButtonElement.removeAttribute('disabled'), 1000);
}

function onShipsFormSubmit(e) {
  e.preventDefault();
  onMessageSubmitted('SHIPS!!');
  shipsButtonElement.setAttribute('disabled', 'true');
  setTimeout(() => shipsButtonElement.removeAttribute('disabled'), 1000);
}

function onApplauseFormSubmit(e) {
  e.preventDefault();
  onMessageSubmitted('👏');
  applauseButtonElement.setAttribute('disabled', 'true');
  setTimeout(() => applauseButtonElement.removeAttribute('disabled'), 1000);
}

function onBooFormSubmit(e) {
  e.preventDefault();
  onMessageSubmitted('👎');
  booButtonElement.setAttribute('disabled', 'true');
  setTimeout(() => booButtonElement.removeAttribute('disabled'), 1000);
}

function onMessageSubmitted(message) {
  // Check that the user entered a message and is signed in.
  if (message && checkSignedInWithMessage()) {
    saveMessage(message).then(() => {
      // Clear message text field and re-enable the SEND button.
      resetMaterialTextfield(messageInputElement);
      toggleButton();
    });
  }
}

// Triggers when the auth state change for instance when the user
// signs-in or
// signs-out.
function authStateObserver(user) {
  if (user) { // User is signed in!
    // Get the signed-in user's profile pic and name.
    let profilePicUrl = getProfilePicUrl();
    let userName = getUserName();

    // Set the user's profile pic and name.
    userPicElement.style.backgroundImage =
        'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
    userNameElement.textContent = userName;

    // Show user's profile and sign-out button.
    userNameElement.removeAttribute('hidden');
    userPicElement.removeAttribute('hidden');
    signOutButtonElement.removeAttribute('hidden');

    // Hide sign-in button.
    signInButtonElement.setAttribute('hidden', 'true');

    // Hide the sign-in UI
    splashScreenElement.setAttribute('hidden', 'true');

    // Show the messages UI
    messagesCardContainerElement.removeAttribute('hidden');
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    userNameElement.setAttribute('hidden', 'true');
    userPicElement.setAttribute('hidden', 'true');
    signOutButtonElement.setAttribute('hidden', 'true');

    // Show sign-in button.
    signInButtonElement.removeAttribute('hidden');

    // Show the sign-in UI
    splashScreenElement.removeAttribute('hidden');

    // Hide the messages UI
    messagesCardContainerElement.setAttribute('hidden', 'true');
  }
}

// Returns true if user is signed-in. Otherwise false and displays a
// message.
function checkSignedInWithMessage() {
  // Return true if the user is signed in Firebase
  if (isUserSignedIn()) {
    return true;
  }

  // Display a message to the user using a Toast.
  let data = {message : 'You must sign-in first', timeout : 2000};
  signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
  return false;
}

// Resets the given MaterialTextField.
function resetMaterialTextfield(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
}

// Template for messages.
const MESSAGE_TEMPLATE = '<div class="message-container">' +
                         '<div class="spacing"><div class="pic"></div></div>' +
                         '<div class="message"></div>' +
                         '<div class="name"></div>' +
                         '</div>';

// Adds a size to Google Profile pics URLs.
function addSizeToGoogleProfilePic(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return url + '?sz=150';
  }
  return url;
}

// A loading image URL.
const LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';

// Delete a Message from the UI.
function deleteMessage(id) {
  let div = document.getElementById(id);
  // If an element for that message exists we delete it.
  if (div) {
    div.parentNode.removeChild(div);
  }
}

function createAndInsertMessage(id, timestamp) {
  const container = document.createElement('div');
  container.innerHTML = MESSAGE_TEMPLATE;
  const div = container.firstChild;
  div.setAttribute('id', id);

  // If timestamp is null, assume we've gotten a brand new message.
  // https://stackoverflow.com/a/47781432/4816918
  timestamp = timestamp ? timestamp.toMillis() : Date.now();
  div.setAttribute('timestamp', timestamp);

  // figure out where to insert new message
  const existingMessages = messageListElement.children;
  if (existingMessages.length === 0) {
    messageListElement.appendChild(div);
  } else {
    let messageListNode = existingMessages[0];

    while (messageListNode) {
      const messageListNodeTime = messageListNode.getAttribute('timestamp');

      if (!messageListNodeTime) {
        throw new Error(
            `Child ${messageListNode.id} has no 'timestamp' attribute`);
      }

      if (messageListNodeTime > timestamp) {
        break;
      }

      messageListNode = messageListNode.nextSibling;
    }

    messageListElement.insertBefore(div, messageListNode);
  }

  return div;
}

// Displays a Message in the UI.
function displayMessage(id, timestamp, name, text, picUrl, videoUrl) {
  let div =
      document.getElementById(id) || createAndInsertMessage(id, timestamp);

  // profile picture
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage =
        'url(' + addSizeToGoogleProfilePic(picUrl) + ')';
  }

  div.querySelector('.name').textContent = name;
  let messageElement = div.querySelector('.message');

  if (text) { // If the message is text.
    messageElement.textContent = text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else if (videoUrl) { // If the message is a video.
    let video = document.createElement('video');
    video.addEventListener('load', () => {
      messageListElement.scrollTop = messageListElement.scrollHeight;
    });
    video.playsInline = true;
    video.autoplay = true;
    video.muted = true;
    video.className = 'callback-video';
    let mp4 = document.createElement('source');
    mp4.src = videoUrl;
    mp4.type = 'video/mp4';
    let fallback =
        document.createTextNode('Your browser does not support the video tag.');
    video.innerHTML = '';
    video.appendChild(mp4);
    video.appendChild(fallback);
    video.onloadedmetadata = () => {
      messageListElement.scrollTop = messageListElement.scrollHeight;
    };
    messageElement.innerHTML = '';
    messageElement.appendChild(video);
  }
  // Show the card fading-in and scroll to view the new message.
  setTimeout(() => {div.classList.add('visible')}, 1);
  messageListElement.scrollTop = messageListElement.scrollHeight;
  messageInputElement.focus();
}

// Enables or disables the submit button depending on the values of the
// input
// fields.
function toggleButton() {
  if (messageInputElement.value) {
    submitButtonElement.removeAttribute('disabled');
  } else {
    submitButtonElement.setAttribute('disabled', 'true');
  }
}

// Checks that the Firebase SDK has been correctly setup and configured.
function checkSetup() {
  if (!window.firebase || !(firebase.app instanceof Function) ||
      !firebase.app().options) {
    window.alert(
        'You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
  }
}

// Checks that Firebase has been imported.
checkSetup();

// Shortcuts to DOM Elements.
const outerContainerElement = document.getElementById('outer-container');
const spinnerElement = document.getElementById('spinner');
const messageListElement = document.getElementById('messages');
const messageFormElement = document.getElementById('message-form');
const messageInputElement = document.getElementById('message');
const submitButtonElement = document.getElementById('submit');
const scienceButtonElement = document.getElementById('science');
const artButtonElement = document.getElementById('art');
const mapsButtonElement = document.getElementById('maps');
const shipsButtonElement = document.getElementById('ships');
const applauseButtonElement = document.getElementById('applause');
const booButtonElement = document.getElementById('boo');
const userPicElement = document.getElementById('user-pic');
const userNameElement = document.getElementById('user-name');
const signInButtonElement = document.getElementById('sign-in');
const signOutButtonElement = document.getElementById('sign-out');
const signInSnackbarElement = document.getElementById('must-signin-snackbar');
const splashScreenElement = document.getElementById('signin-splashscreen');
const signInSplashButtonElement = document.getElementById('sign-in-splash');
const messagesCardContainerElement =
    document.getElementById('messages-card-container');
const youtubeStreamContainerElement =
    document.getElementById('youtube-stream-container');
const youtubeStreamIframeElement = document.getElementById('youtube-stream');

const scienceAudioElement = document.getElementById('science-audio');
const artAudioElement = document.getElementById('art-audio');
const mapsAudioElement = document.getElementById('maps-audio');
const shipsAudioElement = document.getElementById('ships-audio');
const applauseAudioElement = document.getElementById('applause-audio');
const booAudioElement = document.getElementById('boo-audio');

const scienceFormElement = document.getElementById('science-form');
const artFormElement = document.getElementById('art-form');
const mapsFormElement = document.getElementById('maps-form');
const shipsFormElement = document.getElementById('ships-form');
const applauseFormElement = document.getElementById('applause-form');
const booFormElement = document.getElementById('boo-form');

// Callbacks that we listen for.
const callbacks = [
  new Callback(
      'SCIENCE',
      'When you hear or see some SCIENCE, click this button to make some noise:',
      '🔬',
      [
        'science1.mp4', 'science2.mp4', 'science3.mp4', 'science4.mp4',
        'science5.mp4', 'science6.mp4', 'science7.mp4'
      ],
      scienceAudioElement),
  new Callback('ART', 'When there\'s some ART, click this button:', '🎨',
               [ 'art1.mp4', 'art2.mp4', 'art3.mp4' ], artAudioElement),
  new Callback('MAPS', 'Whenever you spot a MAP, this is your button:',
               '🗺️', [ 'maps1.mp4', 'maps2.mp4' ], mapsAudioElement),
  new Callback(
      'SHIPS',
      'And how could we forget seafaring vessels - click here for SHIPS:', '🚢',
      [
        'ships1.mp4', 'ships2.mp4', 'ships3.mp4', 'ships4.mp4', 'ships5.mp4',
        'ships6.mp4'
      ],
      shipsAudioElement),
  new Callback(
      '👏',
      'Our speakers live for the applause - click here to make affirming noises:',
      '👏', [ 'applause1.mp4', 'applause2.mp4', 'applause3.mp4' ],
      applauseAudioElement),
  new Callback(
      '👎',
      'Finally - sosome things deserve to be booed. Click here to express disapproval:',
      '👎', [ 'boo1.mp4', 'boo2.mp4', 'boo3.mp4' ], booAudioElement),
];

// Saves message on form submit.
messageFormElement.addEventListener('submit', onMessageFormSubmit);
signOutButtonElement.addEventListener('click', signOut);
signInButtonElement.addEventListener('click', signIn);
signInSplashButtonElement.addEventListener('click', signIn);

scienceFormElement.addEventListener('submit', onScienceFormSubmit);
artFormElement.addEventListener('submit', onArtFormSubmit);
mapsFormElement.addEventListener('submit', onMapsFormSubmit);
shipsFormElement.addEventListener('submit', onShipsFormSubmit);
applauseFormElement.addEventListener('submit', onApplauseFormSubmit);
booFormElement.addEventListener('submit', onBooFormSubmit);

// Toggle for the button.
messageInputElement.addEventListener('keyup', toggleButton);
messageInputElement.addEventListener('change', toggleButton);

// initialize Firebase
initFirebaseAuth();

// Start the onboarding once the messagesCardContainerElement is
// visible.
new MutationObserver(() => {
  if (!outerContainerElement.hasAttribute('hidden') &&
      !messagesCardContainerElement.hasAttribute('hidden')) {
    onBoarding().then(() => loadMessages());
  }
}).observe(outerContainerElement, {attributes : true});
