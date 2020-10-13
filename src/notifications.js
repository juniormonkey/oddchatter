/**
 * @fileoverview Handle notification permissions and notifications, using FCM.
 */

/** Saves the messaging device token to the datastore. */
export function saveMessagingDeviceToken() {
  window.firebase.messaging().getToken().then((currentToken) => {
    if (currentToken) {
      /* eslint-disable quote-props */
      window.firebase
          .firestore()
          .collection('fcmTokens')
          .doc(currentToken)
          .set({
            'uid': window.firebase.auth().currentUser.uid,
            'timestamp': window.firebase.firestore.FieldValue.serverTimestamp(),
          });
    } else {
        // Need to request permissions to show notifications.
      requestNotificationsPermissions_();
    }
  }).catch(function(error) {
    console.error('Unable to get messaging token.', error);
  });
}

/**
 *  Requests permission to show notifications.
 * @private */
function requestNotificationsPermissions_() {
  Notification.requestPermission().then(function() {
      // Notification permission granted.
    saveMessagingDeviceToken();
  }).catch(function(error) {
    console.error('Unable to get permission to notify.', error);
  });
}
