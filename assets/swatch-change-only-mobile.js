!function () {
  "use strict";

  // ── Utility: convert iterable/array-like to real array ──────────────
  function toArray(val) {
    if (Array.isArray(val)) return val.slice();
    if (typeof Symbol !== "undefined" && val != null && val[Symbol.iterator] || val != null && val["@@iterator"]) return Array.from(val);
    if (typeof val === "string") return val.split("");
    return [];
  }

  // ── Wait for DOM elements matching a selector ────────────────────────
  function waitForElements(selector, root, timeout) {
    root = root || document;
    timeout = timeout || 10000;
    return new Promise(function (resolve, reject) {
      var found = root.querySelectorAll(selector);
      if (found.length > 0) {
        resolve(toArray(found));
      } else {
        var timer;
        var observer = new MutationObserver(function () {
          var found = root.querySelectorAll(selector);
          if (found.length > 0) {
            clearTimeout(timer);
            resolve(toArray(found));
            observer.disconnect();
          }
        });
        observer.observe(root, { childList: true, subtree: true });
        timer = setTimeout(function () {
          observer.disconnect();
          reject(new Error("Timeout: Elements not found."));
        }, timeout);
      }
    });
  }

  // ── Swap product card image to top-down view based on active swatch ──
  function swapToTopDownImage(linkEl) {
    var card = linkEl.closest(".product-card");
    if (!card) return;

    var imgEl = card.querySelector(".product-card__product-img");
    if (!imgEl) return;

    var activeSwatch = card.querySelector(".product-swatch.active");
    if (!activeSwatch) return;

    var imageUrlsRaw = card.dataset.imageUrls;
    if (!imageUrlsRaw) return;

    var imageUrls = [];
    try {
      imageUrls = JSON.parse(imageUrlsRaw);
    } catch (e) {
      return;
    }

    var swatchImage = activeSwatch.dataset.image;
    if (!swatchImage) return;

    // Clean up the swatch filename to find its top-down match
    var cleanedName = swatchImage
      .split("/").pop()
      .replace(/\?.*/,         "")   // remove query string
      .toLowerCase()
      .replace(/^provence_cutsample_/i, "")  // strip known prefix
      .replace(/^([a-z]+)\./i, "$1_")        // "name.ext" → "name_"
      .replace(/_cut_sample.*$/i, "")        // strip cut sample suffix
      .replace(/_cut.*$/i,        "")        // strip _cut suffix
      .replace(/_[a-f0-9-]{20,}.*$/i, "");   // strip hash suffix

    // Find a top-down image URL that matches the cleaned name
    var topDownUrl = imageUrls.find(function (url) {
      var filename = url.split("/").pop().replace(/\?.*/, "").toLowerCase();
      var withoutTopDown = filename.replace(/_top[_-]down.*$/i, "");
      return withoutTopDown === cleanedName &&
        (filename.includes("top_down") || filename.includes("top-down"));
    });

    if (!topDownUrl) return;

    // Only update if not already showing this image
    if (imgEl.src.indexOf(topDownUrl.split("?")[0]) === -1) {
      imgEl.src = topDownUrl;
      imgEl.srcset = topDownUrl;
    }
  }

  // ── Process a list of product card link elements ─────────────────────
  function processLinks(links) {
    links.forEach(function (linkEl) {
      if (linkEl.dataset.topDownProcessed === "true") return;
      linkEl.dataset.topDownProcessed = "true";
      swapToTopDownImage(linkEl);
    });
  }

  // ── Main init: wait for cards, swap images, observe changes ──────────
  function init(bodyEl) {
    var selector = [
      "#collection-grid .collection-grid__loop .product-card .product-card__image a",
      "#collection-grid [class*=\"collection-grid__loop\"] .product-card .product-card__image a"
    ].join(", ");

    waitForElements(selector, bodyEl, 30000).then(function (links) {
      if (!links.length) return;

      var collectionGrid = bodyEl.querySelector("#js-collection");
      if (!collectionGrid) return;

      // Initial pass
      processLinks(links);

      // Watch for swatch changes and newly added cards (infinite scroll)
      new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {

          // Swatch change updated the img src → re-swap
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "src" &&
            mutation.target.matches(".product-card__product-img")
          ) {
            var imageWrapper = mutation.target.closest(".product-card__image");
            if (!imageWrapper) return;
            var linkEl = imageWrapper.querySelector("a");
            if (!linkEl) return;
            if (linkEl.dataset.topDownSrcProcessed === "true") return;
            linkEl.dataset.topDownSrcProcessed = "true";
            swapToTopDownImage(linkEl);
            setTimeout(function () {
              delete linkEl.dataset.topDownSrcProcessed;
            }, 0);
          }

          // New cards added to DOM (e.g. pagination / infinite scroll)
          if (mutation.type === "childList") {
            mutation.addedNodes.forEach(function (node) {
              if (node.nodeType !== 1) return;
              var newLinks = node.matches(".product-card__image a")
                ? [node]
                : toArray(node.querySelectorAll(".product-card__image a"));
              processLinks(newLinks);
            });
          }
        });
      }).observe(collectionGrid, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["src"]
      });
    });
  }

  // ── Allowed collection pages ─────────────────────────────────────────
  function isAllowedPage(pathname) {
    return [
      "/collections/modin-luxury-vinyl-plank",
      "/collections/arista-laminate",
      "/collections/silvan-hardwood",
      "/collections/provence-natural-hardwood",
      "/collections/all-floors"
    ].some(function (path) {
      return pathname.includes(path);
    });
  }

  // ── Bootstrap: only run on mobile + allowed pages ────────────────────
  if (window.innerWidth <= 767 && isAllowedPage(window.location.pathname)) {
    if (document.body) {
      init(document.body);
    } else {
      document.addEventListener("DOMContentLoaded", function () {
        init(document.body);
      });
    }
  }

}();