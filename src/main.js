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
        'sure you are running the codelab using `firebase serve`');
    return;
  }

  // Initialize the UI controller.
  controller.init();

  // initialize Firebase and load the messages.
  firebase.auth().onAuthStateChanged(view.applyNewAuthState);

  // Load the configuration from Firestore.
  config.CONFIG.addConfigurationChangeListener(view.applyNewConfiguration);
  config.CONFIG.loadFromFirestore();

  // Enable Firebase performance monitoring.
  firebase.performance();
}

main();
