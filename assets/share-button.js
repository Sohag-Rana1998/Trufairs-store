

function toggleShareDropdown() {
  const dropdown = document.getElementById('shareDropdown');
  dropdown.classList.toggle('active');
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.social-sharing-wrapper')) {
      dropdown.classList.remove('active');
    }
  });
}

function copyShareLink() {
  const shareLink = document.getElementById('shareLink');
  const copyBtn = document.getElementById('copyBtn');
  
  shareLink.select();
  shareLink.setSelectionRange(0, 99999); // For mobile devices
  
  navigator.clipboard.writeText(shareLink.value).then(function() {
    copyBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,6 9,17 4,12"/>
      </svg>
      Copied!
    `;
    copyBtn.classList.add('copied');
    
    setTimeout(function() {
      copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="m5 15-4-4 4-4"/>
        </svg>
        Copy
      `;
      copyBtn.classList.remove('copied');
    }, 2000);
  }).catch(function(err) {
    console.error('Could not copy text: ', err);
  });
}

// Close dropdown on escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    document.getElementById('shareDropdown').classList.remove('active');
  }
});
