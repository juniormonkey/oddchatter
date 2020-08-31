/**
 * @fileoverview Logging functions.
 */
goog.module('oddsalon.oddchatter.logging');

/**
 * @param {string} eventName
 * @param {Object} eventParameters
 */
function logEvent(eventName, eventParameters) {
  // DO nothing if analytics is not defined, eg because of an ad blocker or
  // something.
  if (typeof analytics !== 'undefined') {
    analytics.logEvent(eventName, eventParameters);
  }
}

exports = {logEvent};
