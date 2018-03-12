theme.Maps = (function() {
  var config = {
    zoom: 14
  };
  var apiStatus = null;
  var mapsToLoad = [];
  var key = theme.mapKey ? theme.mapKey : '';

  function Map(container) {
    this.$container = $(container);

    if (apiStatus === 'loaded') {
      this.createMap();
    } else {
      mapsToLoad.push(this);

      if (apiStatus !== 'loading') {
        apiStatus = 'loading';
        if (typeof window.google === 'undefined') {
          $.getScript('https://maps.googleapis.com/maps/api/js?key=' + key)
            .then(function() {
              apiStatus = 'loaded';
              initAllMaps();
            });
        }
      }
    }
  }

  function initAllMaps() {
    // API has loaded, load all Map instances in queue
    $.each(mapsToLoad, function(index, instance) {
      instance.createMap();
    });
  }

  function geolocate($map) {
    var deferred = $.Deferred();
    var geocoder = new google.maps.Geocoder();
    var address = $map.data('address-setting');

    geocoder.geocode({address: address}, function(results, status) {
      if (status !== google.maps.GeocoderStatus.OK) {
        deferred.reject(status);
      }

      deferred.resolve(results);
    });

    return deferred;
  }

  Map.prototype = _.assignIn({}, Map.prototype, {
    createMap: function() {
      var $map = this.$container.find('.map-section__container');

      return geolocate($map)
        .then(function(results) {
          var mapOptions = {
            zoom: config.zoom,
            center: results[0].geometry.location,
            disableDefaultUI: true
          };

          var map = this.map = new google.maps.Map($map[0], mapOptions);
          var center = this.center = map.getCenter();

          //eslint-disable-next-line no-unused-vars
          var marker = new google.maps.Marker({
            map: map,
            position: map.getCenter()
          });

          google.maps.event.addDomListener(window, 'resize', $.debounce(250, function() {
            google.maps.event.trigger(map, 'resize');
            map.setCenter(center);
          }));
        }.bind(this))
        .fail(function() {
          var errorMessage;

          switch (status) {
            case 'ZERO_RESULTS':
              errorMessage = theme.strings.addressNoResults;
              break;
            case 'OVER_QUERY_LIMIT':
              errorMessage = theme.strings.addressQueryLimit;
              break;
            default:
              errorMessage = theme.strings.addressError;
              break;
          }

          $map
            .parent()
            .addClass('page-width map-section--load-error')
            .html('<div class="errors text-center">' + errorMessage + '</div>');
        });
    },

    onUnload: function() {
      google.maps.event.clearListeners(this.map, 'resize');
    }
  });

  return Map;
})();


theme.Product = (function() {
  var defaults = {
    // Breakpoints from src/stylesheets/global/variables.scss.liquid
    mediaQuerySmall: 'screen and (max-width: 749px)',
    mediaQueryMediumUp: 'screen and (min-width: 750px)',
    bpSmall: false,
    sliderActive: false,
    zoomEnabled: false,
    imageSize: null,
    imageZoomSize: null,
    selectors: {
      addToCart: '#AddToCart',
      productPrice: '#ProductPrice',
      comparePrice: '#ComparePrice',
      addToCartText: '#AddToCartText',
      productFeaturedImage: '#FeaturedImage',
      productThumbImages: '.product-single__thumbnail',
      productThumbs: '.product-single__thumbnails',
      optionSelector: 'ProductSelect',
      saleLabel: '.product-price__sale-label',
      saleClasses: 'product-price__sale product-price__sale--single'
    }
  };

  function enableZoom($el) {
    var zoomUrl = $el.data('zoom');
    $el.zoom({
      url: zoomUrl
    });
  }

  function destroyZoom($el) {
    $el.trigger('zoom.destroy');
  }

  function Product(container) {
    var $container = this.$container = $(container);
    var sectionId = $container.attr('data-section-id');

    this.settings = $.extend({}, defaults, {
      sectionId: sectionId,
      enableHistoryState: $container.data('enable-history-state'),
      selectors: {
        originalSelectorId: 'ProductSelect-' + sectionId,
        addToCart: '#AddToCart-' + sectionId,
        productPrice: '#ProductPrice-' + sectionId,
        comparePrice: '#ComparePrice-' + sectionId,
        addToCartText: '#AddToCartText-' + sectionId,
        productFeaturedImage: '#FeaturedImage-' + sectionId,
        productImageWrap: '#FeaturedImageZoom-' + sectionId,
        productThumbImages: '.product-single__thumbnail--' + sectionId,
        productThumbs: '.product-single__thumbnails-' + sectionId,
        saleLabel: '.product-price__sale-label-' + sectionId,
        saleClasses: 'product-price__sale product-price__sale--single',
        price: '.product-price__price-' + sectionId
      }
    });

    // Stop parsing if we don't have the product json script tag when loading
    // section in the Theme Editor
    if (!$('#ProductJson-' + sectionId).html()) {
      return;
    }

    this.productSingleObject = JSON.parse(document.getElementById('ProductJson-' + sectionId).innerHTML);

    this.settings.zoomEnabled = $(this.settings.selectors.productFeaturedImage).hasClass('js-zoom-enabled');
    this.settings.imageSize = Shopify.Image.imageSize($(this.settings.selectors.productFeaturedImage).attr('src'));

    if (this.settings.zoomEnabled) {
      this.settings.imageZoomSize = Shopify.Image.imageSize($(this.settings.selectors.productImageWrap).data('zoom'));
    }

    this.init();

    // Pre-loading product images to avoid a lag when a thumbnail is clicked, or
    // when a variant is selected that has a variant image
    Shopify.Image.preload(this.productSingleObject.images, this.settings.imageSize);
  }

  Product.prototype = _.assignIn({}, Product.prototype, {
    init: function() {
      this.initBreakpoints();
      this.stringOverrides();
      this.initProductVariant();
      this.initProductImageSwitch();
      this.setActiveThumbnail();
    },

    stringOverrides: function() {
      // Override defaults in theme.strings with potential
      // template overrides

      theme.productStrings = theme.productStrings || {};
      $.extend(theme.strings, theme.productStrings);
    },

    initBreakpoints: function() {
      var self = this;

      enquire.register(this.settings.mediaQuerySmall, {
        match: function() {
          // initialize thumbnail slider on mobile if more than three thumbnails
          if ($(self.settings.selectors.productThumbImages).length > 3) {
            self.initProductThumbnailSlider();
          }

          // destroy an image zooming that's enabled
          if (self.settings.zoomEnabled) {
            destroyZoom($(self.settings.selectors.productImageWrap));
          }

          self.settings.bpSmall = true;
        },
        unmatch: function() {
          if (self.settings.sliderActive) {
            self.destroyProductThumbnailSlider();
          }

          if (self.settings.zoomEnabled) {
            enableZoom($(self.settings.selectors.productImageWrap));
          }

          self.settings.bpSmall = false;
        }
      });
    },

    initProductVariant: function() {
      // this.productSingleObject is a global JSON object defined in theme.liquid
      if (!this.productSingleObject) {
        return;
      }

      var self = this;

      this.optionSelector = new Shopify.OptionSelectors(self.settings.selectors.originalSelectorId, {
        selectorClass: self.settings.selectors.optionSelectorClass,
        product: self.productSingleObject,
        onVariantSelected: self.productVariantCallback,
        enableHistoryState: self.settings.enableHistoryState,
        settings: self.settings,
        switchProductImage: self.switchProductImage,
        setActiveThumbnail: self.setActiveThumbnail
      });

      // Clean up variant labels if the Shopify-defined
      // defaults are the only ones left
      this.simplifyVariantLabels(this.productSingleObject);
      this.productVariantStyles();
    },

    simplifyVariantLabels: function(productObject) {
      // Hide variant dropdown if only one exists and title contains 'Default'
      if (productObject.variants.length && productObject.variants[0].title.indexOf('Default') >= 0) {
        $('.selector-wrapper').hide();
      }
    },

    initProductImageSwitch: function() {
      if (!$(this.settings.selectors.productThumbImages).length) {
        return;
      }

      var self = this;

      $(this.settings.selectors.productThumbImages).on('click', function(evt) {
        evt.preventDefault();
        var $el = $(this);
        var imageSrc = $el.attr('href');
        var zoomSrc = $el.data('zoom');

        self.switchProductImage(imageSrc, zoomSrc);
        self.setActiveThumbnail(imageSrc);
      });
    },

    setActiveThumbnail: function(src) {
      var activeClass = 'active-thumb';

      // If there is no element passed, find it by the current product image
      if (typeof src === 'undefined') {
        src = $(this.settings.selectors.productFeaturedImage).attr('src');
      }

      // select all thumbnails (incl. slick cloned thumbs) with matching 'href'
      var $thumbnail = $(this.settings.selectors.productThumbImages + '[href="' + src + '"]');
      // Set active thumbnail classes
      $(this.settings.selectors.productThumbImages).removeClass(activeClass);
      $thumbnail.addClass(activeClass);
    },

    switchProductImage: function(image, zoomImage) {
      $(this.settings.selectors.productFeaturedImage).attr('src', image);

      // destroy any image zooming that might be enabled
      if (this.settings.zoomEnabled) {
        destroyZoom($(this.settings.selectors.productImageWrap));
      }

      if (!this.settings.bpSmall && this.settings.zoomEnabled && zoomImage) {
        $(this.settings.selectors.productImageWrap).data('zoom', zoomImage);
        enableZoom($(this.settings.selectors.productImageWrap));
      }
    },

    initProductThumbnailSlider: function() {
      var options = {
        slidesToShow: 4,
        slidesToScroll: 3,
        infinite: false,
        prevArrow: '.thumbnails-slider__prev--' + this.settings.sectionId,
        nextArrow: '.thumbnails-slider__next--' + this.settings.sectionId,
        responsive: [
          {
            breakpoint: 321,
            settings: {
              slidesToShow: 3
            }
          }
        ]
      };

      $(this.settings.selectors.productThumbs).slick(options);
      this.settings.sliderActive = true;
    },

    destroyProductThumbnailSlider: function() {
      $(this.settings.selectors.productThumbs).slick('unslick');
      this.settings.sliderActive = false;
    },

    productVariantStyles: function() {
      $('.selector-wrapper').addClass('product-form__item');
      $('.single-option-selector').addClass('product-form__input');
    },

    // **WARNING** This function actually inherits `this` from `this.optionSelector` not
    // from `product` when passed in as a callback for `option_selection.js`
    productVariantCallback: function(variant) {
      var sizedImgUrl;
      var zoomSizedImgUrl;

      if (variant) {
        // Update variant image, if one is set
        if (variant.featured_image) {
          sizedImgUrl = Shopify.Image.getSizedImageUrl(variant.featured_image.src, this.settings.imageSize);
          if (this.settings.zoomEnabled) {
            zoomSizedImgUrl = Shopify.Image.getSizedImageUrl(variant.featured_image.src, this.settings.imageZoomSize);
          }
          this.switchProductImage(sizedImgUrl, zoomSizedImgUrl);
          this.setActiveThumbnail(sizedImgUrl);
        } else {
          // No featured image so setup the zoom on the images loaded by liquid
          var self = this;
          enquire.register(this.settings.mediaQueryMediumUp, {
            match: function() {
              if (self.settings.zoomEnabled) {
                enableZoom($(self.settings.selectors.productImageWrap));
              }
            }
          });
        }

        // Update the product price
        $(this.settings.selectors.productPrice).html(Shopify.formatMoney(variant.price, theme.moneyFormat));

        // Update and show the product's compare price if necessary
        if (variant.compare_at_price > variant.price) {
          $(this.settings.selectors.comparePrice)
            .html(Shopify.formatMoney(variant.compare_at_price, theme.moneyFormat))
            .removeClass('hide');

          $(this.settings.selectors.price).addClass(this.settings.selectors.saleClasses);

          $(this.settings.selectors.saleLabel).removeClass('hide');
        } else {
          $(this.settings.selectors.comparePrice).addClass('hide');
          $(this.settings.selectors.saleLabel).addClass('hide');
          $(this.settings.selectors.price).removeClass(this.settings.selectors.saleClasses);
        }

        // Select a valid variant if available
        if (variant.available) {
          // We have a valid product variant, so enable the submit button
          $(this.settings.selectors.addToCart).prop('disabled', false);
          $(this.settings.selectors.addToCartText).text(theme.strings.addToCart);
        } else {
          // Variant is sold out, disable the submit button and change the text
          $(this.settings.selectors.addToCart).prop('disabled', true);
          $(this.settings.selectors.addToCartText).text(theme.strings.soldOut);
        }
      } else {
        // The variant doesn't exist, disable submit button and change the text.
        // This may be an error or notice that a specific variant is not available.
        $(this.settings.selectors.addToCart).prop('disabled', true);
        $(this.settings.selectors.addToCartText).text(theme.strings.unavailable);
      }
    }

  });

  return Product;
})();
$(document).ready(function() {
  var sections = new theme.Sections();


  sections.register('map', theme.Maps);
  sections.register('quotes', theme.Quotes);
});
$(theme.init);
