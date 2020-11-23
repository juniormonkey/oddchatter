/**
 * @fileoverview The callbacks we listen for.
 */

import * as config from './config.js';
import * as ui from './ui.js';

export class Callback {
  /**
   * @param {string} text The text to listen for in chat.
   * @param {string} buttonText The text to display on the button.
   * @param {Array<string>} videoUrls
   *     A list of URLs of videos to play when the callback is triggered.
   * @param {function(): Element} formElement
   *     The HTML form that submits the callback chat message.
   * @param {function(): Element} buttonElement The HTML button that submits the
   *     form.
   * @param {number=} weight Optional, a multiplier to apply to the callback
   *     window size and threshold.
   */
  constructor(text,
              buttonText,
              videoUrls,
              formElement,
              buttonElement,
              weight = 1) {
    this.text = text;
    this.buttonText = buttonText;
    this.videoUrls = videoUrls;
    this.formElement = formElement;
    this.buttonElement = buttonElement;
    this.weight = weight;
    /** @type {number} */
    this.lastCalledTimestampMillis =
        Date.now() - config.CONFIG.callbackWindowMs(weight);
  }

  /**
   * Enables the button to allow this callback to be used in chat.
   */
  enableButton() {
    if (this.buttonElement()) {
      this.buttonElement().removeAttribute('disabled');
    }
  }

  getByline() {
    if (this.text === '👏' || this.text === '👎') {
      return this.text.repeat(randomNumberBetween_(3, 6));
    }

    return this.text +
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

/**
 * Callbacks that we listen for.
 *
 * @const
 */
export const CALLBACKS = [
  new Callback('SCIENCE', '🔬',
    [
      'science1.mp4',
      'science2.mp4',
      'science3.mp4',
      'science4.mp4',
      'science5.mp4',
      'science6.mp4',
      'science7.mp4',
    ],
               ui.scienceFormElement, ui.scienceButtonElement),
  new Callback('ART', '🎨', ['art1.mp4', 'art2.mp4', 'art3.mp4'],
               ui.artFormElement, ui.artButtonElement),
  new Callback('MAPS', '🗺️', ['maps1.mp4', 'maps2.mp4', 'maps3.mp4'],
               ui.mapsFormElement, ui.mapsButtonElement),
  new Callback('SHIPS', '🚢',
    [
      'ships1.mp4',
      'ships2.mp4',
      'ships3.mp4',
      'ships4.mp4',
      'ships5.mp4',
      'ships6.mp4',
    ],
               ui.shipsFormElement, ui.shipsButtonElement),
  new Callback('👏', '👏', ['applause1.mp4', 'applause2.mp4', 'applause3.mp4'],
               ui.applauseFormElement, ui.applauseButtonElement,
               /* weight = */ 2),
  new Callback('👎', '👎', ['boo1.mp4', 'boo2.mp4', 'boo3.mp4'],
               ui.booFormElement, ui.booButtonElement),
  new Callback('STEEN', '🎙️', ['steen1.mp4', 'steen2.mp4', 'steen3.mp4'],
               ui.steenFormElement, ui.steenButtonElement),
];
