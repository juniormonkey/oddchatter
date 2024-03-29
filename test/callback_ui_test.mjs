/* eslint-disable closure/no-undef */
/* eslint-disable closure/no-unused-expressions */
import firebase from 'firebase';
import MockDate from 'mockdate';

import {CALLBACKS} from '../src/callback_ui.mjs';
import {CONFIG} from '../src/config.mjs';
import {Message} from '../src/messages.mjs';

import Autolinker from 'autolinker';
import createDOMPurify from 'dompurify';

const Timestamp = firebase.firestore.Timestamp;

import firebasemock from 'firebase-mock';
import chai from 'chai';
const should = chai.should();

const callbacksMap = new Map();

function createMessage(id, messageText, uid = 'authorUid') {
  return new Message(id, new Date(), uid, 'Author Name', 'authorPic.png',
                     messageText, null);
}

/**
 * @param {Map<string, Array<Object>>} fakeFirestore
 */
function fakeFirestoreUpdate(fakeFirestore) {
  for (const callback of CALLBACKS) {
    const docs = fakeFirestore.get(callback.callback.getCollection());
    const sortedDocs =
        docs ? docs.sort((one, two) => two.data().timestamp.toMillis() -
                                       one.data().timestamp.toMillis()) :
             null;
    callback.handleFirestoreSnapshot(sortedDocs);
  }
}

function verifyProgressBarWidth(callback, element, expectedWidthInVoices) {
  element.should.exist;
  const expectedWidth =
      100 * expectedWidthInVoices / CONFIG.callbackThreshold(callback.weight);
  element.style.width.should.equal(`${expectedWidth}%`);
  element.querySelectorAll('.callback-progress-voice')
      .length.should.equal(expectedWidthInVoices);
}

describe('callbacks', function() {
  beforeEach(async function() {
    global.Autolinker = Autolinker;
    global.DOMPurify = createDOMPurify(window);

    document.body.innerHTML =
        '<div id="messages">' +
        '  <div id="last-message">&nbsp;</div>' +
        '</div>' +
        '<form id="message-form">' +
        '  <input type="text" id="message">' +
        '  <button id="submit" type="submit">Send</button>' +
        '</form>' +
        '<div id="hidden-audio"></div>';

    window.HTMLMediaElement.prototype.play = () => { /* do nothing */ };

    const mockauth = new firebasemock.MockAuthentication();
    const mockfirestore = new firebasemock.MockFirestore();
    window.firebase = new firebasemock.MockFirebaseSdk(
        // use null if your code does not use RTDB
        null,
        // use null if your code does not use AUTHENTICATION
        () => {
          return mockauth;
        },
        // use null if your code does not use FIRESTORE
        () => {
          return mockfirestore;
        },
        // use null if your code does not use STORAGE
        null,
        // use null if your code does not use MESSAGING
        null);
    window.Firebase = firebasemock.MockFirebase;
    window.firebase.initializeApp();

    mockauth.changeAuthState({
      uid: 'testUid',
      provider: 'google',
      token: 'authToken',
      expires: Math.floor(new Date() / 1000) + 24 * 60 * 60,
    });
    mockauth.flush();

    CALLBACKS.forEach(callback => {
      // This is needed because MockDate is not yet installed when
      // callback_ui.CALLBACKS is initialized.
      callback.lastCalledTimestampMillis = 1;

      // This is needed because the real app would call this in the auth state
      // changed listener, which this test does not set up.
      callback.initAudio();

      callbacksMap.set(callback.callback.getCollection(), callback.callback);
    });

    CONFIG.threshold_is_percentage = false;
    CONFIG.callback_threshold_base = 3;
  });

  afterEach(function() {
    document.body.innerHTML = '';
    MockDate.reset();

    // This is needed because otherwise the callback_ui.CALLBACKS global stores
    // state between tests.
    for (const callback of CALLBACKS) {
      callback.progressBar = null;
      callback.unsubscribeFromFirestore = null;
    }
  });

  it('creates and increments a progress bar as callbacks are sent', function() {
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
      id: 'alice',
      data: () => ({
        userName: 'Alice',
        profilePicUrl: 'alice.png',
        timestamp: Timestamp.fromMillis(147000),
      }),
    });
    fakeFirestore.get('SHIPS').push({
      id: 'bob',
      data: () => ({
        userName: 'Bob',
        profilePicUrl: 'bob.png',
        timestamp: Timestamp.fromMillis(149000),
      }),
    });

    fakeFirestore.get('SCIENCE').push({
      id: 'carol',
      data: () => ({
        userName: 'Carol',
        profilePicUrl: 'carol.png',
        timestamp: Timestamp.fromMillis(143000),
      }),
    });

    fakeFirestore.get('SHIPS').length.should.equal(2);
    fakeFirestore.get('SCIENCE').length.should.equal(1);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages and two progress bars.
    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(6);

    verifyProgressBarWidth(
        callbacksMap.get('SCIENCE'),
        document.getElementById('messages')
            .children[2]
            .querySelector('.callback-progress-bar'),
        1);
    verifyProgressBarWidth(
        callbacksMap.get('SHIPS'),
        document.getElementById('messages')
            .children[5]
            .querySelector('.callback-progress-bar'),
        2);

    fakeFirestore.get('SCIENCE').push({
      id: 'alice',
      data: () => ({
        userName: 'Alice',
        profilePicUrl: 'alice.png',
        timestamp: Timestamp.fromMillis(150000),
      }),
    });

    fakeFirestore.get('SHIPS').length.should.equal(2);
    fakeFirestore.get('SCIENCE').length.should.equal(2);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages and two progress bars.
    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(6);

    verifyProgressBarWidth(
        callbacksMap.get('SCIENCE'),
        document.getElementById('messages')
            .children[2]
            .querySelector('.callback-progress-bar'),
        2);
    verifyProgressBarWidth(
        callbacksMap.get('SHIPS'),
        document.getElementById('messages')
            .children[5]
            .querySelector('.callback-progress-bar'),
        2);
  });

  it('correctly calculates width when threshold is percentage', function() {
    CONFIG.threshold_is_percentage = true;
    CONFIG.callback_threshold_base = 15;
    // Assume 21 active users: 15% of 21 (as an integer) is 3.
    CONFIG.active_users = 21;

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
      id: 'alice',
      data: () => ({
        userName: 'Alice',
        profilePicUrl: 'alice.png',
        timestamp: Timestamp.fromMillis(147000),
      }),
    });
    fakeFirestore.get('SHIPS').push({
      id: 'bob',
      data: () => ({
        userName: 'Bob',
        profilePicUrl: 'bob.png',
        timestamp: Timestamp.fromMillis(149000),
      }),
    });

    fakeFirestore.get('SCIENCE').push({
      id: 'carol',
      data: () => ({
        userName: 'Carol',
        profilePicUrl: 'carol.png',
        timestamp: Timestamp.fromMillis(143000),
      }),
    });

    fakeFirestore.get('SHIPS').length.should.equal(2);
    fakeFirestore.get('SCIENCE').length.should.equal(1);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages and two progress bars.
    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(6);

    verifyProgressBarWidth(
        callbacksMap.get('SCIENCE'),
        document.getElementById('messages')
            .children[2]
            .querySelector('.callback-progress-bar'),
        1);
    verifyProgressBarWidth(
        callbacksMap.get('SHIPS'),
        document.getElementById('messages')
            .children[5]
            .querySelector('.callback-progress-bar'),
        2);

    fakeFirestore.get('SCIENCE').push({
      id: 'alice',
      data: () => ({
        userName: 'Alice',
        profilePicUrl: 'alice.png',
        timestamp: Timestamp.fromMillis(150000),
      }),
    });

    fakeFirestore.get('SHIPS').length.should.equal(2);
    fakeFirestore.get('SCIENCE').length.should.equal(2);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages and two progress bars.
    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(6);

    verifyProgressBarWidth(
        callbacksMap.get('SCIENCE'),
        document.getElementById('messages')
            .children[2]
            .querySelector('.callback-progress-bar'),
        2);
    verifyProgressBarWidth(
        callbacksMap.get('SHIPS'),
        document.getElementById('messages')
            .children[5]
            .querySelector('.callback-progress-bar'),
        2);
  });

  it('replaces the progress bar with the video when the threshold is met',
     function() {
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
         id: 'alice',
         data: () => ({
           userName: 'Alice',
           profilePicUrl: 'alice.png',
           timestamp: Timestamp.fromMillis(147000),
         }),
       });
       fakeFirestore.get('SHIPS').push({
         id: 'bob',
         data: () => ({
           userName: 'Bob',
           profilePicUrl: 'bob.png',
           timestamp: Timestamp.fromMillis(149000),
         }),
       });

       fakeFirestore.get('SCIENCE').push({
         id: 'carol',
         data: () => ({
           userName: 'Carol',
           profilePicUrl: 'carol.png',
           timestamp: Timestamp.fromMillis(143000),
         }),
       });

       fakeFirestore.get('SHIPS').length.should.equal(2);
       fakeFirestore.get('SCIENCE').length.should.equal(1);
       fakeFirestoreUpdate(fakeFirestore);

       // 4 messages and two progress bars.
       document.getElementById('messages')
           .querySelectorAll('.message-container')
           .length.should.equal(6);

       verifyProgressBarWidth(
           callbacksMap.get('SCIENCE'),
           document.getElementById('messages')
               .children[2]
               .querySelector('.callback-progress-bar'),
           1);
       verifyProgressBarWidth(
           callbacksMap.get('SHIPS'),
           document.getElementById('messages')
               .children[5]
               .querySelector('.callback-progress-bar'),
           2);

       fakeFirestore.get('SHIPS').push({
         id: 'david',
         data: () => ({
           userName: 'David',
           profilePicUrl: 'david.png',
           timestamp: Timestamp.fromMillis(150000),
         }),
       });

       fakeFirestore.get('SHIPS').length.should.equal(3);
       fakeFirestore.get('SCIENCE').length.should.equal(1);
       fakeFirestoreUpdate(fakeFirestore);

       // 4 messages, one progress bar, and one video.
       document.getElementById('messages')
           .querySelectorAll('.message-container')
           .length.should.equal(6);

       verifyProgressBarWidth(
           callbacksMap.get('SCIENCE'),
           document.getElementById('messages')
               .children[2]
               .querySelector('.callback-progress-bar'),
           1);
       should.not.exist(document.getElementById('messages')
           .children[5]
           .querySelector('.callback-progress-bar'));
       document.getElementById('messages')
           .children[5]
           .querySelector('.callback-video')
           .should.exist;
     });

  it('replaces the progress bar with video when a weighted threshold is met',
     function() {
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
       fakeFirestore.set('APPLAUSE', []);
       fakeFirestore.get('APPLAUSE').push({
         id: 'alice',
         data: () => ({
           userName: 'Alice',
           profilePicUrl: 'alice.png',
           timestamp: Timestamp.fromMillis(147000),
         }),
       });
       fakeFirestore.get('APPLAUSE').push({
         id: 'bob',
         data: () => ({
           userName: 'Bob',
           profilePicUrl: 'bob.png',
           timestamp: Timestamp.fromMillis(149000),
         }),
       });
       fakeFirestore.get('APPLAUSE').push({
         id: 'carol',
         data: () => ({
           userName: 'Carol',
           profilePicUrl: 'carol.png',
           timestamp: Timestamp.fromMillis(148000),
         }),
       });
       fakeFirestore.get('APPLAUSE').push({
         id: 'david',
         data: () => ({
           userName: 'David',
           profilePicUrl: 'david.png',
           timestamp: Timestamp.fromMillis(150000),
         }),
       });

       fakeFirestore.get('APPLAUSE').length.should.equal(4);
       fakeFirestoreUpdate(fakeFirestore);

       // 4 messages and one progress bar.
       document.getElementById('messages')
           .querySelectorAll('.message-container')
           .length.should.equal(5);

       verifyProgressBarWidth(
           callbacksMap.get('APPLAUSE'),
           document.getElementById('messages')
               .children[4]
               .querySelector('.callback-progress-bar'),
           4);

       fakeFirestore.get('APPLAUSE').push({
         id: 'edward',
         data: () => ({
           userName: 'Edward',
           profilePicUrl: 'edward.png',
           timestamp: Timestamp.fromMillis(151000),
         }),
       });
       fakeFirestore.get('APPLAUSE').push({
         id: 'francyne',
         data: () => ({
           userName: 'Francyne',
           profilePicUrl: 'francyne.png',
           timestamp: Timestamp.fromMillis(152000),
         }),
       });

       fakeFirestore.get('APPLAUSE').length.should.equal(6);
       fakeFirestoreUpdate(fakeFirestore);

       // 4 messages and one video.
       document.getElementById('messages')
           .querySelectorAll('.message-container')
           .length.should.equal(5);

       should.not.exist(document.getElementById('messages')
           .children[4]
           .querySelector('.callback-progress-bar'));
       document.getElementById('messages')
           .children[4]
           .querySelector('.callback-video')
           .should.exist;
     });

  it('creates a new progress bar if the time window expires', function() {
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
      id: 'alice',
      data: () => ({
        userName: 'Alice',
        profilePicUrl: 'alice.png',
        timestamp: Timestamp.fromMillis(147000),
      }),
    });
    fakeFirestore.get('SHIPS').push({
      id: 'bob',
      data: () => ({
        userName: 'Bob',
        profilePicUrl: 'bob.png',
        timestamp: Timestamp.fromMillis(149000),
      }),
    });

    fakeFirestore.get('SCIENCE').push({
      id: 'carol',
      data: () => ({
        userName: 'Carol',
        profilePicUrl: 'carol.png',
        timestamp: Timestamp.fromMillis(143000),
      }),
    });

    fakeFirestore.get('SHIPS').length.should.equal(2);
    fakeFirestore.get('SCIENCE').length.should.equal(1);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages and two progress bars.
    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(6);

    verifyProgressBarWidth(
        callbacksMap.get('SCIENCE'),
        document.getElementById('messages')
            .children[2]
            .querySelector('.callback-progress-bar'),
        1);
    verifyProgressBarWidth(
        callbacksMap.get('SHIPS'),
        document.getElementById('messages')
            .children[5]
            .querySelector('.callback-progress-bar'),
        2);

    MockDate.set(170000);

    fakeFirestore.get('SHIPS').push({
      id: 'david',
      data: () => ({
        userName: 'David',
        profilePicUrl: 'david.png',
        timestamp: Timestamp.fromMillis(170000),
      }),
    });

    fakeFirestore.get('SHIPS').length.should.equal(3);
    fakeFirestore.get('SCIENCE').length.should.equal(1);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages and two progress bars.
    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(7);

    verifyProgressBarWidth(
        callbacksMap.get('SCIENCE'),
        document.getElementById('messages')
            .children[2]
            .querySelector('.callback-progress-bar'),
        1);
    verifyProgressBarWidth(
        callbacksMap.get('SHIPS'),
        document.getElementById('messages')
            .children[5]
            .querySelector('.callback-progress-bar'),
        2);
    verifyProgressBarWidth(
        callbacksMap.get('SHIPS'),
        document.getElementById('messages')
            .children[6]
            .querySelector('.callback-progress-bar'),
        1);
  });

  it('creates a new progress bar after the video is played', function() {
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
      id: 'alice',
      data: () => ({
        userName: 'Alice',
        profilePicUrl: 'alice.png',
        timestamp: Timestamp.fromMillis(147000),
      }),
    });
    fakeFirestore.get('SHIPS').push({
      id: 'bob',
      data: () => ({
        userName: 'Bob',
        profilePicUrl: 'bob.png',
        timestamp: Timestamp.fromMillis(149000),
      }),
    });

    fakeFirestore.get('SCIENCE').push({
      id: 'carol',
      data: () => ({
        userName: 'Carol',
        profilePicUrl: 'carol.png',
        timestamp: Timestamp.fromMillis(143000),
      }),
    });

    fakeFirestore.get('SHIPS').length.should.equal(2);
    fakeFirestore.get('SCIENCE').length.should.equal(1);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages and two progress bars.
    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(6);

    verifyProgressBarWidth(
        callbacksMap.get('SCIENCE'),
        document.getElementById('messages')
            .children[2]
            .querySelector('.callback-progress-bar'),
        1);
    verifyProgressBarWidth(
        callbacksMap.get('SHIPS'),
        document.getElementById('messages')
            .children[5]
            .querySelector('.callback-progress-bar'),
        2);

    fakeFirestore.get('SHIPS').push({
      id: 'david',
      data: () => ({
        userName: 'David',
        profilePicUrl: 'david.png',
        timestamp: Timestamp.fromMillis(150000),
      }),
    });

    fakeFirestore.get('SHIPS').length.should.equal(3);
    fakeFirestore.get('SCIENCE').length.should.equal(1);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages, one progress bar, and one video.
    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(6);

    verifyProgressBarWidth(
        callbacksMap.get('SCIENCE'),
        document.getElementById('messages')
            .children[2]
            .querySelector('.callback-progress-bar'),
        1);
    should.not.exist(document.getElementById('messages')
        .children[5]
        .querySelector('.callback-progress-bar'));
    document.getElementById('messages')
        .children[5]
        .querySelector('.callback-video')
        .should.exist;

    // This date is still within the callback window; but the video has played,
    // so we get a new progress bar.
    MockDate.set(152000);

    fakeFirestore.get('SHIPS').push({
      id: 'erica',
      data: () => ({
        userName: 'Erica',
        profilePicUrl: 'erica.png',
        timestamp: Timestamp.fromMillis(152000),
      }),
    });

    fakeFirestore.get('SHIPS').length.should.equal(4);
    fakeFirestore.get('SCIENCE').length.should.equal(1);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages, two progress bars, and one video
    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(7);

    verifyProgressBarWidth(
        callbacksMap.get('SCIENCE'),
        document.getElementById('messages')
            .children[2]
            .querySelector('.callback-progress-bar'),
        1);
    should.not.exist(document.getElementById('messages')
        .children[5]
        .querySelector('.callback-progress-bar'));
    document.getElementById('messages')
        .children[5]
        .querySelector('.callback-video')
        .should.exist;
    verifyProgressBarWidth(
        callbacksMap.get('SHIPS'),
        document.getElementById('messages')
            .children[6]
            .querySelector('.callback-progress-bar'),
        1);
  });
});
