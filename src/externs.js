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
