/**
 * EMERGENCY SPILL RESPONSE BANNER
 * Nwestco - Homepage Only
 *
 * Vanilla JavaScript - No jQuery dependency
 * Handles dismissal with localStorage persistence (24 hours)
 *
 * WordPress Integration:
 * - Enqueue via wp_enqueue_script() in functions.php
 * - Or include in theme's footer before </body>
 * - Script is self-executing on DOM ready
 */

(function() {
  'use strict';

  /**
   * Configuration
   */
  var CONFIG = {
    bannerId: 'nw-emergency-banner',
    storageKey: 'nw_emergency_banner_dismissed',
    dismissDuration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    hiddenClass: 'nw-emergency-banner--hidden'
  };

  /**
   * Emergency Banner Controller
   */
  var NwEmergencyBanner = {

    /**
     * Initialize the banner
     */
    init: function() {
      var banner = document.getElementById(CONFIG.bannerId);

      if (!banner) {
        return; // Banner not present on this page
      }

      // Check if banner should be hidden (previously dismissed)
      if (this.isDismissed()) {
        this.hide();
      } else {
        this.show();
        this.adjustHeaderPosition();
      }

      // Set up close button event listener
      this.bindEvents();
    },

    /**
     * Bind event listeners
     */
    bindEvents: function() {
      var closeBtn = document.querySelector('.nw-emergency-banner__close');

      if (closeBtn) {
        closeBtn.addEventListener('click', this.dismiss.bind(this));
      }

      // Also handle keyboard accessibility
      var banner = document.getElementById(CONFIG.bannerId);
      if (banner) {
        banner.addEventListener('keydown', function(e) {
          // Allow Escape key to dismiss
          if (e.key === 'Escape' || e.keyCode === 27) {
            this.dismiss();
          }
        }.bind(this));
      }
    },

    /**
     * Dismiss the banner and save to localStorage
     */
    dismiss: function() {
      this.hide();
      this.saveDismissal();
      this.resetHeaderPosition();
    },

    /**
     * Hide the banner (visual only)
     */
    hide: function() {
      var banner = document.getElementById(CONFIG.bannerId);
      if (banner) {
        banner.classList.add(CONFIG.hiddenClass);
        banner.setAttribute('aria-hidden', 'true');
      }
    },

    /**
     * Show the banner
     */
    show: function() {
      var banner = document.getElementById(CONFIG.bannerId);
      if (banner) {
        banner.classList.remove(CONFIG.hiddenClass);
        banner.setAttribute('aria-hidden', 'false');
      }
    },

    /**
     * Save dismissal timestamp to localStorage
     */
    saveDismissal: function() {
      try {
        var dismissalData = {
          timestamp: Date.now(),
          expires: Date.now() + CONFIG.dismissDuration
        };
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(dismissalData));
      } catch (e) {
        // localStorage not available (private browsing, etc.)
        // Fall back to session cookie
        this.setSessionCookie();
      }
    },

    /**
     * Check if banner was previously dismissed and is still within window
     */
    isDismissed: function() {
      try {
        var stored = localStorage.getItem(CONFIG.storageKey);

        if (!stored) {
          return this.hasSessionCookie();
        }

        var data = JSON.parse(stored);

        // Check if dismissal has expired
        if (Date.now() > data.expires) {
          // Clean up expired dismissal
          localStorage.removeItem(CONFIG.storageKey);
          return false;
        }

        return true;
      } catch (e) {
        // Error parsing or localStorage unavailable
        return this.hasSessionCookie();
      }
    },

    /**
     * Fallback: Set session cookie
     */
    setSessionCookie: function() {
      document.cookie = CONFIG.storageKey + '=1; path=/; SameSite=Lax';
    },

    /**
     * Fallback: Check for session cookie
     */
    hasSessionCookie: function() {
      return document.cookie.indexOf(CONFIG.storageKey + '=1') !== -1;
    },

    /**
     * Adjust header position when banner is visible
     * Since header is position:fixed at top:0, we need to push it down
     */
    adjustHeaderPosition: function() {
      var banner = document.getElementById(CONFIG.bannerId);
      var header = document.querySelector('.site-header');

      if (banner && header) {
        var bannerHeight = banner.offsetHeight;
        header.style.top = bannerHeight + 'px';

        // Also adjust the announcement banner if it exists
        var announcementBanner = document.getElementById('announcement-banner');
        if (announcementBanner) {
          // Get current top value (should be 107px from CSS)
          var currentTop = parseInt(window.getComputedStyle(announcementBanner).top) || 107;
          announcementBanner.style.top = (currentTop + bannerHeight) + 'px';
        }

        // Adjust skip-nav focus position
        var skipNav = document.querySelector('.skip-nav');
        if (skipNav) {
          skipNav.style.setProperty('--banner-offset', bannerHeight + 'px');
        }
      }
    },

    /**
     * Reset header position when banner is dismissed
     */
    resetHeaderPosition: function() {
      var header = document.querySelector('.site-header');
      if (header) {
        header.style.top = '';
      }

      var announcementBanner = document.getElementById('announcement-banner');
      if (announcementBanner) {
        announcementBanner.style.top = '';
      }
    },

    /**
     * Clear dismissal (for testing purposes)
     */
    clearDismissal: function() {
      try {
        localStorage.removeItem(CONFIG.storageKey);
      } catch (e) {
        // Ignore
      }
      document.cookie = CONFIG.storageKey + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      this.show();
      this.adjustHeaderPosition();
    }
  };

  /**
   * Initialize on DOM ready
   */
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function() {
    NwEmergencyBanner.init();
  });

  /**
   * Also handle window resize (recalculate header offset)
   */
  var resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      if (!NwEmergencyBanner.isDismissed()) {
        NwEmergencyBanner.adjustHeaderPosition();
      }
    }, 100);
  });

  /**
   * Expose to global scope for inline onclick handlers
   * and for testing/debugging
   */
  window.NwEmergencyBanner = NwEmergencyBanner;

})();
