/** Firebase Cloud Functions. */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/** Sends a notifications to all users when a new message is posted. */
exports.sendNotifications = functions.firestore.document('messages/{messageId}').onCreate(
    async(snapshot) => {
      // Notification details.
      const text = snapshot.data().text;
      const payload = {
        notification: {
          title: `${snapshot.data().name} posted in Odd Chatter`,
          body: text.length <= 100 ? text : `${text.substring(0, 97) }...`,
          icon: snapshot.data().profilePicUrl || '/images/profile_placeholder.png',
          click_action: `https://${process.env.GCLOUD_PROJECT}.web.app`,
        },
      };

      // Get the list of device tokens.
      const allTokens = await admin.firestore().collection('fcmTokens').get();
      const tokens = [];
      allTokens.forEach((tokenDoc) => {
        tokens.push(tokenDoc.id);
      });

      if (tokens.length > 0) {
        // Send notifications to all tokens.
        const response = await admin.messaging().sendToDevice(tokens, payload);
        await cleanupTokens(response, tokens);
      }
    });

/** Cleans up the tokens that are no longer valid. */
function cleanupTokens(response, tokens) {
  // For each notification we check if there was an error.
  const tokensDelete = [];
  response.results.forEach((result, index) => {
    const error = result.error;
    if (error) {
      console.error('Failure sending notification to', tokens[index], error);
      // Cleanup the tokens who are not registered anymore.
      if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
        const deleteTask = admin.firestore().collection('fcmTokens').doc(tokens[index]).delete();
        tokensDelete.push(deleteTask);
      }
    }
  });
  return Promise.all(tokensDelete);
}
   