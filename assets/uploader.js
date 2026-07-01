(() => {
  const config = window.ShopifyVariantUploader || {};
  const proxyBase = config.proxyBase || '/apps/variant-media';

  const els = {
    searchInput: document.querySelector('[data-svmu-search]'),
    searchButton: document.querySelector('[data-svmu-search-button]'),
    searchResults: document.querySelector('[data-svmu-search-results]'),
    selectedVariant: document.querySelector('[data-svmu-selected-variant]'),
    existingAssets: document.querySelector('[data-svmu-existing-assets]'),
    status: document.querySelector('[data-svmu-status]'),
    dropzone: document.querySelector('[data-svmu-dropzone]'),
    fileInput: document.querySelector('[data-svmu-file-input]'),
    previewList: document.querySelector('[data-svmu-preview-list]'),
    submitButton: document.querySelector('[data-svmu-submit]'),
    progress: document.querySelector('[data-svmu-progress]')
  };

  const state = {
    selectedVariantId: '',
    selectedVariantLabel: '',
    files: []
  };

  function setStatus(message, kind = 'info') {
    els.status.className = `svmu-status is-${kind}`;
    els.status.textContent = message;
    els.status.classList.remove('svmu-hidden');
  }

  function clearStatus() {
    els.status.classList.add('svmu-hidden');
    els.status.textContent = '';
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  async function api(path, options = {}) {
    const response = await fetch(`${proxyBase}${path}`, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      throw new Error(data?.error?.message || `Request failed (${response.status})`);
    }
    return data;
  }

  function renderSearchResults(items) {
    if (!items.length) {
      els.searchResults.innerHTML = '<div class="svmu-empty">No variants found.</div>';
      return;
    }

    els.searchResults.innerHTML = items
      .map(
        (item) => `
          <button type="button" class="svmu-result" data-variant-id="${escapeHtml(item.variantId)}" data-variant-label="${escapeHtml(
          `${item.productTitle} — ${item.variantTitle || 'Default'}`
        )}">
            <strong>${escapeHtml(item.productTitle)}</strong>
            <div>${escapeHtml(item.variantTitle || 'Default')}</div>
            <div class="svmu-small">SKU: ${escapeHtml(item.sku || 'N/A')}</div>
          </button>`
      )
      .join('');
  }

  async function searchVariants() {
    const q = els.searchInput.value.trim();
    if (q.length < 2) {
      setStatus('Enter at least 2 characters to search variants.', 'error');
      return;
    }

    clearStatus();
    setStatus('Searching variants…', 'info');
    const data = await api(`/variants/search?q=${encodeURIComponent(q)}`);
    renderSearchResults(data.items || []);
    setStatus(`Found ${data.items.length} variant(s).`, 'success');
  }

  function inferStartNumber() {
    const existingNumbers = [...document.querySelectorAll('[data-existing-number]')].map((el) => Number(el.dataset.existingNumber));
    const maxExisting = existingNumbers.length ? Math.max(...existingNumbers) : 0;
    return maxExisting + 1;
  }

  function acceptFiles(fileList) {
    const startNumber = inferStartNumber();
    const incoming = Array.from(fileList).map((file, index) => ({
      file,
      fileNumber: startNumber + index,
      previewUrl: URL.createObjectURL(file)
    }));
    state.files = [...state.files, ...incoming];
    renderPreviews();
  }

  function renderPreviews() {
    if (!state.files.length) {
      els.previewList.innerHTML = '<div class="svmu-empty">No files selected yet.</div>';
      return;
    }

    els.previewList.innerHTML = `
      <div class="svmu-preview-grid">
        ${state.files
          .map((row, index) => {
            const isVideo = row.file.type.startsWith('video/');
            return `
              <div class="svmu-preview-item">
                <div class="svmu-thumb">
                  ${
                    isVideo
                      ? `<video src="${row.previewUrl}" muted playsinline></video>`
                      : `<img src="${row.previewUrl}" alt="Preview">`
                  }
                </div>
                <strong>${escapeHtml(row.file.name)}</strong>
                <label class="svmu-label">File number</label>
                <input class="svmu-number-input" min="1" type="number" value="${row.fileNumber}" data-file-number-index="${index}">
                <div class="svmu-small">${Math.round(row.file.size / 1024)} KB</div>
                <button type="button" class="svmu-button svmu-button--ghost" data-remove-file="${index}">Remove</button>
              </div>`;
          })
          .join('')}
      </div>`;
  }

  async function loadVariantAssets() {
    if (!state.selectedVariantId) return;
    setStatus('Loading existing uploaded files…', 'info');
    const data = await api(`/variants/${encodeURIComponent(state.selectedVariantId)}/assets`);

    els.selectedVariant.innerHTML = `
      <strong>${escapeHtml(data.variant.product.title)}</strong>
      <div>${escapeHtml(data.variant.title || 'Default')}</div>
      <div class="svmu-small">SKU: ${escapeHtml(data.variant.sku || 'N/A')}</div>`;

    if (!data.records.length) {
      els.existingAssets.innerHTML = '<div class="svmu-empty">No uploaded media found for this variant yet.</div>';
    } else {
      els.existingAssets.innerHTML = `
        <div class="svmu-assets-grid">
          ${data.records
            .map((item) => {
              const isVideo = String(item.mimeType || '').startsWith('video/') || /\.mp4|\.mov|\.webm$/i.test(item.url);
              return `
                <div class="svmu-asset-item">
                  <div class="svmu-thumb">
                    ${
                      isVideo
                        ? `<video src="${item.url}" controls playsinline></video>`
                        : `<img src="${item.url}" alt="Existing uploaded asset">`
                    }
                  </div>
                  <strong>#${item.fileNumber}</strong>
                  <div class="svmu-small" data-existing-number="${item.fileNumber}">${escapeHtml(item.filename || item.url)}</div>
                </div>`;
            })
            .join('')}
        </div>`;
    }

    setStatus(`Variant selected: ${state.selectedVariantLabel}`, 'success');
  }

  async function submitUpload() {
    if (!state.selectedVariantId) {
      setStatus('Select a variant first.', 'error');
      return;
    }
    if (!state.files.length) {
      setStatus('Select one or more files first.', 'error');
      return;
    }

    const seenNumbers = new Set();
    for (const row of state.files) {
      if (!Number.isInteger(row.fileNumber) || row.fileNumber < 1) {
        setStatus('Every file needs a positive integer file number.', 'error');
        return;
      }
      if (seenNumbers.has(row.fileNumber)) {
        setStatus(`Duplicate file number detected: ${row.fileNumber}`, 'error');
        return;
      }
      seenNumbers.add(row.fileNumber);
    }

    const form = new FormData();
    form.append('variantId', state.selectedVariantId);
    form.append('fileMap', JSON.stringify(state.files.map((row) => ({ fileNumber: row.fileNumber }))));
    state.files.forEach((row) => form.append('files', row.file));

    els.submitButton.disabled = true;
    els.progress.textContent = 'Uploading files to Shopify. Videos can take longer because Shopify processes files asynchronously.';
    setStatus('Uploading files…', 'info');

    try {
      const data = await api('/upload', { method: 'POST', body: form });
      setStatus(`Upload complete. ${data.uploaded.length} file(s) processed. Replacement mode: ${data.replacementMode}.`, 'success');
      els.progress.textContent = '';
      state.files.forEach((row) => URL.revokeObjectURL(row.previewUrl));
      state.files = [];
      renderPreviews();
      await loadVariantAssets();
    } catch (error) {
      setStatus(error.message, 'error');
      els.progress.textContent = '';
    } finally {
      els.submitButton.disabled = false;
    }
  }

  els.searchButton?.addEventListener('click', () => searchVariants().catch((error) => setStatus(error.message, 'error')));
  els.searchInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      searchVariants().catch((error) => setStatus(error.message, 'error'));
    }
  });

  els.searchResults?.addEventListener('click', (event) => {
    const target = event.target.closest('[data-variant-id]');
    if (!target) return;
    state.selectedVariantId = target.dataset.variantId;
    state.selectedVariantLabel = target.dataset.variantLabel;
    document.querySelectorAll('.svmu-result').forEach((el) => el.classList.remove('is-active'));
    target.classList.add('is-active');
    loadVariantAssets().catch((error) => setStatus(error.message, 'error'));
  });

  els.dropzone?.addEventListener('click', () => els.fileInput.click());
  els.fileInput?.addEventListener('change', (event) => acceptFiles(event.target.files));

  ['dragenter', 'dragover'].forEach((type) =>
    els.dropzone?.addEventListener(type, (event) => {
      event.preventDefault();
      els.dropzone.classList.add('is-dragover');
    })
  );

  ['dragleave', 'drop'].forEach((type) =>
    els.dropzone?.addEventListener(type, (event) => {
      event.preventDefault();
      els.dropzone.classList.remove('is-dragover');
    })
  );

  els.dropzone?.addEventListener('drop', (event) => acceptFiles(event.dataTransfer.files));

  els.previewList?.addEventListener('input', (event) => {
    if (event.target.matches('[data-file-number-index]')) {
      const index = Number(event.target.dataset.fileNumberIndex);
      state.files[index].fileNumber = Number(event.target.value);
    }
  });

  els.previewList?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-file]');
    if (!button) return;
    const index = Number(button.dataset.removeFile);
    URL.revokeObjectURL(state.files[index].previewUrl);
    state.files.splice(index, 1);
    renderPreviews();
  });

  els.submitButton?.addEventListener('click', () => submitUpload());
  renderPreviews();
})();
