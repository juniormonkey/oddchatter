/**
 * @fileoverview The callbacks we listen for.
 */
goog.module('oddsalon.oddchatter.callbacks');

const config = goog.require('oddsalon.oddchatter.config');
const ui = goog.require('oddsalon.oddchatter.ui');

class Callback {
  constructor(text, onboardingMessage, buttonText, videoUrls, formElement,
              buttonElement, audioElement) {
    this.text = text;
    this.onboardingMessage = onboardingMessage;
    this.buttonText = buttonText;
    this.videoUrls = videoUrls;
    this.formElement = formElement;
    this.buttonElement = buttonElement;
    this.audioElement = audioElement;
    this.lastCalledTimestampMillis =
        Date.now() - config.CONFIG.callback_window_ms;
  }

  /**
   * Enables the button to allow this callback to be used in chat.
   */
  enableButton() {
    this.buttonElement.removeAttribute('disabled');
  }

  getByline() {
    if (this.text === '👏' || this.text === '👎') {
      return this.text.repeat(randomNumberBetween_(3, 6));
    }

    return '!'.repeat(randomNumberBetween_(2, 4)) + this.text +
           '!'.repeat(randomNumberBetween_(1, 3)) +
           '1'.repeat(randomNumberBetween_(0, 2)) +
           '!'.repeat(randomNumberBetween_(1, 2));
  }

  getMessage() {
    if (this.text === '👏' || this.text === '👎') {
      return this.text;
    }

    return `${this.text}!!`;
  }

  getCollection() {
    if (this.text === '👏') {
      return 'APPLAUSE';
    }

    if (this.text === '👎') {
      return 'BOO';
    }

    return this.text;
  }
}

/**
 * @param {number} from
 * @param {number} to
 * @return {number} A random number in the inclusive range [from, to].
 * @private
 */
function randomNumberBetween_(from, to) {
  return from + Math.floor(Math.random() * (to - from + 1));
}

exports = {Callback};

/**
 * Callbacks that we listen for.
 *
 * @const
 */
exports.CALLBACKS = [
  new Callback('SCIENCE',
               'When you hear or see some SCIENCE, ' +
                   'click this button to make some noise:',
               '🔬',
    [
      'science1.mp4',
      'science2.mp4',
      'science3.mp4',
      'science4.mp4',
      'science5.mp4',
      'science6.mp4',
      'science7.mp4',
    ],
               ui.scienceFormElement, ui.scienceButtonElement,
               ui.scienceAudioElement),
  new Callback('ART', 'When there\'s some ART, click this button:', '🎨',
               ['art1.mp4', 'art2.mp4', 'art3.mp4'], ui.artFormElement,
               ui.artButtonElement, ui.artAudioElement),
  new Callback('MAPS', 'Whenever you spot a MAP, this is your button:',
               '🗺️', ['maps1.mp4', 'maps2.mp4', 'maps3.mp4'],
               ui.mapsFormElement, ui.mapsButtonElement, ui.mapsAudioElement),
  new Callback(
      'SHIPS',
      'And how could we forget seafaring vessels - click here for SHIPS:', '🚢',
    [
      'ships1.mp4',
      'ships2.mp4',
      'ships3.mp4',
      'ships4.mp4',
      'ships5.mp4',
      'ships6.mp4',
    ],
      ui.shipsFormElement, ui.shipsButtonElement, ui.shipsAudioElement),
  new Callback('👏',
               'Our speakers live for the applause - ' +
                   'click here to make affirming noises:',
               '👏', ['applause1.mp4', 'applause2.mp4', 'applause3.mp4'],
               ui.applauseFormElement, ui.applauseButtonElement,
               ui.applauseAudioElement),
  new Callback('👎',
               'Finally - sosome things deserve to be booed. ' +
                   'Click here to express disapproval:',
               '👎', ['boo1.mp4', 'boo2.mp4', 'boo3.mp4'], ui.booFormElement,
               ui.booButtonElement, ui.booAudioElement),
];
