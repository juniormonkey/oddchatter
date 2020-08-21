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

const CALLBACK_WINDOW_MS = 10000;
const CALLBACK_THRESHOLD = 2;

const Timestamp = firebase.firestore.Timestamp;

// Signs-in Odd Chatter.
function signIn() {
  // Sign in Firebase with credential from the Google user.
  var provider = new firebase.auth.GoogleAuthProvider();
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
  return firebase.auth().currentUser.photoURL || '/images/profile_placeholder.png';
}

function getUid() {
  return firebase.auth().currentUser.uid;
}

// Returns the signed-in user's display name.
function getUserName() {
  return firebase.auth().currentUser.displayName;
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
  return !!firebase.auth().currentUser;
}

function checkForCallbacks(text, callbacks) {
  callbacks.forEach((callback) => {
    if (text !== callback + '!!') {
      return;
    }

    firebase.firestore()
      .collection(callback)
      .doc(getUid())
      .set({
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function(error) {
      console.error('Error writing new message to database', error);
    });
  });
}

// Saves a new message on the Firebase DB.
function saveMessage(messageText) {
  checkForCallbacks(messageText, ['SCIENCE', 'ART', 'MAPS', 'SHIPS']);

  // Add a new message entry to the database.
  return firebase.firestore().collection('messages').add({
    uid: getUid(),
    name: getUserName(),
    text: messageText,
    profilePicUrl: getProfilePicUrl(),
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).catch(function(error) {
    console.error('Error writing new message to database', error);
  });
}

const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));

async function displayOnBoardingMessage(id, timestamp, message) {
  displayMessage(
      id,
      Timestamp.fromMillis(timestamp),
      'Harvey',
      message,
      'images/adventureharvey.jpg',
      null);
  await waitFor(100);
}

function displayOnBoardingButton(id, timestamp, buttonText, callback, videoUrl, audioElement) {
  var div = createAndInsertMessage(id, Timestamp.fromMillis(timestamp));

  div.querySelector('.name').textContent = 'Harvey';
  div.querySelector('.pic').style.backgroundImage =
      'url(' + addSizeToGoogleProfilePic('images/adventureharvey.jpg') + ')';
  var messageElement = div.querySelector('.message');

  var button = document.createElement('button');
  button.textContent = buttonText;
  messageElement.innerHTML = '';
  messageElement.appendChild(button);

  // Show the card fading-in and scroll to view the new message.
  setTimeout(function() {div.classList.add('visible')}, 1);
  messageListElement.scrollTop = messageListElement.scrollHeight;
  messageInputElement.focus();

  return new Promise((resolve, reject) => {
    button.addEventListener('click', e => {
      displayCallback('!!!!' + callback + '!1!', timestamp, videoUrl, audioElement);
      resolve();
    });
  });
}

// Introduces everything and initializes the background audio.
async function onBoarding() {
  await displayOnBoardingMessage('onboarding0', 1, 'Welcome to the Odd Chatter room!');
  await displayOnBoardingMessage('onboarding1', 10, 'This is not a quiet event - if enough folks shout the same callout in chat, we\'ll all hear it.');
  await displayOnBoardingMessage('onboarding1a', 15, 'Let me show you how it works...');
  await displayOnBoardingMessage('onboarding2', 20, 'When you hear or see some SCIENCE, click this button to make some noise:');
  await displayOnBoardingButton('science', 30, '🔬', 'SCIENCE', 'video/science1.mp4', scienceAudioElement);
  await waitFor(2000);
  await displayOnBoardingMessage('onboarding3', 40, 'When there\'s some ART, click this button:');
  await displayOnBoardingButton('art', 50, '🎨', 'ART', 'video/art1.mp4', artAudioElement);
  await waitFor(2000);
  await displayOnBoardingMessage('onboarding4', 60, 'Whenever you spot a MAP, this is your button:');
  await displayOnBoardingButton('maps', 70, '🗺️', 'MAPS', 'video/maps1.mp4', mapsAudioElement);
  await waitFor(2000);
  await displayOnBoardingMessage('onboarding5', 80, 'And how could we forget seafaring vessels - click here for SHIPS:');
  await displayOnBoardingButton('ships', 90, '🚢', 'SHIPS', 'video/ships1.mp4', shipsAudioElement);
  await waitFor(2000);
  await displayOnBoardingMessage('onboarding6', 100, 'Now you\'re ready to learn something weird!');
  return waitFor(150);
}

// Loads chat messages history and listens for upcoming ones.
function loadMessages() {
  // Create the query to load the last 12 messages and listen for new ones.
  var query = firebase.firestore()
                  .collection('messages')
                  .orderBy('timestamp', 'desc')
                  .limit(12);
  
  // Start listening to the query.
  query.onSnapshot(function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
      if (change.type === 'removed') {
        deleteMessage(change.doc.id);
      } else {
        var message = change.doc.data();
        displayMessage(change.doc.id, message.timestamp, message.name,
                       message.text, message.profilePicUrl, message.imageUrl);
      }
    });
  });

  listenForCallback('SCIENCE', ['science1.mp4', 'science2.mp4', 'science3.mp4', 'science4.mp4', 'science5.mp4', 'science6.mp4', 'science7.mp4'], scienceAudioElement);
  listenForCallback('ART', ['art1.mp4', 'art2.mp4', 'art3.mp4'], artAudioElement);
  listenForCallback('MAPS', ['maps1.mp4', 'maps2.mp4'], mapsAudioElement);
  listenForCallback('SHIPS', ['ships1.mp4', 'ships2.mp4', 'ships3.mp4', 'ships4.mp4', 'ships5.mp4', 'ships6.mp4'], shipsAudioElement);
}

var lastCallbackTimestampMillis = Date.now() - CALLBACK_WINDOW_MS;

function listenForCallback(callback, videoUrls, audioElement) {
  var callbackWindowStartMillis = Math.max(lastCallbackTimestampMillis, Date.now() - CALLBACK_WINDOW_MS);
  var voices = firebase.firestore()
                 .collection(callback)
                 .where('timestamp', '>',  Timestamp.fromMillis(callbackWindowStartMillis))
                 .orderBy('timestamp', 'desc')
                 .limit(CALLBACK_THRESHOLD + 1);

  voices.onSnapshot(function(snapshot) {
    if (snapshot.size > 0) {
      window.console.log("voice.onSnapshot() id[0]=", snapshot.docs[0].id, "date[0]=", snapshot.docs[0].data().timestamp.toDate());
    }
    if (snapshot.size >= CALLBACK_THRESHOLD) {
      window.console.log("
      lastCallbackTimestampMillis = snapshot.docs[0].data().timestamp.toMillis();
      var videoUrl = 'video/' + videoUrls[Math.floor(Math.random() * videoUrls.length)]
      displayCallback('!!!!' + callback + '!1!', lastCallbackTimestamp.getTime(), videoUrl, audioElement);
    }
  });
}

var callbackIdx = 0;

function nextCallbackId() {
  return 'callback-message-' + callbackIdx++;
}

function displayCallback(message, timestamp, videoUrl, audioElement) {
  var callbackId = nextCallbackId();
  displayMessage(callbackId, Timestamp.fromMillis(timestamp), message, '', 'images/adventureharvey.jpg', videoUrl);
  audioElement.play();
}

// Triggered when the send new message form is submitted.
function onMessageFormSubmit(e) {
  e.preventDefault();
  onMessageSubmitted(messageInputElement.value);
}

function onScienceFormSubmit(e) {
  e.preventDefault();
  onMessageSubmitted("SCIENCE!!");
}

function onArtFormSubmit(e) {
  e.preventDefault();
  onMessageSubmitted("ART!!");
}

function onMapsFormSubmit(e) {
  e.preventDefault();
  onMessageSubmitted("MAPS!!");
}

function onShipsFormSubmit(e) {
  e.preventDefault();
  onMessageSubmitted("SHIPS!!");
}

function onMessageSubmitted(message) {
  // Check that the user entered a message and is signed in.
  if (message && checkSignedInWithMessage()) {
    saveMessage(message).then(function() {
      // Clear message text field and re-enable the SEND button.
      resetMaterialTextfield(messageInputElement);
      toggleButton();
    });
  }
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
  if (user) { // User is signed in!
    // Get the signed-in user's profile pic and name.
    var profilePicUrl = getProfilePicUrl();
    var userName = getUserName();

    // Set the user's profile pic and name.
    userPicElement.style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
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
    splashScreenElement.removeAttribute('hidden')

    // Show the messages UI
    messagesCardContainerElement.setAttribute('hidden', 'true');
  }
}

// Returns true if user is signed-in. Otherwise false and displays a message.
function checkSignedInWithMessage() {
  // Return true if the user is signed in Firebase
  if (isUserSignedIn()) {
    return true;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
  return false;
}

// Resets the given MaterialTextField.
function resetMaterialTextfield(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
}

// Template for messages.
var MESSAGE_TEMPLATE =
    '<div class="message-container">' +
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
var LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';

// Delete a Message from the UI.
function deleteMessage(id) {
  var div = document.getElementById(id);
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
          `Child ${messageListNode.id} has no 'timestamp' attribute`
        );
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
  var div = document.getElementById(id) || createAndInsertMessage(id, timestamp);

  // profile picture
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(picUrl) + ')';
  }

  div.querySelector('.name').textContent = name;
  var messageElement = div.querySelector('.message');

  if (text) { // If the message is text.
    messageElement.textContent = text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else if (videoUrl) { // If the message is a video.
    var video = document.createElement('video');
    video.addEventListener('load', function() {
      messageListElement.scrollTop = messageListElement.scrollHeight;
    });
    video.playsInline = true;
    video.autoplay = true;
    video.muted = true;
    video.className = 'callback-video';
    var mp4 = document.createElement('source');
    mp4.src = videoUrl;
    mp4.type = 'video/mp4';
    var fallback = document.createTextNode('Your browser does not support the video tag.');
    video.innerHTML = '';
    video.appendChild(mp4);
    video.appendChild(fallback);
    video.onloadedmetadata = function() { messageListElement.scrollTop = messageListElement.scrollHeight; };
    messageElement.innerHTML = '';
    messageElement.appendChild(video);
  }
  // Show the card fading-in and scroll to view the new message.
  setTimeout(function() {div.classList.add('visible')}, 1);
  messageListElement.scrollTop = messageListElement.scrollHeight;
  messageInputElement.focus();
}

// Enables or disables the submit button depending on the values of the input
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
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
  }
}

// Checks that Firebase has been imported.
checkSetup();

// Shortcuts to DOM Elements.
var messageListElement = document.getElementById('messages');
var messageFormElement = document.getElementById('message-form');
var messageInputElement = document.getElementById('message');
var submitButtonElement = document.getElementById('submit');
var userPicElement = document.getElementById('user-pic');
var userNameElement = document.getElementById('user-name');
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');
var signInSnackbarElement = document.getElementById('must-signin-snackbar');
var splashScreenElement = document.getElementById('signin-splashscreen');
var signInSplashButtonElement = document.getElementById('sign-in-splash');
var messagesCardContainerElement = document.getElementById('messages-card-container');

var scienceAudioElement = document.getElementById('science-audio');
var artAudioElement = document.getElementById('art-audio');
var mapsAudioElement = document.getElementById('maps-audio');
var shipsAudioElement = document.getElementById('ships-audio');

var scienceFormElement = document.getElementById('science-form');
scienceFormElement.addEventListener('submit', onScienceFormSubmit);

var artFormElement = document.getElementById('art-form');
artFormElement.addEventListener('submit', onArtFormSubmit);

var mapsFormElement = document.getElementById('maps-form');
mapsFormElement.addEventListener('submit', onMapsFormSubmit);

var shipsFormElement = document.getElementById('ships-form');
shipsFormElement.addEventListener('submit', onShipsFormSubmit);

// Saves message on form submit.
messageFormElement.addEventListener('submit', onMessageFormSubmit);
signOutButtonElement.addEventListener('click', signOut);
signInButtonElement.addEventListener('click', signIn);
signInSplashButtonElement.addEventListener('click', signIn);

// Toggle for the button.
messageInputElement.addEventListener('keyup', toggleButton);
messageInputElement.addEventListener('change', toggleButton);

// initialize Firebase
initFirebaseAuth();

onBoarding().then(() =>

// We load currently existing chat messages and listen to new ones.
loadMessages());
