
class ProductBundle {
  constructor(container) {
    this.container = container;
    this.bundleDiscount = parseFloat(container.dataset.bundleDiscount) || 0;
    // Convert cents to dollars for minimum amount
this.bundleMinimum = (parseFloat(container.dataset.bundleMinimum) || 0) ;
    this.bundleItems = new Map();
    this.currencyFormat = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    });
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.initializeBundle();
    this.updateDisplay();
  }
  
  bindEvents() {
    // Variant selection
    this.container.addEventListener('change', (e) => {
      if (e.target.classList.contains('variant-select')) {
        this.handleVariantChange(e.target);
      } else if (e.target.classList.contains('quantity-input')) {
        this.handleQuantityInput(e.target);
      } else if (e.target.classList.contains('bundle-quantity-input')) {
        this.handleBundleQuantityInput(e.target);
      }
    });
    
    // Click events
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('quantity-plus')) {
        this.handleQuantityChange(e.target.dataset.productId, 1);
      } else if (e.target.classList.contains('quantity-minus')) {
        this.handleQuantityChange(e.target.dataset.productId, -1);
      } else if (e.target.classList.contains('bundle-quantity-plus')) {
        this.handleBundleQuantityChange(e.target.dataset.productId, 1);
      } else if (e.target.classList.contains('bundle-quantity-minus')) {
        this.handleBundleQuantityChange(e.target.dataset.productId, -1);
      } else if (e.target.classList.contains('add-to-bundle-btn')) {
        this.addToBundle(e.target.dataset.productId);
      } else if (e.target.classList.contains('remove-item-btn')) {
        this.removeFromBundle(e.target.dataset.productId);
      } else if (e.target.classList.contains('add-individual-btn')) {
        this.addIndividualToCart(e.target.dataset.productId);
      } else if (e.target.classList.contains('add-bundle-to-cart-btn')) {
        this.addBundleToCart();
      }
    });
  }
  
  initializeBundle() {
    const productCards = this.container.querySelectorAll('.bundle-product-card');
    productCards.forEach(card => {
      const productId = card.dataset.productId;
      const variantSelect = card.querySelector('.variant-select');
      const quantityInput = card.querySelector('.quantity-input');
      
      if (variantSelect && quantityInput) {
        const option = variantSelect.selectedOptions ? variantSelect.selectedOptions[0] : null;
        if (option || variantSelect.value) {
          this.bundleItems.set(productId, {
            variantId: variantSelect.value,
            quantity: parseInt(quantityInput.value),
            price: parseFloat(option?.dataset?.price || variantSelect.dataset.price || 0),
            comparePrice: parseFloat(option?.dataset?.comparePrice || variantSelect.dataset.comparePrice || 0),
            productTitle: this.decodeHtml(option?.dataset?.productTitle || variantSelect.dataset.productTitle || ''),
            variantTitle: this.decodeHtml(option?.dataset?.variantTitle || variantSelect.dataset.variantTitle || ''),
            image: option?.dataset?.image || variantSelect.dataset.image || ''
          });
        }
      }
    });
  }
  
  decodeHtml(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }
  
  handleVariantChange(select) {
    const productId = select.dataset.productId;
    const option = select.selectedOptions[0];
    const card = this.container.querySelector(`[data-product-id="${productId}"]`);
    
    // Update product image
    const productImage = card.querySelector('.product-image');
    if (productImage && option.dataset.image) {
      productImage.src = option.dataset.image;
    }
    
    // Update price display
    const currentPrice = card.querySelector('.current-price');
    const comparePrice = card.querySelector('.compare-price');
    if (currentPrice) {
      currentPrice.textContent = this.currencyFormat.format(option.dataset.price / 100);
    }
    if (comparePrice) {
      const comparePriceValue = parseFloat(option.dataset.comparePrice);
      if (comparePriceValue > 0) {
        comparePrice.textContent = this.currencyFormat.format(comparePriceValue / 100);
        comparePrice.style.display = 'inline';
      } else {
        comparePrice.style.display = 'none';
      }
    }
    
    // Update bundle item if exists
    if (this.bundleItems.has(productId)) {
      const item = this.bundleItems.get(productId);
      item.variantId = select.value;
      item.price = parseFloat(option.dataset.price);
      item.comparePrice = parseFloat(option.dataset.comparePrice);
      item.productTitle = this.decodeHtml(option.dataset.productTitle);
      item.variantTitle = this.decodeHtml(option.dataset.variantTitle);
      item.image = option.dataset.image;
      
      this.updateDisplay();
    }
  }
  
  handleQuantityChange(productId, change) {
    const quantityInput = this.container.querySelector(`.quantity-input[data-product-id="${productId}"]`);
    if (!quantityInput) return;
    
    let newQuantity = parseInt(quantityInput.value) + change;
    newQuantity = Math.max(1, Math.min(10, newQuantity));
    quantityInput.value = newQuantity;
    
    // Update bundle item if it exists
    if (this.bundleItems.has(productId)) {
      this.bundleItems.get(productId).quantity = newQuantity;
      
      // Also update bundle quantity input if it exists
      const bundleQuantityInput = this.container.querySelector(`.bundle-quantity-input[data-product-id="${productId}"]`);
      if (bundleQuantityInput) {
        bundleQuantityInput.value = newQuantity;
      }
      
      this.updateDisplay();
    }
  }
  
  handleQuantityInput(input) {
    const productId = input.dataset.productId;
    let quantity = parseInt(input.value) || 1;
    quantity = Math.max(1, Math.min(10, quantity));
    input.value = quantity;
    
    // Update bundle item if it exists
    if (this.bundleItems.has(productId)) {
      this.bundleItems.get(productId).quantity = quantity;
      
      // Also update bundle quantity input if it exists
      const bundleQuantityInput = this.container.querySelector(`.bundle-quantity-input[data-product-id="${productId}"]`);
      if (bundleQuantityInput) {
        bundleQuantityInput.value = quantity;
      }
      
      this.updateDisplay();
    }
  }
  
  handleBundleQuantityChange(productId, change) {
    const bundleQuantityInput = this.container.querySelector(`.bundle-quantity-input[data-product-id="${productId}"]`);
    if (!bundleQuantityInput) return;
    
    let newQuantity = parseInt(bundleQuantityInput.value) + change;
    newQuantity = Math.max(0, Math.min(10, newQuantity));
    bundleQuantityInput.value = newQuantity;
    
    if (newQuantity === 0) {
      this.removeFromBundle(productId);
    } else if (this.bundleItems.has(productId)) {
      this.bundleItems.get(productId).quantity = newQuantity;
      
      // Also update the main product card quantity
      const mainQuantityInput = this.container.querySelector(`.quantity-input[data-product-id="${productId}"]`);
      if (mainQuantityInput) {
        mainQuantityInput.value = newQuantity;
      }
      
      this.updateDisplay();
    }
  }
  
  handleBundleQuantityInput(input) {
    const productId = input.dataset.productId;
    let quantity = parseInt(input.value) || 0;
    quantity = Math.max(0, Math.min(10, quantity));
    input.value = quantity;
    
    if (quantity === 0) {
      this.removeFromBundle(productId);
    } else if (this.bundleItems.has(productId)) {
      this.bundleItems.get(productId).quantity = quantity;
      
      // Also update the main product card quantity
      const mainQuantityInput = this.container.querySelector(`.quantity-input[data-product-id="${productId}"]`);
      if (mainQuantityInput) {
        mainQuantityInput.value = quantity;
      }
      
      this.updateDisplay();
    }
  }
  
  addToBundle(productId) {
    const card = this.container.querySelector(`[data-product-id="${productId}"]`);
    const variantSelect = card.querySelector('.variant-select');
    const quantityInput = card.querySelector('.quantity-input');
    
    if (!variantSelect || !quantityInput) return;
    
    const option = variantSelect.selectedOptions ? variantSelect.selectedOptions[0] : null;
    
    this.bundleItems.set(productId, {
      variantId: variantSelect.value,
      quantity: parseInt(quantityInput.value),
      price: parseFloat(option?.dataset?.price || variantSelect.dataset.price || 0),
      comparePrice: parseFloat(option?.dataset?.comparePrice || variantSelect.dataset.comparePrice || 0),
      productTitle: this.decodeHtml(option?.dataset?.productTitle || variantSelect.dataset.productTitle || ''),
      variantTitle: this.decodeHtml(option?.dataset?.variantTitle || variantSelect.dataset.variantTitle || ''),
      image: option?.dataset?.image || variantSelect.dataset.image || ''
    });
    
    // Update card state
    card.classList.add('in-bundle');
    card.querySelector('.add-to-bundle-btn').style.display = 'none';
    
    this.updateDisplay();
  }
  
  removeFromBundle(productId) {
    this.bundleItems.delete(productId);
    
    // Update card state
    const card = this.container.querySelector(`[data-product-id="${productId}"]`);
    card.classList.remove('in-bundle');
    card.querySelector('.add-to-bundle-btn').style.display = 'block';
    
    // Reset quantity to 1
    const quantityInput = card.querySelector('.quantity-input');
    if (quantityInput) {
      quantityInput.value = 1;
    }
    
    this.updateDisplay();
  }
  
  async addIndividualToCart(productId) {
    const item = this.bundleItems.get(productId);
    if (!item) return;
    
    const button = this.container.querySelector(`button[data-product-id="${productId}"].add-individual-btn`);
    button.classList.add('loader');
    button.disabled = true;
    
try {
  const response = await fetch('/cart/add.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: item.variantId,
      quantity: item.quantity
    })
  });

  const data = await response.json(); // Parse the response as JSON

  if (response.ok && data) {
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

   

    // Attempt to open the cart drawer
    setTimeout(function() {
      if (window.theme && window.theme.CartDrawer && typeof window.theme.CartDrawer.open === 'function') {
        window.theme.CartDrawer.open();
      }
    }, 100);

    

  } else {
    console.error('Error from cart response:', data);
    throw new Error('Failed to add to cart');
  }
} catch (error) {
  // Display an error notification if the add-to-cart process fails
  this.showNotification('Failed to add item to cart. Please try again.', 'error');
} finally {
  // Remove the loading state from the button and re-enable it
  button.classList.remove('loader');
  button.disabled = false;
}

  }
  
  async addBundleToCart() {
    if (this.bundleItems.size === 0) return;
    
    const button = this.container.querySelector('.add-bundle-to-cart-btn');
    button.classList.add('loader');
    button.disabled = true;
    
    const items = Array.from(this.bundleItems.values()).map(item => ({
      id: item.variantId,
      quantity: item.quantity
    }));
    
    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items })
      });
      
      if (response.ok) {
        this.showNotification('Bundle added to cart successfully!', 'success');
        
        // Clear bundle
        this.bundleItems.clear();
        
        // Reset all cards
        const cards = this.container.querySelectorAll('.bundle-product-card');
        cards.forEach(card => {
          card.classList.remove('in-bundle');
          card.querySelector('.add-to-bundle-btn').style.display = 'block';
          const quantityInput = card.querySelector('.quantity-input');
          if (quantityInput) {
            quantityInput.value = 1;
          }
        });
        
        this.updateDisplay();
        
        // Trigger cart drawer or redirect
        if (window.location.pathname !== '/cart') {
          setTimeout(() => {
           window.location.pathname = "/cart"; 
          }, 100);
        }
      } else {
        throw new Error('Failed to add bundle to cart');
      }
    } catch (error) {
      this.showNotification('Failed to add bundle to cart. Please try again.', 'error');
    } finally {
      button.classList.remove('loader');
      button.disabled = false;
    }
  }
  
  updateDisplay() {
    this.updateBundleSummary();
    this.updateProgressBar();
    this.updateTotals();
  }
  
  updateBundleSummary() {
    const bundleItemsList = this.container.querySelector('.bundle-items-list');
    
    if (this.bundleItems.size === 0) {
      bundleItemsList.innerHTML = '<div class="empty-bundle-message">No items in bundle yet. Add products above to get started!</div>';
      return;
    }
    
    let html = '';
    let index = 1;
    
    this.bundleItems.forEach((item, productId) => {
      const itemTotal = (item.price * item.quantity) / 100;
      // Ensure proper display of product title and variant
      const displayTitle = item.productTitle || 'Product';
      const displayVariant = item.variantTitle && item.variantTitle !== item.productTitle ? item.variantTitle : 'Default';
      
      html += `
        <div class="bundle-item" data-product-id="${productId}">
       
          <div class="bundle-item-image">
             <div class="bundle-item-number">${index}.</div>
            <img src="${item.image}" alt="${displayTitle} - ${displayVariant}" loading="lazy">
              <div>
              <div class="bundle-item-title">
        ${displayTitle.length > 65 ? displayTitle.slice(0, 65) + '...' : displayTitle}
      </div>
               <div class="bundle-item-variant">${displayVariant}</div>
                 <div class="quantity-price-container">
             <div class="bundle-item-price">${this.currencyFormat.format(itemTotal)}</div>
            <div class="bundle-quantity-controls">
              <button type="button" class="bundle-quantity-btn bundle-quantity-minus" data-product-id="${productId}">-</button>
              <input type="number" class="bundle-quantity-input" value="${item.quantity}" min="0" max="10" data-product-id="${productId}">
              <button type="button" class="bundle-quantity-btn bundle-quantity-plus" data-product-id="${productId}">+</button>
            </div>
           
            </div>
               <div class="bundle-item-controls">
            
            <button type="button" class="add-individual-btn" data-product-id="${productId}">
              Add to Cart
            </button>
            <button type="button" class="remove-item-btn" data-product-id="${productId}">
              Remove
            </button>
          </div>
                </div>
          </div>
          
       
        </div>
      `;
      index++;
    });
    
    bundleItemsList.innerHTML = html;
  }
  
  updateProgressBar() {
    const progressContainer = this.container.querySelector('.bundle-progress-container');
    
    if (this.bundleMinimum <= 0) {
      progressContainer.style.display = 'none';
      return;
    }
    
    const progressFill = this.container.querySelector('.bundle-progress-fill');
    const remainingAmount = this.container.querySelector('.remaining-amount');
    
    const currentTotal = this.calculateSubtotal();
    const progress = Math.min((currentTotal / this.bundleMinimum) * 100, 100);
    const remaining = Math.max(this.bundleMinimum - currentTotal, 0);
    
    progressFill.style.width = `${progress}%`;
    remainingAmount.textContent = this.currencyFormat.format(remaining / 100);
    
    if (remaining > 0 && this.bundleItems.size > 0) {
      progressContainer.style.display = 'block';
    } else {
      progressContainer.style.display = 'none';
    }
  }
  
  updateTotals() {
    const subtotal = this.calculateSubtotal();
    const isDiscountEligible = this.bundleMinimum > 0 ? subtotal >= this.bundleMinimum : subtotal > 0;
    const discountAmount = isDiscountEligible && this.bundleDiscount > 0 ? (subtotal * this.bundleDiscount / 100) : 0;
    const total = subtotal - discountAmount;
    
    // Update displays
    this.container.querySelector('.bundle-subtotal').textContent = this.currencyFormat.format(subtotal / 100);
    this.container.querySelector('.bundle-total').textContent = this.currencyFormat.format(total / 100);
    this.container.querySelector('.bundle-item-count').textContent = this.bundleItems.size;
    
    // Show/hide discount row
    const discountRow = this.container.querySelector('.discount-row');
    const savingsRow = this.container.querySelector('.savings-row');
    if (discountAmount > 0) {
      discountRow.style.display = 'flex';
      savingsRow.style.display = 'flex';
      this.container.querySelector('.bundle-discount-amount').textContent = `-${this.currencyFormat.format(discountAmount / 100)}`;
      this.container.querySelector('.bundle-savings').textContent = this.currencyFormat.format(discountAmount / 100);
    } else {
      discountRow.style.display = 'none';
      savingsRow.style.display = 'none';
    }
    
    // Enable/disable cart button
    const cartButton = this.container.querySelector('.add-bundle-to-cart-btn');
    cartButton.disabled = this.bundleItems.size === 0;
  }
  
  calculateSubtotal() {
    let subtotal = 0;
    this.bundleItems.forEach(item => {
      subtotal += item.price * item.quantity;
    });
    return subtotal;
  }
  
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `bundle-notification bundle-notification--${type}`;
    notification.innerHTML = `
      <div class="bundle-notification__content">
        <span class="bundle-notification__message">${message}</span>
        <button class="bundle-notification__close" type="button" aria-label="Close notification">×</button>
      </div>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#bundle-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'bundle-notification-styles';
      style.textContent = `
        .bundle-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          z-index: 1000;
          max-width: 400px;
          animation: slideIn 0.4s ease;
        }
        
        .bundle-notification--success {
          border-left: 6px solid #28a745;
        }
        
        .bundle-notification--error {
          border-left: 6px solid #dc3545;
        }
        
        .bundle-notification__content {
          padding: 1.25rem 1.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        
        .bundle-notification__message {
          flex: 1;
          font-weight: 500;
          color: #1a1a1a;
        }
        
        .bundle-notification__close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6c757d;
          padding: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s ease;
        }
        
        .bundle-notification__close:hover {
          background: #f8f9fa;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @media (max-width: 480px) {
          .bundle-notification {
            right: 10px;
            left: 10px;
            max-width: none;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
    
    // Manual close
    notification.querySelector('.bundle-notification__close').addEventListener('click', () => {
      notification.remove();
    });
  }
}

// Initialize bundle when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const bundleContainer = document.querySelector('.product-bundle');
  if (bundleContainer) {
    new ProductBundle(bundleContainer);
  }
});