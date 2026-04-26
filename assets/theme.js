/**
 * UNIFYONE MODERN COMMERCE THEME
 * Theme JavaScript — v2.0.0
 * Rebuilt: March 2026
 *
 * Modules:
 *  1. Storage + Cookie Consent
 *  2. Mobile Menu
 *  3. Product Gallery
 *  4. Cart (ATC + Cart Drawer)
 *  5. Lazy Load
 *  6. Sticky Header
 *  7. Announcement Bar
 *  8. Pixel Event Helpers
 *  9. Quantity Selector
 */

(function () {
  "use strict";

  // ===========================================
  // UTILITY FUNCTIONS
  // ===========================================

  /**
   * LocalStorage Manager
   * Note: get() does not check consent to avoid circular dependency
   * set() checks consent except for consent-related keys
   */
  const Storage = {
    get: (key, defaultValue = null) => {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
      } catch (error) {
        // Silent fail for storage errors
        return defaultValue;
      }
    },
    set: (key, value) => {
      try {
        // Bypass consent check for consent-related keys to avoid circular dependency
        const consentKeys = ["cookie-consent", "cookie-dismissed"];
        if (!consentKeys.includes(key)) {
          // For non-consent keys, check if consent exists directly
          const hasConsent = localStorage.getItem("cookie-consent");
          if (hasConsent !== "true") {
            return;
          }
        }
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        // Silent fail for storage errors (quota exceeded, private mode, etc.)
      }
    },
    remove: (key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        // Silent fail for storage errors
      }
    },
  };

  // ===========================================
  // COOKIE CONSENT
  // ===========================================

  const CookieConsent = {
    init() {
      if (!this.hasConsent() && !this.isDismissed()) {
        this.show();
      }
      this.setupListeners();
    },

    hasConsent() {
      return Storage.get("cookie-consent") === true;
    },

    isDismissed() {
      return Storage.get("cookie-dismissed") === true;
    },

    show() {
      const banner = document.getElementById("cookie-banner");
      if (banner) {
        banner.style.display = "block";
      }
    },

    hide() {
      const banner = document.getElementById("cookie-banner");
      if (banner) {
        banner.style.display = "none";
      }
    },

    setupListeners() {
      const acceptButton = document.getElementById('cookie-accept');
      const declineButton = document.getElementById('cookie-decline');

      if (acceptButton) {
        acceptButton.addEventListener('click', () => this.accept());
      }
      if (declineButton) {
        declineButton.addEventListener('click', () => this.decline());
      }
    },

    accept() {
      Storage.set("cookie-consent", true);
      this.hide();
      this.loadAnalytics();
    },

    decline() {
      Storage.set("cookie-dismissed", true);
      this.hide();
    },

    loadAnalytics() {
      // Load Google Analytics or other tracking scripts
      // TODO: Implement actual analytics loading (GA4, Meta Pixel, etc.)
    },
  };

  // ===========================================
  // MOBILE MENU
  // ===========================================

  const MobileMenu = {
    // Cache DOM elements to avoid repeated queries
    elements: {},

    init() {
      // Cache elements once
      this.elements.toggle = document.querySelector('[data-menu-toggle]');
      this.elements.menu = document.querySelector('[data-mobile-menu]');
      this.elements.menuLinks = document.querySelectorAll('[data-mobile-menu] a');
      
      this.setupToggle();
      this.setupCloseOnClick();
      this.setupAccessibility();
    },

    closeMenu() {
      const { menu, toggle } = this.elements;
      if (menu && toggle) {
        menu.classList.remove("is-open");
        toggle.classList.remove("is-active");
        toggle.setAttribute("aria-expanded", "false");
        menu.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
      }
    },

    setupToggle() {
      const { toggle, menu } = this.elements;

      if (toggle && menu) {
        toggle.addEventListener("click", () => {
          const isOpen = menu.classList.toggle("is-open");
          toggle.classList.toggle("is-active");

          // Update ARIA attributes
          toggle.setAttribute("aria-expanded", isOpen);
          menu.setAttribute("aria-hidden", !isOpen);

          // Prevent body scroll when menu is open
          document.body.style.overflow = isOpen ? "hidden" : "";
        });
      }
    },

    setupCloseOnClick() {
      const { menuLinks, menu, toggle } = this.elements;
      
      menuLinks.forEach((link) => {
        link.addEventListener('click', () => {
          if (menu && toggle) {
            menu.classList.remove('is-open');
            toggle.classList.remove('is-active');
            toggle.setAttribute('aria-expanded', 'false');
            menu.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
          }
        });
      });
    },

    setupAccessibility() {
      const { menu, toggle } = this.elements;

      if (menu) {
        // Handle Escape key to close menu
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape' && menu.classList.contains('is-open')) {
            if (toggle) {
              toggle.click();
            }
          }
        });
      }
    },
  };

  // ===========================================
  // PRODUCT IMAGE GALLERY
  // ===========================================

  const ProductGallery = {
    init() {
      const gallery = document.querySelector("[data-product-gallery]");
      if (gallery) {
        this.setupThumbnails();
      }
    },

    setupThumbnails() {
      const thumbnails = document.querySelectorAll("[data-gallery-thumbnail]");
      const mainImage = document.querySelector("[data-gallery-main-image]");

      thumbnails.forEach((thumbnail) => {
        thumbnail.addEventListener('click', () => {
          const imageSrc = thumbnail.dataset.galleryThumbnail;
          if (mainImage && imageSrc) {
            mainImage.src = imageSrc;
            mainImage.alt = thumbnail.alt;
            thumbnails.forEach((otherThumbnail) => otherThumbnail.classList.remove('is-active'));
            thumbnail.classList.add('is-active');
          }
        });
      });
    },
  };

  // ===========================================
  // CART FUNCTIONALITY
  // ===========================================

  const Cart = {
    validateProductData(productId, quantity) {
      // Shopify variant IDs are numeric strings (e.g., "12345678901")
      const isValidVariantId = /^\d+$/.test(productId);

      if (!productId || !isValidVariantId) {
        return { valid: false, error: "Invalid product ID" };
      }

      if (isNaN(quantity) || quantity < 1) {
        return { valid: false, error: "Invalid quantity" };
      }

      return { valid: true };
    },

    addToCart(productId, quantity = 1, retries = 2) {
      const formData = new FormData();
      formData.append("id", productId);
      formData.append("quantity", quantity);

      return fetch("/cart/add.js", {
        method: "POST",
        body: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((cartData) => {
          this.updateCartCount();
          this.showNotification('Product added to cart');
          return cartData;
        })
        .catch((error) => {
          // Retry logic for network errors
          if (retries > 0) {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(this.addToCart(productId, quantity, retries - 1));
              }, 1000);
            });
          }
          this.showNotification("Unable to add product to cart. Please try again.", "error");
          throw error;
        });
    },

    updateCartCount() {
      fetch("/cart.js")
        .then((response) => response.json())
        .then((cartData) => {
          const cartCountElement = document.querySelector('[data-cart-count]');
          if (cartCountElement) {
            cartCountElement.textContent = cartData.item_count;
          }
        });
    },

    showNotification(message, type = "success") {
      // Validate notification type
      const validTypes = ["success", "error", "warning", "info"];
      const notificationType = validTypes.includes(type) ? type : "info";

      const notification = document.createElement("div");
      notification.className = `notification notification--${notificationType}`;
      notification.setAttribute("role", "alert");
      notification.setAttribute("aria-live", "polite");
      notification.textContent = message;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.remove();
      }, 3000);
    },
  };

  // ===========================================
  // LAZY LOADING
  // ===========================================

  const LazyLoad = {
    init() {
      const images = document.querySelectorAll("[data-lazy-load]");
      if ("IntersectionObserver" in window) {
        this.setupIntersectionObserver(images);
      } else {
        this.setupFallback(images);
      }
    },

    setupIntersectionObserver(images) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const imageElement = entry.target;
            imageElement.src = imageElement.dataset.lazyLoad;
            imageElement.removeAttribute('data-lazy-load');
            imageObserver.unobserve(imageElement);
          }
        });
      }, {
        rootMargin: '50px' // Load images 50px before they enter viewport
      });

      images.forEach((imageElement) => imageObserver.observe(imageElement));
    },

    setupFallback(images) {
      images.forEach((imageElement) => {
        imageElement.src = imageElement.dataset.lazyLoad;
      });
    },
  };

  // ===========================================
  // INITIALIZATION
  // ===========================================

  document.addEventListener("DOMContentLoaded", () => {
    CookieConsent.init();
    MobileMenu.init();
    ProductGallery.init();
    LazyLoad.init();

    // Setup cart listeners
    document.querySelectorAll('[data-add-to-cart]').forEach((addButton) => {
      addButton.addEventListener('click', (event) => {
        event.preventDefault();
        const productId = addButton.dataset.addToCart;
        const quantity = parseInt(addButton.dataset.quantity || 1, 10);
        
        // Shopify variant IDs are numeric strings (e.g., "12345678901")
        const isValidVariantId = /^\d+$/.test(productId);
        
        if (!productId || !isValidVariantId) {
          Cart.showNotification('Invalid product ID', 'error');
          return;
        }
        
        if (isNaN(quantity) || quantity < 1) {
          Cart.showNotification('Invalid quantity', 'error');
          return;
        }

        Cart.addToCart(productId, quantity).catch((error) => {
          // Error already handled by Cart.addToCart, but catch to prevent unhandled rejection
          console.error(
            "Add to cart failed for product",
            productId,
            "quantity",
            quantity,
            ":",
            error
          );
        });
      });
    });
  });

  // ===========================================
  // CART DRAWER
  // ===========================================

  const CartDrawer = {
    drawer: null,
    overlay: null,
    body: null,
    isOpen: false,

    init() {
      this.drawer = document.getElementById('cart-drawer');
      this.overlay = document.getElementById('cart-drawer-overlay');
      this.body = document.getElementById('cart-drawer-body');
      if (!this.drawer) return;

      document.getElementById('cart-drawer-close')?.addEventListener('click', () => this.close());
      this.overlay?.addEventListener('click', () => this.close());
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.isOpen) this.close(); });

      document.querySelectorAll('[data-cart-trigger], .header__cart-link').forEach(el => {
        el.addEventListener('click', (e) => { e.preventDefault(); this.open(); });
      });
    },

    open() {
      this.isOpen = true;
      this.drawer.setAttribute('aria-hidden', 'false');
      this.drawer.classList.add('cart-drawer--open');
      document.body.classList.add('cart-drawer-active');
      this.render();
    },

    close() {
      this.isOpen = false;
      this.drawer.setAttribute('aria-hidden', 'true');
      this.drawer.classList.remove('cart-drawer--open');
      document.body.classList.remove('cart-drawer-active');
    },

    render() {
      if (!this.body) return;
      this.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:48px"><div class="spinner"></div></div>';
      fetch('/cart.js')
        .then(r => r.json())
        .then(cart => {
          this.body.innerHTML = this.buildCartHTML(cart);
          this.bindCartEvents();
          document.querySelectorAll('[data-cart-count]').forEach(el => {
            el.textContent = cart.item_count;
            el.style.display = cart.item_count > 0 ? '' : 'none';
          });
        })
        .catch(() => { this.body.innerHTML = '<p style="padding:24px;text-align:center">Unable to load cart. <a href="/cart">View cart</a></p>'; });
    },

    buildCartHTML(cart) {
      if (cart.item_count === 0) {
        return `<div style="text-align:center;padding:48px 24px">
          <p style="margin-bottom:16px;opacity:0.5">Your cart is empty.</p>
          <a href="/collections/all" class="btn btn--primary">Start Shopping</a>
        </div>`;
      }
      const items = cart.items.map(item => `
        <div class="cart-item" data-variant-id="${item.variant_id}">
          <a href="${item.url}"><img src="${item.image}" alt="${item.title}" width="80" height="80" loading="lazy" style="width:80px;height:80px;object-fit:cover;border-radius:8px"></a>
          <div style="flex:1">
            <a href="${item.url}" style="font-size:.875rem;font-weight:600;display:block;margin-bottom:4px">${item.product_title}</a>
            ${item.variant_title && item.variant_title !== 'Default Title' ? `<p style="font-size:.75rem;opacity:.6;margin-bottom:8px">${item.variant_title}</p>` : ''}
            <div style="display:flex;align-items:center;gap:8px">
              <button class="quantity-selector__btn" data-cart-qty-minus data-variant-id="${item.variant_id}" data-current-qty="${item.quantity}" style="width:28px;height:28px;background:none;border:1px solid rgba(255,255,255,.2);border-radius:4px;cursor:pointer;color:inherit" aria-label="Decrease">−</button>
              <span style="min-width:24px;text-align:center;font-size:.875rem">${item.quantity}</span>
              <button class="quantity-selector__btn" data-cart-qty-plus data-variant-id="${item.variant_id}" data-current-qty="${item.quantity}" style="width:28px;height:28px;background:none;border:1px solid rgba(255,255,255,.2);border-radius:4px;cursor:pointer;color:inherit" aria-label="Increase">+</button>
              <span style="margin-left:auto;font-weight:700;font-size:.875rem">$${(item.final_line_price/100).toFixed(2)}</span>
              <button data-cart-remove data-variant-id="${item.variant_id}" style="background:none;border:none;cursor:pointer;opacity:.5;padding:4px" aria-label="Remove">✕</button>
            </div>
          </div>
        </div>`).join('');
      return `<div>${items}</div><div style="display:flex;justify-content:space-between;font-weight:700;padding:12px 0;border-top:1px solid rgba(255,255,255,.1);margin-top:8px"><span>Subtotal</span><span>$${(cart.total_price/100).toFixed(2)}</span></div>`;
    },

    bindCartEvents() {
      this.body.querySelectorAll('[data-cart-remove]').forEach(btn => {
        btn.addEventListener('click', () => this.updateItem(btn.dataset.variantId, 0));
      });
      this.body.querySelectorAll('[data-cart-qty-minus]').forEach(btn => {
        btn.addEventListener('click', () => this.updateItem(btn.dataset.variantId, Math.max(0, parseInt(btn.dataset.currentQty, 10) - 1)));
      });
      this.body.querySelectorAll('[data-cart-qty-plus]').forEach(btn => {
        btn.addEventListener('click', () => this.updateItem(btn.dataset.variantId, parseInt(btn.dataset.currentQty, 10) + 1));
      });
    },

    updateItem(variantId, quantity) {
      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ id: variantId, quantity })
      }).then(() => this.render()).catch(console.error);
    }
  };

  // ===========================================
  // ADD TO CART INTERCEPT (form submit)
  // ===========================================

  const ATCInterceptor = {
    init() {
      document.addEventListener('submit', (e) => {
        const form = e.target;
        if (!form.matches('[action="/cart/add"]')) return;
        e.preventDefault();
        const formData = new FormData(form);
        const variantId = formData.get('id');
        const quantity = parseInt(formData.get('quantity') || 1, 10);
        const btn = form.querySelector('[type="submit"]');
        if (btn) { btn.disabled = true; btn._orig = btn.textContent; btn.textContent = 'Adding...'; }
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ id: variantId, quantity })
        })
          .then(r => r.json())
          .then(item => {
            if (window.JITSPixel) JITSPixel.addToCart(item.variant_id, item.product_title, item.price, item.quantity);
            CartDrawer.open();
            if (btn) { btn.disabled = false; btn.textContent = btn._orig || 'Add to Cart'; }
          })
          .catch(() => { if (btn) { btn.disabled = false; btn.textContent = btn._orig || 'Add to Cart'; } });
      });
    }
  };

  // ===========================================
  // STICKY HEADER
  // ===========================================

  const StickyHeader = {
    header: null,
    lastScroll: 0,
    init() {
      this.header = document.querySelector('header, .site-header, [data-header]');
      if (!this.header) return;
      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    },
    onScroll() {
      const s = window.scrollY;
      this.header.classList.toggle('header--scrolled', s > 80);
      this.header.classList.toggle('header--hidden', s > this.lastScroll && s > 200);
      this.lastScroll = s;
    }
  };

  // ===========================================
  // ANNOUNCEMENT BAR
  // ===========================================

  const AnnouncementBar = {
    init() {
      const btn = document.querySelector('[data-announcement-dismiss]');
      const bar = document.querySelector('[data-announcement-bar]');
      if (!btn || !bar) return;
      if (sessionStorage.getItem('jits_announcement_dismissed')) bar.style.display = 'none';
      btn.addEventListener('click', () => { bar.style.display = 'none'; sessionStorage.setItem('jits_announcement_dismissed', '1'); });
    }
  };

  // ===========================================
  // EXTENDED INIT
  // ===========================================

  document.addEventListener('DOMContentLoaded', () => {
    CookieConsent.init();
    MobileMenu.init();
    ProductGallery.init();
    LazyLoad.init();
    CartDrawer.init();
    ATCInterceptor.init();
    StickyHeader.init();
    AnnouncementBar.init();

    // Legacy data-add-to-cart support
    document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = btn.dataset.addToCart;
        const quantity = parseInt(btn.dataset.quantity || 1, 10);
        if (!/^\d+$/.test(productId)) { Cart.showNotification('Invalid product ID', 'error'); return; }
        Cart.addToCart(productId, quantity).catch(console.error);
      });
    });
  });

  // Expose to global scope
  window.ThemeCart = Cart;
  window.ThemeStorage = Storage;
  window.ThemeCartDrawer = CartDrawer;
})();
