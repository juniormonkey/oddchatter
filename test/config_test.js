/* eslint-disable closure/no-undef */

import {
  CONFIG,
} from '../src/config.js';

const chai = require('chai');
chai.should();

describe('config', function() {

  it('returns a callback threshold at least 1', function() {
    CONFIG.active_users = 25;
    CONFIG.callback_threshold_raw = 0;
    CONFIG.threshold_is_percentage = false;
    CONFIG.callbackThreshold().should.equal(1);
  });

  it('returns threshold when not a percentage', function() {
    CONFIG.active_users = 25;
    CONFIG.callback_threshold_raw = 3;
    CONFIG.threshold_is_percentage = false;
    CONFIG.callbackThreshold().should.equal(3);
  });

  it('returns threshold when percentage requested', function() {
    CONFIG.active_users = 25;
    CONFIG.callback_threshold_raw = 15;
    CONFIG.threshold_is_percentage = true;
    CONFIG.callbackThreshold().should.equal(3);
  });

  it('returns threshold at least 1 when percentage requested', function() {
    CONFIG.active_users = 25;
    CONFIG.callback_threshold_raw = 3;
    CONFIG.threshold_is_percentage = true;
    CONFIG.callbackThreshold().should.equal(1);
  });
});
