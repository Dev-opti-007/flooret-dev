if (!window.fr24TrimUpsellBooted) {
  window.fr24TrimUpsellBooted = true;

  // ─── FETCH + XHR INTERCEPTOR ──────────────────────────────────────────────
  if (!window.fr24FetchIntercepted) {
    window.fr24FetchIntercepted = true;
    window.fr24LastAddedBoxTitle = null;
    window.fr24LastAddedBoxVariantTitle = undefined;
    window.fr24IsAddingTrim = false;

    function fr24HandleCartAddResponse(data) {
      if (!data) return;

      const productTitle = (data.product_title || data.title || "").trim();
      if (!productTitle) return;

      const variantTitle = (data.variant_title || "").trim();
      const optionValues = [data.option1, data.option2, data.option3]
        .filter(Boolean)
        .map(v => String(v).trim());

      const isBoxVariant =
        variantTitle.includes("Box") ||
        optionValues.some(o => o === "Box");

      if (!isBoxVariant) return;

      window.fr24LastAddedBoxTitle = productTitle;
      window.fr24LastAddedBoxVariantTitle = variantTitle || optionValues.join(" / ");

      console.log(
        "TrimUpsell: Captured via",
        data._source || data.source,
        "-",
        window.fr24LastAddedBoxTitle,
        window.fr24LastAddedBoxVariantTitle
      );
    }

    const _origFetch = window.fetch;
    window.fetch = function (...args) {
      const url = typeof args[0] === "string" ? args[0] : (args[0]?.url || "");
      const promise = _origFetch.apply(this, args);
      if (url.includes("/cart/add") && !window.fr24IsAddingTrim) {
        promise
          .then((res) => res.clone().json())
          .then((data) => {
            data._source = "fetch";
            fr24HandleCartAddResponse(data);
          })
          .catch(() => {});
      }
      return promise;
    };

    const _origXHROpen = XMLHttpRequest.prototype.open;
    const _origXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this._fr24ReqUrl = String(url || "");
      return _origXHROpen.apply(this, [method, url, ...rest]);
    };

    XMLHttpRequest.prototype.send = function (...args) {
      if (this._fr24ReqUrl && this._fr24ReqUrl.includes("/cart/add") && !window.fr24IsAddingTrim) {
        this.addEventListener("load", function () {
          try {
            const data = JSON.parse(this.responseText);
            data._source = "XHR";
            fr24HandleCartAddResponse(data);
          } catch (e) {}
        });
      }
      return _origXHRSend.apply(this, args);
    };
  }

  // ─── ATC CLICK CAPTURE ────────────────────────────────────────────────────
  document.addEventListener("click", function (e) {
    const atcBtn = e.target.closest("#addtocart");
    if (!atcBtn) return;

    const selected = window.productInfo && window.productInfo.selectedVariant;
    const handle = document.querySelector(".m-product-form")?.dataset?.handle;

    if (!selected) {
      console.warn("TrimUpsell: No selectedVariant on window.productInfo, capture skipped");
      return;
    }

    const isBoxVariant = [selected.option1, selected.option2, selected.option3]
      .some(opt => opt && String(opt).trim() === "Box");
    if (!isBoxVariant) return;

    const productName = document.querySelector(".js-product-name")?.textContent?.trim() || handle || "";
    const variantText = selected.title || [selected.option1, selected.option2, selected.option3].filter(Boolean).join(" / ");

    window.fr24LastAddedBoxTitle = productName;
    window.fr24LastAddedBoxVariantTitle = variantText;

    console.log(
      "TrimUpsell: Captured at click:",
      window.fr24LastAddedBoxTitle,
      window.fr24LastAddedBoxVariantTitle
    );
  });

  // ─── MODIN — variant-based product maps ───────────────────────────────────
  const MODIN_PRODUCT_MAP = {
    signature: [
      { name:"TrueStep™ Stair Tread", collection:"Modin", link: "https://www.flooret.com/products/truestep-stair-treads", image:"https://www.flooret.com/cdn/shop/files/TrueStepRoundTreadHero.webp"},
      { name:"Signature TruePlank™ Square Nosing", collection:"Modin", link: "https://www.flooret.com/products/signature-tru-plank-square-nosing-48-60", image:"https://www.flooret.com/cdn/shop/files/TrueStep_Sig_Square.webp"},
      { name:"Signature TruePlank™ Round Nosing", collection:"Modin", link: "https://www.flooret.com/products/signature-truplank-round-nosing-48-60", image: "https://www.flooret.com/cdn/shop/files/TrueStep_Sig_Round.webp"},
      { name:'Base TruePlank™ Nosing 48"', collection:"Modin", link: "https://www.flooret.com/products/base-truplank-round-nosing-48", image:"https://www.flooret.com/cdn/shop/files/TrueStep_Base_Round.webp"},
      { name:"Signature Micro Bevel TruePlank™ Round Nosing", collection:"Modin", link: "https://www.flooret.com/products/signature-microbevel-truplank-round-nosing-48-60", image:"https://www.flooret.com/cdn/shop/files/TrueStep_Sig_Round_Micro_Bevel.webp"},
      { name:"Signature Micro Bevel TruePlank™ Square Nosing", collection:"Modin", link: "https://www.flooret.com/products/signature-microbevel-truplank-square-nosing", image:"https://www.flooret.com/cdn/shop/files/TrueStep_Sig_Square_Micro_Bevel.webp"},
      { name: "Modin T-Molding", collection: "Modin", link: "https://www.flooret.com/products/t-molding", image: "https://www.flooret.com/cdn/shop/files/t-molding-website-2__73321.jpg" },
      { name: "Modin Reducer", collection: "Modin", link: "https://www.flooret.com/products/reducer", image: "https://www.flooret.com/cdn/shop/files/reducer-2.jpg" },
      { name: "Modin End Cap", collection: "Modin", link: "https://www.flooret.com/products/end-cap", image: "https://www.flooret.com/cdn/shop/files/endcap-1.jpg" },
      { name: "Modin Quarter Round", collection: "Modin", link: "https://www.flooret.com/products/quarter-round", image: "https://www.flooret.com/cdn/shop/files/quarter-round-website-1__72738.jpg" },
      { name: "Modin Full Stair Tread", collection: "Modin", link: "https://www.flooret.com/products/stair-tread", image: "https://www.flooret.com/cdn/shop/files/FullTreadRound-Modin-Website_ca9e5143-bfb8-4042-b90d-8b2311840654.png" },
      { name: "Overlapping Stair Nose", collection: "Modin", link: "https://www.flooret.com/products/overlapping-stair-nose", image: "https://www.flooret.com/cdn/shop/files/OverlappingStairNose-Piece-Soho-Cropped.jpg" }
    ],
    signature_micro_bevel: [
      { name:"TrueStep™ Stair Tread", collection:"Modin", link: "https://www.flooret.com/products/truestep-stair-treads", image:"https://www.flooret.com/cdn/shop/files/TrueStepRoundTreadHero.webp"},
      { name:"Signature TruePlank™ Square Nosing", collection:"Modin", link: "https://www.flooret.com/products/signature-tru-plank-square-nosing-48-60", image:"https://www.flooret.com/cdn/shop/files/TrueStep_Sig_Square.webp"},
      { name:"Signature TruePlank™ Round Nosing", collection:"Modin", link: "https://www.flooret.com/products/signature-truplank-round-nosing-48-60", image: "https://www.flooret.com/cdn/shop/files/TrueStep_Sig_Round.webp"},
      { name:'Base TruePlank™ Nosing 48"', collection:"Modin", link: "https://www.flooret.com/products/base-truplank-round-nosing-48", image:"https://www.flooret.com/cdn/shop/files/TrueStep_Base_Round.webp"},
      { name:"Signature Micro Bevel TruePlank™ Round Nosing", collection:"Modin", link: "https://www.flooret.com/products/signature-microbevel-truplank-round-nosing-48-60", image:"https://www.flooret.com/cdn/shop/files/TrueStep_Sig_Round_Micro_Bevel.webp"},
      { name:"Signature Micro Bevel TruePlank™ Square Nosing", collection:"Modin", link: "https://www.flooret.com/products/signature-microbevel-truplank-square-nosing", image:"https://www.flooret.com/cdn/shop/files/TrueStep_Sig_Square_Micro_Bevel.webp"},
      { name: "Modin T-Molding", collection: "Modin", link: "https://www.flooret.com/products/t-molding", image: "https://www.flooret.com/cdn/shop/files/t-molding-website-2__73321.jpg" },
      { name: "Modin Reducer", collection: "Modin", link: "https://www.flooret.com/products/reducer", image: "https://www.flooret.com/cdn/shop/files/reducer-2.jpg" },
      { name: "Modin End Cap", collection: "Modin", link: "https://www.flooret.com/products/end-cap", image: "https://www.flooret.com/cdn/shop/files/endcap-1.jpg" },
      { name: "Modin Quarter Round", collection: "Modin", link: "https://www.flooret.com/products/quarter-round", image: "https://www.flooret.com/cdn/shop/files/quarter-round-website-1__72738.jpg" },
      { name: "Modin Full Stair Tread", collection: "Modin", link: "https://www.flooret.com/products/stair-tread", image: "https://www.flooret.com/cdn/shop/files/FullTreadRound-Modin-Website_ca9e5143-bfb8-4042-b90d-8b2311840654.png" },
      { name: "Overlapping Stair Nose", collection: "Modin", link: "https://www.flooret.com/products/overlapping-stair-nose", image: "https://www.flooret.com/cdn/shop/files/OverlappingStairNose-Piece-Soho-Cropped.jpg" }
    ],
    craftsman: [
      { name:"TrueStep™ Stair Tread", collection:"Modin", link: "https://www.flooret.com/products/truestep-stair-treads", image:"https://www.flooret.com/cdn/shop/files/TrueStepRoundTreadHero.webp"},
      { name:"Signature TruePlank™ Square Nosing", collection:"Modin", link: "https://www.flooret.com/products/signature-tru-plank-square-nosing-48-60", image:"https://www.flooret.com/cdn/shop/files/TrueStep_Sig_Square.webp"},
      { name:"Signature TruePlank™ Round Nosing", collection:"Modin", link: "https://www.flooret.com/products/signature-truplank-round-nosing-48-60", image: "https://www.flooret.com/cdn/shop/files/TrueStep_Sig_Round.webp"},
      { name:'Base TruePlank™ Nosing 48"', collection:"Modin", link: "https://www.flooret.com/products/base-truplank-round-nosing-48", image:"https://www.flooret.com/cdn/shop/files/TrueStep_Base_Round.webp"},
      { name:"Signature Micro Bevel TruePlank™ Round Nosing", collection:"Modin", link: "https://www.flooret.com/products/signature-microbevel-truplank-round-nosing-48-60", image:"https://www.flooret.com/cdn/shop/files/TrueStep_Sig_Round_Micro_Bevel.webp"},
      { name:"Signature Micro Bevel TruePlank™ Square Nosing", collection:"Modin", link: "https://www.flooret.com/products/signature-microbevel-truplank-square-nosing", image:"https://www.flooret.com/cdn/shop/files/TrueStep_Sig_Square_Micro_Bevel.webp"},
      { name: "Modin T-Molding", collection: "Modin", link: "https://www.flooret.com/products/t-molding", image: "https://www.flooret.com/cdn/shop/files/t-molding-website-2__73321.jpg" },
      { name: "Modin Reducer", collection: "Modin", link: "https://www.flooret.com/products/reducer", image: "https://www.flooret.com/cdn/shop/files/reducer-2.jpg" },
      { name: "Modin End Cap", collection: "Modin", link: "https://www.flooret.com/products/end-cap", image: "https://www.flooret.com/cdn/shop/files/endcap-1.jpg" },
      { name: "Modin Quarter Round", collection: "Modin", link: "https://www.flooret.com/products/quarter-round", image: "https://www.flooret.com/cdn/shop/files/quarter-round-website-1__72738.jpg" },
      { name: "Modin Full Stair Tread", collection: "Modin", link: "https://www.flooret.com/products/stair-tread", image: "https://www.flooret.com/cdn/shop/files/FullTreadRound-Modin-Website_ca9e5143-bfb8-4042-b90d-8b2311840654.png" },
      { name: "Overlapping Stair Nose", collection: "Modin", link: "https://www.flooret.com/products/overlapping-stair-nose", image: "https://www.flooret.com/cdn/shop/files/OverlappingStairNose-Piece-Soho-Cropped.jpg" }
    ],
    herringbone: [
      { name:"TrueStep™ Stair Tread", collection:"Modin", link: "https://www.flooret.com/products/truestep-stair-treads", image:"https://www.flooret.com/cdn/shop/files/TrueStepRoundTreadHero.webp"},
      { name:"Signature TruePlank™ Square Nosing", collection:"Modin", link: "https://www.flooret.com/products/signature-tru-plank-square-nosing-48-60", image:"https://www.flooret.com/cdn/shop/files/TrueStep_Sig_Square.webp"},
      { name:"Signature TruePlank™ Round Nosing", collection:"Modin", link: "https://www.flooret.com/products/signature-truplank-round-nosing-48-60", image: "https://www.flooret.com/cdn/shop/files/TrueStep_Sig_Round.webp"},
      { name:'Base TruePlank™ Nosing 48"', collection:"Modin", link: "https://www.flooret.com/products/base-truplank-round-nosing-48", image:"https://www.flooret.com/cdn/shop/files/TrueStep_Base_Round.webp"},
      { name:"Signature Micro Bevel TruePlank™ Round Nosing", collection:"Modin", link: "https://www.flooret.com/products/signature-microbevel-truplank-round-nosing-48-60", image:"https://www.flooret.com/cdn/shop/files/TrueStep_Sig_Round_Micro_Bevel.webp"},
      { name:"Signature Micro Bevel TruePlank™ Square Nosing", collection:"Modin", link: "https://www.flooret.com/products/signature-microbevel-truplank-square-nosing", image:"https://www.flooret.com/cdn/shop/files/TrueStep_Sig_Square_Micro_Bevel.webp"},
      { name: "Modin T-Molding", collection: "Modin", link: "https://www.flooret.com/products/t-molding", image: "https://www.flooret.com/cdn/shop/files/t-molding-website-2__73321.jpg" },
      { name: "Modin Reducer", collection: "Modin", link: "https://www.flooret.com/products/reducer", image: "https://www.flooret.com/cdn/shop/files/reducer-2.jpg" },
      { name: "Modin End Cap", collection: "Modin", link: "https://www.flooret.com/products/end-cap", image: "https://www.flooret.com/cdn/shop/files/endcap-1.jpg" },
      { name: "Modin Quarter Round", collection: "Modin", link: "https://www.flooret.com/products/quarter-round", image: "https://www.flooret.com/cdn/shop/files/quarter-round-website-1__72738.jpg" },
      { name: "Modin Full Stair Tread", collection: "Modin", link: "https://www.flooret.com/products/stair-tread", image: "https://www.flooret.com/cdn/shop/files/FullTreadRound-Modin-Website_ca9e5143-bfb8-4042-b90d-8b2311840654.png" },
      { name: "Overlapping Stair Nose", collection: "Modin", link: "https://www.flooret.com/products/overlapping-stair-nose", image: "https://www.flooret.com/cdn/shop/files/OverlappingStairNose-Piece-Soho-Cropped.jpg" }
    ],
    base: [
      { name:"TrueStep™ Stair Tread", collection:"Modin", link: "https://www.flooret.com/products/truestep-stair-treads", image:"https://www.flooret.com/cdn/shop/files/TrueStepRoundTreadHero.webp"},
      { name:'Base TruePlank™ Nosing 48"', collection:"Modin", link: "https://www.flooret.com/products/base-truplank-round-nosing-48", image:"https://www.flooret.com/cdn/shop/files/TrueStep_Base_Round.webp"},,
      { name: "Modin T-Molding", collection: "Modin", link: "https://www.flooret.com/products/t-molding", image: "https://www.flooret.com/cdn/shop/files/t-molding-website-2__73321.jpg" },
      { name: "Modin Reducer", collection: "Modin", link: "https://www.flooret.com/products/reducer", image: "https://www.flooret.com/cdn/shop/files/reducer-2.jpg" },
      { name: "Modin End Cap", collection: "Modin", link: "https://www.flooret.com/products/end-cap", image: "https://www.flooret.com/cdn/shop/files/endcap-1.jpg" },
      { name: "Modin Quarter Round", collection: "Modin", link: "https://www.flooret.com/products/quarter-round", image: "https://www.flooret.com/cdn/shop/files/quarter-round-website-1__72738.jpg" },
      { name: "Modin Full Stair Tread", collection: "Modin", link: "https://www.flooret.com/products/stair-tread", image: "https://www.flooret.com/cdn/shop/files/FullTreadRound-Modin-Website_ca9e5143-bfb8-4042-b90d-8b2311840654.png" },
      { name: "Overlapping Stair Nose", collection: "Modin", link: "https://www.flooret.com/products/overlapping-stair-nose", image: "https://www.flooret.com/cdn/shop/files/OverlappingStairNose-Piece-Soho-Cropped.jpg" }
    ]
  };

  const SILVAN_PRODUCTS = [
    { name: "Silvan T-Molding", collection: "Silvan", link: "https://www.flooret.com/products/silvan-t-molding", image: "https://www.flooret.com/cdn/shop/files/Anza.jpg" },
    { name: "Silvan Reducer", collection: "Silvan", link: "https://www.flooret.com/products/silvan-reducer", image: "https://www.flooret.com/cdn/shop/files/Anza_reducer.jpg" },
    { name: "Silvan Nosing Round", collection: "Silvan", link: "https://www.flooret.com/products/silvan-nosing-round", image: "https://www.flooret.com/cdn/shop/files/Anza_nosing_round.jpg" },
    { name: "Silvan Nosing Square", collection: "Silvan", link: "https://www.flooret.com/products/silvan-nosing-square", image: "https://www.flooret.com/cdn/shop/files/Anza_Nosing_Square-2.jpg" },
    { name: "Silvan End Cap", collection: "Silvan", link: "https://www.flooret.com/products/silvan-end-cap", image: "https://www.flooret.com/cdn/shop/files/Anza_end_cap.jpg" },
    { name: "Silvan Quarter Round", collection: "Silvan", link: "https://www.flooret.com/products/silvan-quarter-round", image: "https://www.flooret.com/cdn/shop/files/Anza_quarter.jpg" },
    { name: "Silvan Full Stair Tread", collection: "Silvan", link: "https://www.flooret.com/products/silvan-full-stair-tread", image: "https://www.flooret.com/cdn/shop/files/Anza_full_tread_1080x1350_7a1bd8d0-b6c5-4cc4-9ba4-b48017cfd601.jpg" }
  ];

  const ARISTA_PRODUCTS = [
    { name: "Arista T-Molding", collection: "Arista", link: "https://www.flooret.com/products/arista-t-molding", image: "https://www.flooret.com/cdn/shop/files/Tmolding_Levant_top_2000x_540b12e1-a093-425e-8d0b-caee7992db10.jpg" },
    { name: "Arista Reducer", collection: "Arista", link: "https://www.flooret.com/products/arista-reducer", image: "https://www.flooret.com/cdn/shop/files/Reducer_Levant_top_2000x_78cbf64a-22ca-440b-939f-8a6ea461419d.jpg" },
    { name: "Arista Nosing Round", collection: "Arista", link: "https://www.flooret.com/products/arista-nosing-round", image: "https://www.flooret.com/cdn/shop/files/NosingRound_Levant_top_2000x_c81f38f3-8b4c-45cc-9e50-6e0163075d2a.jpg" },
    { name: "Arista Stair Tread and Riser", collection: "Arista", link: "https://www.flooret.com/products/arista-stair-tread-and-riser", image: "https://www.flooret.com/cdn/shop/files/StairTread___Riser_Arista_841x_72f6e840-bf4b-47cf-95f4-3828cec17435.jpg" },
    { name: "Arista End Cap", collection: "Arista", link: "https://www.flooret.com/products/arista-reducer-copy-1", image: "https://www.flooret.com/cdn/shop/files/Arista_Levant_EndCap.webp" },
    { name: "Arista Quarter Round", collection: "Arista", link: "https://www.flooret.com/products/arista-end-cap-copy", image: "https://www.flooret.com/cdn/shop/files/Arista_Levant_QuarterRound.webp" }
  ];

  const PROVENCE_PRODUCT_MAP = {
    "7_5": [
      { name: "Provence T-Molding", collection: "Provence", link: "https://www.flooret.com/products/provenance-t-molding", image: "https://www.flooret.com/cdn/shop/files/Provence_T_Molding.webp" },
      { name: "Provence 7.5 Reducer", collection: "Provence", link: "https://www.flooret.com/products/provenance-7-5-reducer", image: "https://www.flooret.com/cdn/shop/files/Provence_7.5_Reducer.webp" },
      { name: "Provence 7.5 Nosing Square", collection: "Provence", link: "https://www.flooret.com/products/provenance-7-5-nosing-square", image: "https://www.flooret.com/cdn/shop/files/Provence_7.5_SquareNosing.webp" },
      { name: "Provence 7.5 Nosing Round", collection: "Provence", link: "https://www.flooret.com/products/provenance-7-5-nosing-round", image: "https://www.flooret.com/cdn/shop/files/Provence_7.5_RoundNosing.webp" },
      { name: "Provence 7.5 End Cap", collection: "Provence", link: "https://www.flooret.com/products/provenance-7-5-end-cap", image: "https://www.flooret.com/cdn/shop/files/Provence_7.5_EndCap.webp" },
      { name: "Provence Quarter Round", collection: "Provence", link: "https://www.flooret.com/products/provenance-quarter-round", image: "https://www.flooret.com/cdn/shop/files/Provence_QuarterRound_1.webp" },
      { name: "Provence Full Stair Tread", collection: "Provence", link: "https://www.flooret.com/products/provenance-full-stair-tread", image: "https://www.flooret.com/cdn/shop/files/Provence_Full_Stair_Tread.webp" }
    ],
    "10": [
      { name: "Provence T-Molding", collection: "Provence", link: "https://www.flooret.com/products/provenance-t-molding", image: "https://www.flooret.com/cdn/shop/files/Provence_T_Molding.webp" },
      { name: "Provence 10 Reducer", collection: "Provence", link: "https://www.flooret.com/products/provenance-10-reducer", image: "https://www.flooret.com/cdn/shop/files/Provence_10_Reducer.webp" },
      { name: "Provence 10 Nosing Square", collection: "Provence", link: "https://www.flooret.com/products/provenance-10-nosing-square", image: "https://www.flooret.com/cdn/shop/files/Provence_10_SquareNosing.webp" },
      { name: "Provence 10 Nosing Round", collection: "Provence", link: "https://www.flooret.com/products/provenance-10-nosing-round", image: "https://www.flooret.com/cdn/shop/files/Provence_10_RoundNosing.webp" },
      { name: "Provence 10 End Cap", collection: "Provence", link: "https://www.flooret.com/products/provenance-10-end-cap", image: "https://www.flooret.com/cdn/shop/files/Provence_10_EndCap.webp" },
      { name: "Provence Quarter Round", collection: "Provence", link: "https://www.flooret.com/products/provenance-quarter-round", image: "https://www.flooret.com/cdn/shop/files/Provence_QuarterRound_1.webp" },
      { name: "Provence Full Stair Tread", collection: "Provence", link: "https://www.flooret.com/products/provenance-full-stair-tread", image: "https://www.flooret.com/cdn/shop/files/Provence_Full_Stair_Tread.webp" }
    ]
  };

  function normalizeText(value) {
    return (value || "")
      .toLowerCase()
      .replace(/&quot;/g, '"')
      .replace(/['"]/g, "")
      .replace(/&/g, "and")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getProductFamily(boxProductTitle) {
    const silvanKeywords = ["Norde", "Evern", "Lyon", "Anza", "Balboa", "Arden"];
    const aristaKeywords = ["Levant", "Bastille", "Rohan", "Opera", "Gala", "Victor", "Concorde", "Russo"];
    const provenceKeywords = ["Colmar", "Umbria", "Merano", "Basel"];

    const title = (boxProductTitle || "").trim();
    const lowerTitle = title.toLowerCase();

    if (silvanKeywords.some((w) => title.includes(w)) || lowerTitle.includes("silvan")) return "silvan";
    if (aristaKeywords.some((w) => title.includes(w)) || lowerTitle.includes("arista")) return "arista";
    if (provenceKeywords.some((w) => title.includes(w)) || lowerTitle.includes("provence")) return "provence";
    return "modin";
  }

  function getModinVariantKey(variantText) {
    const v = normalizeText(variantText);
    if (v.includes("signature micro bevel")) return "signature_micro_bevel";
    if (v.includes("signature")) return "signature";
    if (v.includes("craftsman")) return "craftsman";
    if (v.includes("herringbone")) return "herringbone";
    if (v.includes("base")) return "base";
    return "signature";
  }

  function getProvenceVariantKey(variantText) {
    const v = normalizeText(variantText);
    if (v.includes("7.5") || v.includes("7 5")) return "7_5";
    if (v.includes("10")) return "10";
    return "7_5";
  }

  function getUpsellProductsByFamilyAndVariant(boxProductTitle, variantText) {
    const family = getProductFamily(boxProductTitle);

    if (family === "silvan") return SILVAN_PRODUCTS;
    if (family === "arista") return ARISTA_PRODUCTS;

    if (family === "provence") {
      const key = getProvenceVariantKey(variantText);
      return PROVENCE_PRODUCT_MAP[key] || [];
    }

    const key = getModinVariantKey(variantText);
    return MODIN_PRODUCT_MAP[key] || [];
  }

  const FLOORING_TITLE_REGEX = /modin|silvan|arista|provence|nakan|sutton|kingswood|ashford|arbor|lato|soho|palka|miller|minka|dutton|wren|breland|henderson|cali|payson|bishop|olten|norde|arden|evern|lyon|anza|balboa|levant|bastille|rohan|opera|gala|victor|concorde|russo|arlo|brenwick|catura|dimalo|dorset|elmstead|hafren|jova|kora|lachlan|madeira|oxden|pomeroy|queensbury|raeburn|sable|tilden|windsor|yuzen|colmar|umbria|merano|basel/i;

  function isLikelyBoxCartItem(item) {
    const fullText = (item.product_title || item.title || "") + " " + (item.variant_title || "");
    return FLOORING_TITLE_REGEX.test(fullText);
  }

  function getCartItemOptionText(item) {
    if (Array.isArray(item.options_with_values) && item.options_with_values.length) {
      return item.options_with_values.map((opt) => opt.name + ": " + opt.value).join(" / ");
    }
    return item.variant_title || "";
  }

  function fetchCartState() {
    return fetch("/cart.js", {
      method: "GET",
      headers: { Accept: "application/json" }
    }).then((res) => {
      if (!res.ok) throw new Error("Cart fetch failed");
      return res.json();
    });
  }

  function getActiveBoxCartItem(cart, boxProductTitle) {
    if (!cart || !Array.isArray(cart.items) || !cart.items.length) return null;

    const normalizedBoxTitle = normalizeText(boxProductTitle);

    if (normalizedBoxTitle) {
      const exactMatch = cart.items.find((item) => {
        const itemTitle = normalizeText(item.product_title || item.title || "");
        return itemTitle && itemTitle.includes(normalizedBoxTitle);
      });
      if (exactMatch) return exactMatch;
    }

    return cart.items.find(isLikelyBoxCartItem) || null;
  }

  function parseCartTitles(value) {
    return (value || "").split("||").map((item) => item.trim()).filter(Boolean);
  }

  function getDefaultDecorName(boxProductTitle) {
    const title = (boxProductTitle || "").trim();
    const knownDecorNames = [
      "Nakan", "Sutton", "Kingswood", "Ashford", "Arbor", "Lato", "Soho", "Palka",
      "Miller", "Minka", "Dutton", "Wren", "Breland", "Henderson", "Cali", "Payson",
      "Bishop", "Olten", "Norde", "Arden", "Evern", "Lyon", "Anza", "Balboa",
      "Levant", "Bastille", "Rohan", "Opera", "Gala", "Victor", "Concorde", "Russo",
      "Arlo", "Brenwick", "Catura", "Dimalo", "Dorset", "Elmstead", "Hafren", "Jova",
      "Kora", "Lachlan", "Madeira", "Oxden", "Pomeroy", "Queensbury", "Raeburn",
      "Sable", "Tilden", "Windsor", "Yuzen", "Colmar", "Umbria", "Merano", "Basel"
    ];

    const match = knownDecorNames.find((name) =>
      title.toLowerCase().includes(name.toLowerCase())
    );

    return match || "";
  }

  function formatMoney(cents) {
    if (typeof Shopify !== "undefined" && typeof Shopify.formatMoney === "function") {
      const moneyFormat =
        (window.theme && window.theme.moneyFormat) ||
        (window.Shopify && window.Shopify.money_format) ||
        "${{amount}}";
      return Shopify.formatMoney(cents, moneyFormat);
    }
    return "$" + (Number(cents || 0) / 100).toFixed(2);
  }

  function getProductHandleFromUrl(url) {
    try {
      const parsed = new URL(url, window.location.origin);
      const match = parsed.pathname.match(/\/products\/([^\/]+)/);
      return match ? match[1] : null;
    } catch (e) {
      return null;
    }
  }

  function getUniqueOptionValues(variants, optionKey) {
    const seen = new Set();
    const values = [];

    (variants || []).forEach((variant) => {
      const value = String(variant?.[optionKey] || "").trim();
      if (!value || seen.has(value)) return;
      seen.add(value);
      values.push(value);
    });

    return values;
  }

  function getSelectableVariants(variants) {
    const all = (variants || []).filter(Boolean);
    const available = all.filter((variant) => variant.available !== false);
    return available.length ? available : all;
  }

  function findMatchingVariant(variants, selectedOptions) {
    return (variants || []).find((variant) => {
      return [1, 2, 3].every((index) => {
        const selectedValue = String(selectedOptions["option" + index] || "").trim();
        if (!selectedValue) return true;
        return String(variant["option" + index] || "").trim() === selectedValue;
      });
    }) || null;
  }

  function findExactVariant(variants, selectedOptions, optionNames) {
    const totalOptions = Array.isArray(optionNames) ? optionNames.length : 0;
    if (!totalOptions) return null;

    const hasAllSelections = Array.from({ length: totalOptions }, function (_, index) {
      return String(selectedOptions["option" + (index + 1)] || "").trim();
    }).every(Boolean);

    if (!hasAllSelections) return null;

    return (variants || []).find((variant) => {
      return Array.from({ length: totalOptions }, function (_, index) {
        const optionKey = "option" + (index + 1);
        return String(variant[optionKey] || "").trim() === String(selectedOptions[optionKey] || "").trim();
      }).every(Boolean);
    }) || null;
  }
  function findVariantFromRenderedSelections(variants, selectedOptions, optionKeys) {
    console.group("findVariantFromRenderedSelections");
    console.log("selectedOptions:", JSON.parse(JSON.stringify(selectedOptions)));
    console.log("optionKeys:", optionKeys);

    const matched = (variants || []).find((variant, variantIndex) => {
      const variantSnapshot = {};
      optionKeys.forEach((optionKey) => {
        variantSnapshot[optionKey] = String(variant[optionKey] || "").trim();
      });

      console.log("Checking variant #" + variantIndex, {
        id: variant.id,
        title: variant.title,
        options: variantSnapshot
      });

      const isMatch = optionKeys.every((optionKey) => {
        const selectedValue = String(selectedOptions[optionKey] || "").trim();
        const variantValue = String(variant[optionKey] || "").trim();

        console.log("Compare", {
          optionKey: optionKey,
          selectedValue: selectedValue,
          variantValue: variantValue,
          selectedNormalized: normalizeText(selectedValue),
          variantNormalized: normalizeText(variantValue),
          exactMatch: selectedValue === variantValue,
          normalizedMatch: normalizeText(selectedValue) === normalizeText(variantValue)
        });

        return normalizeText(selectedValue) === normalizeText(variantValue);
      });

      console.log("Variant match result:", isMatch);

      return isMatch;
    }) || null;

    console.log("FINAL MATCHED VARIANT:", matched);
    console.groupEnd();

    return matched;
  }

  function getAvailableOptionValues(variants, selectedOptions, targetOptionKey, optionNames) {
    const totalOptions = Array.isArray(optionNames) ? optionNames.length : 0;
    const values = new Set();
    const selectableVariants = getSelectableVariants(variants);

    selectableVariants.forEach((variant) => {
      const matchesOtherSelected = Array.from({ length: totalOptions }, function (_, index) {
        return "option" + (index + 1);
      }).every((optionKey) => {
        if (optionKey === targetOptionKey) return true;
        const selectedValue = String(selectedOptions[optionKey] || "").trim();
        if (!selectedValue) return true;
        return String(variant[optionKey] || "").trim() === selectedValue;
      });

      const targetValue = String(variant[targetOptionKey] || "").trim();
      if (matchesOtherSelected && targetValue) {
        values.add(targetValue);
      }
    });

    return Array.from(values);
  }

  function ensureVariantMessageEl(card) {
    let el = card.querySelector(".fr_24_upsell_variant_message");
    if (!el) {
      el = document.createElement("div");
      el.className = "fr_24_upsell_variant_message";
      el.style.fontSize = "12px";
      el.style.lineHeight = "1.4";
      el.style.marginTop = "6px";
      el.style.color = "#b45309";
      el.setAttribute("aria-live", "polite");
      const wrapper = card.querySelector(".fr_24_upsell_product_info_wrapper") || card;
      const form = card.querySelector(".fr_24_upsell_form");
      if (form) form.insertAdjacentElement("beforebegin", el);
      else wrapper.appendChild(el);
    }
    return el;
  }

  function setVariantMessage(card, message) {
    const el = ensureVariantMessageEl(card);
    el.textContent = message || "";
    el.style.display = message ? "block" : "none";
  }

  function updateUpsellCardFromVariant(card, variant) {
    if (!card || !variant) return;

    const price = Number(variant.price || 0);
    const comparePrice = Number(variant.compare_at_price || 0);
    const discount = comparePrice > price
      ? Math.round(((comparePrice - price) * 100) / comparePrice)
      : 0;

    const variantInput = card.querySelector(".fr_24_upsell_variant_id");
    const colorInput = card.querySelector(".fr_24_upsell_color_input");
    const priceWrap = card.querySelector(".fr_24_upsell_product_price_wrap");
    const uidInput = card.querySelector(".fr_24_upsell_uid_input");

    if (variantInput) variantInput.value = variant.id;
    if (colorInput) {
      colorInput.value = [variant.option1, variant.option2, variant.option3]
        .filter(Boolean)
        .join(" / ");
    }
    if (uidInput) {
      uidInput.value = variant.id + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    }

    if (priceWrap) {
      priceWrap.innerHTML =
        '<span class="fr_24_upsell_product_price">' + formatMoney(price) + "</span>" +
        (comparePrice > price ? '<span class="fr_24_upsell_product_compare_price">' + formatMoney(comparePrice) + "</span>" : "") +
        (comparePrice > price && discount > 0 ? '<span class="fr_24_upsell_product_discount">(' + discount + "% Off)</span>" : "");
    }
  }

  // function syncCardStateFromSelections(card, productData, changedOptionKey) {
  //   if (!card || !productData || !Array.isArray(productData.variants)) return null;

  //   const optionNames = productData.optionNames || [];
  //   const optionKeys = optionNames.map((_, index) => "option" + (index + 1));
  //   const selectsByKey = {};
  //   const selectableVariants = getSelectableVariants(productData.variants);

  //   card.querySelectorAll(".fr_24_upsell_product_dropdown_select").forEach((select) => {
  //     const optionKey = select.getAttribute("data-option-key");
  //     if (optionKey) selectsByKey[optionKey] = select;
  //   });

  //   const currentSelections = {};
  //   optionKeys.forEach((optionKey) => {
  //     currentSelections[optionKey] = selectsByKey[optionKey]
  //       ? String(selectsByKey[optionKey].value || "").trim()
  //       : "";
  //   });

  //   const changedIndex = optionKeys.indexOf(changedOptionKey);
  //   if (changedIndex > -1) {
  //     optionKeys.slice(changedIndex + 1).forEach((optionKey) => {
  //       currentSelections[optionKey] = "";
  //       if (selectsByKey[optionKey]) selectsByKey[optionKey].value = "";
  //     });
  //   }

  //   const finalSelections = {};
  //   let invalidMessage = "";

  //   optionKeys.forEach((optionKey, index) => {
  //     const select = selectsByKey[optionKey];
  //     if (!select) return;

  //     const priorSelections = {};
  //     optionKeys.slice(0, index).forEach((key) => {
  //       priorSelections[key] = finalSelections[key] || "";
  //     });

  //     const validValues = getAvailableOptionValues(
  //       selectableVariants,
  //       priorSelections,
  //       optionKey,
  //       optionNames
  //     );

  //     Array.from(select.options).forEach((option) => {
  //       const value = String(option.value || "").trim();
  //       if (!value) return;
  //       const isValid = validValues.includes(value);
  //       option.disabled = !isValid;
  //       option.hidden = false;
  //     });

  //     let nextValue = String(currentSelections[optionKey] || "").trim();

  //     if (nextValue && !validValues.includes(nextValue)) {
  //       const label = optionNames[index] || optionKey;
  //       const previousParts = optionKeys
  //         .slice(0, index)
  //         .map((key, keyIndex) => {
  //           const optionLabel = optionNames[keyIndex] || key;
  //           const val = finalSelections[key];
  //           return val ? optionLabel + ": " + val : "";
  //         })
  //         .filter(Boolean);

  //       invalidMessage = (previousParts.length ? previousParts.join(" / ") + " / " : "") +
  //         label + ": " + nextValue + " combination is not available";
  //       nextValue = "";
  //     }

  //     if (!nextValue && validValues.length === 1) {
  //       nextValue = validValues[0];
  //     }

  //     select.value = nextValue;
  //     finalSelections[optionKey] = nextValue;
  //   });

  //   const exactVariant = findExactVariant(
  //     selectableVariants,
  //     finalSelections,
  //     optionNames
  //   );

  //   const variantInput = card.querySelector(".fr_24_upsell_variant_id");
  //   const colorInput = card.querySelector(".fr_24_upsell_color_input");
  //   const btn = card.querySelector(".fr_24_upsell_addtocartbtn");

  //   if (exactVariant) {
  //     updateUpsellCardFromVariant(card, exactVariant);
  //     if (btn) btn.disabled = false;
  //     setVariantMessage(card, "");
  //   } else {
  //     if (variantInput) variantInput.value = "";
  //     if (colorInput) {
  //       colorInput.value = optionKeys
  //         .map((key) => finalSelections[key] || "")
  //         .filter(Boolean)
  //         .join(" / ");
  //     }
  //     if (btn) btn.disabled = true;
  //     setVariantMessage(card, invalidMessage || "This combination is not available.");
  //   }

  //   return {
  //     selectedOptions: finalSelections,
  //     matchedVariant: exactVariant
  //   };
  // }
// function syncCardStateFromSelections(card, productData, changedOptionKey) {
//   console.group("syncCardStateFromSelections");
//   console.log("changedOptionKey:", changedOptionKey);
//   console.log("card:", card);
//   console.log("productData:", productData);

//   if (!card || !productData || !Array.isArray(productData.variants)) {
//     console.warn("sync aborted: invalid card/productData/variants");
//     console.groupEnd();
//     return null;
//   }

//   const optionNames = productData.optionNames || [];
//   const optionKeys = optionNames.map((_, index) => "option" + (index + 1));
//   const selectsByKey = {};
//   const selectableVariants = getSelectableVariants(productData.variants);

//   console.log("optionNames:", optionNames);
//   console.log("optionKeys:", optionKeys);
//   console.log("selectableVariants:", selectableVariants);

//   card.querySelectorAll(".fr_24_upsell_product_dropdown_select").forEach((select) => {
//     const optionKey = select.getAttribute("data-option-key");
//     if (optionKey) selectsByKey[optionKey] = select;
//   });

//   console.log("selectsByKey:", selectsByKey);

//   const currentSelections = {};
//   optionKeys.forEach((optionKey) => {
//     currentSelections[optionKey] = selectsByKey[optionKey]
//       ? String(selectsByKey[optionKey].value || "").trim()
//       : "";
//   });

//   console.log("currentSelections before reset:", currentSelections);

//   const changedIndex = optionKeys.indexOf(changedOptionKey);
//   console.log("changedIndex:", changedIndex);

//   if (changedIndex > -1) {
//     optionKeys.slice(changedIndex + 1).forEach((optionKey) => {
//       currentSelections[optionKey] = "";
//       if (selectsByKey[optionKey]) {
//         selectsByKey[optionKey].value = "";
//       }
//     });
//   }

//   console.log("currentSelections after reset:", currentSelections);

//   const finalSelections = {};
//   let invalidMessage = "";

//   optionKeys.forEach((optionKey, index) => {
//     const select = selectsByKey[optionKey];
//     if (!select) {
//       console.warn("missing select for", optionKey);
//       return;
//     }

//     console.group("processing " + optionKey);
//     console.log("select element:", select);
//     console.log("select current DOM value:", select.value);

//     const priorSelections = {};
//     optionKeys.slice(0, index).forEach((key) => {
//       priorSelections[key] = finalSelections[key] || "";
//     });

//     console.log("priorSelections:", priorSelections);

//     const validValues = getAvailableOptionValues(
//       selectableVariants,
//       priorSelections,
//       optionKey,
//       optionNames
//     );

//     console.log("validValues:", validValues);

//     console.log(
//       "options before reset:",
//       Array.from(select.options).map((option) => ({
//         text: option.textContent.trim(),
//         value: String(option.value || "").trim(),
//         disabledProp: option.disabled,
//         disabledAttr: option.getAttribute("disabled"),
//         selected: option.selected
//       }))
//     );

//     Array.from(select.options).forEach((option) => {
//       const value = String(option.value || "").trim();
//       if (!value) return;
//       option.disabled = false;
//       option.removeAttribute("disabled");
//     });

//     console.log(
//       "options after reset:",
//       Array.from(select.options).map((option) => ({
//         text: option.textContent.trim(),
//         value: String(option.value || "").trim(),
//         disabledProp: option.disabled,
//         disabledAttr: option.getAttribute("disabled"),
//         selected: option.selected
//       }))
//     );

//     Array.from(select.options).forEach((option) => {
//       const value = String(option.value || "").trim();
//       if (!value) return;

//       const isValid = validValues.includes(value);
//       if (!isValid) {
//         option.disabled = true;
//         option.setAttribute("disabled", "disabled");
//       } else {
//         option.disabled = false;
//         option.removeAttribute("disabled");
//       }

//       console.log("option update:", {
//         optionKey,
//         optionValue: value,
//         isValid,
//         disabledProp: option.disabled,
//         disabledAttr: option.getAttribute("disabled")
//       });
//     });

//     console.log(
//       "options after valid/invalid apply:",
//       Array.from(select.options).map((option) => ({
//         text: option.textContent.trim(),
//         value: String(option.value || "").trim(),
//         disabledProp: option.disabled,
//         disabledAttr: option.getAttribute("disabled"),
//         selected: option.selected
//       }))
//     );

//     let nextValue = String(currentSelections[optionKey] || "").trim();
//     console.log("nextValue before validation:", nextValue);

//     if (nextValue && !validValues.includes(nextValue)) {
//       const label = optionNames[index] || optionKey;
//       const previousParts = optionKeys
//         .slice(0, index)
//         .map((key, keyIndex) => {
//           const optionLabel = optionNames[keyIndex] || key;
//           const val = finalSelections[key];
//           return val ? optionLabel + ": " + val : "";
//         })
//         .filter(Boolean);

//       invalidMessage =
//         (previousParts.length ? previousParts.join(" / ") + " / " : "") +
//         label + ": " + nextValue + " combination is not available";

//       console.warn("current value invalid, clearing:", {
//         optionKey,
//         nextValue,
//         invalidMessage
//       });

//       nextValue = "";
//     }

//     if (!nextValue && validValues.length === 1) {
//       nextValue = validValues[0];
//       console.log("auto-selecting only valid value:", nextValue);
//     }

//     select.value = nextValue;
//     finalSelections[optionKey] = nextValue;

//     console.log("final select.value written:", select.value);
//     console.log("finalSelections so far:", finalSelections);

//     console.log(
//       "final option DOM state:",
//       Array.from(select.options).map((option) => ({
//         text: option.textContent.trim(),
//         value: String(option.value || "").trim(),
//         disabledProp: option.disabled,
//         disabledAttr: option.getAttribute("disabled"),
//         selected: option.selected
//       }))
//     );

//     console.groupEnd();
//   });

//   console.log("finalSelections complete:", finalSelections);

//   const exactVariant = findExactVariant(
//     selectableVariants,
//     finalSelections,
//     optionNames
//   );

//   console.log("exactVariant:", exactVariant);

//   const variantInput = card.querySelector(".fr_24_upsell_variant_id");
//   const colorInput = card.querySelector(".fr_24_upsell_color_input");
//   const btn = card.querySelector(".fr_24_upsell_addtocartbtn");

//   if (exactVariant) {
//     console.log("exactVariant found, updating card");
//     updateUpsellCardFromVariant(card, exactVariant);
//     if (btn) btn.disabled = false;
//     setVariantMessage(card, "");
//   } else {
//     console.warn("no exactVariant found");
//     if (variantInput) variantInput.value = "";
//     if (colorInput) {
//       colorInput.value = optionKeys
//         .map((key) => finalSelections[key] || "")
//         .filter(Boolean)
//         .join(" / ");
//     }
//     if (btn) btn.disabled = true;
//     setVariantMessage(card, invalidMessage || "This combination is not available.");
//   }

//   console.log("variantInput value:", variantInput ? variantInput.value : null);
//   console.log("colorInput value:", colorInput ? colorInput.value : null);
//   console.log("button disabled:", btn ? btn.disabled : null);
//   console.groupEnd();

//   return {
//     selectedOptions: finalSelections,
//     matchedVariant: exactVariant
//   };
// }
// function syncCardStateFromSelections(card, productData, changedOptionKey) {
//   if (!card || !productData || !Array.isArray(productData.variants)) return null;

//   const optionNames = productData.optionNames || [];
//   const optionKeys = optionNames.map((_, index) => "option" + (index + 1));
//   const selectsByKey = {};
//   const selectableVariants = getSelectableVariants(productData.variants);

//   card.querySelectorAll(".fr_24_upsell_product_dropdown_select").forEach((select) => {
//     const optionKey = select.getAttribute("data-option-key");
//     if (optionKey) selectsByKey[optionKey] = select;
//   });

//   const currentSelections = {};
//   optionKeys.forEach((optionKey) => {
//     currentSelections[optionKey] = selectsByKey[optionKey]
//       ? String(selectsByKey[optionKey].value || "").trim()
//       : "";
//   });

//   const changedIndex = optionKeys.indexOf(changedOptionKey);
//   if (changedIndex > -1) {
//     optionKeys.slice(changedIndex + 1).forEach((optionKey) => {
//       currentSelections[optionKey] = "";
//       if (selectsByKey[optionKey]) {
//         selectsByKey[optionKey].value = "";
//       }
//     });
//   }

//   const finalSelections = {};
//   let invalidMessage = "";

//   optionKeys.forEach((optionKey, index) => {
//     const select = selectsByKey[optionKey];
//     if (!select) return;

//     const priorSelections = {};
//     optionKeys.slice(0, index).forEach((key) => {
//       priorSelections[key] = finalSelections[key] || "";
//     });

//     const validValues = getAvailableOptionValues(
//       selectableVariants,
//       priorSelections,
//       optionKey,
//       optionNames
//     );

//     let nextValue = String(currentSelections[optionKey] || "").trim();

//     if (nextValue && !validValues.includes(nextValue)) {
//       const label = optionNames[index] || optionKey;
//       const previousParts = optionKeys
//         .slice(0, index)
//         .map((key, keyIndex) => {
//           const optionLabel = optionNames[keyIndex] || key;
//           const val = finalSelections[key];
//           return val ? optionLabel + ": " + val : "";
//         })
//         .filter(Boolean);

//       invalidMessage =
//         (previousParts.length ? previousParts.join(" / ") + " / " : "") +
//         label + ": " + nextValue + " combination is not available";

//       nextValue = "";
//     }

//     if (!nextValue && validValues.length === 1) {
//       nextValue = validValues[0];
//     }

//     Array.from(select.options).forEach((option) => {
//       const value = String(option.value || "").trim();
//       if (!value) return;

//       const isValid = validValues.includes(value);
//       option.disabled = !isValid;

//       if (isValid) {
//         option.removeAttribute("disabled");
//       } else {
//         option.setAttribute("disabled", "disabled");
//       }
//     });

//     if (nextValue) {
//       const selectedOptionEl = Array.from(select.options).find((option) => {
//         return String(option.value || "").trim() === nextValue;
//       });

//       if (selectedOptionEl) {
//         selectedOptionEl.disabled = false;
//         selectedOptionEl.removeAttribute("disabled");
//       }
//     }

//     select.value = nextValue;
//     finalSelections[optionKey] = nextValue;
//   });

//   const exactVariant = findExactVariant(
//     selectableVariants,
//     finalSelections,
//     optionNames
//   );

//   const variantInput = card.querySelector(".fr_24_upsell_variant_id");
//   const colorInput = card.querySelector(".fr_24_upsell_color_input");
//   const btn = card.querySelector(".fr_24_upsell_addtocartbtn");

//   if (exactVariant) {
//     updateUpsellCardFromVariant(card, exactVariant);
//     if (btn) btn.disabled = false;
//     setVariantMessage(card, "");
//   } else {
//     if (variantInput) variantInput.value = "";
//     if (colorInput) {
//       colorInput.value = optionKeys
//         .map((key) => finalSelections[key] || "")
//         .filter(Boolean)
//         .join(" / ");
//     }
//     if (btn) btn.disabled = true;
//     setVariantMessage(card, invalidMessage || "This combination is not available.");
//   }

//   return {
//     selectedOptions: finalSelections,
//     matchedVariant: exactVariant
//   };
// }
// function syncCardStateFromSelections(card, productData, changedOptionKey) {
//   if (!card || !productData || !Array.isArray(productData.variants)) return null;

//   const optionNames = productData.optionNames || [];
//   const optionKeys = optionNames.map((_, index) => "option" + (index + 1));
//   const selectableVariants = getSelectableVariants(productData.variants);
//   const selectsByKey = {};

//   card.querySelectorAll(".fr_24_upsell_product_dropdown_select").forEach((select) => {
//     const optionKey = select.getAttribute("data-option-key");
//     if (optionKey) selectsByKey[optionKey] = select;
//   });

//   const selectedOptions = {};
//   optionKeys.forEach((optionKey) => {
//     selectedOptions[optionKey] = selectsByKey[optionKey]
//       ? String(selectsByKey[optionKey].value || "").trim()
//       : "";
//   });

//   const exactVariant = findExactVariant(
//     selectableVariants,
//     selectedOptions,
//     optionNames
//   );

//   const variantInput = card.querySelector(".fr_24_upsell_variant_id");
//   const colorInput = card.querySelector(".fr_24_upsell_color_input");
//   const btn = card.querySelector(".fr_24_upsell_addtocartbtn");

//   if (colorInput) {
//     colorInput.value = optionKeys
//       .map((key) => selectedOptions[key] || "")
//       .filter(Boolean)
//       .join(" / ");
//   }

//   if (exactVariant) {
//     updateUpsellCardFromVariant(card, exactVariant);
//     if (btn) btn.disabled = false;
//     setVariantMessage(card, "");
//   } else {
//     if (variantInput) variantInput.value = "";
//     if (btn) btn.disabled = true;

//     const filledSelections = optionKeys
//       .map((key, index) => {
//         const value = selectedOptions[key];
//         if (!value) return "";
//         const label = optionNames[index] || key;
//         return label + ": " + value;
//       })
//       .filter(Boolean);

//     if (filledSelections.length >= 2) {
//       setVariantMessage(card, filledSelections.join(" / ") + " combination is not available.");
//     } else {
//       setVariantMessage(card, "");
//     }
//   }

//   return {
//     selectedOptions: selectedOptions,
//     matchedVariant: exactVariant
//   };
// }
// function syncCardStateFromSelections(card, productData, changedOptionKey) {
//   if (!card || !productData || !Array.isArray(productData.variants)) return null;

//   const selectableVariants = getSelectableVariants(productData.variants);
//   const selects = Array.from(card.querySelectorAll(".fr_24_upsell_product_dropdown_select"));

//   const optionKeys = selects
//     .map((select) => select.getAttribute("data-option-key"))
//     .filter(Boolean);

//   const optionNames = optionKeys.map((key) => {
//     const index = Number(String(key).replace("option", "")) - 1;
//     return (productData.optionNames || [])[index] || key;
//   });

//   const selectedOptions = {};
//   optionKeys.forEach((optionKey) => {
//     const select = selects.find((item) => item.getAttribute("data-option-key") === optionKey);
//     selectedOptions[optionKey] = select ? String(select.value || "").trim() : "";
//   });

//   const allSelected = optionKeys.every((key) => selectedOptions[key]);
//   const matchedVariant = allSelected
//     ? findVariantFromRenderedSelections(selectableVariants, selectedOptions, optionKeys)
//     : null;

//   const variantInput = card.querySelector(".fr_24_upsell_variant_id");
//   const colorInput = card.querySelector(".fr_24_upsell_color_input");
//   const btn = card.querySelector(".fr_24_upsell_addtocartbtn");

//   if (colorInput) {
//     colorInput.value = optionKeys
//       .map((key) => selectedOptions[key] || "")
//       .filter(Boolean)
//       .join(" / ");
//   }

//   if (matchedVariant) {
//     updateUpsellCardFromVariant(card, matchedVariant);
//     if (btn) btn.disabled = false;
//     setVariantMessage(card, "");
//   } else {
//     if (variantInput) variantInput.value = "";
//     if (btn) btn.disabled = true;

//     if (allSelected) {
//       const message = optionKeys.map((key, index) => {
//         return optionNames[index] + ": " + selectedOptions[key];
//       }).join(" / ") + " combination is not available.";
//       setVariantMessage(card, message);
//     } else {
//       setVariantMessage(card, "");
//     }
//   }

//   return {
//     selectedOptions: selectedOptions,
//     matchedVariant: matchedVariant
//   };
// }
function syncCardStateFromSelections(card, productData, changedOptionKey) {
  if (!card || !productData || !Array.isArray(productData.variants)) return null;

  console.group("syncCardStateFromSelections");
  console.log("changedOptionKey:", changedOptionKey);

  const selectableVariants = getSelectableVariants(productData.variants);
  const selects = Array.from(card.querySelectorAll(".fr_24_upsell_product_dropdown_select"));

  const optionKeys = selects
    .map((select) => select.getAttribute("data-option-key"))
    .filter(Boolean);

  const optionNames = optionKeys.map((key) => {
    const index = Number(String(key).replace("option", "")) - 1;
    return (productData.optionNames || [])[index] || key;
  });

  const selectedOptions = {};
  optionKeys.forEach((optionKey) => {
    const select = selects.find((item) => item.getAttribute("data-option-key") === optionKey);
    const selectedOption = select && select.selectedIndex > -1 ? select.options[select.selectedIndex] : null;
    const rawValue = select ? String(select.value || "") : "";
    const rawText = selectedOption ? String(selectedOption.textContent || "") : "";

    selectedOptions[optionKey] = rawValue.trim();

    console.log("SELECT DEBUG", {
      optionKey: optionKey,
      label: optionNames[optionKeys.indexOf(optionKey)],
      selectValue: rawValue,
      selectText: rawText,
      normalizedValue: normalizeText(rawValue),
      normalizedText: normalizeText(rawText),
      selectedIndex: select ? select.selectedIndex : -1,
      html: select ? select.outerHTML : null
    });
  });

  console.log("selectedOptions final:", selectedOptions);
  console.log("all variants:", selectableVariants.map((variant) => ({
    id: variant.id,
    title: variant.title,
    option1: variant.option1,
    option2: variant.option2,
    option3: variant.option3
  })));

  const allSelected = optionKeys.every((key) => selectedOptions[key]);
  console.log("allSelected:", allSelected);

  const matchedVariant = allSelected
    ? findVariantFromRenderedSelections(selectableVariants, selectedOptions, optionKeys)
    : null;

  const variantInput = card.querySelector(".fr_24_upsell_variant_id");
  const colorInput = card.querySelector(".fr_24_upsell_color_input");
  const btn = card.querySelector(".fr_24_upsell_addtocartbtn");

  if (colorInput) {
    colorInput.value = optionKeys
      .map((key) => selectedOptions[key] || "")
      .filter(Boolean)
      .join(" / ");
  }

  if (matchedVariant) {
    console.log("MATCH FOUND", matchedVariant);
    updateUpsellCardFromVariant(card, matchedVariant);
    if (btn) btn.disabled = false;
    setVariantMessage(card, "");
  } else {
    console.warn("NO MATCH FOUND");

    if (variantInput) variantInput.value = "";
    if (btn) btn.disabled = true;

    if (allSelected) {
      const message = optionKeys.map((key, index) => {
        return optionNames[index] + ": " + selectedOptions[key];
      }).join(" / ") + " combination is not available.";
      setVariantMessage(card, message);
    } else {
      setVariantMessage(card, "");
    }
  }

  console.groupEnd();

  return {
    selectedOptions: selectedOptions,
    matchedVariant: matchedVariant
  };
}

  function getInitialSelectedOptions(variants, defaultDecorName) {
    const selectableVariants = getSelectableVariants(variants);
    const firstAvailable = selectableVariants[0] || variants[0];

    const selected = {
      option1: firstAvailable?.option1 || "",
      option2: firstAvailable?.option2 || "",
      option3: firstAvailable?.option3 || ""
    };

    if (defaultDecorName) {
      const decorMatch = selectableVariants.find((variant) =>
        [variant.option1, variant.option2, variant.option3]
          .filter(Boolean)
          .some(val => String(val).toLowerCase() === defaultDecorName.toLowerCase())
      );

      if (decorMatch) {
        selected.option1 = decorMatch.option1 || "";
        selected.option2 = decorMatch.option2 || "";
        selected.option3 = decorMatch.option3 || "";
      }
    }

    return selected;
  }

  function buildOptionSelectorsHTML(product, selectedOptions, index) {
    const optionNames = product.optionNames || [];
    const optionValuesMap = product.optionValuesMap || {};

    return optionNames.map((optionName, optionIndex) => {
      const normalizedOptionName =
        typeof optionName === "string"
          ? optionName
          : (optionName && optionName.name) || `Option ${optionIndex + 1}`;

      const optionKey = "option" + (optionIndex + 1);
      const values = optionValuesMap[optionKey] || [];
      if (!values.length) return "";

      return `
        <div class="fr_24_upsell_product_dropdown">
          <label class="fr_24_upsell_option_label" for="fr24-upsell-option-${index}-${optionIndex}">
            ${normalizedOptionName}
          </label>
          <select
            id="fr24-upsell-option-${index}-${optionIndex}"
            class="fr_24_upsell_product_dropdown_select"
            data-index="${index}"
            data-option-key="${optionKey}"
            aria-label="${normalizedOptionName}"
          >
            <option value="">Select ${normalizedOptionName}</option>
            ${values.map((value) => `
              <option value="${String(value).replace(/"/g, '&quot;')}" ${selectedOptions[optionKey] === value ? "selected" : ""}>
                ${value}
              </option>
            `).join("")}
          </select>
        </div>
      `;
    }).join("");
  }

  function fetchProductOptions(product) {
    const handle = getProductHandleFromUrl(product.link);
    if (!handle) return Promise.resolve(null);

    return fetch("/products/" + handle + ".js")
      .then((res) => {
        if (!res.ok) throw new Error("Product JSON fetch failed");
        return res.json();
      })
      .then((productData) => {
        if (!productData || !productData.variants || !productData.variants.length) return null;

        const variants = productData.variants.filter(Boolean);
        const selectableVariants = getSelectableVariants(variants);

        const optionNames = Array.isArray(productData.options)
          ? productData.options
              .filter(Boolean)
              .map((option, index) =>
                typeof option === "string"
                  ? option
                  : (option && option.name) || `Option ${index + 1}`
              )
          : [];

        const optionValuesMap = {
          option1: getUniqueOptionValues(selectableVariants, "option1"),
          option2: getUniqueOptionValues(selectableVariants, "option2"),
          option3: getUniqueOptionValues(selectableVariants, "option3")
        };

        return Object.assign({}, product, {
          image: (productData.images && productData.images[0]) || product.image || "",
          productTitle: productData.title || product.name,
          variants,
          optionNames,
          optionValuesMap
        });
      })
      .catch((err) => {
        console.error("Upsell product fetch failed:", product.link, err);
        return null;
      });
  }

  function createProductHTML(product, index, defaultDecorName) {
    const selectableVariants = getSelectableVariants(product.variants || []);
    const selectedOptions = getInitialSelectedOptions(selectableVariants, defaultDecorName);

    const selectedVariant =
      findExactVariant(selectableVariants, selectedOptions, product.optionNames || []) ||
      findMatchingVariant(selectableVariants, selectedOptions) ||
      selectableVariants[0];

    if (!selectedVariant) return "";

    const price = Number(selectedVariant.price || 0);
    const comparePrice = Number(selectedVariant.compare_at_price || 0);
    const discount = comparePrice > price
      ? Math.round(((comparePrice - price) * 100) / comparePrice)
      : 0;

    const selectorsHTML = buildOptionSelectorsHTML(product, selectedOptions, index);
    const propertyValue = [selectedVariant.option1, selectedVariant.option2, selectedVariant.option3]
      .filter(Boolean)
      .join(" / ");

    return `
      <div class="fr_24_upsell_product" data-product-index="${index}">
        <a href="${product.link}">
          <img src="${product.image}" alt="${product.name}">
        </a>
        <div class="fr_24_upsell_product_add">
          <div class="fr_24_upsell_product_name">${product.name}</div>
          <div class="fr_24_upsell_product_info_wrapper">
            ${selectorsHTML}
            <div class="fr_24_upsell_variant_message" style="display:none;font-size:12px;line-height:1.4;margin-top:6px;color:#b45309;" aria-live="polite"></div>
            <div class="fr_24_upsell_form">
              <input type="hidden" name="id" class="fr_24_upsell_variant_id" value="${selectedVariant.id}">
              <input type="hidden" name="quantity" class="fr_24_upsell_quantity_input" value="2">
              <input type="hidden" name="properties[Color]" class="fr_24_upsell_color_input" value="${propertyValue}">
              <input type="hidden" class="fr_24_upsell_uid_input" value="${selectedVariant.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}">
              <button type="button" class="fr_24_upsell_addtocartbtn">
                Add to Cart 
                <span class="fr_24_upsell_product_price_wrap">
                  <span class="fr_24_upsell_product_price">${formatMoney(price)}</span>
                  ${comparePrice > price ? `<span class="fr_24_upsell_product_compare_price">${formatMoney(comparePrice)}</span>` : ""}
                  ${comparePrice > price && discount > 0 ? `<span class="fr_24_upsell_product_discount">(${discount}% Off)</span>` : ""}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function setUpsellRenderingState(state) {
    if (typeof window.fr24SetUpsellRenderingState === "function") {
      window.fr24SetUpsellRenderingState(state);
    }
  }

  function initTrimUpsell() {
    const popCart = document.querySelector(".pop-cart");
    if (!popCart) return;

    const wrapper = document.querySelector(".fr_24_upsell_minicart");
    if (!wrapper) return;

    const container = wrapper.querySelector(".fr_24_upsell_products_container");
    if (!container) return;

    setUpsellRenderingState(true);

    const jsTitle = window.fr24LastAddedBoxTitle || "";
    const liquidTitle = wrapper.dataset.boxProductTitle || "";
    const boxProductTitle = (jsTitle && FLOORING_TITLE_REGEX.test(jsTitle) ? jsTitle : null)
      || liquidTitle
      || "";

    if (boxProductTitle) {
      if (wrapper.dataset.boxProductTitle !== boxProductTitle) {
        wrapper.dataset.boxProductTitle = boxProductTitle;
      }

      const heading = wrapper.querySelector("h2");
      if (heading) {
        const variantText = window.fr24LastAddedBoxVariantTitle || "";
        heading.textContent = "Trims purchased along with " + boxProductTitle + (variantText ? " - " + variantText : "");
      }
    }

    window.fr24LastAddedBoxTitle = null;

    const defaultDecorName = getDefaultDecorName(boxProductTitle);
    const cartTitles = parseCartTitles(wrapper.dataset.cartProductTitles);

    console.log("[TrimUpsell] boxProductTitle:", boxProductTitle, "| liquidTitle:", liquidTitle, "| variant:", window.fr24LastAddedBoxVariantTitle || "");
    console.log("[TrimUpsell] family:", getProductFamily(boxProductTitle));

    container.innerHTML = "";

    fetchCartState()
      .then((cart) => {
        let selectedVariantText = window.fr24LastAddedBoxVariantTitle || "";

        if (!selectedVariantText) {
          const activeBoxItem = getActiveBoxCartItem(cart, boxProductTitle);
          selectedVariantText = activeBoxItem ? getCartItemOptionText(activeBoxItem) : "";
        }

        console.log("[TrimUpsell] selectedVariantText:", selectedVariantText);

        const products = getUpsellProductsByFamilyAndVariant(boxProductTitle, selectedVariantText)
          .filter((product) => !cartTitles.includes(product.name));

        if (!products.length) {
          wrapper.remove();
          setUpsellRenderingState(false);
          return Promise.resolve([]);
        }

        return Promise.all(products.map(fetchProductOptions));
      })
      .then((items) => {
        const validItems = (items || []).filter(Boolean);
        window.fr24RenderedUpsellProducts = validItems;

        if (!validItems.length) {
          container.innerHTML = "";
          return;
        }

        container.innerHTML = "";

        validItems.forEach((product, index) => {
          container.insertAdjacentHTML("beforeend", createProductHTML(product, index, defaultDecorName));
        });

        container.querySelectorAll(".fr_24_upsell_product").forEach(function (card) {
          const productIndex = Number(card.getAttribute("data-product-index"));
          const productData = (window.fr24RenderedUpsellProducts || [])[productIndex];
          if (!productData || !Array.isArray(productData.variants)) return;
          syncCardStateFromSelections(card, productData, null);
        });

        initUpsellDragScroll();
      })
      .catch((err) => {
        console.error("Upsell render failed:", err);
      })
      .finally(() => {
        setUpsellRenderingState(false);
      });
  }

  function initUpsellDragScroll() {
    const container = document.querySelector(
      "#shopify-section-pop-cart .pop-cart .fr_24_upsell_minicart .fr_24_upsell_products_container"
    );
    if (!container || container._dragScrollInit) return;

    container._dragScrollInit = true;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    container.addEventListener("mousedown", function (e) {
      isDown = true;
      container.classList.add("is-dragging");
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    });

    container.addEventListener("mouseleave", function () {
      isDown = false;
      container.classList.remove("is-dragging");
    });

    container.addEventListener("mouseup", function () {
      isDown = false;
      container.classList.remove("is-dragging");
    });

    container.addEventListener("mousemove", function (e) {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5;
      container.scrollLeft = scrollLeft - walk;
    });
  }

  function resetTrimUpsell() {
    const wrapper = document.querySelector(".fr_24_upsell_minicart");
    if (!wrapper) return;
    const container = wrapper.querySelector(".fr_24_upsell_products_container");
    if (container) container.innerHTML = "";
  }

  function openPopCart() {
    const popCart = document.querySelector(".pop-cart");
    if (popCart) popCart.classList.add("active");
  }

  function refreshCartCountFromSections(sectionsHTML) {
    if (!sectionsHTML) return;
    const parser = new DOMParser().parseFromString(sectionsHTML, "text/html");
    const newCountEls = parser.querySelectorAll(".js-cart-count");
    const currentCountEls = document.querySelectorAll(".js-cart-count");
    currentCountEls.forEach((el, index) => {
      if (newCountEls[index]) el.innerHTML = newCountEls[index].innerHTML;
    });
  }

  function replacePopCartFromHTML(htmlText) {
    if (!htmlText) return;
    const parser = new DOMParser().parseFromString(htmlText, "text/html");
    const newPopCart = parser.querySelector(".pop-cart") || parser.querySelector("#shopify-section-pop-cart");
    const currentPopCart = document.querySelector(".pop-cart") || document.querySelector("#shopify-section-pop-cart");
    if (newPopCart && currentPopCart) currentPopCart.replaceWith(newPopCart);
  }

  function refreshCartDrawerFromSections(sections) {
    if (!sections) return Promise.resolve();

    const cartDrawer = document.querySelector("cart-drawer") || document.querySelector("cart-drawer-component");

    if (cartDrawer && typeof cartDrawer.renderContents === "function") {
      try {
        cartDrawer.renderContents({ id: null, sections: sections });
        openPopCart();
        return new Promise((resolve) => setTimeout(() => {
          if (window.initTrimUpsell) window.initTrimUpsell();
          resolve();
        }, 300));
      } catch (err) {
        console.error("cartDrawer.renderContents failed, falling back to replace:", err);
      }
    }

    if (sections["pop-cart"]) replacePopCartFromHTML(sections["pop-cart"]);
    else if (sections["cart-drawer"]) replacePopCartFromHTML(sections["cart-drawer"]);

    if (sections["cart-icon-bubble"]) refreshCartCountFromSections(sections["cart-icon-bubble"]);

    openPopCart();

    return new Promise((resolve) => setTimeout(() => {
      if (window.initTrimUpsell) window.initTrimUpsell();
      resolve();
    }, 300));
  }

  window.initTrimUpsell = initTrimUpsell;
  window.resetTrimUpsell = resetTrimUpsell;
  window.refreshCartDrawerFromSections = refreshCartDrawerFromSections;

  // ─── DROPDOWN CHANGE ──────────────────────────────────────────────────────
  document.addEventListener("change", function (e) {
    const select = e.target.closest(".fr_24_upsell_product_dropdown_select");
    if (!select) return;

    const card = select.closest(".fr_24_upsell_product");
    if (!card) return;

    const productIndex = Number(card.getAttribute("data-product-index"));
    const productData = (window.fr24RenderedUpsellProducts || [])[productIndex];
    if (!productData || !Array.isArray(productData.variants)) return;

    syncCardStateFromSelections(card, productData, select.getAttribute("data-option-key"));
  });

  // ─── ADD TO CART CLICK ────────────────────────────────────────────────────
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".fr_24_upsell_addtocartbtn");
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const form = btn.closest(".fr_24_upsell_form");
    if (!form || btn.disabled) return;

    const variantId = form.querySelector(".fr_24_upsell_variant_id")?.value;
    if (!variantId) return;

    btn.disabled = true;

    const formData = new FormData();
    formData.append("id", variantId);
    formData.append("quantity", form.querySelector(".fr_24_upsell_quantity_input")?.value || "1");
    formData.append("properties[Color]", form.querySelector(".fr_24_upsell_color_input")?.value || "");

    window.fr24IsAddingTrim = true;

    fetch("/cart/add.js", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData
    })
      .then((res) => {
        if (!res.ok) throw new Error("Upsell add failed");
        return res.json();
      })
      .then(() => {
        resetTrimUpsell();
        return fetch("/?sections=pop-cart,cart-icon-bubble", {
          method: "GET",
          headers: { Accept: "application/json" }
        });
      })
      .then((res) => {
        if (!res.ok) throw new Error("Cart refresh failed");
        return res.json();
      })
      .then((sections) => {
        const popCartHtml = sections && sections["pop-cart"];
        const bubbleHtml = sections && sections["cart-icon-bubble"];

        if (popCartHtml) {
          const parser = new DOMParser().parseFromString(popCartHtml, "text/html");
          const newForm = parser.querySelector(".pop-cart form") || parser.querySelector("#shopify-section-pop-cart form");
          const currentForm = document.querySelector(".pop-cart form") || document.querySelector("#shopify-section-pop-cart form");
          if (newForm && currentForm) currentForm.innerHTML = newForm.innerHTML;
        }

        if (bubbleHtml) {
          const parser = new DOMParser().parseFromString(bubbleHtml, "text/html");
          const newCountEls = parser.querySelectorAll(".js-cart-count");
          const currentCountEls = document.querySelectorAll(".js-cart-count");
          currentCountEls.forEach((el, i) => {
            if (newCountEls[i]) el.innerHTML = newCountEls[i].innerHTML;
          });
        }

        const popCart = document.querySelector(".pop-cart");
        if (popCart) popCart.classList.add("active");

        setTimeout(() => {
          if (window.initTrimUpsell) window.initTrimUpsell();
        }, 150);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        window.fr24IsAddingTrim = false;
        btn.disabled = false;
      });
  });

  if (document.readyState !== "loading") window.initTrimUpsell();
  else document.addEventListener("DOMContentLoaded", function () {
    window.initTrimUpsell();
  });

  if (!window.fr24TrimUpsellRefreshWatcher) {
    window.fr24TrimUpsellRefreshWatcher = true;
    let fr24UpsellRefreshTimeout = null;
    let fr24IsRenderingUpsell = false;

    function scheduleTrimUpsellInit() {
      clearTimeout(fr24UpsellRefreshTimeout);
      fr24UpsellRefreshTimeout = setTimeout(function () {
        if (fr24IsRenderingUpsell) return;
        if (window.initTrimUpsell) window.initTrimUpsell();
      }, 250);
    }

    function watchCartDrawerRefresh() {
      const cartRoot = document.querySelector("#shopify-section-pop-cart") || document.querySelector(".pop-cart");
      if (!cartRoot) {
        setTimeout(watchCartDrawerRefresh, 500);
        return;
      }

      const observer = new MutationObserver(function (mutations) {
        let shouldRerun = false;

        mutations.forEach(function (mutation) {
          const target = mutation.target;
          if (target && target.closest && target.closest(".fr_24_upsell_minicart")) return;

          if (mutation.type === "childList") {
            const addedOutsideUpsell = Array.from(mutation.addedNodes).some(function (node) {
              return node.nodeType === 1 && (!node.closest || !node.closest(".fr_24_upsell_minicart"));
            });

            const removedOutsideUpsell = Array.from(mutation.removedNodes).some(function (node) {
              return node.nodeType === 1;
            });

            if (addedOutsideUpsell || removedOutsideUpsell) shouldRerun = true;
          }
        });

        if (shouldRerun) scheduleTrimUpsellInit();
      });

      observer.observe(cartRoot, { childList: true, subtree: true });
      window.fr24UpsellObserverInstance = observer;
    }

    window.fr24SetUpsellRenderingState = function (state) {
      fr24IsRenderingUpsell = state;
    };

    if (document.readyState !== "loading") watchCartDrawerRefresh();
    else document.addEventListener("DOMContentLoaded", watchCartDrawerRefresh);
  } else {
    console.log("Trim upsell script already booted.");
  }

  function lockPageScroll() {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  function unlockPageScroll() {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }

  function syncDrawerScrollLock() {
    const popCart = document.querySelector(".pop-cart");
    if (popCart && popCart.classList.contains("active")) lockPageScroll();
    else unlockPageScroll();
  }

  function scrollToTripUpsellInDrawer() {
    const target = document.querySelector("#tripUpsell");
    if (!target) return;

    const scrollContainer =
      document.querySelector(".pop-cart form .overflow") ||
      document.querySelector(".pop-cart .overflow") ||
      document.querySelector(".pop-cart_top") ||
      document.querySelector(".pop-cart");

    if (!scrollContainer) return;

    const containerRect = scrollContainer.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const currentScrollTop = scrollContainer.scrollTop;
    const targetTop = targetRect.top - containerRect.top + currentScrollTop - 20;

    scrollContainer.scrollTo({ top: targetTop, behavior: "smooth" });
  }

  document.addEventListener("click", function (e) {
    const scrollBtn = e.target.closest("#scrollToBtn");
    if (!scrollBtn) return;
    e.preventDefault();
    e.stopPropagation();
    syncDrawerScrollLock();
    requestAnimationFrame(function () {
      scrollToTripUpsellInDrawer();
    });
  });

  document.addEventListener("click", function () {
    setTimeout(syncDrawerScrollLock, 50);
  });

  window.addEventListener("load", syncDrawerScrollLock);
}