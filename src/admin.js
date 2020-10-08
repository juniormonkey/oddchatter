/**
 * @fileoverview Main JS code for the Odd Chatter page.
 */

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
        'sure you are running the codelab using `firebase serve`',
    );
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

    enableWithDefault(
        fallbackFormElement(),
        fallbackUrlElement(),
        configuration.fallback_url,
        (url) => {
          configuration.fallback_url = url;
        },
    );

    enableDatetimeWithDefault(
        eventStartFormElement(),
        eventStartElement(),
        configuration.event_start,
        (eventStart) => {
          configuration.event_start = eventStart;
        },
    );

    enableWithDefault2(
        callbackFormElement(),
        callbackThresholdElement(),
        configuration.callback_threshold,
        callbackWindowElement(),
        configuration.callback_window_ms,
        (callbackThreshold, callbackWindowMs) => {
          if (isNaN(parseInt(callbackThreshold, 10)) ||
              isNaN(+callbackThreshold)) {
            console.error(
                'callbackThreshold must be a number, was ',
                callbackThreshold,
            );
            return;
          }
          if (isNaN(parseInt(callbackWindowMs, 10)) ||
              isNaN(+callbackWindowMs)) {
            console.error(
                'callbackWindowMs must be a number, was ',
                callbackWindowMs,
            );
            return;
          }
          configuration.callback_threshold = +callbackThreshold;
          configuration.callback_window_ms = +callbackWindowMs;
        },
    );

    enableWithDefault(
        youtubeStreamFormElement(),
        youtubeStreamURLElement(),
        configuration.youtube_video,
        (videoId) => {
          configuration.youtube_video = videoId;
        },
    );

    enableWithDefault(
        youtubeChatFormElement(),
        youtubeChatURLElement(),
        configuration.youtube_chat,
        (videoId) => {
          configuration.youtube_chat = videoId;
        },
    );
  });

  config.CONFIG.loadFromFirestore();

  // - only accessible to admin users - TODO: can Firebase restrict new users?
  // - list of users, with block button - TODO: is there a good UI for this?
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
function enableWithDefault(
    formElement,
    textInput,
    defaultValue,
    updateConfiguration,
) {
  enableTextInput(textInput, defaultValue);
  formElement.addEventListener('submit', (e) => {
    e.preventDefault();
    updateConfiguration(textInput.value);
    config.CONFIG.saveToFirestore();
  });
  formElement.querySelectorAll('button').forEach(
      (el) => el.removeAttribute('disabled'));
}

/**
 * Enables a datetime input form with a default value for the datetime field.
 * @param {Element} formElement The outer <form> element.
 * @param {Element} datetimeInput The inner <input> element.
 * @param {Date|null} defaultValue The default value for the input element.
 * @param {function(Date)} updateConfiguration A function that updates the
 *     configuration on form submit.
 */
function enableDatetimeWithDefault(
    formElement,
    datetimeInput,
    defaultValue,
    updateConfiguration,
) {
  enableDatetimeInput(datetimeInput, defaultValue);
  formElement.addEventListener('submit', (e) => {
    e.preventDefault();
    updateConfiguration(new Date(datetimeInput.value));
    config.CONFIG.saveToFirestore();
  });
  formElement.querySelectorAll('button').forEach(
      (el) => el.removeAttribute('disabled'));
}

/**
 * Enables a two-field text input form with a default value for the text fields.
 * @param {Element} formElement The outer <form> element.
 * @param {Element} textInput1 The first inner <input> element.
 * @param {string} defaultValue1 The default text for the first input element.
 * @param {Element} textInput2 The second inner <input> element.
 * @param {string} defaultValue2 The default text for the second input element.
 * @param {function(string, string)} updateConfiguration A function that updates
 *     the configuration on form submit.
 */
function enableWithDefault2(
    formElement,
    textInput1,
    defaultValue1,
    textInput2,
    defaultValue2,
    updateConfiguration,
) {
  enableTextInput(textInput1, defaultValue1);
  enableTextInput(textInput2, defaultValue2);
  formElement.addEventListener('submit', (e) => {
    e.preventDefault();
    updateConfiguration(textInput1.value, textInput2.value);
    config.CONFIG.saveToFirestore();
  });
  formElement.querySelectorAll('button').forEach(
     (el) => el.removeAttribute('disabled'));
}

/**
 * Enables a text field with a default value.
 * @param {Element} textInput The inner <input> element.
 * @param {string} defaultValue The default text for the input element.
 */
function enableTextInput(textInput, defaultValue) {
  textInput.value = defaultValue;
  /** @type {MaterialTextfield} */ (textInput.parentNode['MaterialTextfield'])
      .boundUpdateClassesHandler();
  textInput.removeAttribute('disabled');
}

/**
 * Enables a datetime-local field with a default value.
 * @param {Element} datetimeInput The inner <input> element.
 * @param {Date|firebase.firestore.Timestamp|null} defaultValue The default
 *     text for the input element.
 */
function enableDatetimeInput(datetimeInput, defaultValue) {
  let defaultValueString = '';
  if (defaultValue instanceof firebase.firestore.Timestamp) {
    defaultValue = defaultValue.toDate();
  }
  if (defaultValue instanceof Date) {
    defaultValue.setMinutes(
        defaultValue.getMinutes() - defaultValue.getTimezoneOffset(),
    );
    defaultValueString = defaultValue.toISOString().slice(0, 16);
  }
  datetimeInput.value = defaultValueString;
  datetimeInput.removeAttribute('disabled');
}

/** @return {Element} */ const fallbackUrlElement = () =>
    document.getElementById('fallback-url');
/** @return {Element} */ const fallbackFormElement = () =>
    document.getElementById('fallback-form');

/** @return {Element} */ const enableSwitchElement = () =>
    document.getElementById('enabled');
/** @return {Element} */ const eventStartElement = () =>
    document.getElementById('event-start');
/** @return {Element} */ const eventStartFormElement = () =>
    document.getElementById('event-start-form');
/** @return {Element} */ const callbackThresholdElement = () =>
    document.getElementById('callback-threshold');
/** @return {Element} */ const callbackWindowElement = () =>
    document.getElementById('callback-window');
/** @return {Element} */ const callbackFormElement = () =>
    document.getElementById('callback-form');
/** @return {Element} */ const youtubeStreamURLElement = () =>
    document.getElementById('youtube-stream-url');
/** @return {Element} */ const youtubeStreamFormElement = () =>
    document.getElementById('youtube-stream-form');
/** @return {Element} */ const youtubeChatURLElement = () =>
    document.getElementById('youtube-chat-url');
/** @return {Element} */ const youtubeChatFormElement = () =>
    document.getElementById('youtube-chat-form');

main();
