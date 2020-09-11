import assert from 'assert';
import firebase from 'firebase';
import MockDate from 'mockdate';
import should from 'should';

import {
  Message
} from '../public/scripts/src/messages.js';

const firebasemock = require('firebase-mock');

const Timestamp = firebase.firestore.Timestamp;

function createMessage(id, messageText, uid = 'authorUid') {
  return new Message(id, Timestamp.now(), uid, 'Author Name', 'authorPic.png',
                     messageText, null);
}

function createVideoMessage(id) {
  return new Message(id, Timestamp.now(), 'authorUid', 'Author Name',
                     'authorPic.png', null, 'callback.mp4');
}

function getTimestampFromDom(id) {
  return parseInt(document.getElementById(id).getAttribute('timestamp'));
}

function mockScrolling() {
  Object.defineProperty(HTMLElement.prototype, "scrollTop", {
    configurable : true,
    get : function() { return this._scrollTop || 0; },
    set(val) { this._scrollTop = val; }
  });
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable : true,
    get : function() { return this._scrollHeight || 0; },
    set(val) { this._scrollHeight = val; }
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable : true,
    get : function() { return this._clientHeight || 20; },
    set(val) { this._clientHeight = val; }
  });
}

describe('messages', function() {
  beforeEach(function() {
    document.body.innerHTML =
        '<div id="messages"></div>' +
        '<form id="message-form">' +
        '  <input type="text" id="message">' +
        '  <button id="submit" type="submit">Send</button>' +
        '</form>';

    mockScrolling();

    const mockauth = new firebasemock.MockAuthentication();
    const mockfirestore = new firebasemock.MockFirestore();
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

    mockauth.changeAuthState({
      uid : 'testUid',
      provider : 'google',
      token : 'authToken',
      expires : Math.floor(new Date() / 1000) + 24 * 60 * 60,
    });
    mockauth.flush();
  });

  afterEach(function() {
    document.body.innerHTML = '';
    MockDate.reset();
  });

  it('inserts text messages in order', function() {
    MockDate.set(100000);
    const message1 = createMessage('one', 'message one');
    MockDate.set(200000);
    const message2 = createVideoMessage('two');
    MockDate.set(300000);
    const message3 = createMessage('three', 'message three');
    MockDate.set(400000);
    const message4 = createMessage('four', 'message four');

    message4.display();
    message2.display();
    message1.display();
    message3.display();

    const messageElements = document.getElementById('messages').children;
    messageElements.length.should.equal(4);
    messageElements[0].id.should.equal('one');
    messageElements[1].id.should.equal('two');
    messageElements[2].id.should.equal('three');
    messageElements[3].id.should.equal('four');
  });

  // ... if it's the newest message, and the author is the logged-in user.
  it('stays scrolled to the bottom when a new message appears', function() {
    MockDate.set(100000);
    createMessage('A', 'message A').display();
    MockDate.set(200000);
    createMessage('B', 'message B').display();
    MockDate.set(300000);
    createMessage('C', 'message C').display();
    MockDate.set(400000);
    createMessage('D', 'message D').display();

    // The scrollTop is the distance in pixels from the top of the element to
    // the top of the visible area.
    document.getElementById('messages').scrollTop = 400;
    // The scrollHeight is the height of the scrollable element.
    document.getElementById('messages').scrollHeight = 500;
    // The clientHeight is the height of the visible area.
    document.getElementById('messages').clientHeight = 90;
    // By default, elements have clientHeight 20, so this is within one message
    // of the bottom: 400 + 90 > 500 - 20.

    createMessage('E', 'message E').display();
    document.getElementById('messages').scrollTop.should.equal(500);
  });

  it('scrolls to the bottom when the newest message is your own', function() {
    MockDate.set(100000);
    createMessage('A', 'message A').display();
    MockDate.set(200000);
    createMessage('B', 'message B').display();
    MockDate.set(300000);
    createMessage('C', 'message C').display();
    MockDate.set(400000);
    createMessage('D', 'message D').display();

    // The scrollTop is the distance in pixels from the top of the element to
    // the top of the visible area.
    document.getElementById('messages').scrollTop = 200;
    // The scrollHeight is the height of the scrollable element.
    document.getElementById('messages').scrollHeight = 500;
    // The clientHeight is the height of the visible area.
    document.getElementById('messages').clientHeight = 90;
    // By default, elements have clientHeight 20, so this is not within one
    // message of the bottom: 200 + 90 < 500 - 20.

    // testUid is the logged-in user.
    createMessage('E', 'message E', 'testUid').display();
    document.getElementById('messages').scrollTop.should.equal(500);
  });

  it('stays scrolled up when the newest message is not yours', function() {
    MockDate.set(100000);
    createMessage('A', 'message A').display();
    MockDate.set(200000);
    createMessage('B', 'message B').display();
    MockDate.set(300000);
    createMessage('C', 'message C').display();
    MockDate.set(400000);
    createMessage('D', 'message D').display();

    // The scrollTop is the distance in pixels from the top of the element to
    // the top of the visible area.
    document.getElementById('messages').scrollTop = 200;
    // The scrollHeight is the height of the scrollable element.
    document.getElementById('messages').scrollHeight = 500;
    // The clientHeight is the height of the visible area.
    document.getElementById('messages').clientHeight = 90;
    // By default, elements have clientHeight 20, so this is not within one
    // message of the bottom: 200 + 90 < 500 - 20.

    // By default, the message is someone else's; keep the scrollTop unchanged.
    createMessage('E', 'message E').display();
    document.getElementById('messages').scrollTop.should.equal(200);
  });

  // TODO: collapse callback messages
  // Callback strings are handled by callbacks.js.
  it('hides messages that match a callback string', function() {
    MockDate.set(100000);
    createMessage('A', 'message A').display();
    MockDate.set(200000);
    createMessage('B', 'message B').display();
    MockDate.set(300000);
    createMessage('C', 'message C').display();
    MockDate.set(400000);
    createMessage('D', 'message D').display();

    document.getElementById('messages').children.length.should.equal(4);

    MockDate.set(350000);
    createMessage('1', 'message one').display();

    document.getElementById('messages').children.length.should.equal(5);

    MockDate.set(375000);
    createMessage('2', 'SHIPS!!').display();

    document.getElementById('messages').children.length.should.equal(5);

    MockDate.set(385000);
    createMessage('3', 'message three').display();

    document.getElementById('messages').children.length.should.equal(6);
  });
});
