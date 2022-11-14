/* eslint-disable closure/no-undef */

import {
  CONFIG,
  overrideAdminMode,
} from '../src/config.mjs';
import * as ui from '../src/ui.mjs';
import {applyNewAuthState, applyNewConfiguration} from '../src/view.mjs';

import firebasemock from 'firebase-mock';
import chai from 'chai';
import chai_dom from 'chai-dom';
chai.use(chai_dom);
chai.should();

describe('view', function() {
  beforeEach(async function() {
    overrideAdminMode(false);

    document.body.innerHTML =
        '<div id="promo"></div>' +
        '<div id="error-container" hidden><a id="error-link">ABORT</a></div>' +
        '<div id="outer-container" hidden>' +
        '  <div id="user-container">' +
        '    <div id="user-pic" hidden></div>' +
        '    <div id="user-name" hidden></div>' +
        '    <button id="sign-in"></button>' +
        '    <button id="kebab-menu"></button>' +
        '    <button id="sign-out"></button>' +
        '    <input type="checkbox" id="notifications-switch"></input>' +
        '  </div>' +
        '  <div id="signin-splashscreen"></div>' +
        '  <div id="intro-container" hidden>' +
        '    <button id="intro-button"></button>' +
        '  </div>' +
        '  <div id="messages-card-container" hidden></div>' +
        '  <div id="youtube-stream-container" hidden>' +
        '    <div hidden>' +
        '      <span id="user-count">0</span> users currently chatting' +
        '    </div>' +
        '  </div>' +
        '</div>' +
        '<div id="hidden-audio"></div>';

    const mockauth = new firebasemock.MockAuthentication();
    const mockfirestore = new firebasemock.MockFirestore();
    const mockmessaging = new firebasemock.MockMessaging();
    window.firebase = new firebasemock.MockFirebaseSdk(
        // use null if your code does not use RTDB
        null,
        () => mockauth,
        () => mockfirestore,
        // use null if your code does not use STORAGE
        null,
        () => mockmessaging);

    mockmessaging.getToken = () => Promise.resolve('messagingtoken');

    mockauth.onAuthStateChanged(applyNewAuthState);

    mockauth.createUser({email: 'test@test.com', password: 't3st'});
    mockauth.createUser({email: 'admin@admin.com', password: 'adm1n'});
    mockauth.flush();

    CONFIG.copyFromFirestoreData_({
      enabled: false,
      event_start: null,
      fallback_url: '',
      callback_window_ms: 10000,
      callback_threshold: 3,
      admin_users: [],
      youtube_video: '',
      youtube_chat: '',
    });
  });

  afterEach(function() {
    window.firebase.auth().changeAuthState(null);
    window.firebase.auth().flush();
    document.body.innerHTML = '';
  });

  it('shows only the splash screen when disabled', function() {
    // By default, the app is disabled.
    ui.promoElement().should.not.have.attr('hidden');
    ui.outerContainerElement().should.have.attr('hidden');
    ui.errorContainerElement().should.have.attr('hidden');

    // Set enabled to true;
    CONFIG.copyFromFirestoreData_({enabled: true});
    applyNewConfiguration(CONFIG);

    ui.promoElement().should.have.attr('hidden');
    ui.outerContainerElement().should.not.have.attr('hidden');
    ui.errorContainerElement().should.have.attr('hidden');

    // Setting enabled to false -> hides app, shows splash screen.
    CONFIG.copyFromFirestoreData_({enabled: false});
    applyNewConfiguration(CONFIG);

    ui.promoElement().should.not.have.attr('hidden');
    ui.outerContainerElement().should.have.attr('hidden');
    ui.errorContainerElement().should.have.attr('hidden');

    // No change to configuration -> no change to visibility.
    applyNewConfiguration(CONFIG);
    ui.promoElement().should.not.have.attr('hidden');
    ui.outerContainerElement().should.have.attr('hidden');
    ui.errorContainerElement().should.have.attr('hidden');
  });

  it('hides the splash screen when enabled', function() {
    // By default, the app is disabled.
    ui.promoElement().should.not.have.attr('hidden');
    ui.outerContainerElement().should.have.attr('hidden');
    ui.errorContainerElement().should.have.attr('hidden');

    // Set enabled to true -> shows app, hides splash screen.
    CONFIG.copyFromFirestoreData_({enabled: true});
    applyNewConfiguration(CONFIG);

    ui.promoElement().should.have.attr('hidden');
    ui.outerContainerElement().should.not.have.attr('hidden');
    ui.errorContainerElement().should.have.attr('hidden');

    // No change to configuration -> no change to visibility.
    CONFIG.copyFromFirestoreData_({enabled: true});
    applyNewConfiguration(CONFIG);

    ui.promoElement().should.have.attr('hidden');
    ui.outerContainerElement().should.not.have.attr('hidden');
    ui.errorContainerElement().should.have.attr('hidden');
  });

  it('shows the error splash screen when an error URL is set', function() {
    // By default, the app is disabled.
    ui.promoElement().should.not.have.attr('hidden');
    ui.outerContainerElement().should.have.attr('hidden');
    ui.errorContainerElement().should.have.attr('hidden');

    // When disabled, show the splash screen rather than the error page.
    CONFIG.copyFromFirestoreData_({fallback_url: 'https://oddsalon.com'});
    applyNewConfiguration(CONFIG);

    ui.promoElement().should.not.have.attr('hidden');
    ui.outerContainerElement().should.have.attr('hidden');
    ui.errorContainerElement().should.have.attr('hidden');

    // Enabling the app shows the error page if the URL is set.
    CONFIG.copyFromFirestoreData_(
        {enabled: true, fallback_url: 'https://oddsalon.com'});
    applyNewConfiguration(CONFIG);

    ui.promoElement().should.have.attr('hidden');
    ui.outerContainerElement().should.have.attr('hidden');
    ui.errorContainerElement().should.not.have.attr('hidden');
    ui.errorLinkElement().getAttribute('href').should.equal(
        'https://oddsalon.com');

    // If the error URL is cleared, show the app if it's enabled.
    CONFIG.copyFromFirestoreData_({enabled: true, fallback_url: ''});
    applyNewConfiguration(CONFIG);

    ui.promoElement().should.have.attr('hidden');
    ui.outerContainerElement().should.not.have.attr('hidden');
    ui.errorContainerElement().should.have.attr('hidden');

    // If the URL is set again, show the error page again.
    CONFIG.copyFromFirestoreData_(
        {enabled: true, fallback_url: 'https://oddsalon.com'});
    applyNewConfiguration(CONFIG);

    ui.promoElement().should.have.attr('hidden');
    ui.outerContainerElement().should.have.attr('hidden');
    ui.errorContainerElement().should.not.have.attr('hidden');
    ui.errorLinkElement().getAttribute('href').should.equal(
        'https://oddsalon.com');
  });

  it('shows the login screen in admin mode when not logged in',
     async function() {
       overrideAdminMode(true);

       const admin =
           await window.firebase.auth().getUserByEmail('admin@admin.com');
       CONFIG.copyFromFirestoreData_({admin_users: [admin.uid]});
       applyNewConfiguration(CONFIG);

       ui.promoElement().should.have.attr('hidden');
       ui.outerContainerElement().should.not.have.attr('hidden');
       ui.splashScreenElement().should.not.have.attr('hidden');
     });

  it('shows only the admin splash screen to non-admins', async function() {
    overrideAdminMode(true);

    const admin =
        await window.firebase.auth().getUserByEmail('admin@admin.com');
    CONFIG.copyFromFirestoreData_({admin_users: [admin.uid]});
    applyNewConfiguration(CONFIG);

    const user = await window.firebase.auth().getUserByEmail('test@test.com');
    window.firebase.auth().changeAuthState({
      uid: user.uid,
      provider: 'custom',
      token: 'authToken',
      expires: Math.floor(new Date() / 1000) + 24 * 60 * 60,
    });
    window.firebase.auth().flush();

    ui.promoElement().should.not.have.attr('hidden');
    ui.outerContainerElement().should.have.attr('hidden');
  });

  it('hides the admin splash screen when an admin signs in', async function() {
    overrideAdminMode(true);

    const admin =
        await window.firebase.auth().getUserByEmail('admin@admin.com');
    CONFIG.copyFromFirestoreData_({admin_users: [admin.uid]});
    applyNewConfiguration(CONFIG);

    window.firebase.auth().changeAuthState({
      uid: admin.uid,
      provider: 'custom',
      token: 'authToken',
      expires: Math.floor(new Date() / 1000) + 24 * 60 * 60,
    });
    window.firebase.auth().flush();

    ui.promoElement().should.have.attr('hidden');
    ui.outerContainerElement().should.not.have.attr('hidden');
  });

  it('hides the admin splash screen when the user becomes admin',
     async function() {
       overrideAdminMode(true);

       const admin =
           await window.firebase.auth().getUserByEmail('admin@admin.com');
       CONFIG.copyFromFirestoreData_({admin_users: [admin.uid]});
       applyNewConfiguration(CONFIG);

       const user =
           await window.firebase.auth().getUserByEmail('test@test.com');
       window.firebase.auth().changeAuthState({
         uid: user.uid,
         provider: 'custom',
         token: 'authToken',
         expires: Math.floor(new Date() / 1000) + 24 * 60 * 60,
       });
       window.firebase.auth().flush();

       ui.promoElement().should.not.have.attr('hidden');
       ui.outerContainerElement().should.have.attr('hidden');

       CONFIG.copyFromFirestoreData_({admin_users: [admin.uid, user.uid]});
       applyNewConfiguration(CONFIG);

       ui.promoElement().should.have.attr('hidden');
       ui.outerContainerElement().should.not.have.attr('hidden');
     });

  it('shows the user count when the app is enabled', function() {
    // User count container starts hidden.
    ui.userCountElement().parentElement.should.have.attr('hidden');

    // Set enabled to true -> fills displayed user count value, shows container
    CONFIG.copyFromFirestoreData_({enabled: true});
    CONFIG.active_users = 35;
    applyNewConfiguration(CONFIG);

    ui.userCountElement().parentElement.should.not.have.attr('hidden');
    ui.userCountElement().textContent.should.equal('35');

    // User count update -> updates displayed value.
    CONFIG.copyFromFirestoreData_({enabled: true});
    CONFIG.active_users = 36;
    applyNewConfiguration(CONFIG);

    ui.userCountElement().parentElement.should.not.have.attr('hidden');
    ui.userCountElement().textContent.should.equal('36');
  });
});
