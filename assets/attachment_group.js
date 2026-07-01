class AttachmentBlock {
  constructor(container) {
    this.container = container;
    this.toggleBtn = this.container.querySelector('.attachment-toggle-btn');
    this.attachmentsContainer = this.container.querySelector('.attachments-container');
    this.cards = this.container.querySelectorAll('.attachment-card');
    this.isFirstBlock = this.container.dataset.isFirst === 'true';
    this.bindEvents();
  }

  bindEvents() {
    this.toggleBtn.addEventListener('click', () => this.toggle());
    this.cards.forEach(card => {
      card.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action) {
          this[this.camelCase(action)]?.(e.target.closest('[data-action]'), card);
        }
      });
      card.addEventListener('change', (e) => {
        const action = e.target.dataset.action;
        if (action === 'update-variant') {
          this.updateVariant(e.target, card);
        }
      });
    });
  }

  toggle() {
    const isExpanded = this.toggleBtn.getAttribute('aria-expanded') === 'true';
    this.toggleBtn.setAttribute('aria-expanded', !isExpanded);
    this.attachmentsContainer.classList.toggle('expanded', !isExpanded);
  }

  addAttachment(button, card) {
    const variantSelect = card.querySelector('.attachment-variant-select');
    const quantityInput = card.querySelector('[data-quantity-input]');
    const selectedOption = variantSelect.options ? variantSelect.options[variantSelect.selectedIndex] : variantSelect;
    const item = {
      variantId: variantSelect.value,
      productId: card.dataset.productId,
      title: button.dataset.productTitle,
      variantTitle: selectedOption.dataset.title,
      price: parseInt(selectedOption.dataset.price, 10),
      quantity: parseInt(quantityInput.value, 10)
    };
    document.dispatchEvent(new CustomEvent('add-attachment', { detail: item }));
    // Visual feedback
    const originalText = button.querySelector('.btn-text').textContent;
    button.querySelector('.btn-text').textContent = 'Added!';
    button.classList.add('is-added');
    setTimeout(() => {
      button.querySelector('.btn-text').textContent = originalText;
      button.classList.remove('is-added');
    }, 1500);
  }
  
  updateVariant(select, card) {
    const selectedOption = select.options[select.selectedIndex];
    const price = parseInt(selectedOption.dataset.price, 10);
    const moneyFormat = JSON.parse(document.getElementById('shopify-global-data')?.textContent || '{}').moneyFormat || `\${{amount}}`;
    card.querySelector('[data-price-container]').textContent = this.formatMoney(price, moneyFormat);
  }

  increaseQty(button, card) {
    const input = card.querySelector('[data-quantity-input]');
    input.value = parseInt(input.value, 10) + 1;
  }

  decreaseQty(button, card) {
    const input = card.querySelector('[data-quantity-input]');
    const currentVal = parseInt(input.value, 10);
    if (currentVal > 1) {
      input.value = currentVal - 1;
    }
  }

  formatMoney(cents, format) {
    if (typeof cents !== 'number' || typeof format !== 'string') return '';
    return format.replace(/\{\{\s*amount\s*\}\}/, (cents / 100).toFixed(2));
  }
  
  camelCase(str) {
    return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const containers = document.querySelectorAll('.attachment-group-wrapper');
  containers.forEach(container => new AttachmentBlock(container));
});



class GlobalAttachmentManager {
  constructor(container) {
    this.container = container;
    this.storageKey = 'global-attachment-state';

    const dataEl = document.getElementById('shopify-global-data');
    if (!dataEl) {
      console.error('GlobalAttachmentManager: Global data script tag not found.');
      return;
    }
    this.data = JSON.parse(dataEl.textContent);
    this.mainProduct = this.data.mainProduct;
    this.moneyFormat = this.data.moneyFormat;

    this.state = JSON.parse(sessionStorage.getItem(this.storageKey) || '{"selected": {}, "mainQuantity": 1}');

    this.elements = {
      summaryContainer: this.container.querySelector('[data-summary-items-container]'),
      summaryCount: this.container.querySelector('[data-summary-count]'),
      summaryTotal: this.container.querySelector('[data-summary-total]'),
      addToCartBtn: this.container.querySelector('[data-action="add-all-to-cart"]'),
      addToCartText: this.container.querySelector('[data-add-to-cart-text]'),
      placeholder: this.container.querySelector('[data-summary-placeholder]'),
      mainProductPrice: this.container.querySelector('[data-main-product-price]'),
      mainQuantityInput: this.container.querySelector('[data-main-product="true"]')
    };

    this.bindEvents();
    this.updateUI();
  }

  bindEvents() {
    document.addEventListener('add-attachment', (e) => this.addItem(e.detail));
    this.elements.addToCartBtn.addEventListener('click', () => this.addAllToCart());
    
    // Handle attachment item controls
    this.elements.summaryContainer.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action]');
        if (!button) return;
        const { action, variantId } = button.dataset;
        
        if (action === 'remove-summary-item') this.removeItem(variantId);
        if (action === 'increase-summary-qty') this.increaseQuantity(variantId);
        if (action === 'decrease-summary-qty') this.decreaseQuantity(variantId);
    });

    this.elements.summaryContainer.addEventListener('change', (e) => {
        const input = e.target.closest('[data-action="update-summary-qty"]');
        if (input) {
            this.updateQuantityFromInput(input.dataset.variantId, parseInt(input.value, 10));
        }
    });

    // Handle main product quantity controls
    this.container.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action]');
        if (!button) return;
        const { action } = button.dataset;
        
        if (action === 'increase-main-qty') this.increaseMainQuantity();
        if (action === 'decrease-main-qty') this.decreaseMainQuantity();
    });

    this.container.addEventListener('change', (e) => {
        const input = e.target.closest('[data-action="update-main-qty"]');
        if (input) {
            this.updateMainQuantityFromInput(parseInt(input.value, 10));
        }
    });
  }

  addItem(item) {
    if (this.state.selected[item.variantId]) {
      this.state.selected[item.variantId].quantity += item.quantity;
    } else {
      this.state.selected[item.variantId] = item;
    }
    this.saveState();
    this.updateUI();
  }

  removeItem(variantId) {
    if (this.state.selected[variantId]) {
      delete this.state.selected[variantId];
      this.saveState();
      this.updateUI();
    }
  }

  increaseQuantity(variantId) {
    if (this.state.selected[variantId]) {
      this.state.selected[variantId].quantity++;
      this.saveState();
      this.updateUI();
    }
  }

  decreaseQuantity(variantId) {
    if (this.state.selected[variantId] && this.state.selected[variantId].quantity > 1) {
      this.state.selected[variantId].quantity--;
      this.saveState();
      this.updateUI();
    }
  }

  updateQuantityFromInput(variantId, quantity) {
     if (this.state.selected[variantId] && quantity > 0) {
        this.state.selected[variantId].quantity = quantity;
        this.saveState();
        this.updateUI();
     }
  }

  // Main product quantity methods
  increaseMainQuantity() {
    this.state.mainQuantity++;
    this.saveState();
    this.updateUI();
  }

  decreaseMainQuantity() {
    if (this.state.mainQuantity > 1) {
      this.state.mainQuantity--;
      this.saveState();
      this.updateUI();
    }
  }

  updateMainQuantityFromInput(quantity) {
    if (quantity > 0) {
      this.state.mainQuantity = quantity;
      this.saveState();
      this.updateUI();
    }
  }

  addAllToCart() {
    this.elements.addToCartBtn.disabled = true;
    this.elements.addToCartText.textContent = 'Adding...';

    const items = [{ id: this.mainProduct.variantId, quantity: this.state.mainQuantity }];
    for (const variantId in this.state.selected) {
      items.push({
        id: variantId,
        quantity: this.state.selected[variantId].quantity
      });
    }

    fetch(window.Shopify.routes.root + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    })
    .then(response => {
      if (response.ok) {
        this.elements.addToCartText.textContent = 'Added!';
        sessionStorage.removeItem(this.storageKey); // Clear state on success
        window.location.href = '/cart';
      } else { throw new Error('Failed to add items.'); }
    })
    .catch(error => {
      console.error(error);
      this.elements.addToCartText.textContent = 'Error!';
      setTimeout(() => {
        this.elements.addToCartBtn.disabled = false;
        this.elements.addToCartText.textContent = 'Add All to Cart';
      }, 2000);
    });
  }

  updateUI() {
    this.elements.summaryContainer.innerHTML = '';
    let attachmentsTotal = 0;
    const selectedKeys = Object.keys(this.state.selected);

    this.elements.placeholder.style.display = selectedKeys.length === 0 ? 'block' : 'none';

    // Update main product quantity input and price
    if (this.elements.mainQuantityInput) {
      this.elements.mainQuantityInput.value = this.state.mainQuantity;
    }
    if (this.elements.mainProductPrice) {
      this.elements.mainProductPrice.textContent = this.formatMoney(this.mainProduct.price * this.state.mainQuantity);
    }

    selectedKeys.forEach(variantId => {
      const item = this.state.selected[variantId];
      attachmentsTotal += item.price * item.quantity;
      
      const itemEl = document.createElement('div');
      itemEl.className = 'summary-item';
      itemEl.innerHTML = `
        <div class="item-info">
          <div class="item-title">${item.title}</div>
          ${item.variantTitle !== 'Default Title' ? `<div class="item-variant">${item.variantTitle}</div>` : ''}
          <div class="summary-item-controls">
             <div class="summary-quantity-selector">
                <button type="button" class="summary-quantity-btn" data-action="decrease-summary-qty" data-variant-id="${variantId}" aria-label="Decrease quantity">-</button>
                <input type="number" class="summary-quantity-input" value="${item.quantity}" min="1" data-action="update-summary-qty" data-variant-id="${variantId}" aria-label="Quantity">
                <button type="button" class="summary-quantity-btn" data-action="increase-summary-qty" data-variant-id="${variantId}" aria-label="Increase quantity">+</button>
            </div>
            <button class="summary-remove-btn" data-action="remove-summary-item" data-variant-id="${variantId}">Remove</button>
          </div>
        </div>
        <div class="item-price">${this.formatMoney(item.price * item.quantity)}</div>
      `;
      this.elements.summaryContainer.appendChild(itemEl);
    });
    
    this.elements.summaryCount.textContent = `${selectedKeys.length} attachment${selectedKeys.length !== 1 ? 's' : ''} selected`;
    this.elements.summaryTotal.textContent = this.formatMoney((this.mainProduct.price * this.state.mainQuantity) + attachmentsTotal);
  }

  saveState() {
    sessionStorage.setItem(this.storageKey, JSON.stringify(this.state));
  }

  formatMoney(cents) {
    if (typeof cents !== 'number') return '';
    return this.moneyFormat.replace(/\{\{\s*amount\s*\}\}/, (cents / 100).toFixed(2));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('global-attachment-summary');
  if (container) {
    new GlobalAttachmentManager(container);
  }
});