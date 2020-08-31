/**
 * @fileoverview Logging functions.
 */
goog.module('oddsalon.oddchatter.logging');

/**
 * @param {string} event_name
 * @param {Object} event_parameters
 */
function logEvent(event_name, event_parameters) {
  // DO nothing if analytics is not defined, eg because of an ad blocker or
  // something.
  if (typeof analytics !== 'undefined') {
    analytics.logEvent(event_name, event_parameters);
  }
}

exports = {logEvent};
