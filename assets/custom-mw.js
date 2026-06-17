
document.addEventListener('DOMContentLoaded', function() {
  document.addEventListener('click', function(event) {

    if (event.target && event.target.tagName === 'IMG' && event.target.closest('.product-swatch')) {
      console.log("Image inside .product-swatch found");

      const swatchButton = event.target.closest('.product-swatch');
      
      const productId = swatchButton.getAttribute('data-product-id'), productWidthLength = swatchButton.getAttribute('product_width_length'), wearLayerThickness = swatchButton.getAttribute('wear_layer_thickness');

      const widthLengthSpan = document.querySelector(`.product-card__csm_width_length-${productId}`), thicknessSpan = document.querySelector(`.product-card__csm_thickness-${productId}`);

      if (widthLengthSpan) { widthLengthSpan.textContent = productWidthLength || '' } 
      if (thicknessSpan) { thicknessSpan.textContent = wearLayerThickness || ''  } 
    }
    else if (event.target && event.target.classList.contains('js-addsample')) {
      console.log('its add sample button')
      handleSampleButtonClick();
    }     
    else {
    }
  });

  function handleSampleButtonClick() {
    let sampleInterval = setInterval(() => { 
      if (doChangeInSelectMenu()) {
        clearInterval(sampleInterval); 
      }
    }, 1600);

    setTimeout(() => clearInterval(sampleInterval), 4000); // Stop after 4 seconds
  }

  // Function to handle changing the select menu
  function doChangeInSelectMenu() {
    const checkedButton = document.querySelector('.pdp-atc__group--model ul li input[checked]');
    const notCheckedButton = document.querySelector('.pdp-atc__group--model ul li input:not([checked])');

    console.log('SAMPLE', {
      checkedButton: checkedButton,
      notCheckedButton: notCheckedButton
    });

    if (notCheckedButton) {
      notCheckedButton.click();
    }

    if (checkedButton) {
      checkedButton.click();
    }

    return checkedButton && notCheckedButton;
  }
  
});



// const add_sample_buttons = document.querySelectorAll('.js-addsample');

// add_sample_buttons.forEach( b => {
//   b.addEventListener('click', () => { 
    
//     let sampleInterval = setInterval(() => { 
//       doChangeInSelectMenu() && clearInterval(sampleInterval); 
//     }, 1600 ) 

//     setTimeout( ()=> { clearInterval(sampleInterval) }, 4000 );
    
//   });  
// });

// function doChangeInSelectMenu() {
//     const checkedButton = document.querySelector('.pdp-atc__group--model ul li input[checked]');
//     const NotcheckedButton = document.querySelector('.pdp-atc__group--model ul li input:not([checked])');

//     console.log('SAMPLE', {
//       checkedButton: checkedButton,
//       NotcheckedButton: NotcheckedButton
//     })

//     NotcheckedButton?.click();
//     checkedButton?.click();

//     if( checkedButton && NotcheckedButton){ return true }
// }

// document.addEventListener('DOMContentLoaded', function() {
//   // Get all product swatch buttons
//   const swatchButtons = document.querySelectorAll('.product-swatch');

//   // Loop through each button and add a click event listener
//   swatchButtons.forEach(button => {
//     button.addEventListener('click', function() {
//       // Get the product ID from the button's data attribute
//       const productId = button.getAttribute('data-product-id');
//       const productWidthLength = button.getAttribute('product_width_length');
//       const wearLayerThickness = button.getAttribute('wear_layer_thickness');

//       console.log('productId: ', productId, "productWidthLength: ", productWidthLength, 'wearLayerThickness: ', wearLayerThickness)

//       // Find the width/length and thickness spans for this specific product using the product ID
//       const widthLengthSpan = document.querySelector(`.product-card__csm_width_length-${productId}`);
//       const thicknessSpan = document.querySelector(`.product-card__csm_thickness-${productId}`);

//       // Update the content of the spans if they exist
//       if (widthLengthSpan) {
//         widthLengthSpan.textContent = productWidthLength || ''; // Update the width/length span
//       }
//       if (thicknessSpan) {
//         thicknessSpan.textContent = wearLayerThickness || ''; // Update the thickness span
//       }
//     });
//   });
// });


(function () {
  let previousPathname = window.location.pathname;

  const resetTrackOrder = () => {
    localStorage.setItem('TRACK_ORDER', JSON.stringify([]));
  };

  // On first load
  resetTrackOrder();

  // Watch history changes
  const wrapHistoryMethod = (type) => {
    const original = history[type];
    history[type] = function () {
      const result = original.apply(this, arguments);
      const newPathname = window.location.pathname;

      // Only reset if path (not query string) changed
      if (newPathname !== previousPathname) {
        resetTrackOrder();
        previousPathname = newPathname;
      }

      return result;
    };
  };

  wrapHistoryMethod('pushState');
  wrapHistoryMethod('replaceState');

  // Also handle browser back/forward
  window.addEventListener('popstate', () => {
    const newPathname = window.location.pathname;

    if (newPathname !== previousPathname) {
      resetTrackOrder();
      previousPathname = newPathname;
    }
  });
})();

// Format Reviews.io rating display
document.addEventListener('DOMContentLoaded', function() {
  const formatRatingDisplay = () => {
    const ratingSnippets = document.querySelectorAll('.ruk_rating_snippet.normal');
    ratingSnippets.forEach(snippet => {
      // Check for existing rating span
      const existingRating = snippet.querySelector('.ruk-rating-snippet-rating');
      if (existingRating) {
        // If there are multiple rating spans, remove extras
        const allRatingSpans = snippet.querySelectorAll('.ruk-rating-snippet-rating');
        if (allRatingSpans.length > 1) {
          // Keep first one, remove the rest
          for (let i = 1; i < allRatingSpans.length; i++) {
            allRatingSpans[i].remove();
          }
        }
        return;
      }

      if (snippet.title) {
        // Extract rating and review count from title
        const matches = snippet.title.match(/(\d+\.\d+)\s+Stars\s+-\s+(\d+)\s+Reviews/);
        if (matches) {
          const [_, rating, reviewCount] = matches;
          
          // Find the review count span
          const countSpan = snippet.querySelector('.ruk-rating-snippet-count');
          if (countSpan) {
            // Update format to: rating (count Reviews)
            countSpan.textContent = `(${reviewCount} Reviews)`;
            
            // Insert single rating span before the count
            const ratingSpan = document.createElement('span');
            ratingSpan.textContent = `${rating} `;
            ratingSpan.classList.add('ruk-rating-snippet-rating');
            countSpan.parentNode.insertBefore(ratingSpan, countSpan);
          }
        }
      }
    });
  };

  const formatStickyRatingDisplay = () => {
    const ratingSnippets = document.querySelectorAll('.ruk_rating_snippet.sticky');
    ratingSnippets.forEach(snippet => {
      // Check for existing rating span
      const existingRating = snippet.querySelector('.ruk-rating-snippet-rating');
      if (existingRating) {
        // If there are multiple rating spans, remove extras
        const allRatingSpans = snippet.querySelectorAll('.ruk-rating-snippet-rating');
        if (allRatingSpans.length > 1) {
          // Keep first one, remove the rest
          for (let i = 1; i < allRatingSpans.length; i++) {
            allRatingSpans[i].remove();
          }
        }
        return;
      }

      if (snippet.title) {
        // Extract rating and review count from title
        const matches = snippet.title.match(/(\d+\.\d+)\s+Stars\s+-\s+(\d+)\s+Reviews/);
        if (matches) {
          const [_, rating, reviewCount] = matches;
          
          // Find the review count span
          const countSpan = snippet.querySelector('.ruk-rating-snippet-count');
          if (countSpan) {
            // Update format to: rating (count Reviews)
            countSpan.textContent = `${reviewCount} Reviews`;
            
            // Insert single rating span before the count
            const ratingSpan = document.createElement('span');
            ratingSpan.textContent = `${rating} out of `;
            ratingSpan.classList.add('ruk-rating-snippet-rating');
            countSpan.parentNode.insertBefore(ratingSpan, countSpan);
          }
        }
      }
    });
  };

  // Run on initial load
  formatRatingDisplay();
  formatStickyRatingDisplay();

  // Create observer to handle dynamically loaded snippets
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-done') {
        formatRatingDisplay();
        formatStickyRatingDisplay();
      }
    });
  });

  // Observe document body for changes
  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ['data-done']
  });
});


// Apply styles to Elements Widget badges
const applyBadgeStyles = () => {
  const targetItems = document.querySelectorAll('.c-meta__authorDetails');
  // Find badge elements
  targetItems.forEach(item => {
    const badges = item.querySelectorAll('.ElementsWidget-prefix .R-BadgeElement');
    const badgeIcons = item.querySelectorAll('.ElementsWidget-prefix .R-BadgeElement .R-BadgeElement__icon .cssVar-badgeElement__icon');
    const badgeTexts = item.querySelectorAll('.ElementsWidget-prefix .R-BadgeElement .cssVar-badgeElement__text');

    item.style.setProperty('margin-bottom', '6px', 'important');

    badges.forEach(badge => {
      badge.style.backgroundColor = '#faaf4f';
      badge.style.padding = '4px 10px';
      badge.style.borderRadius = '9px';
      badge.style.marginBottom = '10px';
    });
  
    badgeIcons.forEach(icon => {
      icon.style.color = 'white';
    });

    badgeTexts.forEach(text => {
      text.style.fontSize = '12px';
      text.style.color = 'white';
      text.style.lineHeight = '12px';
      text.style.marginTop = '1px';
    });
  });

};

// Run initially
applyBadgeStyles();

// Set up interval to keep checking and applying styles
setInterval(applyBadgeStyles, 1000);