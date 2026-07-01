 document.addEventListener('DOMContentLoaded', function() {



  
  // Get delivery day settings from Liquid
  const minDays =  5;
  const maxDays = 15;
  
  // Calculate delivery dates
  function calculateDeliveryDates() {
    const today = new Date();
    
    // Calculate start date (minDays from now)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + minDays);
    
    // Calculate end date (maxDays from now)
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + maxDays);
    
    // Format dates
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const formattedStartDate = startDate.toLocaleDateString('en-US', options);
    const formattedEndDate = endDate.toLocaleDateString('en-US', options);
    
    // Update all date elements
    const startDateElements = document.querySelectorAll('#delivery-start-date, #modal-delivery-start-date');
    const endDateElements = document.querySelectorAll('#delivery-end-date, #modal-delivery-end-date, #modal-delivery-end-date2');
    
    startDateElements.forEach(function(element) {
      if(element) element.textContent = formattedStartDate;
    });
    
    endDateElements.forEach(function(element) {
      if(element) element.textContent = formattedEndDate;
    });
  }
  
  // Initialize dates
  calculateDeliveryDates();
  
  // Get modal elements
  const modal = document.getElementById('delivery-date-modal');
  const btn = document.getElementById('delivery-date-button');
  const closeBtn = document.getElementById('delivery-date-close');
  
  // Return if elements aren't found
  if (!modal || !btn || !closeBtn) {
    console.error('Delivery date elements not found');
    return;
  }
  
  // Toggle modal
  let isModalOpen = false;
  
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (isModalOpen) {
      modal.style.display = 'none';
      isModalOpen = false;
    } else {
      modal.style.display = 'block';
      isModalOpen = true;
    }
  });
  
  // Close modal when clicking X
  closeBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    modal.style.display = 'none';
    isModalOpen = false;
  });
  
  // Close when clicking outside
  document.addEventListener('click', function(e) {
    if (isModalOpen && !modal.contains(e.target) && e.target !== btn) {
      modal.style.display = 'none';
      isModalOpen = false;
    }
  });
  
  // Close when pressing ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isModalOpen) {
      modal.style.display = 'none';
      isModalOpen = false;
    }
  });
     });








      

