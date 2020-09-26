/* eslint-disable closure/no-undef */
import MockDate from 'mockdate';

import {Message} from '../src/messages.js';
import {findDivToInsertBefore} from '../src/ui.js';

const should = require('chai').should();

function createMessage(id, messageText, uid = 'authorUid') {
  return new Message(id, new Date(), uid, 'Author Name',
                     'authorPic.png', messageText, null);
}

describe('ui', function() {
  beforeEach(function() {
    document.body.innerHTML =
        '<div id="messages"></div>' +
        '<form id="message-form">' +
        '  <input type="text" id="message">' +
        '  <button id="submit" type="submit">Send</button>' +
        '</form>';
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
    const message4 = createMessage('four', 'same timestamp as D');

    MockDate.set(500000);
    const message5 = createMessage('five', 'newer than all other messages');

    const insertion1 = findDivToInsertBefore(message1.timestampMillis_());
    should.exist(insertion1);
    insertion1.id.should.equal('A');

    const insertion2 = findDivToInsertBefore(message2.timestampMillis_());
    should.exist(insertion2);
    insertion2.id.should.equal('B');

    const insertion3 = findDivToInsertBefore(message3.timestampMillis_());
    should.exist(insertion3);
    insertion3.id.should.equal('C');

    const insertion4 = findDivToInsertBefore(message4.timestampMillis_());
    should.not.exist(insertion4);

    const insertion5 = findDivToInsertBefore(message5.timestampMillis_());
    should.not.exist(insertion5);
  });
});
