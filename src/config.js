/**
 * @fileoverview Configuration for the Odd Chatter app.
 */
goog.module('oddsalon.oddchatter.config');

var DEBUG_MODE = false;

/** @const */ const DEFAULT_CALLBACK_WINDOW_MS = 10000;
/** @const */ const DEFAULT_CALLBACK_THRESHOLD = 3;

/**
 * Holds the configuration for the Odd Chatter app.
 */
class Configuration {
  constructor() {
    this.enabled = false;
    this.fallback_url = '';
    this.callback_window_ms = DEFAULT_CALLBACK_WINDOW_MS;
    this.callback_threshold = DEFAULT_CALLBACK_THRESHOLD;
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
    this.enabled = data['enabled'] || DEBUG_MODE;
    this.fallback_url = data.hasOwnProperty('fallback_url') ?
                            data['fallback_url'] :
                            this.fallback_url;
    this.callback_window_ms = data.hasOwnProperty('config') ?
                                  data['callback_window_ms'] :
                                  this.callback_window_ms;
    this.callback_threshold = data.hasOwnProperty('callback_threshold') ?
                                  data['callback_threshold'] :
                                  this.callback_threshold;
    this.admin_users = data.hasOwnProperty('admin_users') ? data['admin_users'] :
                                                          this.admin_users;
    this.youtube_video = data.hasOwnProperty('youtube_video') ?
                             data['youtube_video'] :
                             this.youtube_video;
    this.youtube_chat = data.hasOwnProperty('youtube_chat') ?
                            data['youtube_chat'] :
                            this.youtube_chat;
  }

  /**
   * Loads the configuration from Firestore, and listens for changes.
   */
  loadFromFirestore() {
    const query = firebase.firestore()
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
  }
}

exports = {Configuration};

/** @const {Configuration} */ exports.CONFIG = new Configuration();
