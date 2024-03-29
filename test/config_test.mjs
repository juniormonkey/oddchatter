/* eslint-disable closure/no-undef */

import {
  CONFIG,
} from '../src/config.mjs';

import chai from 'chai';
chai.should();

describe('config', function() {

  it('returns a callback threshold at least 2', function() {
    CONFIG.active_users = 25;
    CONFIG.callback_threshold_base = 0;
    CONFIG.threshold_is_percentage = false;
    CONFIG.callbackThreshold(1).should.equal(2);
  });

  it('returns threshold when not a percentage', function() {
    CONFIG.active_users = 25;
    CONFIG.callback_threshold_base = 3;
    CONFIG.threshold_is_percentage = false;
    CONFIG.callbackThreshold(1).should.equal(3);
  });

  it('returns threshold when percentage requested', function() {
    CONFIG.active_users = 25;
    CONFIG.callback_threshold_base = 15;
    CONFIG.threshold_is_percentage = true;
    CONFIG.callbackThreshold(1).should.equal(3);
  });

  it('returns threshold at least 2 when percentage requested', function() {
    CONFIG.active_users = 25;
    CONFIG.callback_threshold_base = 3;
    CONFIG.threshold_is_percentage = true;
    CONFIG.callbackThreshold(1).should.equal(2);
  });

  it('returns adjusted threshold when weight is passed', function() {
    CONFIG.active_users = 25;
    CONFIG.callback_threshold_base = 3;
    CONFIG.threshold_is_percentage = false;
    CONFIG.callbackThreshold(2).should.equal(6);
  });

  it('returns adjusted percentage threshold when weight is passed', function() {
    CONFIG.active_users = 25;
    CONFIG.callback_threshold_base = 15;
    CONFIG.threshold_is_percentage = true;
    CONFIG.callbackThreshold(2).should.equal(7);
  });

  it('returns window size in ms', function() {
    CONFIG.callback_window_ms_base = 10000;
    CONFIG.callbackWindowMs(1).should.equal(10000);
  });

  it('returns adjusted window size when weight is passed', function() {
    CONFIG.callback_window_ms_base = 10000;
    CONFIG.callbackWindowMs(2).should.equal(20000);
  });
});
