










      function openDrawer() {
      document.getElementById('bundleDrawer').classList.add('active');
      document.querySelector('.drawer-overlay').classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      document.getElementById('bundleDrawer').classList.remove('active');
      document.querySelector('.drawer-overlay').classList.remove('active');
      document.body.style.overflow = '';
    }

    function adjustQty(inputId, delta) {
      const input = document.getElementById(inputId);
      let value = parseInt(input.value) || 1;
      value = Math.max(1, value + delta);
      input.value = value;
    }

    function addToCart(variantId, qtyInputId, btnId) {
      const qty = document.getElementById(qtyInputId).value;
      const btn = document.getElementById(btnId);
      const spinner = btn.querySelector('.add-btn-spinner');

      btn.classList.add('loading1');
      btn.disabled = true;

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: parseInt(qty) })
      })
      .then(res => res.json())
      .then(data => {
        showPopup();
        btn.classList.remove('loading1');
        btn.disabled = false;
      })
      .catch(err => {
        alert('Failed to add product');
        btn.classList.remove('loading1');
        btn.disabled = false;
      });
    }

    function showPopup() {
      const popup = document.getElementById('popupMessage');
      popup.classList.add('show');
      setTimeout(() => popup.classList.remove('show'), 3000);
    }













   function copyCoupon(couponCode, button) {
    navigator.clipboard.writeText(couponCode).then(function() {
      const notification = button.parentElement.querySelector('.copied-notification');
      notification.classList.add('show');
      const originalText = button.innerHTML;
      button.innerHTML = `
        <svg class="copy-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        Copied!
      `;
      button.style.background = '#28a745';
      setTimeout(function() {
        notification.classList.remove('show');
        button.innerHTML = originalText;
        button.style.background = '#0066cc';
      }, 2000);
    }).catch(function(err) {
      const textArea = document.createElement('textarea');
      textArea.value = couponCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      const notification = button.parentElement.querySelector('.copied-notification');
      notification.classList.add('show');
      setTimeout(function() {
        notification.classList.remove('show');
      }, 2000);
    });
  }




  document.addEventListener('DOMContentLoaded', () => {

  const stickyBar = document.getElementById('sticky-cart-bar');
  const stickyBtn = document.getElementById('sticky-add-to-cart-btn');
  const qtyInput = document.getElementById('sticky-quantity');
  const plusBtn = document.querySelector('.sticky-qty-plus');
  const minusBtn = document.querySelector('.sticky-qty-minus');

  /* 🔗 MAIN PRODUCT FORM (YOUR CODE) */
  const productForm = document.querySelector('.product-single__form');

  /* ---------------- Quantity Controls ---------------- */
  const clampQty = val => Math.max(1, Math.min(999, val));

  plusBtn?.addEventListener('click', () => {
    qtyInput.value = clampQty(+qtyInput.value + 1);
  });

  minusBtn?.addEventListener('click', () => {
    qtyInput.value = clampQty(+qtyInput.value - 1);
  });

  qtyInput?.addEventListener('input', () => {
    qtyInput.value = clampQty(+qtyInput.value || 1);
  });

  /* ---------------- Sticky Visibility ---------------- */
  function toggleSticky() {
    const mainAddBtn = productForm?.querySelector('[data-add-to-cart]');
    if (!mainAddBtn) return;

    const rect = mainAddBtn.getBoundingClientRect();
    const visible = rect.top >= 0 && rect.bottom <= window.innerHeight;

    stickyBar.classList.toggle('sticky-cart-visible', !visible);
  }

  window.addEventListener('scroll', toggleSticky);
  window.addEventListener('resize', toggleSticky);
  setTimeout(toggleSticky, 150);

  /* ---------------- Get Variant ID ---------------- */
  function getVariantId() {
    const select = productForm.querySelector('select[name="id"]');
    if (select) return select.value;

    const radio = productForm.querySelector('input[name="id"]:checked');
    if (radio) return radio.value;

    const hidden = productForm.querySelector('input[name="id"]');
    return hidden ? hidden.value : null;
  }

  /* ---------------- Add to Cart ---------------- */
  stickyBtn?.addEventListener('click', () => {
    const variantId = getVariantId();
    if (!variantId) {
      alert('Please select a variant');
      return;
    }

    stickyBtn.classList.add('loading');
    stickyBtn.disabled = true;

    const formData = new FormData();
    formData.append('id', variantId);
    formData.append('quantity', qtyInput.value);

    /* Copy extra properties (gift card, notes, etc.) */
    productForm.querySelectorAll('input, select, textarea').forEach(el => {
      if (!el.name || ['id', 'quantity'].includes(el.name)) return;

      if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
      formData.append(el.name, el.value);
    });

    fetch('/cart/add.js', {
      method: 'POST',
      body: formData
    })
    .then(r => r.json())
    .then(() => {
      stickyBtn.querySelector('.sticky-btn-text').textContent = 'Added ✓';
      document.dispatchEvent(new CustomEvent('cart:updated'));

      setTimeout(() => {
        window.location.href = '/cart';
      }, 800);
    })
    .catch(() => {
      stickyBtn.classList.remove('loading');
      stickyBtn.disabled = false;
      stickyBtn.querySelector('.sticky-btn-text').textContent = 'Error – Try Again';
    });
  });

});