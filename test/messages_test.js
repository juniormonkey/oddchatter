/* eslint-disable closure/no-unused-expressions */
/* eslint-disable closure/no-undef */
import MockDate from 'mockdate';

import {
  overrideAdminMode,
} from '../src/config.js';
import {
  Message,
} from '../src/messages.js';

const firebasemock = require('firebase-mock');
const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(sinonChai);

import Autolinker from 'autolinker';
import createDOMPurify from 'dompurify';

function createMessage(id, messageText, uid = 'authorUid') {
  return new Message(id, new Date(), uid, 'Author Name', 'authorPic.png',
                     messageText, null);
}

function createVideoMessage(id) {
  return new Message(id, new Date(), 'authorUid', 'Author Name',
                     'authorPic.png', null, 'callback.mp4');
}

function mockScrolling() {
  window.Element.prototype.scrollIntoView = function() {};
  sinon.stub(Element.prototype, 'scrollIntoView');
}

describe('messages', function() {
  beforeEach(function() {
    global.Autolinker = Autolinker;
    global.DOMPurify = createDOMPurify(window);

    document.body.innerHTML =
        '<div id="messages">' +
        '  <div id="last-message">&nbsp;</div>' +
        '</div>' +
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

    mockauth.changeAuthState({
      uid: 'testUid',
      provider: 'google',
      token: 'authToken',
      expires: Math.floor(new Date() / 1000) + 24 * 60 * 60,
    });
    mockauth.flush();
  });

  afterEach(function() {
    sinon.restore();
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

    const messageElements = document.getElementById('messages')
        .querySelectorAll('.message-container');
    messageElements.length.should.equal(4);
    messageElements[0].id.should.equal('one');
    messageElements[1].id.should.equal('two');
    messageElements[2].id.should.equal('three');
    messageElements[3].id.should.equal('four');
  });

  it('stays scrolled to the bottom when a new message appears', function() {
    MockDate.set(100000);
    createMessage('A', 'message A').display();
    MockDate.set(200000);
    createMessage('B', 'message B').display();
    MockDate.set(300000);
    createMessage('C', 'message C').display();
    MockDate.set(400000);
    createMessage('D', 'message D').display();

    document.getElementById('messages').dataset.scrolledToEnd = true;

    MockDate.set(500000);
    createMessage('E', 'message E').display();
    document.getElementById('last-message').scrollIntoView
        .should.have.been.calledOnce;
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

    delete document.getElementById('messages').dataset.scrolledToEnd;

    // testUid is the logged-in user.
    MockDate.set(500000);
    createMessage('E', 'message E', 'testUid').display();
    document.getElementById('last-message').scrollIntoView
        .should.have.been.calledOnce;
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

    delete document.getElementById('messages').dataset.scrolledToEnd;

    // By default, the message is someone else's; don't scroll into view.
    MockDate.set(500000);
    createMessage('E', 'message E').display();
    document.getElementById('last-message').scrollIntoView
        .should.not.have.been.called;
  });

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

    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(4);

    MockDate.set(350000);
    createMessage('1', 'message one').display();

    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(5);

    MockDate.set(375000);
    createMessage('2', 'SHIPS!!').display();

    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(5);

    MockDate.set(385000);
    createMessage('3', 'message three').display();

    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(6);
  });

  it('shows callback messages in admin mode', function() {
    overrideAdminMode(true);
    MockDate.set(100000);
    createMessage('A', 'message A').display();
    MockDate.set(200000);
    createMessage('B', 'message B').display();
    MockDate.set(300000);
    createMessage('C', 'message C').display();
    MockDate.set(400000);
    createMessage('D', 'message D').display();

    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(4);

    MockDate.set(350000);
    createMessage('1', 'message one').display();

    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(5);

    MockDate.set(375000);
    createMessage('2', 'SHIPS!!').display();

    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(6);

    MockDate.set(385000);
    createMessage('3', 'message three').display();

    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(7);
  });

  it('sanitizes malicious HTML', function() {
    createMessage('A', '<script src=malicious.js>').display();
    createMessage('B', '<safe>').display();
    createMessage('C', 'very safe').display();

    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(3);

    document.getElementById('A')
        .querySelector('.message')
        .innerHTML.should.equal('&lt;script src=malicious.js&gt;');
    document.getElementById('B')
        .querySelector('.message')
        .innerHTML.should.equal('&lt;safe&gt;');
    document.getElementById('C')
        .querySelector('.message')
        .innerHTML.should.equal('very safe');
  });

  it('linkifies URLs, email addresses and phone numbers', function() {
    createMessage('A', 'Donate at http://oddsalon.com/donate').display();
    createMessage('B', '<a href=https://oddsalon.com>click here!</a>')
        .display();
    createMessage('C', 'oddsalon@gmail.com').display();
    createMessage('D', 'Oops here\'s my digits: 415-123-4567').display();
    createMessage('E', 'LONG: https://www.oddsalon.com/donate').display();
    createMessage('F', 'SHORT: oddsalon.com').display();

    document.getElementById('messages').querySelectorAll('.message-container')
        .length.should.equal(6);

    document.getElementById('A')
        .querySelector('.message')
        .innerHTML.should.equal(
            'Donate at <a href="http://oddsalon.com/donate"' +
            ' target="_blank" rel="noopener noreferrer"' +
            '>http://oddsalon.com/donate</a>');
    document.getElementById('B')
        .querySelector('.message')
        .innerHTML.should.equal('&lt;a href=<a href="https://oddsalon.com"' +
                                ' target="_blank" rel="noopener noreferrer"' +
                                '>https://oddsalon.com</a>&gt;click here!' +
                                '&lt;/a&gt;');
    document.getElementById('C')
        .querySelector('.message')
        .innerHTML.should.equal('<a href="mailto:oddsalon@gmail.com"' +
                                ' target="_blank" rel="noopener noreferrer"' +
                                '>oddsalon@gmail.com</a>');
    document.getElementById('D')
        .querySelector('.message')
        .innerHTML.should.equal(
            'Oops here\'s my digits: <a href="tel:4151234567"' +
            ' target="_blank" rel="noopener noreferrer"' +
            '>415-123-4567</a>');

    document.getElementById('E')
        .querySelector('.message')
        .innerHTML.should.equal(
            'LONG: <a href="https://www.oddsalon.com/donate"' +
            ' target="_blank" rel="noopener noreferrer"' +
            '>https://www.oddsalon.com/donate</a>');

    document.getElementById('F')
        .querySelector('.message')
        .innerHTML.should.equal('SHORT: <a href="http://oddsalon.com"' +
                                ' target="_blank" rel="noopener noreferrer"' +
                                '>oddsalon.com</a>');
  });
});
