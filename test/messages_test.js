import assert from 'assert';
import firebase from 'firebase';
import should from 'should';

import {Message} from '../public/scripts/src/messages.js';

var firebasemock = require('firebase-mock');

var mockauth = new firebasemock.MockAuthentication();
var mockfirestore = new firebasemock.MockFirestore();
window.firebase = new firebasemock.MockFirebaseSdk(
    // use null if your code does not use RTDB
    null,
    // use null if your code does not use AUTHENTICATION
    () => { return mockauth; },
    // use null if your code does not use FIRESTORE
    () => { return mockfirestore; },
    // use null if your code does not use STORAGE
    null,
    // use null if your code does not use MESSAGING
    null);

function createMessage(messageText) {
  return new Message('id', firebase.firestore.Timestamp.now(), 'authorUid',
                     'Author Name', 'authorPic.png', messageText, null);
}

function createVideoMessage() {
  return new Message('id', firebase.firestore.Timestamp.now(), 'authorUid',
                     'Author Name', 'authorPic.png', null, 'callback.mp4');
}

describe('Messages', function() {
  beforeEach(function() {
    document.body.innerHTML =
        '<div id="messages"></div>' +
        '<form id="message-form">' +
        '  <input type="text" id="message">' +
        '  <button id="submit" type="submit">Send</button>' +
        '</form>';

    mockauth.changeAuthState({
      uid : 'testUid',
      provider : 'google',
      token : 'authToken',
      expires : Math.floor(new Date() / 1000) + 24 * 60 * 60,
    });
    mockauth.flush();
  });

  afterEach(function() { document.body.innerHTML = ''; });

  it('inserts text messages in order', function() {
    // document.should.equal('asdf');
    const message1 = createMessage('message one');
    const message2 = createVideoMessage();
    const message3 = createMessage('message three');
    const message4 = createMessage('message four');

    message4.display();
    message2.display();
    message1.display();
    message3.display();

    // TODO: assert messages are present and in order.
    // TODO: assert scrolling?
    // assert.equal();
  });
});
