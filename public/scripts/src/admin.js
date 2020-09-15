/**
 * @fileoverview Main JS code for the Odd Chatter page.
 */

window.ADMIN_MODE = true;

import * as config from './config.js';
import * as controller from './controller.js';
import * as view from './view.js';

function main() {
  /** Checks that the Firebase SDK has been correctly setup and configured. */
  if (!window.firebase || !(firebase.app instanceof Function) ||
      !firebase.app().options) {
    window.alert(
        'You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
    return;
  }

  // Initialize the UI controller
  controller.init();

  // initialize Firebase and load the messages
  firebase.auth().onAuthStateChanged(view.applyNewAuthState);

  // Load the configuration from Firestore
  config.CONFIG.addConfigurationChangeListener(view.applyNewConfiguration);
  config.CONFIG.addConfigurationChangeListener((configuration) => {
    // - on/off switch that enables/disables the app.
    enableSwitchElement().checked = configuration.enabled_;
    enableSwitchElement().removeAttribute('disabled');
    /** @type {MaterialSwitch} */ (
        enableSwitchElement().parentNode['MaterialSwitch'])
        .boundChangeHandler();
    enableSwitchElement().addEventListener('click', (e) => {
      configuration.enabled_ = e.target.checked;
      configuration.saveToFirestore();
    });

    enableWithDefault(fallbackFormElement(), fallbackUrlElement(),
                      configuration.fallback_url,
                      (url) => {
                        configuration.fallback_url = url;
                      });
  });

  config.CONFIG.loadFromFirestore();

  // - only accessible to admin users - TODO: can Firebase restrict new users?
  // - (set the event start time?)
  // - list of users, with block button - TODO: is there a good UI for this?
  // - thresholds to update?
  // - different background or header or something to emphasise admin mode
}

/**
 * Enables a text input form with a default value for the text field.
 * @param {Element} formElement The outer <form> element.
 * @param {Element} textInput The inner <input> element.
 * @param {string} defaultValue The default text for the input element.
 * @param {function(string)} updateConfiguration A function that updates the
 *     configuration on form submit.
 */
function enableWithDefault(formElement, textInput, defaultValue,
                           updateConfiguration) {
  textInput.value = defaultValue;
  /** @type {MaterialTextfield} */ (textInput.parentNode['MaterialTextfield'])
      .boundUpdateClassesHandler();
  formElement.addEventListener('submit', (e) => {
    e.preventDefault();
    updateConfiguration(textInput.value);
    config.CONFIG.saveToFirestore();
  });
  textInput.removeAttribute('disabled');
  formElement.querySelectorAll('button').forEach(
      (el) => el.removeAttribute('disabled'));
}

/** @return {Element} */ const enableSwitchElement = () =>
    document.getElementById('enabled');
/** @return {Element} */ const fallbackUrlElement = () =>
    document.getElementById('fallback-url');
/** @return {Element} */ const fallbackFormElement = () =>
    document.getElementById('fallback-form');
/** @return {Element} */ const youtubeStreamURLElement = () =>
    document.getElementById('youtube-stream-url');
/** @return {Element} */ const youtubeStreamFormElement = () =>
    document.getElementById('youtube-stream-form');
/** @return {Element} */ const youtubeChatURLElement = () =>
    document.getElementById('youtube-chat-url');
/** @return {Element} */ const youtubeChatFormElement = () =>
    document.getElementById('youtube-chat-form');

main();
