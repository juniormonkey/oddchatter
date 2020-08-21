/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
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

// Signs-in Friendly Chat.
function signIn() {
  // Sign in Firebase with credential from the Google user.
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider);
}

// Signs-out of Friendly Chat.
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

// Saves a new message on the Firebase DB.
function saveMessage(messageText) {
  // Add a new message entry to the database.
  return firebase.firestore().collection('messages').add({
    uid: getUid(),
    name: getUserName(),
    text: messageText,
    profilePicUrl: getProfilePicUrl(),
    counted: false,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).catch(function(error) {
    console.error('Error writing new message to database', error);
  });
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

  listenForCallback('SCIENCE', ['science1.mp4', 'science2.mp4', 'science3.mp4', 'science4.mp4', 'science5.mp4', 'science6.mp4', 'science7.mp4']);
  listenForCallback('ART', ['art1.mp4', 'art2.mp4', 'art3.mp4']);
  listenForCallback('MAPS', ['maps1.mp4', 'maps2.mp4']);
  listenForCallback('SHIPS', ['ships1.mp4', 'ships2.mp4', 'ships3.mp4', 'ships4.mp4', 'ships5.mp4', 'ships6.mp4']);
  listenForCallback('RISK', ['risk.mp4']);
}

function listenForCallback(callback, videoUrls) {
  var messages = firebase.firestore()
                  .collection('messages')
                  .where('text', '==', callback + '!!')
                  .where('counted', '==', false)
                  .where('timestamp', '>',  new Date(Date.now() - 60000))
                  .limit(12);

  messages.onSnapshot(function(snapshot) {
    snapshot.forEach(function(doc) {
      firebase.firestore()
        .collection(callback)
        .doc(doc.data().uid)
        .set({
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function() {
        doc.ref.update({
          counted: true
        });
      }).catch(function(error) {
        console.error('Error writing new message to database', error);
      });
    });
  });

  var voices = firebase.firestore()
                 .collection(callback)
                 .where('timestamp', '>',  new Date(Date.now() - 60000))
                 .limit(12);

  voices.onSnapshot(function(snapshot) {
    if (snapshot.size > 2) {
      var videoUrl = 'video/' + videoUrls[Math.floor(Math.random() * videoUrls.length)]
      displayCallback('!!!!' + callback + '!1!', videoUrl);
      snapshot.forEach(function(doc) {
        doc.ref.delete().catch(function(error) {
          console.error('Error deleting document from database', error);
        });
      });
    }
  });
}

var callbackIdx = 0;

function nextCallbackId() {
  return 'callback-message-' + callbackIdx++;
}

function displayCallback(message, videoUrl) {
  window.console.log('displayCallback(', message, ');');
  var callbackId = nextCallbackId();
  displayMessage(callbackId, null, 'THE CROWD GOES WILD', '', 'images/adventureharvey.jpg', videoUrl);
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
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    userNameElement.setAttribute('hidden', 'true');
    userPicElement.setAttribute('hidden', 'true');
    signOutButtonElement.setAttribute('hidden', 'true');

    // Show sign-in button.
    signInButtonElement.removeAttribute('hidden');
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
    video.autoplay = true;
    video.playsInline = true;
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

// Toggle for the button.
messageInputElement.addEventListener('keyup', toggleButton);
messageInputElement.addEventListener('change', toggleButton);

// initialize Firebase
initFirebaseAuth();

// TODO: Enable Firebase Performance Monitoring.

// We load currently existing chat messages and listen to new ones.
loadMessages();
