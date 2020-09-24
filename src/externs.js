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
