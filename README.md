# Odd Chatter

A callback-enabled chat UI for use while watching Odd Salon.

   * https://www.oddsalon.com
   * https://www.youtube.com/oddsalon
   * https://odd-chatter.web.app

----

Odd Chatter is a Firebase project, https://firebase.google.com/docs. All data and configuration is stored in Cloud Firestore data, and the HTML/JS/CSS frontend is hosted on Firebase Hosting.

This web app consists of a chat window with pre-defined "callbacks", which the users type or click based on what they see in the talk. (These are callbacks in the style of live-performance Rocky Horror Picture Show, not as in [programming](https://en.wikipedia.org/wiki/Callback_(computer_programming)).) When enough users activate a callback within a predefined period of time, the app shows a short YouTube clip that contains an audio recording of that callback.

In addition, there is an "admin mode" that allows certain users to delete messages, and a pre-show mode that shows a banner and marketing links instead of the chat UI.

User authentication is through Google Accounts.

<!-- Logging? -->

## Compiling and deploying

### Prerequisites

You need to install Firebase locally both to compile and deploy the code: `npm install --save firebase`.

The client-side code is JS, using the [google-closure-library](https://github.com/google/closure-library) (install using `npm install --save google-closure-library`) and compiled using [google-closure-compiler](https://developers.google.com/closure/compiler) (install using `npm install --save google-closure-compiler`).

### Compiling

The correct magic incantation to google-closure-compiler is stored in  `compile.bat` (for Windows) and`compile.sh` (for Bash systems); the right script for your system can be run with `npm run build`. Additional parameters to these scripts are added to the parameters to `google-closure-compiler`, eg:

* `--define=config.DEBUG_MODE` simplifies local testing by, eg, bypassing the 'enabled' check in the configuration stored in Firestore:

  ```sh
  $ npm run build -- --define=config=DEBUG_MODE
  ```

### Running locally

Firebase supports running a web app on localhost, against a hosted database. Make sure you're running against the dev environment by using the following commands:

```sh
$ firebase use dev
$ firebase serve --only hosting:dev
```

Then your app will be available at http://localhost:5000.

### Deploying to dev environment

A dev version of this app lives at https://odd-chatter-dev.web.app/. You can deploy the compiled code to this site using the following commands:

```sh
$ firebase use dev
$ firebase deploy
```

or in one line:

```sh
$ firebase deploy -P dev
```

### Deploying to production

The production link that we send to Odd Salon attendees is https://odd-chatter.web.app. To release to production, follow these steps:

1. Copy the compiled HTML/JS/CSS from `public/` to `release/`:

   ```sh
   $ rm -rf release/*
   $ cp -r public/* release/*
   ```

2. Run a local instance of the prod code against the dev database, to verify that everything looks good:

   ```sh
   $ firebase serve -P dev --only hosting:release
   ```

3. If everything looks good, run a local instance of the prod code against the prod database, and make sure everything is OK:

   ```sh
   $ firebase serve -P release --only hosting:release
   ```

4. If this looks good too, deploy everything:

   ```sh
   $ firebase deploy -P release
   ```

5. Commit the new contents of the `release/` directory into version control, for posterity.

## How this works

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
   * `callback_threshold`, number: the minimum number (if `threshold_is_percentage` is `false`) or percentage (if `threshold_is_percentage` is `true`) of users who need to say the same callback within `callback_window_ms` milliseconds for the video to play.
   * `callback_window_ms`, number: the length of the window in milliseconds within which `callback_threshold` users need to say the same callback for the video to play.
   * `enabled`, boolean: when this is false, the app stays displaying the splash screen. This allows us to enable and disable the app before and after an Odd Salon.
   * `fallback_url`, string: a URL to fall back to in an emergency. If this is non-empty, the app shows an error screen with a link to this URL.
   * `youtube_chat`, string: the video ID of a YouTube live stream. If this is non-empty, the right half of the desktop UI will embed the YouTube chat widget for that stream. If `youtube_video` is also set, the chat will appear below the embedded video.
   * `youtube_video`, string: the video ID of a YouTube live stream. If this is non-empty, the right half of the desktop UI will embed the YouTube video of that stream. If `youtube_chat` is also set, the embedded video will appear above the chat.

### JS client architecture

The JS client is roughly MVC, where the Firebase Firestore DB is the model, `view.js` acts as the view by pushing data into the DOM , and `controller.js` acts as the controller by handling user interactions with the DOM. In addition, `config.js` is a layer to the Firestore `configuration` collection; `ui.js` stores the references to DOM elements that both the view and the controller need; and `callbacks.js` handles the logic controlling callbacks.

### Sending a message

When a user sends a message, it is written into the `messages` collection, in `oddsalon.oddchatter.controller.saveMessage_()`. (The callback buttons simply send a text message with predefined strings.) In addition, if the message consists of one of the predefined strings (meaning the user typed a callback manually), the document in that callback's collection with the user's UID as its document ID is updated with the current timestamp; this check is done in `oddsalon.oddchatter.controller.checkForCallbacks_()`.

### Displaying messages

The script installs a Firestore query listener in `oddsalon.oddchatter.view.loadMessages()` to add a message `div` to the messages list for every new document in the `messages` collection, or delete the `div` when a message disappears. Currently (for speed reasons) it only shows the most recent 12 messages, deleting older `div`s as new messages appear.

### Displaying callback videos

The script installs a Firestore query listener for each callback in `oddsalon.oddchatter.view.loadCallbacks()`, to display the callback's video if the most recent `oddsalon.oddchatter.config.Configuration.callbackThreshold()` documents in that callback's collection are all more recent than `oddsalon.oddchatter.config.Configuration.callback_window_ms` milliseconds ago, or the last time the callback video was played, whichever is more recent.

### Onboarding

Some browsers (iOS Safari *cough cough*) have auto-play policies that demand that a user interaction happen before you can play the sound. So before anything works, we need the user to click on a button to explicitly trigger the sound; then we can later play the sound at will. (See: https://rosswintle.uk/2019/01/skirting-the-ios-safari-audio-auto-play-policy-for-ui-sound-effects/) To ~~force~~ encourage our users to actually click the buttons, we show a splash screen explaining the callbacks and asking the users to agree to the Odd Salon Code of Conduct. The "agree" button plays all the callback sounds, muted and at double speed, before unmuting the audio elements again for later use in the chat.

### Configuration

The script installs a Firestore query listener in `oddsalon.oddchatter.config.Configuration.loadFromFirestore()` to listen to changes in the `configuration` collection, and update its local variables correspondingly. `oddsalon.oddchatter.view.applyNewConfiguration()` is called by `oddsalon.oddchatter.config.Configuration` whenever the configuration changes, to show or hide the appropriate UI elements.

### Analytics

In theory, this app uses Google Analytics to record user behavior, logging events to track which screens are seen and which elements are used. As of 8/27/2020 this does not appear to be working.
