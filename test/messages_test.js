import assert from 'assert';
import firebase from 'firebase';
import MockDate from 'mockdate';
import should from 'should';

import {Message} from '../public/scripts/src/messages.js';

const firebasemock = require('firebase-mock');

const Timestamp = firebase.firestore.Timestamp;

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

function createMessage(id, messageText) {
  return new Message(id, Timestamp.now(), 'authorUid', 'Author Name',
                     'authorPic.png', messageText, null);
}

function createVideoMessage(id) {
  return new Message(id, Timestamp.now(), 'authorUid', 'Author Name',
                     'authorPic.png', null, 'callback.mp4');
}

function getTimestampFromDom(id) {
  return parseInt(document.getElementById(id).getAttribute('timestamp'));
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

  afterEach(function() {
    document.body.innerHTML = '';
    MockDate.reset();
  });

  it('finds the right place to insert a new message', function() {

    MockDate.set(100000);
    createMessage('A', 'message A').display();
    MockDate.set(200000);
    createMessage('B', 'message B').display();
    MockDate.set(300000);
    createMessage('C', 'message C').display();
    MockDate.set(400000);
    createMessage('D', 'message D').display();

    MockDate.set(50000);
    const message1 = createMessage('one', 'before A');

    MockDate.set(150000);
    const message2 = createMessage('two', 'between A and B');

    MockDate.set(200000);
    const message3 = createMessage('three', 'same timestamp as B');

    MockDate.set(400000);
    const message4 = createMessage('four', 'same timestamp as D')

    MockDate.set(500000);
    const message5 = createMessage('five', 'newer than all other messages')

    const insertion1 = message1.findDivToInsertBefore();
    should.exist(insertion1);
    insertion1.id.should.equal('A');

    const insertion2 = message2.findDivToInsertBefore();
    should.exist(insertion2);
    insertion2.id.should.equal('B');

    const insertion3 = message3.findDivToInsertBefore();
    should.exist(insertion3);
    insertion3.id.should.equal('B');

    const insertion4 = message4.findDivToInsertBefore();
    should.exist(insertion4);
    insertion4.id.should.equal('D');

    const insertion5 = message5.findDivToInsertBefore();
    should.not.exist(insertion5);
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

  // TODO: scrolling

  // TODO: collapse callback messages
});
