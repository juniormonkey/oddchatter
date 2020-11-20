/**
 * @fileoverview Configuration for the Odd Chatter app.
 */

/** @define {boolean} */
export const DEBUG_MODE = goog.define('config.DEBUG_MODE', false);

/** @define {boolean} */
export const ADMIN_MODE = goog.define('config.ADMIN_MODE', false);

/** @const */ const DEFAULT_CALLBACK_WINDOW_MS = 10000;
/** @const */ const DEFAULT_CALLBACK_THRESHOLD = 3;

/**
 * Holds the configuration for the Odd Chatter app.
 */
export class Configuration {
  constructor() {
    this.enabled_ = false;
    this.event_start = null;
    this.intro_seen = false;
    this.fallback_url = '';
    this.callback_window_ms = DEFAULT_CALLBACK_WINDOW_MS;
    this.callback_threshold_raw = DEFAULT_CALLBACK_THRESHOLD;
    this.threshold_is_percentage = false;
    this.active_users = 0;
    this.youtube_video = '';
    this.youtube_chat = '';
    this.admin_users = [];
    this.change_listeners = [];
  }

  /**
   * Adds a function to be called whenever the configuration changes.
   *
   * @param {function(Configuration)} listener
   */
  addConfigurationChangeListener(listener) {
    this.change_listeners.push(listener);
  }

  /**
   * Copy the configuration from a Firestore object.
   *
   * @param {Object} data
   * @private
   */
  copyFromFirestoreData_(data) {
    this.enabled_ =
        data.hasOwnProperty('enabled') ? data['enabled'] : this.enabled_;
    this.event_start = data.hasOwnProperty('event_start') ?
                           data['event_start'] :
                           this.event_start;
    this.fallback_url = data.hasOwnProperty('fallback_url') ?
                            data['fallback_url'] :
                            this.fallback_url;
    this.callback_window_ms = data.hasOwnProperty('config') ?
                                  data['callback_window_ms'] :
                                  this.callback_window_ms;
    this.callback_threshold_raw = data.hasOwnProperty('callback_threshold') ?
                                      data['callback_threshold'] :
                                      this.callback_threshold_raw;
    this.threshold_is_percentage =
        data.hasOwnProperty('threshold_is_percentage') ?
            data['threshold_is_percentage'] :
            this.threshold_is_percentage;
    this.admin_users = data.hasOwnProperty('admin_users') ?
                           data['admin_users'] :
                           this.admin_users;
    this.youtube_video = data.hasOwnProperty('youtube_video') ?
                             data['youtube_video'] :
                             this.youtube_video;
    this.youtube_chat = data.hasOwnProperty('youtube_chat') ?
                            data['youtube_chat'] :
                            this.youtube_chat;
  }

  /**
   * @return {boolean} Whether the app is enabled. This takes into account
   *     DEBUG_MODE and ADMIN_MODE.
   */
  enabled() {
    return this.enabled_ || DEBUG_MODE || ADMIN_MODE;
  }

  /**
   * @return {number} The minimum number of voices that need to send a
   * callback within callback_window_ms for the app to play the
   * callback's video.
   */
  callbackThreshold() {
    return this.threshold_is_percentage ?
      Math.floor(this.active_users * (this.callback_threshold_raw / 100)) :
      this.callback_threshold_raw;
  }

  /**
   * Loads the configuration from Firestore, and listens for changes.
   */
  loadFromFirestore() {
    const query = window.firebase.firestore()
                      .collection('configuration')
                      .orderBy('timestamp', 'desc')
                      .limit(1);

    const config = this;
    query.onSnapshot(
        (snapshot) => {
          if (snapshot.size > 0) {
            config.copyFromFirestoreData_(snapshot.docs[0].data());

            for (const listener of this.change_listeners) {
              listener(config);
            }
          }
        },
        (error) => {
          console.error('Error querying Firestore: ', error);
        });

    const presence = window.firebase.firestore()
                         .collection('_user_presence')
                         .where('sessions', '>', {});
    presence.onSnapshot(
        (snapshot) => {
          if (snapshot.size > 0) {
            config.active_users = snapshot.docs.length;

            for (const listener of this.change_listeners) {
              listener(config);
            }
          }
        },
        (error) => {
          console.error('Error querying Firestore: ', error);
        });
  }

  /**
   * Saves the configuration to Firestore, with a new timestamp.
   * @return {Promise} A promise that is resolved when the message is saved.
   */
  saveToFirestore() {
    // Add a new configuration entry to the database.
    return window.firebase.firestore()
        .collection('configuration')
        .add({
          'enabled': this.enabled_,
          'event_start': this.event_start,
          'fallback_url': this.fallback_url,
          'callback_window_ms': this.callback_window_ms,
          'callback_threshold': this.callback_threshold_raw,
          'threshold_is_percentage': this.threshold_is_percentage,
          'admin_users': this.admin_users,
          'youtube_video': this.youtube_video,
          'youtube_chat': this.youtube_chat,
          'timestamp': window.firebase.firestore.FieldValue.serverTimestamp(),
        })
        .catch((error) => {
          console.error('Error writing new message to database', error);
        });
  }
}

/** @const {Configuration} */ export const CONFIG = new Configuration();

/**
 * Do not set this field, except from tests.
 */
let adminModeOverride = false;

/**
 * Do not call this, except from tests.
 * @param {boolean} mode
 */
export function overrideAdminMode(mode) {
  adminModeOverride = mode;
}

/**
 * @return whether we're in admin mode.
 */
export function isAdminMode() {
  return ADMIN_MODE || adminModeOverride;
}
