/**
 * @fileoverview Handle notification permissions and notifications, using FCM.
 */

/** Saves the messaging device token to the datastore. */
export async function saveMessagingDeviceToken() {
  try {
    const currentToken = await window.firebase.messaging().getToken();
    if (currentToken) {
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
  } catch (error) {
    console.error('Unable to get messaging token.', error);
  }
}

/**
 * Clears the current messaging device token from the datastore.
 */
export async function clearMessagingDeviceToken() {
  try {
    const currentToken = await window.firebase.messaging().getToken();
    if (currentToken) {
      window.firebase
          .firestore()
          .collection('fcmTokens')
          .doc(currentToken)
          .delete()
          .catch((error) => {
            console.error('Error removing token: ', error);
          });
    }
  } catch (error) {
    console.error('Unable to get messaging token.', error);
  }
}

// TODO: clearMessagingDeviceToken() to delete the current token.

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
