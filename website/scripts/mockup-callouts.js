/**
 * ==========================================================================
 * JERMChart Showcase Website - Mockup Callouts Interactive Script
 * Zero external CDN dependencies, fully offline-first and keyboard accessible.
 * ==========================================================================
 */

(function () {
  'use strict';

  let calloutsGlobalBound = false;

  /**
   * Deactivates a single callout pin and updates accessibility state.
   * @param {HTMLElement} pin
   */
  function deactivatePin(pin) {
    if (!pin) return;
    pin.classList.remove('active');
    pin.setAttribute('aria-expanded', 'false');
  }

  /**
   * Deactivates all active callout pins on the page.
   */
  function deactivateAllPins() {
    const activePins = document.querySelectorAll('.callout-pin.active');
    activePins.forEach((pin) => deactivatePin(pin));
  }

  /**
   * Activates a single callout pin, closing any other active pins.
   * @param {HTMLElement} pin
   */
  function activatePin(pin) {
    if (!pin) return;
    deactivateAllPins();
    pin.classList.add('active');
    pin.setAttribute('aria-expanded', 'true');
  }

  /**
   * Toggles a callout pin between active and inactive states.
   * @param {HTMLElement} pin
   */
  function togglePin(pin) {
    if (!pin) return;
    if (pin.classList.contains('active')) {
      deactivatePin(pin);
    } else {
      activatePin(pin);
    }
  }

  /**
   * Handles keyboard events on callout pin elements.
   * Supports Enter/Space to toggle, Escape to dismiss.
   * @param {KeyboardEvent} event
   * @param {HTMLElement} pin
   */
  function handlePinKeydown(event, pin) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      togglePin(pin);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      deactivatePin(pin);
    }
  }

  /**
   * Sets up accessibility attributes on a pin element.
   * @param {HTMLElement} pin
   * @param {number} index
   */
  function setupPinAccessibility(pin, index) {
    if (!pin.getAttribute('role')) {
      pin.setAttribute('role', 'button');
    }
    if (!pin.getAttribute('tabindex')) {
      pin.setAttribute('tabindex', '0');
    }
    pin.setAttribute('aria-expanded', 'false');
    pin.setAttribute('aria-haspopup', 'true');

    const tooltip = pin.querySelector('.pin-tooltip');
    if (tooltip) {
      if (!tooltip.id) {
        tooltip.id = 'callout-tooltip-' + (pin.dataset.pin || index);
      }
      pin.setAttribute('aria-describedby', tooltip.id);
    }
  }

  /**
   * Initializes all callout pins within the showcase diagram mockup.
   */
  function initMockupCallouts() {
    if (typeof document === 'undefined') return;

    const pins = document.querySelectorAll('.callout-pin');
    pins.forEach((pin, index) => {
      setupPinAccessibility(pin, index);

      // Prevent duplicate listener attachments
      if (pin.dataset.calloutInitialized === 'true') return;
      pin.dataset.calloutInitialized = 'true';

      pin.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        togglePin(pin);
      });

      pin.addEventListener('keydown', (event) => {
        handlePinKeydown(event, pin);
      });
    });

    // Global document listeners for click-outside and Escape dismiss
    if (!calloutsGlobalBound) {
      calloutsGlobalBound = true;

      document.addEventListener('click', (event) => {
        const targetPin = event.target.closest('.callout-pin');
        if (!targetPin) {
          deactivateAllPins();
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          deactivateAllPins();
        }
      });
    }
  }

  // Auto-initialize when loaded in browser environments
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMockupCallouts);
    } else {
      initMockupCallouts();
    }
  }

  // Universal module export (Window global + CommonJS for testing)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      initMockupCallouts,
      activatePin,
      deactivatePin,
      togglePin,
      deactivateAllPins,
    };
  }

  if (typeof window !== 'undefined') {
    window.JERMWebsite = Object.assign(window.JERMWebsite || {}, {
      initMockupCallouts,
      activatePin,
      deactivatePin,
      togglePin,
      deactivateAllPins,
    });
  }
})();
