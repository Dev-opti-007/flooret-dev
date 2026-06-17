document.addEventListener('DOMContentLoaded', () => {
  const modalEl = document.getElementById('install-modal');
  const openBtn = document.getElementById('open-install-modal');
  const closeBtn = modalEl?.querySelector('.install-modal__close');

  if (!modalEl || !openBtn || !closeBtn) return;

  function openModal() {
    setTimeout(()=>{adjustInputPaddingForUnits();},1000);
    modalEl.classList.remove('hidden');
    document.documentElement.classList.add('modal-open');
  }

  function closeModal() {
    modalEl.classList.add('hidden');
    document.documentElement.classList.remove('modal-open');
  }

  openBtn.addEventListener('click', () => {
    openModal();
    // optionally lazy-load or re-filter modal content here
    if(window.innerWidth < 768) {
      
  
    const initialSlideIndex = $('.tier_card .active').parent().index();
            $('.tier-grid').slick({
                dots: true,
                infinite: true,
                slidesToShow: 1,
                slidesToScroll: 1,
                initialSlide: initialSlideIndex,
                autoplay: false,
                arrows: false,
                swipeToSlide: true,
                draggable: true,
              adaptiveHeight: true
            });
        }
  });

  closeBtn.addEventListener('click', closeModal);

  // Close on ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Close when clicking outside modal
  modalEl.addEventListener('click', e => {
    if (e.target === modalEl) closeModal();
  });
});
