/* eslint-disable closure/no-undef */
/* eslint-disable closure/no-unused-expressions */
import firebase from 'firebase';
import MockDate from 'mockdate';
import should from 'should';

import {CALLBACKS} from '../src/callback_ui.js';
import {CONFIG} from '../src/config.js';
import {Message} from '../src/messages.js';

import Autolinker from 'autolinker';
import createDOMPurify from 'dompurify';

const Timestamp = firebase.firestore.Timestamp;

const firebasemock = require('firebase-mock');

function createMessage(id, messageText, uid = 'authorUid') {
  return new Message(id, new Date(), uid, 'Author Name', 'authorPic.png',
                     messageText, null);
}

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

function verifyProgressBarWidth(element, expectedWidthInVoices) {
  element.should.exist;
  element.style.width.should.equal(
      `${100 * expectedWidthInVoices / CONFIG.callback_threshold }%`);
  element.querySelectorAll('.callback-progress-voice')
      .length.should.equal(expectedWidthInVoices);
}

describe('callbacks', function() {
  beforeEach(async function() {
    global.Autolinker = Autolinker;
    global.DOMPurify = createDOMPurify(window);

    document.body.innerHTML =
        '<div id="messages"></div>' +
        '<form id="message-form">' +
        '  <input type="text" id="message">' +
        '  <button id="submit" type="submit">Send</button>' +
        '</form>' +
        '<audio id="science-audio" src="video/science1.mp4"></audio>' +
        '<audio id="art-audio" src="video/art1.mp4"></audio>' +
        '<audio id="maps-audio" src="video/maps1.mp4"></audio>' +
        '<audio id="ships-audio" src="video/ships1.mp4"></audio>' +
        '<audio id="applause-audio" src="video/applause1.mp4"></audio>' +
        '<audio id="boo-audio" src="video/boo1.mp4"></audio>';

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

    // This is needed because MockDate is not yet installed when
    // callback_ui.CALLBACKS is initialized.
    for (const callback of CALLBACKS) {
      callback.lastCalledTimestampMillis = 1;
    }
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

  /**
   * @param {Map<string, Array<Object>>} fakeFirestore
   */
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
        profilePicUrl: 'alice.png',
        timestamp: Timestamp.fromMillis(147000),
      }),
    });
    fakeFirestore.get('SHIPS').push({
      id: 'bob',
      data: () => (
          {profilePicUrl: 'bob.png', timestamp: Timestamp.fromMillis(149000)}),
    });

    fakeFirestore.get('SCIENCE').push({
      id: 'carol',
      data: () => ({
        profilePicUrl: 'carol.png',
        timestamp: Timestamp.fromMillis(143000),
      }),
    });

    fakeFirestore.get('SHIPS').length.should.equal(2);
    fakeFirestore.get('SCIENCE').length.should.equal(1);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages and two progress bars.
    document.getElementById('messages').children.length.should.equal(6);

    verifyProgressBarWidth(document.getElementById('messages')
        .children[2]
        .querySelector('.callback-progress-bar'),
                           1);
    verifyProgressBarWidth(document.getElementById('messages')
        .children[5]
        .querySelector('.callback-progress-bar'),
                           2);

    fakeFirestore.get('SCIENCE').push({
      id: 'alice',
      data: () => ({
        profilePicUrl: 'alice.png',
        timestamp: Timestamp.fromMillis(150000),
      }),
    });

    fakeFirestore.get('SHIPS').length.should.equal(2);
    fakeFirestore.get('SCIENCE').length.should.equal(2);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages and two progress bars.
    document.getElementById('messages').children.length.should.equal(6);

    verifyProgressBarWidth(document.getElementById('messages')
        .children[2]
        .querySelector('.callback-progress-bar'),
                           2);
    verifyProgressBarWidth(document.getElementById('messages')
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
           profilePicUrl: 'alice.png',
           timestamp: Timestamp.fromMillis(147000),
         }),
       });
       fakeFirestore.get('SHIPS').push({
         id: 'bob',
         data: () => ({
           profilePicUrl: 'bob.png',
           timestamp: Timestamp.fromMillis(149000),
         }),
       });

       fakeFirestore.get('SCIENCE').push({
         id: 'carol',
         data: () => ({
           profilePicUrl: 'carol.png',
           timestamp: Timestamp.fromMillis(143000),
         }),
       });

       fakeFirestore.get('SHIPS').length.should.equal(2);
       fakeFirestore.get('SCIENCE').length.should.equal(1);
       fakeFirestoreUpdate(fakeFirestore);

       // 4 messages and two progress bars.
       document.getElementById('messages').children.length.should.equal(6);

       verifyProgressBarWidth(document.getElementById('messages')
           .children[2]
           .querySelector('.callback-progress-bar'),
                              1);
       verifyProgressBarWidth(document.getElementById('messages')
           .children[5]
           .querySelector('.callback-progress-bar'),
                              2);

       fakeFirestore.get('SHIPS').push({
         id: 'david',
         data: () => ({
           profilePicUrl: 'david.png',
           timestamp: Timestamp.fromMillis(150000),
         }),
       });

       fakeFirestore.get('SHIPS').length.should.equal(3);
       fakeFirestore.get('SCIENCE').length.should.equal(1);
       fakeFirestoreUpdate(fakeFirestore);

       // 4 messages, one progress bar, and one video.
       document.getElementById('messages').children.length.should.equal(6);

       verifyProgressBarWidth(document.getElementById('messages')
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
        profilePicUrl: 'alice.png',
        timestamp: Timestamp.fromMillis(147000),
      }),
    });
    fakeFirestore.get('SHIPS').push({
      id: 'bob',
      data: () => (
          {profilePicUrl: 'bob.png', timestamp: Timestamp.fromMillis(149000)}),
    });

    fakeFirestore.get('SCIENCE').push({
      id: 'carol',
      data: () => ({
        profilePicUrl: 'carol.png',
        timestamp: Timestamp.fromMillis(143000),
      }),
    });

    fakeFirestore.get('SHIPS').length.should.equal(2);
    fakeFirestore.get('SCIENCE').length.should.equal(1);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages and two progress bars.
    document.getElementById('messages').children.length.should.equal(6);

    verifyProgressBarWidth(document.getElementById('messages')
        .children[2]
        .querySelector('.callback-progress-bar'),
                           1);
    verifyProgressBarWidth(document.getElementById('messages')
        .children[5]
        .querySelector('.callback-progress-bar'),
                           2);

    MockDate.set(170000);

    fakeFirestore.get('SHIPS').push({
      id: 'david',
      data: () => ({
        profilePicUrl: 'david.png',
        timestamp: Timestamp.fromMillis(170000),
      }),
    });

    fakeFirestore.get('SHIPS').length.should.equal(3);
    fakeFirestore.get('SCIENCE').length.should.equal(1);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages and two progress bars.
    document.getElementById('messages').children.length.should.equal(7);

    verifyProgressBarWidth(document.getElementById('messages')
        .children[2]
        .querySelector('.callback-progress-bar'),
                           1);
    verifyProgressBarWidth(document.getElementById('messages')
        .children[5]
        .querySelector('.callback-progress-bar'),
                           2);
    verifyProgressBarWidth(document.getElementById('messages')
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
        profilePicUrl: 'alice.png',
        timestamp: Timestamp.fromMillis(147000),
      }),
    });
    fakeFirestore.get('SHIPS').push({
      id: 'bob',
      data: () => (
          {profilePicUrl: 'bob.png', timestamp: Timestamp.fromMillis(149000)}),
    });

    fakeFirestore.get('SCIENCE').push({
      id: 'carol',
      data: () => ({
        profilePicUrl: 'carol.png',
        timestamp: Timestamp.fromMillis(143000),
      }),
    });

    fakeFirestore.get('SHIPS').length.should.equal(2);
    fakeFirestore.get('SCIENCE').length.should.equal(1);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages and two progress bars.
    document.getElementById('messages').children.length.should.equal(6);

    verifyProgressBarWidth(document.getElementById('messages')
        .children[2]
        .querySelector('.callback-progress-bar'),
                           1);
    verifyProgressBarWidth(document.getElementById('messages')
        .children[5]
        .querySelector('.callback-progress-bar'),
                           2);

    fakeFirestore.get('SHIPS').push({
      id: 'david',
      data: () => ({
        profilePicUrl: 'david.png',
        timestamp: Timestamp.fromMillis(150000),
      }),
    });

    fakeFirestore.get('SHIPS').length.should.equal(3);
    fakeFirestore.get('SCIENCE').length.should.equal(1);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages, one progress bar, and one video.
    document.getElementById('messages').children.length.should.equal(6);

    verifyProgressBarWidth(document.getElementById('messages')
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
        profilePicUrl: 'erica.png',
        timestamp: Timestamp.fromMillis(152000),
      }),
    });

    fakeFirestore.get('SHIPS').length.should.equal(4);
    fakeFirestore.get('SCIENCE').length.should.equal(1);
    fakeFirestoreUpdate(fakeFirestore);

    // 4 messages, two progress bars, and one video
    document.getElementById('messages').children.length.should.equal(7);

    verifyProgressBarWidth(document.getElementById('messages')
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
    verifyProgressBarWidth(document.getElementById('messages')
        .children[6]
        .querySelector('.callback-progress-bar'),
                           1);
  });
});
