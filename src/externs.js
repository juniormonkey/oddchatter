/**
 * @fileoverview externs for odd chatter.
 * @externs
 */
/* eslint-disable no-unused-vars */

/**
 * @interface
 * @param {Element} element
 */
function MaterialSnackbar(element) {}

/**
 * @param {Object} data
 */
MaterialSnackbar.prototype.showSnackbar = function(data) {};

/**
 * @interface
 * @param {Element} element
 */
function MaterialTextfield(element) {}

MaterialTextfield.prototype.boundUpdateClassesHandler = function() {};

/**
 * @interface
 * @param {Element} element
 */
function MaterialSwitch(element) {}

MaterialSwitch.prototype.boundChangeHandler = function() {};

/**
 * @constructor
 * @param {Object} options
 */
function Autolinker(options) {}

/**
 * @param {string} textToLinkify
 */
Autolinker.prototype.link = function(textToLinkify) {};

/**
 * @interface
 */
function DOMPurify() {}

/**
 * @param {string} dirty
 */
DOMPurify.sanitize = function(dirty) {};

// eslint-disable-next-line closure/jsdoc
/**
 * Gets the Analytics service.
 *
 * firebase.analytics() can be called with no arguments to access the default
 * app's Analytics service.
 *
 * @namespace
 * @param {!firebase.app.App=} app
 *
 * @return {!firebase.analytics.Analytics}
 */
firebase.analytics = function(app) {};

/**
 * The Firebase Analytics service interface.
 *
 * Do not call this constructor directly. Instead, use
 * {@link firebase.analytics `firebase.analytics()`}.
 *
 * See
 * {@link https://firebase.google.com/docs/analytics/ Firebase Analytics}
 * for a full guide on how to use the Firebase Analytics service.
 *
 * @interface
 */
firebase.analytics.Analytics = function() {};
