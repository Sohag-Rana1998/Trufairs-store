// Global cart drawer functionality - initialize immediately when DOM loads
(function() {
  'use strict';

  // Function to initialize add to cart buttons
  function initializeAddToCartButtons(container) {
    container = container || document;

    const addToCartButtons = container.querySelectorAll('.product-card-add-to-cart:not([data-cart-initialized])');

    addToCartButtons.forEach(function(button) {
      // Mark as initialized to prevent duplicate listeners
      button.setAttribute('data-cart-initialized', 'true');

      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const variantId = button.dataset.variantId;
        const productTitle = button.dataset.productTitle;
        const isAvailable = button.dataset.variantAvailable === 'true';

        // Check if variant is available
        if (!isAvailable || button.disabled) {
          return;
        }

        // Prevent double submission
        if (button.classList.contains('adding-to-cart')) {
          return;
        }

        const addText = button.querySelector('.add-to-cart-text');
        const loadingText = button.querySelector('.add-to-cart-loading');

        // Show loading state
        button.classList.add('adding-to-cart');
        button.disabled = true;
        if (addText) addText.style.display = 'none';
        if (loadingText) loadingText.style.display = 'inline';

        // Prepare form data
        const formData = new FormData();
        formData.append('id', variantId);
        formData.append('quantity', '1');

        // Submit to cart
        fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        })
        .then(function(response) {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(function(data) {
          // --- SUCCESS ---

          // Dispatch a primary event to trigger the cart drawer
          document.dispatchEvent(new CustomEvent('ajaxProduct:added', {
            bubbles: true,
            detail: { product: data, addToCartBtn: button, quantity: 1 }
          }));

          // Dispatch alternative events for wider theme compatibility
          const altEvents = ['cart:item-added', 'cart:updated', 'product:added-to-cart'];
          altEvents.forEach(eventName => {
            document.dispatchEvent(new CustomEvent(eventName, {
              bubbles: true,
              detail: { product: data, variant: data, quantity: 1, addToCartBtn: button }
            }));
          });

          // Update cart count using common theme methods
          if (window.theme && typeof window.theme.cartCount === 'function') {
            window.theme.cartCount();
          }

          // Show success message
          if (addText) {
            addText.textContent = 'Added!';
            addText.style.display = 'inline';
          }
          if (loadingText) loadingText.style.display = 'none';

          // Attempt to open the cart drawer
          setTimeout(function() {
            if (window.theme && window.theme.CartDrawer && typeof window.theme.CartDrawer.open === 'function') {
              window.theme.CartDrawer.open();
            }
          }, 100);

          // Reset button text after a delay
          setTimeout(function() {
            if (addText) addText.textContent = 'Add To Cart';
          }, 1500);

        })
        .catch(function(error) {
          console.error('Error adding to cart:', error);
          if (addText) {
            addText.textContent = 'Error';
            addText.style.display = 'inline';
          }
          if (loadingText) loadingText.style.display = 'none';
          setTimeout(function() {
            if (addText) addText.textContent = 'Add To Cart';
          }, 2000);
        })
        .finally(function() {
          // Reset button state
          setTimeout(function() {
            button.classList.remove('adding-to-cart');
            button.disabled = false;
          }, 1000);
        });
      });
    });
  }

  // Function to handle content changes and re-initialize buttons
  function onContentChange() {
    initializeAddToCartButtons();
  }

  // --- Initialization and Event Listening ---

  // Initialize on initial page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onContentChange);
  } else {
    onContentChange();
  }

  // Listen for Shopify-specific events that signal content has been replaced
  document.addEventListener('shopify:section:load', onContentChange);
  window.addEventListener('popstate', onContentChange); // For back/forward navigation with filters

  // Use a MutationObserver on a more stable parent element (like the main content area)
  // to detect when the product grid is replaced by the filter functionality.
  const mainContent = document.querySelector('main#main-content') || document.body;
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node itself is or contains the buttons
            if (node.querySelector('.product-card-add-to-cart')) {
              initializeAddToCartButtons(node);
            }
          }
        });
      }
    });
  });

  observer.observe(mainContent, {
    childList: true,
    subtree: true
  });

  // Make the initialization function globally available for manual calls if needed by other scripts
  window.initializeProductCardButtons = initializeAddToCartButtons;

})();