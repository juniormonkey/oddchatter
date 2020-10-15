/* eslint-disable closure/no-undef */

import {
  CONFIG,
  overrideAdminMode,
} from '../src/config.js';
import {init} from '../src/controller.js';

const FakeTimers = require('@sinonjs/fake-timers');

const firebasemock = require('firebase-mock');
const chai = require('chai');
chai.use(require('chai-dom'));
chai.should();

describe('controller', function() {
  beforeEach(async function() {
    overrideAdminMode(false);

    document.body.innerHTML =
        '<div id="outer-container" hidden>' +
        '  <div id="user-container">' +
        '    <button id="sign-in"></button>' +
        '    <button id="kebab-menu"></button>' +
        '    <button id="sign-out"></button>' +
        '    <input type="checkbox" id="notifications-switch"></input>' +
        '  </div>' +
        '  <div id="signin-splashscreen">' +
        '    <button id="sign-in-splash">Sign in</button>' +
        '  </div>' +
        '  <div id="messages-card-container">' +
        '    <form id="message-form" action="#">' +
        '      <div class="mdl-textfield mdl-js-textfield">' +
        '        <input type="text" id="message">' +
        '        <button id="submit" disabled type="submit">Send</button>' +
        '      </div>' +
        '    </form>' +
        '    <div class="messagebuttons">' +
        '      <form id="science-form" class="one-button-form" action=#>' +
        '        <button id="science" type="submit">Science</button>' +
        '      </form>' +
        '      <form id="art-form" class="one-button-form" action=#>' +
        '        <button id="art" type="submit">Art</button>' +
        '      </form>' +
        '      <form id="maps-form" class="one-button-form" action=#>' +
        '        <button id="maps" type="submit">Maps</button>' +
        '      </form>' +
        '      <form id="ships-form" class="one-button-form" action=#>' +
        '        <button id="ships" type="submit">Ships</button>' +
        '      </form>' +
        '      <form id="applause-form" class="one-button-form" action=#>' +
        '        <button id="applause" type="submit">Applause</button>' +
        '      </form>' +
        '      <form id="boo-form" class="one-button-form" action=#>' +
        '        <button id="boo" type="submit">Boo</button>' +
        '      </form>' +
        '    </div>' +
        '  </div>' +
        '</div>';

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

    mockfirestore.autoFlush();

    mockauth.createUser({email: 'user@one.com', password: 't3st1'});
    mockauth.createUser({email: 'user@two.com', password: 'test2'});
    mockauth.createUser({email: 'user@three.com', password: 't3st'});
    mockauth.createUser({email: 'user@four.com', password: '4test'});
    mockauth.createUser({email: 'user@five.com', password: 'te5t'});
    mockauth.flush();

    CONFIG.copyFromFirestoreData_({
      enabled: false,
      event_start: null,
      fallback_url: '',
      callback_window_ms: 10000,
      callback_threshold: 3,
      admin_users: [],
      youtube_video: '',
      youtube_chat: '',
    });

    init();
  });

  afterEach(function() {
    window.firebase.auth().changeAuthState(null);
    window.firebase.auth().flush();
    document.body.innerHTML = '';
  });

  async function typeMessage(userEmail, message) {
    const user = await window.firebase.auth().getUserByEmail(userEmail);
    window.firebase.auth().changeAuthState({
      uid: user.uid,
      provider: 'custom',
      token: 'authToken',
      expires: Math.floor(new Date() / 1000) + 24 * 60 * 60,
    });
    window.firebase.auth().flush();

    document.getElementById('message').value = message;
    await document.getElementById('message-form').submit();
  }

  async function submitCallback(userEmail, callback) {
    const user = await window.firebase.auth().getUserByEmail(userEmail);
    window.firebase.auth().changeAuthState({
      uid: user.uid,
      provider: 'custom',
      token: 'authToken',
      expires: Math.floor(new Date() / 1000) + 24 * 60 * 60,
    });
    window.firebase.auth().flush();

    document.getElementById(callback).submit();
  }

  async function verifyCollectionSize(collection, size) {
    const snapshot =
        await window.firebase.firestore().collection(collection).get();
    snapshot.size.should.equal(size);
  }

  it('saves messages', async function() {
    await verifyCollectionSize('messages', 0);
    await verifyCollectionSize('SCIENCE', 0);
    await verifyCollectionSize('ART', 0);
    await verifyCollectionSize('MAPS', 0);
    await verifyCollectionSize('SHIPS', 0);
    await verifyCollectionSize('APPLAUSE', 0);
    await verifyCollectionSize('BOO', 0);

    await typeMessage('user@one.com', 'Message one');
    await typeMessage('user@three.com', 'Message two');
    await typeMessage('user@two.com', 'Message three');

    await verifyCollectionSize('messages', 3);
    await verifyCollectionSize('SCIENCE', 0);
    await verifyCollectionSize('ART', 0);
    await verifyCollectionSize('MAPS', 0);
    await verifyCollectionSize('SHIPS', 0);
    await verifyCollectionSize('APPLAUSE', 0);
    await verifyCollectionSize('BOO', 0);
  });

  it('saves a callback message when typed out', async function() {
    await verifyCollectionSize('messages', 0);
    await verifyCollectionSize('SCIENCE', 0);
    await verifyCollectionSize('ART', 0);
    await verifyCollectionSize('MAPS', 0);
    await verifyCollectionSize('SHIPS', 0);
    await verifyCollectionSize('APPLAUSE', 0);
    await verifyCollectionSize('BOO', 0);

    await typeMessage('user@one.com', 'Message one');
    await typeMessage('user@three.com', 'SHIPS!!');
    await typeMessage('user@two.com', 'SCIENCE!!');
    await typeMessage('user@four.com', '👏');

    await verifyCollectionSize('messages', 4);
    await verifyCollectionSize('SCIENCE', 1);
    await verifyCollectionSize('ART', 0);
    await verifyCollectionSize('MAPS', 0);
    await verifyCollectionSize('SHIPS', 1);
    await verifyCollectionSize('APPLAUSE', 1);
    await verifyCollectionSize('BOO', 0);
  });

  it('saves a callback message via callback button', async function() {
    await verifyCollectionSize('messages', 0);
    await verifyCollectionSize('SCIENCE', 0);
    await verifyCollectionSize('ART', 0);
    await verifyCollectionSize('MAPS', 0);
    await verifyCollectionSize('SHIPS', 0);
    await verifyCollectionSize('APPLAUSE', 0);
    await verifyCollectionSize('BOO', 0);

    await submitCallback('user@one.com', 'ships-form');
    await typeMessage('user@one.com', 'asdf');
    await submitCallback('user@three.com', 'science-form');
    await submitCallback('user@two.com', 'applause-form');
    await submitCallback('user@four.com', 'ships-form');
    await submitCallback('user@three.com', 'science-form');

    await verifyCollectionSize('messages', 6);
    await verifyCollectionSize('SCIENCE', 1);
    await verifyCollectionSize('ART', 0);
    await verifyCollectionSize('MAPS', 0);
    await verifyCollectionSize('SHIPS', 2);
    await verifyCollectionSize('APPLAUSE', 1);
    await verifyCollectionSize('BOO', 0);
  });

  it('toggles the send button with whether the text input is empty',
     function() {
       const messageInput = document.getElementById('message');
       const submitButton = document.getElementById('submit');
       submitButton.should.have.attr('disabled');

       messageInput.value = 'a non-empty message';
       messageInput.dispatchEvent(new Event('keyup'));
       submitButton.should.not.have.attr('disabled');

       messageInput.value = '';
       messageInput.dispatchEvent(new Event('keyup'));
       submitButton.should.have.attr('disabled');
     });

  it('disables the callback button for one second after send',
     async function() {
       const clock = FakeTimers.install({now: Date.now()});

       const scienceButton = document.getElementById('science');
       scienceButton.should.not.have.attr('disabled');

       await submitCallback('user@one.com', 'science-form');
       await clock.tickAsync(1);
       scienceButton.should.have.attr('disabled');

       await clock.tickAsync(1000);
       scienceButton.should.not.have.attr('disabled');

       clock.uninstall();
     });

  it('does not disables the callback button after typing the callback',
     async function() {
       const clock = FakeTimers.install({now: Date.now()});

       const scienceButton = document.getElementById('science');
       scienceButton.should.not.have.attr('disabled');

       await typeMessage('user@one.com', 'SCIENCE!!');
       scienceButton.should.not.have.attr('disabled');

       clock.uninstall();
     });
});
