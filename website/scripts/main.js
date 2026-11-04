/**
 * ==========================================================================
 * JERMChart Showcase Website - Client Main Script
 * Features:
 *   - Navigation ScrollSpy and smooth scroll handling
 *   - Modal dialog open/close lifecycle and accessibility
 *   - One-click terminal snippet copy with visual feedback
 * Zero external dependencies, pure vanilla JS, zero telemetry.
 * ==========================================================================
 */

(function () {
  'use strict';

  let modalsInitialized = false;
  let copyInitialized = false;

  /* ==========================================================================
     1. Modal Dialog Logic (initModals, openModal, closeModal)
     ========================================================================== */

  /**
   * Resolves a modal element from an ID or element reference.
   * @param {string|HTMLElement} target
   * @returns {HTMLElement|null}
   */
  function resolveModalElement(target) {
    if (!target) return null;
    if (typeof target === 'string') {
      return document.getElementById(target);
    }
    if (target instanceof HTMLElement) {
      return target.closest('.modal-dialog');
    }
    return null;
  }

  /**
   * Opens a modal dialog by ID or element, locking background scroll.
   * @param {string|HTMLElement} target
   */
  function openModal(target) {
    if (typeof document === 'undefined') return;
    const modal = resolveModalElement(target);
    if (!modal) return;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const closeButton = modal.querySelector('.modal-close');
    if (closeButton && typeof closeButton.focus === 'function') {
      closeButton.focus();
    }
  }

  /**
   * Closes a modal dialog by ID or element, restoring background scroll.
   * @param {string|HTMLElement} target
   */
  function closeModal(target) {
    if (typeof document === 'undefined') return;
    const modal = resolveModalElement(target);
    if (!modal) return;

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');

    const anyOpen = document.querySelector('.modal-dialog.open');
    if (!anyOpen) {
      document.body.style.overflow = '';
    }
  }

  /**
   * Closes all currently open modal dialogs.
   */
  function closeAllModals() {
    if (typeof document === 'undefined') return;
    const openModals = document.querySelectorAll('.modal-dialog.open');
    openModals.forEach((modal) => closeModal(modal));
  }

  /**
   * Resolves target modal ID from a trigger button/link.
   * @param {HTMLElement} trigger
   * @returns {string}
   */
  function getModalTargetId(trigger) {
    if (!trigger) return '';
    if (trigger.dataset.modalTarget) {
      return trigger.dataset.modalTarget;
    }
    if (trigger.dataset.openModal) {
      return trigger.dataset.openModal;
    }
    const href = trigger.getAttribute('href') || '';
    if (href.startsWith('#')) {
      return href.slice(1);
    }
    return '';
  }

  /**
   * Sets up delegated click handling for modal open/close actions.
   */
  function setupModalDelegation() {
    document.addEventListener('click', (event) => {
      // 1. Open trigger
      const trigger = event.target.closest('[data-modal-target], [data-open-modal], a[href="#privacy-modal"], a[href="#terms-modal"]');
      if (trigger) {
        const modalId = getModalTargetId(trigger);
        if (modalId) {
          event.preventDefault();
          openModal(modalId);
        }
        return;
      }

      // 2. Close button
      const closeBtn = event.target.closest('.modal-close, [data-close-modal]');
      if (closeBtn) {
        event.preventDefault();
        const modal = closeBtn.closest('.modal-dialog');
        if (modal) {
          closeModal(modal);
        }
        return;
      }

      // 3. Backdrop click
      const isBackdrop = event.target.classList.contains('modal-backdrop');
      const isDialogWrapper = event.target.classList.contains('modal-dialog');
      if (isBackdrop || isDialogWrapper) {
        const modal = event.target.closest('.modal-dialog');
        if (modal) {
          closeModal(modal);
        }
      }
    });

    // 4. Escape key dismiss
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeAllModals();
      }
    });
  }

  /**
   * Initializes modal dialog interactions across the page.
   */
  function initModals() {
    if (typeof document === 'undefined') return;
    if (modalsInitialized) return;
    modalsInitialized = true;

    setupModalDelegation();
  }

  /* ==========================================================================
     2. Terminal & Developer Snippet Copy (initCopySnippet)
     ========================================================================== */

  /**
   * Cleans terminal prompt markers from command text.
   * @param {string} text
   * @returns {string}
   */
  function cleanCommandText(text) {
    if (!text) return '';
    const trimmed = text.trim();
    if (trimmed.startsWith('$ ')) {
      return trimmed.slice(2).trim();
    }
    if (trimmed.startsWith('PS ')) {
      return trimmed.slice(3).trim();
    }
    return trimmed;
  }

  /**
   * Finds the text to copy associated with a copy button.
   * @param {HTMLElement} button
   * @returns {string}
   */
  function resolveTextToCopy(button) {
    if (!button) return '';
    if (button.dataset.clipboardText) {
      return button.dataset.clipboardText;
    }
    if (button.dataset.copyText) {
      return button.dataset.copyText;
    }

    const card = button.closest('.terminal-card') || button.parentElement;
    if (!card) return '';

    const commandEl = card.querySelector('.terminal-command, code, pre');
    if (commandEl) {
      return cleanCommandText(commandEl.textContent || '');
    }
    return '';
  }

  /**
   * Copies a string to the clipboard with modern API and legacy fallback.
   * @param {string} text
   * @returns {Promise<boolean>}
   */
  async function copyToClipboard(text) {
    if (!text) return false;

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fallback if clipboard API throws
      }
    }

    // Fallback for older browsers or restricted environments
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  }

  /**
   * Triggers visual "Copied!" feedback on button and feedback indicator.
   * @param {HTMLElement} button
   */
  function triggerCopyFeedback(button) {
    if (!button) return;

    const card = button.closest('.terminal-card') || button.parentElement;
    const feedback = card ? card.querySelector('.copied-feedback') : null;

    button.classList.add('copied');
    if (feedback) {
      feedback.style.display = 'inline-block';
    }

    const originalText = button.textContent;
    if (!feedback && originalText !== 'Copied!') {
      button.textContent = 'Copied!';
    }

    setTimeout(() => {
      button.classList.remove('copied');
      if (feedback) {
        feedback.style.display = 'none';
      }
      if (!feedback && originalText !== 'Copied!') {
        button.textContent = originalText;
      }
    }, 2000);
  }

  /**
   * Sets up terminal tab switching if interactive tabs exist.
   */
  function setupTerminalTabs() {
    const tabs = document.querySelectorAll('.terminal-tab');
    tabs.forEach((tab) => {
      if (tab.dataset.tabInitialized === 'true') return;
      tab.dataset.tabInitialized = 'true';

      tab.addEventListener('click', () => {
        const container = tab.closest('.terminal-card') || tab.parentElement;
        const siblingTabs = container ? container.querySelectorAll('.terminal-tab') : tabs;
        siblingTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        const targetCommand = tab.dataset.command;
        if (targetCommand && container) {
          const commandEl = container.querySelector('.terminal-command');
          if (commandEl) {
            commandEl.textContent = targetCommand;
          }
        }
      });
    });
  }

  /**
   * Initializes terminal snippet copy buttons and developer tabs.
   */
  function initCopySnippet() {
    if (typeof document === 'undefined') return;

    setupTerminalTabs();

    if (copyInitialized) return;
    copyInitialized = true;

    document.addEventListener('click', async (event) => {
      const button = event.target.closest('.copy-btn, [data-copy-snippet]');
      if (!button) return;

      event.preventDefault();
      const text = resolveTextToCopy(button);
      if (!text) return;

      const ok = await copyToClipboard(text);
      if (ok) {
        triggerCopyFeedback(button);
      }
    });
  }

  /* ==========================================================================
     3. Navigation ScrollSpy & Smooth Scroll (initNavigation)
     ========================================================================== */

  /**
   * Updates active navigation link matching the given section ID.
   * @param {string} activeId
   */
  function updateActiveNavLink(activeId) {
    if (!activeId) return;
    const links = document.querySelectorAll('.nav-link');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === '#' + activeId) {
        link.classList.add('active');
      } else if (href && href.startsWith('#')) {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Sets up IntersectionObserver for navigation scroll spy.
   */
  function setupScrollSpy() {
    if (typeof IntersectionObserver === 'undefined') return;

    const sections = document.querySelectorAll('section[id]');
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            updateActiveNavLink(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -65% 0px',
        threshold: 0.1,
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  /**
   * Handles smooth scrolling on navigation anchor links.
   * @param {MouseEvent} event
   * @param {HTMLAnchorElement} link
   */
  function handleNavAnchorClick(event, link) {
    const href = link.getAttribute('href') || '';
    if (!href.startsWith('#') || href.length <= 1) return;

    // Don't intercept modal triggers
    if (href === '#privacy-modal' || href === '#terms-modal') return;

    const targetId = href.slice(1);
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    event.preventDefault();
    targetElement.scrollIntoView({ behavior: 'smooth' });
    updateActiveNavLink(targetId);

    if (typeof history !== 'undefined' && history.pushState) {
      history.pushState(null, '', href);
    }
  }

  /**
   * Initializes navigation link event handlers and scroll spy.
   */
  function initNavigation() {
    if (typeof document === 'undefined') return;

    const navLinks = document.querySelectorAll('.nav-link[href^="#"], a.smooth-scroll[href^="#"]');
    navLinks.forEach((link) => {
      if (link.dataset.navInitialized === 'true') return;
      link.dataset.navInitialized = 'true';

      link.addEventListener('click', (event) => {
        handleNavAnchorClick(event, link);
      });
    });

    setupScrollSpy();
  }

  /* ==========================================================================
     4. Automatic Initialization & Exports
     ========================================================================== */

  /**
   * Initializes all client scripts on page load.
   */
  function initAll() {
    initNavigation();
    initModals();
    initCopySnippet();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAll);
    } else {
      initAll();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      initNavigation,
      initModals,
      initCopySnippet,
      openModal,
      closeModal,
      closeAllModals,
      updateActiveNavLink,
    };
  }

  if (typeof window !== 'undefined') {
    window.JERMWebsite = Object.assign(window.JERMWebsite || {}, {
      initNavigation,
      initModals,
      initCopySnippet,
      openModal,
      closeModal,
      closeAllModals,
      updateActiveNavLink,
    });
  }
})();
