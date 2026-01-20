# Emergency Spill Response Banner

**Nwestco - Homepage Only**
Created: January 20, 2026

## Overview

A dismissible emergency alert banner that appears above the navigation menu on the homepage. Features:

- Red/emergency themed design
- Pulsing warning icon for attention
- Click-to-call phone number CTA
- Dismissible with X button
- Remembers dismissal for 24 hours (localStorage with cookie fallback)
- Mobile responsive
- Accessibility compliant (WCAG 2.1 AA)

---

## Files Included

| File | Description |
|------|-------------|
| `emergency-banner.html` | HTML markup for the banner |
| `emergency-banner.css` | Standalone CSS (namespaced to avoid conflicts) |
| `emergency-banner.js` | Vanilla JavaScript for dismiss functionality |
| `README.md` | This implementation guide |

---

## Quick Start (WordPress)

### 1. Add the CSS

**Option A: functions.php (Recommended)**

```php
function nwestco_emergency_banner_styles() {
    if ( is_front_page() ) {
        wp_enqueue_style(
            'nw-emergency-banner',
            get_template_directory_uri() . '/assets/css/emergency-banner.css',
            array(),
            '1.0.0'
        );
    }
}
add_action( 'wp_enqueue_scripts', 'nwestco_emergency_banner_styles' );
```

**Option B: Customizer**

Paste the CSS contents into **Appearance > Customize > Additional CSS**

---

### 2. Add the JavaScript

**In functions.php:**

```php
function nwestco_emergency_banner_scripts() {
    if ( is_front_page() ) {
        wp_enqueue_script(
            'nw-emergency-banner',
            get_template_directory_uri() . '/assets/js/emergency-banner.js',
            array(),
            '1.0.0',
            true // Load in footer
        );
    }
}
add_action( 'wp_enqueue_scripts', 'nwestco_emergency_banner_scripts' );
```

---

### 3. Add the HTML

**In header.php:**

Place immediately after `<body>` tag, BEFORE the skip-nav and header:

```php
<?php if ( is_front_page() ) : ?>
<!-- Emergency Spill Response Banner -->
<div class="nw-emergency-banner" id="nw-emergency-banner" role="alert" aria-live="polite">
  <div class="nw-emergency-banner__container">
    <div class="nw-emergency-banner__content">
      <span class="nw-emergency-banner__icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9V13M12 17H12.01M12 3L2 21H22L12 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <span class="nw-emergency-banner__text">
        <strong class="nw-emergency-banner__label">EMERGENCY SPILL RESPONSE</strong>
        <span class="nw-emergency-banner__message">24/7 rapid response for fuel spills and environmental emergencies.</span>
      </span>
      <a href="tel:8007751892" class="nw-emergency-banner__cta">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
        </svg>
        <span>Call Now: 800-775-1892</span>
      </a>
    </div>
    <button
      type="button"
      class="nw-emergency-banner__close"
      aria-label="Dismiss emergency banner"
      onclick="NwEmergencyBanner.dismiss()"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>
</div>
<?php endif; ?>
```

---

## Page Structure After Implementation

```
<body>
  <!-- 1. Emergency Banner (NEW - scrolls with page) -->
  <div class="nw-emergency-banner">...</div>

  <!-- 2. Skip Navigation -->
  <a href="#main-content" class="skip-nav">...</a>

  <!-- 3. Header (fixed) -->
  <header class="site-header">...</header>

  <!-- 4. Announcement Banner (fixed, below header) -->
  <div class="announcement-banner">...</div>

  <!-- 5. Main Content -->
  <main id="main-content">...</main>
</body>
```

---

## Behavior Details

### Dismissal Storage

- **Primary**: localStorage with 24-hour expiration
- **Fallback**: Session cookie (for private browsing)

### Header Adjustment

The JavaScript automatically adjusts the fixed header's `top` position when the banner is visible, ensuring the header sits directly below the emergency banner.

### Mobile Behavior

- On screens < 480px: Icon is hidden, CTA becomes full-width
- On screens < 768px: Reduced padding and font sizes

---

## Customization

### Change Dismissal Duration

In `emergency-banner.js`, modify the `dismissDuration` value:

```javascript
var CONFIG = {
  // ...
  dismissDuration: 24 * 60 * 60 * 1000, // 24 hours
  // For 1 hour: 60 * 60 * 1000
  // For 7 days: 7 * 24 * 60 * 60 * 1000
};
```

### Change Colors

In `emergency-banner.css`, modify these values:

```css
.nw-emergency-banner {
  background: linear-gradient(135deg, #B91C1C 0%, #991B1B 50%, #7F1D1D 100%);
  /* Red-700, Red-800, Red-900 from Tailwind palette */
}
```

### Change Phone Number

Update the `href` attribute and visible text in the HTML:

```html
<a href="tel:YOUR-NUMBER" class="nw-emergency-banner__cta">
  ...
  <span>Call Now: YOUR-NUMBER</span>
</a>
```

---

## Testing

### Force Banner to Show (Clear Dismissal)

In browser console:

```javascript
NwEmergencyBanner.clearDismissal();
```

### Check Dismissal Status

```javascript
NwEmergencyBanner.isDismissed(); // Returns true/false
```

### Manually Dismiss

```javascript
NwEmergencyBanner.dismiss();
```

---

## Accessibility Features

- `role="alert"` for screen reader announcement
- `aria-live="polite"` for non-intrusive updates
- `aria-label` on close button
- `aria-hidden` on decorative icons
- Escape key dismisses banner
- Visible focus states on interactive elements
- Respects `prefers-reduced-motion` for animations

---

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- iOS Safari 11+
- Android Chrome 60+

---

## Troubleshooting

### Banner doesn't appear

1. Check if on homepage (`is_front_page()` returns true)
2. Check browser console for JavaScript errors
3. Verify CSS and JS files are loading
4. Clear localStorage: `localStorage.removeItem('nw_emergency_banner_dismissed')`

### Header overlaps banner

The JS automatically adjusts the header position. If not working:
1. Ensure JS is loaded AFTER the banner HTML
2. Check if `.site-header` selector matches your theme's header class

### Banner reappears on every page load

1. Check if localStorage is disabled (private browsing)
2. Verify there are no JS errors before dismissal code runs

---

## Support

For questions or modifications, contact your development team.
