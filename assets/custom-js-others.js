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
      button.style.background = '#000000';
      setTimeout(function() {
        notification.classList.remove('show');
        button.innerHTML = originalText;
        button.style.background = '#000000';
        button.style.color = '#ffffff';
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


    var klaviyo = klaviyo || [];
    klaviyo.init({
      account: "XQxD5g",
      platform: "shopify"
    });
    klaviyo.enable("backinstock",{ 
    trigger: {
      product_page_text: "Notify Me When Available",
      product_page_class: "button",
      product_page_text_align: "center",
      product_page_margin: "0px",
      replace_anchor: false
    },
    modal: {
     headline: "{product_name}",
     body_content: "Register to receive a notification when this item comes back in stock.",
     email_field_label: "Email",
     button_label: "Notify me when available",
     subscription_success_label: "You're in! We'll let you know when it's back.",
     footer_content: '',
     additional_styles: "@import url('https://fonts.googleapis.com/css?family=Helvetica+Neue');",
     drop_background_color: "#000",
     background_color: "#fff",
     text_color: "#222",
     button_text_color: "#fff",
     button_background_color: "#000",
     close_button_color: "#ccc",
     error_background_color: "#fcd6d7",
     error_text_color: "#C72E2F",
     success_background_color: "#d3efcd",
     success_text_color: "#1B9500"
    }
  });
 
