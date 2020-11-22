/**
 * @fileoverview Code for keeping track of user presence. See https://dev-partners.googlesource.com/samples/firebase/extensions-alpha/+/refs/heads/master/firestore-detect-presence.
 */

class Session {
  constructor(ref, metadata, onError) {
    this.ref = ref;
    this.onError = onError;
    this.setMetadataPromise = null;
    this.updateMetadata = function(newMetadata) {
      metadata = newMetadata;
      if (this.setMetadataPromise) {
        this.setMetadataPromise = this.setMetadataPromise.then(function() {
          const promise = ref.set(metadata);
          promise.catch(onError);
          return promise;
        });
      }
    };
    const that = this;
    ref.onDisconnect().remove().then(() => {
      // onDisconnect registered!
      that.setMetadataPromise = ref.set(metadata);
      that.setMetadataPromise.catch(onError);
    }, onError);
  }

  end() {
    if (this.setMetadataPromise) {
      const that = this;
      return this.setMetadataPromise.then(() => {
        return that.ref.remove().then(function() {
          that.setMetadataPromise = null;
          return that.end();
        }, that.onError);
      },
      () => {});
    } else {
      return this.ref
          .onDisconnect()
          .cancel()
          .catch(this.onError);
    }
  }
}

export class SessionManager {
  constructor(auth, ref) {
    this.ref = ref;
    this.metadata = true;
    this.databaseConnected = false;
    this.user = null;
    this.session = null;
    this.forceOffline = true;
    const that = this;
    ref.root.child('.info/connected').on('value', (snapshot) => {
      that.databaseConnected = snapshot.val();
      if (that.session && !that.databaseConnected) {
        that.session.end();
        that.session = null;
      }
      that.createSessionIfNeeded();
    });
    auth.onAuthStateChanged((newUser) => {
      if (this.session && (!newUser || newUser.uid !== this.user.uid)) {
        // Don't bother ending the session here since the client is no longer
        // authenticated to RTDB as the original user. Writes would be denied.
        this.session = null;
      }
      this.user = newUser;
      this.createSessionIfNeeded();
    });
  }

  setMetadata(newMetadata) {
    if (newMetadata != null) {
      this.metadata = newMetadata;
    } else {
      // RTDB does not allow null/undefined as a value, so:
      this.metadata = true;
    }
    if (this.session) {
      this.session.updateMetadata(this.metadata);
    }
  }

  goOnline() {
    this.forceOffline = false;
    this.createSessionIfNeeded();
    return Promise.resolve();
  }

  goOffline() {
    this.forceOffline = true;
    if (this.session) {
      const promise = this.session.end();
      this.session = null;
      return promise;
    } else {
      return Promise.resolve();
    }
  }

  createSessionIfNeeded() {
    if (!this.session &&
        !this.forceOffline &&
        this.databaseConnected &&
        this.user) {
      const sessionId = randomId();
      const sessionRef = this.ref
                .child(this.user.uid)
                .child('sessions')
                .child(sessionId);
      this.session =
          new Session(sessionRef, this.metadata, this.onSessionError);
    }
  }

  onSessionError(err) {
    console.error('Error updating presence', err);
    this.session.end();
    this.session = null;
    if (err.code !== 'PERMISSION_DENIED') {
      setTimeout(this.createSessionIfNeeded, 1000);
    }
  }
}

function randomId() {
  const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 20; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * The Realtime Database path at which presence data is stored.
 * This MUST be the same as the Realtime Database path, ${param:RTDB_PATH}.
 * */
const DB_PATH = '_firebase_extensions/presence';

let SESSION_MANAGER = null;

/**
 * @return {SessionManager} The SessionManager singleton.
 */
export function sessionManager() {
  if (!(SESSION_MANAGER instanceof SessionManager)) {
    SESSION_MANAGER = new SessionManager(
        window.firebase.auth(),
        window.firebase.database().ref(DB_PATH));
  }
  return SESSION_MANAGER;
}
