/**
 * NWESTCO OPTION C - INTERACTIVE JAVASCRIPT
 *
 * Modern, bold, interactive functionality including:
 * - Flip cards
 * - Animated counters
 * - Interactive timeline
 * - Testimonial carousel
 * - Scroll animations
 * - Mobile menu
 * - Smooth scroll
 * - Header scroll behavior
 *
 * Performance-optimized with Intersection Observer and debouncing
 * Respects prefers-reduced-motion preference
 */

(function() {
  'use strict';

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * UTILITY FUNCTIONS
   */

  // Debounce function for scroll events
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Check if element is in viewport
  function isInViewport(element, threshold = 0.2) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) * (1 - threshold) &&
      rect.bottom >= 0
    );
  }


  /**
   * MOBILE MENU
   */

  function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const fullscreenMenu = document.querySelector('.fullscreen-menu');
    const menuClose = document.querySelector('.menu-close');
    const menuLinks = fullscreenMenu.querySelectorAll('a');

    if (!menuToggle || !fullscreenMenu) return;

    function openMenu() {
      fullscreenMenu.setAttribute('aria-hidden', 'false');
      menuToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      fullscreenMenu.setAttribute('aria-hidden', 'true');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (menuClose) {
      menuClose.addEventListener('click', closeMenu);
    }

    // Close menu when clicking a link
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
      }
    });
  }


  /**
   * HEADER SCROLL BEHAVIOR
   */

  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const handleScroll = debounce(() => {
      const currentScroll = window.pageYOffset;

      // Add scrolled class for shadow effect
      if (currentScroll > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      // Header stays persistent (always visible)
      // Removed hide/show behavior for better UX
    }, 10);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }


  /**
   * SMOOTH SCROLL
   */

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '#!') return;

        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          e.preventDefault();

          const headerOffset = 80;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
          });
        }
      });
    });
  }


  /**
   * FLIP CARDS
   */

  function initFlipCards() {
    const flipCards = document.querySelectorAll('.flip-card');

    flipCards.forEach(card => {
      const trigger = card.querySelector('.flip-trigger');
      const backLink = card.querySelector('.flip-card-back .btn');

      if (trigger) {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          card.classList.add('flipped');
        });
      }

      // Click anywhere on card to flip (mobile-friendly)
      card.addEventListener('click', (e) => {
        // Don't flip if clicking on a link
        if (e.target.tagName === 'A' || e.target.closest('a')) {
          return;
        }

        if (!card.classList.contains('flipped')) {
          card.classList.add('flipped');
        }
      });

      // Double-click or long-press to flip back
      let pressTimer;

      card.addEventListener('mousedown', () => {
        pressTimer = setTimeout(() => {
          if (card.classList.contains('flipped')) {
            card.classList.remove('flipped');
          }
        }, 500);
      });

      card.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
      });

      // Keyboard accessibility
      card.setAttribute('tabindex', '0');
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.classList.toggle('flipped');
        }
        if (e.key === 'Escape') {
          card.classList.remove('flipped');
        }
      });
    });
  }


  /**
   * ANIMATED COUNTERS
   */

  function animateCounter(element, target, duration = 2000) {
    if (prefersReducedMotion) {
      element.textContent = target;
      return;
    }

    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 16);
  }

  function initCounters() {
    // Only select stat-numbers that have a data-target attribute (actual counters)
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    const observedStats = new Set();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !observedStats.has(entry.target)) {
          observedStats.add(entry.target);
          const target = parseInt(entry.target.getAttribute('data-target'), 10);

          // Skip if no valid target number
          if (isNaN(target)) return;

          // Delay slightly for stagger effect
          const delay = Array.from(statNumbers).indexOf(entry.target) * 100;
          setTimeout(() => {
            animateCounter(entry.target, target);
          }, delay);
        }
      });
    }, {
      threshold: 0.5
    });

    statNumbers.forEach(stat => {
      observer.observe(stat);
    });
  }


  /**
   * INTERACTIVE TIMELINE
   */

  function initTimeline() {
    const timelineDots = document.querySelectorAll('.timeline-dot');
    const timelineDetails = document.querySelectorAll('.timeline-detail');

    timelineDots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        // Remove active class from all dots and details
        timelineDots.forEach(d => d.classList.remove('active'));
        timelineDetails.forEach(d => d.classList.remove('active'));

        // Add active class to clicked dot
        dot.classList.add('active');

        // Show corresponding detail
        const pointNumber = dot.closest('.timeline-point').getAttribute('data-point');
        const detail = document.querySelector(`.timeline-detail[data-detail="${pointNumber}"]`);
        if (detail) {
          detail.classList.add('active');
        }
      });

      // Keyboard navigation
      dot.addEventListener('keydown', (e) => {
        let newIndex = index;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          newIndex = (index + 1) % timelineDots.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          newIndex = (index - 1 + timelineDots.length) % timelineDots.length;
        } else if (e.key === 'Home') {
          e.preventDefault();
          newIndex = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          newIndex = timelineDots.length - 1;
        } else {
          return;
        }

        timelineDots[newIndex].click();
        timelineDots[newIndex].focus();
      });
    });
  }


  /**
   * TESTIMONIAL CAROUSEL
   */

  function initTestimonials() {
    const slides = document.querySelectorAll('.testimonial-slide');
    const prevButton = document.querySelector('.carousel-prev');
    const nextButton = document.querySelector('.carousel-next');
    const dotsContainer = document.querySelector('.carousel-dots');

    if (slides.length === 0) return;

    let currentSlide = 0;

    // Create dots
    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.classList.add('carousel-dot');
      dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`);
      if (index === 0) dot.classList.add('active');

      // Style dots
      dot.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: none;
        background: var(--nwestco-neutral-300);
        cursor: pointer;
        transition: all 0.3s ease;
      `;

      dot.addEventListener('click', () => goToSlide(index));
      dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.carousel-dot');

    function goToSlide(index) {
      // Remove active class from current slide
      slides[currentSlide].classList.remove('active');
      dots[currentSlide].classList.remove('active');
      dots[currentSlide].style.background = 'var(--nwestco-neutral-300)';

      // Update current slide
      currentSlide = index;

      // Add active class to new slide
      slides[currentSlide].classList.add('active');
      dots[currentSlide].classList.add('active');
      dots[currentSlide].style.background = 'var(--nwestco-blue)';
    }

    function nextSlide() {
      const next = (currentSlide + 1) % slides.length;
      goToSlide(next);
    }

    function prevSlide() {
      const prev = (currentSlide - 1 + slides.length) % slides.length;
      goToSlide(prev);
    }

    if (prevButton) {
      prevButton.addEventListener('click', prevSlide);
    }

    if (nextButton) {
      nextButton.addEventListener('click', nextSlide);
    }

    // Auto-advance carousel every 5 seconds (unless reduced motion)
    if (!prefersReducedMotion) {
      let autoplayInterval = setInterval(nextSlide, 5000);

      // Pause autoplay on hover
      const carousel = document.querySelector('.testimonial-carousel');
      if (carousel) {
        carousel.addEventListener('mouseenter', () => {
          clearInterval(autoplayInterval);
        });

        carousel.addEventListener('mouseleave', () => {
          autoplayInterval = setInterval(nextSlide, 5000);
        });
      }
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      const carousel = document.querySelector('.testimonial-carousel');
      if (!carousel || !isInViewport(carousel)) return;

      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    });
  }


  /**
   * SCROLL ANIMATIONS
   */

  function initScrollAnimations() {
    if (prefersReducedMotion) return;

    const uniqueItems = document.querySelectorAll('.unique-item');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.2
    });

    uniqueItems.forEach(item => {
      observer.observe(item);
    });
  }


  /**
   * FORM HANDLING
   */

  function initFormHandling() {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get form data
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);

        console.log('Form submitted:', data);

        // Show success message (in production, this would be an API call)
        alert('Thank you for your message! We will get back to you within 24 hours.');

        // Reset form
        contactForm.reset();
      });

      // Floating labels effect
      const formGroups = contactForm.querySelectorAll('.form-group');
      formGroups.forEach(group => {
        const input = group.querySelector('input, select, textarea');
        const label = group.querySelector('label');

        if (input && label) {
          input.addEventListener('focus', () => {
            label.style.transform = 'translateY(-1.5rem) scale(0.85)';
            label.style.color = 'var(--nwestco-blue)';
          });

          input.addEventListener('blur', () => {
            if (!input.value) {
              label.style.transform = '';
              label.style.color = '';
            }
          });

          // Check if input has value on page load
          if (input.value) {
            label.style.transform = 'translateY(-1.5rem) scale(0.85)';
          }
        }
      });
    }
  }


  /**
   * SCROLL PROGRESS INDICATOR
   */

  function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--nwestco-green), var(--nwestco-blue));
      width: 0%;
      z-index: 999;
      transition: width 0.1s ease;
      pointer-events: none;
    `;
    document.body.appendChild(progressBar);

    const updateProgress = debounce(() => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.pageYOffset / scrollHeight) * 100;
      progressBar.style.width = Math.min(scrolled, 100) + '%';
    }, 10);

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress(); // Initial call
  }


  /**
   * LAZY LOADING IMAGES
   */

  function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }


  /**
   * ACCESSIBILITY ENHANCEMENTS
   */

  function initA11y() {
    // Add focus indicators for keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });

    // Add CSS for keyboard focus
    const style = document.createElement('style');
    style.textContent = `
      .keyboard-nav *:focus {
        outline: 3px solid var(--nwestco-blue) !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
  }


  /**
   * PERFORMANCE MONITORING
   */

  function logPerformanceMetrics() {
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          if (perfData) {
            console.log('Performance Metrics:');
            console.log(`- DOM Content Loaded: ${perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart}ms`);
            console.log(`- Page Load Time: ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
            console.log(`- Total Page Load: ${perfData.loadEventEnd - perfData.fetchStart}ms`);
          }
        }, 0);
      });
    }
  }


  /**
   * INITIALIZE ALL
   */

  function init() {
    console.log('Initializing Option C interactive features...');

    // Core functionality
    initMobileMenu();
    initHeaderScroll();
    initSmoothScroll();
    initFlipCards();
    initCounters();
    initTimeline();
    initTestimonials();
    initScrollAnimations();
    initFormHandling();
    initScrollProgress();
    initLazyLoading();
    initA11y();

    // Performance monitoring (dev only)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      logPerformanceMetrics();
    }

    console.log('Option C initialized successfully!');
    console.log(`Reduced motion: ${prefersReducedMotion ? 'enabled' : 'disabled'}`);
  }


  /**
   * DOM READY
   */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }


  /**
   * EXPOSE UTILITIES (for debugging)
   */

  window.NwestcoOptionC = {
    version: '1.0.0',
    prefersReducedMotion,
    reinit: init
  };

})();
