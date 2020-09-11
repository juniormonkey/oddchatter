import assert from 'assert';
import firebase from 'firebase';
import MockDate from 'mockdate';
import should from 'should';

import {CALLBACKS} from '../public/scripts/src/callback_ui.js'
import {CONFIG} from '../public/scripts/src/config.js';
import {Message} from '../public/scripts/src/messages.js'

const firebasemock = require('firebase-mock');
import MockFirebaseQuerySnapshot from 'firebase-mock';

const Timestamp = firebase.firestore.Timestamp;

function createMessage(id, messageText, uid = 'authorUid') {
  return new Message(id, Timestamp.now(), uid, 'Author Name', 'authorPic.png',
                     messageText, null);
}

function fakeFirestoreUpdate(fakeFirestore) {
  for (const callback of CALLBACKS) {
    callback.handleFirestoreSnapshot(
        fakeFirestore.get(callback.callback.getCollection()));
  }
}

function verifyProgressBarWidth(element, expectedWidthInVoices) {
  element.should.exist;
  element.offsetWidth.should.equal(expectedWidthInVoices * 40);
  element.querySelectorAll('.callback-progress-voice')
      .length.should.equal(expectedWidthInVoices);
}

describe('callbacks', function() {
  beforeEach(async function() {
    document.body.innerHTML =
        '<div id="messages"></div>' +
        '<form id="message-form">' +
        '  <input type="text" id="message">' +
        '  <button id="submit" type="submit">Send</button>' +
        '</form>';

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
    window.Firebase = firebasemock.MockFirebase;
    window.firebase.initializeApp();

    mockauth.changeAuthState({
      uid : 'testUid',
      provider : 'google',
      token : 'authToken',
      expires : Math.floor(new Date() / 1000) + 24 * 60 * 60,
    });
    mockauth.flush();

    // This is needed because MockDate is not yet installed when
    // callbacks.CALLBACKS is initialized.
    for (const callback of CALLBACKS) {
      callback.lastCalledTimestampMillis = 1;
    }
  });

  afterEach(function() {
    document.body.innerHTML = '';
    MockDate.reset();
  });

  /**
   * @param {Map<string, Array<Object>>} fakeFirestore
   */
  it('creates and increments a progress bar as callbacks are sent', function() {
    // TODO: update firebase with callbacks, and some non-callback messages too,
    // to see what happens.

    MockDate.set(140000);
    createMessage('A', 'message A').display();
    MockDate.set(141000);
    createMessage('B', 'message B').display();
    MockDate.set(144000);
    createMessage('C', 'message C').display();
    MockDate.set(148000);
    createMessage('D', 'message D').display();

    /** @const {Map<string, Array<Object>} */
    const fakeFirestore = new Map();
    fakeFirestore.set('SHIPS', []);
    fakeFirestore.set('SCIENCE', []);
    fakeFirestore.get('SHIPS').push({
      id : 'alice',
      data : () => ({
        profilePicUrl : 'alice.png',
        timestamp : firebase.firestore.Timestamp.fromMillis(147000)
      })
    });
    fakeFirestore.get('SHIPS').push({
      id : 'bob',
      data : () => ({
        profilePicUrl : 'bob.png',
        timestamp : firebase.firestore.Timestamp.fromMillis(149000)
      })
    });

    fakeFirestore.get('SCIENCE').push({
      id : 'carol',
      data : () => ({
        profilePicUrl : 'carol.png',
        timestamp : firebase.firestore.Timestamp.fromMillis(143000)
      })
    });

    fakeFirestore.get('SHIPS').length.should.equal(2);
    fakeFirestore.get('SCIENCE').length.should.equal(1);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages and two progress bars.
    document.getElementById('messages').children.length.should.equal(6);

    document.getElementById('messages')
        .children[4]
        .querySelector('.callback-progress-bar')
        .should.exist;
    document.getElementById('messages')
        .children[2]
        .querySelector('.callback-progress-bar')
        .should.exist;

    fakeFirestore.get('SCIENCE').push({
      id : 'alice',
      data : () => ({
        profilePicUrl : 'alice.png',
        timestamp : firebase.firestore.Timestamp.fromMillis(150000)
      })
    });

    fakeFirestore.get('SHIPS').length.should.equal(2);
    fakeFirestore.get('SCIENCE').length.should.equal(2);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages and two progress bars.
    document.getElementById('messages').children.length.should.equal(6);
  });

  it('replaces the progress bar with the video when the threshold is met',
     function() {});

  it('creates a new progress bar if the time window expires', function() {});

  it('creates a new progress bar after the video is played', function() {});

  //  it('finds the right place to insert a new message', function() {
  //    MockDate.set(100000);
  //    createMessage('A', 'message A').display();
  //    MockDate.set(200000);
  //    createMessage('B', 'message B').display();
  //    MockDate.set(300000);
  //    createMessage('C', 'message C').display();
  //    MockDate.set(400000);
  //    createMessage('D', 'message D').display();
  //
  //    MockDate.set(50000);
  //    const message1 = createMessage('one', 'before A');
  //
  //    MockDate.set(150000);
  //    const message2 = createMessage('two', 'between A and B');
  //
  //    MockDate.set(200000);
  //    const message3 = createMessage('three', 'same timestamp as B');
  //
  //    MockDate.set(400000);
  //    const message4 = createMessage('four', 'same timestamp as D')
  //
  //    MockDate.set(500000);
  //    const message5 = createMessage('five', 'newer than all other messages')
  //
  //    const insertion1 = message1.findDivToInsertBefore();
  //    should.exist(insertion1);
  //    insertion1.id.should.equal('A');
  //
  //    const insertion2 = message2.findDivToInsertBefore();
  //    should.exist(insertion2);
  //    insertion2.id.should.equal('B');
  //
  //    const insertion3 = message3.findDivToInsertBefore();
  //    should.exist(insertion3);
  //    insertion3.id.should.equal('C');
  //
  //    const insertion4 = message4.findDivToInsertBefore();
  //    should.not.exist(insertion4);
  //
  //    const insertion5 = message5.findDivToInsertBefore();
  //    should.not.exist(insertion5);
  //  });
  //
  //  it('inserts text messages in order', function() {
  //    MockDate.set(100000);
  //    const message1 = createMessage('one', 'message one');
  //    MockDate.set(200000);
  //    const message2 = createVideoMessage('two');
  //    MockDate.set(300000);
  //    const message3 = createMessage('three', 'message three');
  //    MockDate.set(400000);
  //    const message4 = createMessage('four', 'message four');
  //
  //    message4.display();
  //    message2.display();
  //    message1.display();
  //    message3.display();
  //
  //    const messageElements = document.getElementById('messages').children;
  //    messageElements.length.should.equal(4);
  //    messageElements[0].id.should.equal('one');
  //    messageElements[1].id.should.equal('two');
  //    messageElements[2].id.should.equal('three');
  //    messageElements[3].id.should.equal('four');
  //  });
  //
  //  // ... if it's the newest message, and the author is the logged-in user.
  //  it('stays scrolled to the bottom when a new message appears', function() {
  //    MockDate.set(100000);
  //    createMessage('A', 'message A').display();
  //    MockDate.set(200000);
  //    createMessage('B', 'message B').display();
  //    MockDate.set(300000);
  //    createMessage('C', 'message C').display();
  //    MockDate.set(400000);
  //    createMessage('D', 'message D').display();
  //
  //    // The scrollTop is the distance in pixels from the top of the element
  //    to
  //    // the top of the visible area.
  //    document.getElementById('messages').scrollTop = 400;
  //    // The scrollHeight is the height of the scrollable element.
  //    document.getElementById('messages').scrollHeight = 500;
  //    // The clientHeight is the height of the visible area.
  //    document.getElementById('messages').clientHeight = 90;
  //    // By default, elements have clientHeight 20, so this is within one
  //    message
  //    // of the bottom: 400 + 90 > 500 - 20.
  //
  //    createMessage('E', 'message E').display();
  //    document.getElementById('messages').scrollTop.should.equal(500);
  //  });
  //
  //  it('scrolls to the bottom when the newest message is your own',
  //  function() {
  //    MockDate.set(100000);
  //    createMessage('A', 'message A').display();
  //    MockDate.set(200000);
  //    createMessage('B', 'message B').display();
  //    MockDate.set(300000);
  //    createMessage('C', 'message C').display();
  //    MockDate.set(400000);
  //    createMessage('D', 'message D').display();
  //
  //    // The scrollTop is the distance in pixels from the top of the element
  //    to
  //    // the top of the visible area.
  //    document.getElementById('messages').scrollTop = 200;
  //    // The scrollHeight is the height of the scrollable element.
  //    document.getElementById('messages').scrollHeight = 500;
  //    // The clientHeight is the height of the visible area.
  //    document.getElementById('messages').clientHeight = 90;
  //    // By default, elements have clientHeight 20, so this is not within one
  //    // message of the bottom: 200 + 90 < 500 - 20.
  //
  //    // testUid is the logged-in user.
  //    createMessage('E', 'message E', 'testUid').display();
  //    document.getElementById('messages').scrollTop.should.equal(500);
  //  });
  //
  //  it('stays scrolled up when the newest message is not yours', function() {
  //    MockDate.set(100000);
  //    createMessage('A', 'message A').display();
  //    MockDate.set(200000);
  //    createMessage('B', 'message B').display();
  //    MockDate.set(300000);
  //    createMessage('C', 'message C').display();
  //    MockDate.set(400000);
  //    createMessage('D', 'message D').display();
  //
  //    // The scrollTop is the distance in pixels from the top of the element
  //    to
  //    // the top of the visible area.
  //    document.getElementById('messages').scrollTop = 200;
  //    // The scrollHeight is the height of the scrollable element.
  //    document.getElementById('messages').scrollHeight = 500;
  //    // The clientHeight is the height of the visible area.
  //    document.getElementById('messages').clientHeight = 90;
  //    // By default, elements have clientHeight 20, so this is not within one
  //    // message of the bottom: 200 + 90 < 500 - 20.
  //
  //    // By default, the message is someone else's; keep the scrollTop
  //    unchanged. createMessage('E', 'message E').display();
  //    document.getElementById('messages').scrollTop.should.equal(200);
  //  });
  //
  //  // TODO: collapse callback messages
  //  // Callback strings are handled by callbacks.js.
  //  it('hides messages that match a callback string', function() {
  //    MockDate.set(100000);
  //    createMessage('A', 'message A').display();
  //    MockDate.set(200000);
  //    createMessage('B', 'message B').display();
  //    MockDate.set(300000);
  //    createMessage('C', 'message C').display();
  //    MockDate.set(400000);
  //    createMessage('D', 'message D').display();
  //
  //    document.getElementById('messages').children.length.should.equal(4);
  //
  //    MockDate.set(350000);
  //    createMessage('1', 'message one').display();
  //
  //    document.getElementById('messages').children.length.should.equal(5);
  //
  //    MockDate.set(375000);
  //    createMessage('2', 'SHIPS!!').display();
  //
  //    document.getElementById('messages').children.length.should.equal(5);
  //
  //    MockDate.set(385000);
  //    createMessage('3', 'message three').display();
  //
  //    document.getElementById('messages').children.length.should.equal(6);
  //  });
});
