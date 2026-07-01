(function() {
    const shopifyBackToTopBtn = document.getElementById('shopifyBackToTopBtn');
    let isBttVisible = false;

    function toggleBttVisibility() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const shouldShow = scrollTop > 300;

        if (shouldShow && !isBttVisible) {
            shopifyBackToTopBtn.classList.add('btt-visible');
            isBttVisible = true;
        } else if (!shouldShow && isBttVisible) {
            shopifyBackToTopBtn.classList.remove('btt-visible');
            isBttVisible = false;
        }
    }

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    window.addEventListener('scroll', toggleBttVisibility);
    shopifyBackToTopBtn.addEventListener('click', scrollToTop);

    shopifyBackToTopBtn.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            scrollToTop();
        }
    });

    shopifyBackToTopBtn.setAttribute('aria-label', 'Back to top');
    shopifyBackToTopBtn.setAttribute('role', 'button');
    shopifyBackToTopBtn.setAttribute('tabindex', '0');

    toggleBttVisibility();
})();


