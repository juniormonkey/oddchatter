/**
 * @fileoverview Logging functions.
 */

/**
 * @param {string} eventName
 * @param {Object} eventParameters
 */
export function logEvent(eventName, eventParameters) {
  // Do nothing if analytics is not defined, eg because of an ad blocker or
  // something.
  if (window.firebase.analytics instanceof Function) {
    window.firebase.analytics().logEvent(eventName, eventParameters);
  }
}
