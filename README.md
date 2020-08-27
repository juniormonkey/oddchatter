# Odd Chatter

A callback-enabled chat UI for use while watching Odd Salon.

   * https://www.oddsalon.com
   * https://www.youtube.com/oddsalon
   * https://odd-chatter.web.app

----

## How this works

Odd Chatter is a Firebase project, https://firebase.google.com/docs. All data and configuration is stored in Cloud Firestore data, and the HTML/JS/CSS frontend is hosted on Firebase Hosting. 

You'll need to install Firebase locally both to compile and deploy the code: `npm install --save firebase`.

The client-side code is JS, compiled using [google-closure-compiler](https://developers.google.com/closure/compiler). Install this using `npm install --save google-closure-compiler`. To build the compiled output, run `compile.sh` or `compile.bat`.

### Cloud Firestore data architecture

##### `messages`: a list of documents representing one message each.

   * id: automatically generated.
* `name`, string: the display name of the user.
* `profilePicUrl`, string: the profile photo to display.
* `text`, string: the text of the message.
* `timestamp`, firebase.firestore.Timestamp: the time the message was sent.
* `uid`, string: the UID of the user.

##### `SHIPS`, `MAPS`, etc (one per callback): a list of documents representing the last time a user said the callback.

   * id: corresponds to the UID of the user
   * `timestamp`, firebase.firestore.Timestamp: the last time the user said the callback.

##### `configuration`: a bunch of configuration values, allowing the app to readjust on the fly.

   * `timestamp`, firebase.firestore.Timestamp: the app always uses the most recent document.
* `admin_users`, array of string: UIDs of users who should see a 'delete' link next to each message (this should correspond to the uids in the ACLs in firestore.rules.)
* `callback_threshold`, number: the minimum number of users who need to say the same callback within `callback_window_ms` milliseconds for the video to play.
* `callback_window_ms`, number: the length of the window in milliseconds within which `callback_threshold` users need to say the same callback for the video to play.
* `enabled`, boolean: when this is false, the app stays displaying the splash screen. This allows us to enable and disable the app before and after an Odd Salon.
* `fallback_url`, string: a URL to fall back to in an emergency. If this is non-empty, the app shows an error screen with a link to this URL.
* `youtube_chat`, string: the video ID of a YouTube live stream. If this is non-empty, the right half of the desktop UI will embed the YouTube chat widget for that stream. If `youtube_video` is also set, the chat will appear below the embedded video.
* `youtube_video`, string: the video ID of a YouTube live stream. If this is non-empty, the right half of the desktop UI will embed the YouTube video of that stream. If `youtube_chat` is also set, the embedded video will appear above the chat.

### Sending a message

When a user sends a message, it gets written into the `messages` collection. (The callback buttons simply send a text message with predefined strings.) In addition, if the message consists of one of the predefined strings, the document in that callback's collection with the user's UID as its document ID is updated with the current timestamp.

### Displaying messages

The script installs a Firestore query listener in `loadMessages()` to add a message `div` to the messages list for every new document in the `messages` collection, or delete the `div` when a message disappears. Currently (for speed reasons) it only shows the most recent 12 messages, deleting older `div`s as new messages appear.

### Displaying callback videos

The script installs a Firestore query listener in `Callback.prototype.listenInChat()`, to display the callback's video if the most recent `CALLBACK_THRESHOLD` documents in that callback's collection are all more recent than `CALLBACK_WINDOW_MS` milliseconds ago, or the last time the callback video was played, whichever is more recent. 

### Onboarding

Some browsers (iOS Safari *cough cough*) have auto-play policies that demand that a user interaction happen before you can play the sound. So before anything works, we need the user to click on a button to explicitly trigger the sound; then we can later play the sound at will. (See: https://rosswintle.uk/2019/01/skirting-the-ios-safari-audio-auto-play-policy-for-ui-sound-effects/) To ~~force~~ encourage our users to actually click the buttons, you need to go through a onboarding tutorial (implemented in `onBoarding()` and `Callback.prototype.onboard()`) that shows you each button in turn and requires you to click it and thus trigger the video & sound.

### Configuration

The script installs a Firestore query listener in `loadConfiguration()` to listen to changes in the `configuration` collection, and update its local variables correspondingly. This method also immediately acts on changes to `enabled`, `fallback_url`, `youtube_video`, and `youtube_chat`, to show or hide the appropriate UI elements.

### Analytics

In theory, this app uses Google Analytics to record user behavior, logging events to track which screens are seen and which elements are used. As of 8/27/2020 this does not appear to be working.
