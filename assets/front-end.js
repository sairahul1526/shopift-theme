(function($) {


  if ($("#filter-sidebar")) {
    History.Adapter.bind(window, "statechange", function() {
      var e = History.getState();
      if (!mt.isSidebarAjaxClick) {
        mt.sidebarParams();
        var n = mt.sidebarCreateUrl();
        mt.sidebarGetContent(n);

      }
      mt.isSidebarAjaxClick = false
    })
  }

  if (window.use_color_swatch) {
    $(".swatch :radio").change(function() {
      var t = $(this).closest(".swatch").attr("data-option-index");
      var n = $(this).val();
      $(this).closest("form").find(".single-option-selector").eq(t).val(n).trigger("change")
    });

    Shopify.optionsMap = {};
    Shopify.updateOptionsInSelector = function(t) {
      switch (t) {
        case 0:
          var n = "root";
          var cart = $(".single-option-selector:eq(0)");
          break;
        case 1:
          var n = $(".single-option-selector:eq(0)").val();
          var cart = $(".single-option-selector:eq(1)");
          break;
        case 2:
          var n = $(".single-option-selector:eq(0)").val();
          n += " / " + $(".single-option-selector:eq(1)").val();
          var cart = $(".single-option-selector:eq(2)")
          }
      var i = cart.val();
      cart.empty();
      var s = Shopify.optionsMap[n];
      for (var o = 0; o < s.length; o++) {
        var u = s[o];
        var a = $("<option></option>").val(u).html(u);
        cart.append(a)
      }
      $('.swatch[data-option-index="' + t + '"] .swatch-element').each(function() {
        if ($.inArray($(this).attr("data-value"), s) !== -1) {
          $(this).removeClass("soldout").show().find(":radio").removeAttr("disabled", "disabled").removeAttr("checked")
        } else {
          $(this).addClass("soldout").hide().find(":radio").removeAttr("checked").attr("disabled", "disabled")
        }
      });
      if ($.inArray(i, s) !== -1) {
        cart.val(i)
      }
      cart.trigger("change")
    };
    Shopify.linkOptionSelectors = function(mt) {
      for (var n = 0; n < mt.variants.length; n++) {
        var cart = mt.variants[n];
        if (cart.available) {
          Shopify.optionsMap["root"] = Shopify.optionsMap["root"] || [];
          Shopify.optionsMap["root"].push(cart.option1);
          Shopify.optionsMap["root"] = Shopify.uniq(Shopify.optionsMap["root"]);
          if (mt.options.length > 0) {
            var i = cart.option1;
            Shopify.optionsMap[i] = Shopify.optionsMap[i] || [];
            Shopify.optionsMap[i].push(cart.option2);
            Shopify.optionsMap[i] = Shopify.uniq(Shopify.optionsMap[i])
          }
          if (mt.options.length === 3) {
            var i = cart.option1 + " / " + cart.option2;
            Shopify.optionsMap[i] = Shopify.optionsMap[i] || [];
            Shopify.optionsMap[i].push(cart.option3);
            Shopify.optionsMap[i] = Shopify.uniq(Shopify.optionsMap[i])
          }
        }
      }
      Shopify.updateOptionsInSelector(0);
      if (mt.options.length > 0) Shopify.updateOptionsInSelector(1);
      if (mt.options.length === 3) Shopify.updateOptionsInSelector(2);
      $(".single-option-selector:eq(0)").change(function() {
        Shopify.updateOptionsInSelector(1);
        if (mt.options.length === 3) Shopify.updateOptionsInSelector(2);
        return true
      });
      $(".single-option-selector:eq(1)").change(function() {
        if (mt.options.length === 3) Shopify.updateOptionsInSelector(2);
        return true
      })
    }
  }

  $(document).ready(function() {
    mt.go()
  });
  $(window).resize(function() {
    mt.goResizeImage()
  });



  var mt = {
    atTimeout: null,
    isSidebarAjaxClick: false,
    go: function() {
      this.goResizeImage();
      this.goQuickView();
      this.goSidebar();
      this.goCloudzoom();
      this.goScrollTop();
      this.goDropDownCart();//add cart
      this.goAddToCart();
      this.goBox();
      this.goProductAddToCart();
      this.goWishlist();
      this.goProductWishlist();
      this.goRemoveWishlist();
      this.goColorSwatchGridInit();
      this.goInfiniteScrolling();
    },
    
     goInfiniteScrolling: function() {
            if ($(".infinite-scrolling").length > 0) {
                $(".infinite-scrolling a").click(function(n) {
                    n.preventDefault();
                    if (!$(this).hasClass("disabled")) {
                        mt.doInfiniteScrolling()
                    }
                })
            }
        },
        doInfiniteScrolling: function() {
            var n = $(".main_container .products-grid");
            if (!n.length) {
                n = $(".main_container .product-list")
            }
            if (n) {
                var r = $(".infinite-scrolling a").first();
                $.ajax({
                    type: "GET",
                    url: r.attr("href"),
                    beforeSend: function() {
                        mt.showLoading();
                        $(".loading-modal").show()
                    },
                    success: function(i) {
                        mt.hideLoading();
                        var s = $(i).find(".main_container .products-grid");
                        if (!s.length) {
                            s = $(i).find(".main_container .product-list-item")
                        }
                        if (s.length) {
                            if (s.hasClass("products-grid")) {
                                if (window.product_image_resize) {
                                    s.children().find("img").fakecrop({
                                        fill: window.images_size.is_crop,
                                        widthSelector: ".products-grid .grid-item .product-image",
                                        ratioWrapper: window.images_size
                                    })
                                }
                            }
                            n.append(s.children());
                            mt.goQuickView();
                            mt.goAddToCart();
                            mt.goWishlist();
                            if ($(i).find(".infinite-scrolling").length > 0) {
                                r.attr("href", $(i).find(".infinite-scrolling a").attr("href"))
                            } else {
                                r.hide();
                                r.next().show()
                            }
                            if ($(".spr-badge").length > 0) {
                                return window.SPR.registerCallbacks(), window.SPR.initRatingHandler(), window.SPR.initDomEls(), window.SPR.loadProducts(), window.SPR.loadBadges()
                            }
                        }
                    },
                    error: function(n, r) {
                        mt.hideLoading();
                        $(".loading-modal").hide();
                        $(".ajax-error-message").text($.parseJSON(n.responseText).description);
                        mt.showBox(".ajax-error-modal")
                    },
                    dataType: "html"
                })
            }
        },
    goColorSwatchGridInit: function(){
      $('.color-swatch-item li a').on('click', function(e){
        e.preventDefault();  
        var productImage = $(this).parents('.product-inner').find('.grid-image'); 
        productImage.find('img.feature-images').attr('src', $(this).data('image'));  
      });
    },
    sidebarMapTagEvents: function() {
      $(".sidebar-tag a, .sidebar-tag label").click(function(n) {
        var r = [];
        if (Shopify.queryParams.constraint) {
          r = Shopify.queryParams.constraint.split("+")
        }
        if (!window.enable_sidebar_multiple_choice && !$(this).prev().is(":checked")) {
          var i = $(this).parents(".sidebar-tag").find("input:checked");
          if (i.length > 0) {
            var s = i.val();
            if (s) {
              var o = r.indexOf(s);
              if (o >= 0) {
                r.splice(o, 1)
              }
            }
          }
        }
        var s = $(this).prev().val();
        if (s) {
          var o = r.indexOf(s);
          if (o >= 0) {
            r.splice(o, 1)
          } else {
            r.push(s)
          }
        }
        if (r.length) {
          Shopify.queryParams.constraint = r.join("+")
        } else {
          delete Shopify.queryParams.constraint
        }
        mt.sidebarAjaxClick();
        n.preventDefault()
      })
    },


    sidebarMapEvents: function() {
      mt.sidebarMapTagEvents();

    },

    //cart top

    checkItemsInDropdownCart: function() {
      if ($("#dropdown-cart .cart-list").children().length > 0) {
        $("#dropdown-cart .cart-empty").hide();
        $("#dropdown-cart .mini_cart_header").show()
      } else {
        $("#dropdown-cart .mini_cart_header").hide();
        $("#dropdown-cart .cart-empty").show()
      }
    },

    goDropDownCart: function() {
      mt.checkItemsInDropdownCart();
      $("#dropdown-cart .cart-empty a").click(function() {
        $("#dropdown-cart").slideUp("fast")
      });
      $("#dropdown-cart .btn-remove").click(function(n) {
        n.preventDefault();
        var cart = $(this).parents(".item").attr("id");
        cart = cart.match(/\d+/g);
        Shopify.removeItem(cart, function(e) {
          mt.doUpdateDropdownCart(e)
        })
      })
    },
    closeDropdownCart: function() {
      if ($("#dropdown-cart").is(":visible")) {
        $("#dropdown-cart").slideUp("fast")
      }
    },

    //end cart  





    sidebarMapTagEvents: function() {
      $(".sidebar-tag a, .sidebar-tag label").click(function(n) {
        var cart = [];
        if (Shopify.queryParams.constraint) {
          cart = Shopify.queryParams.constraint.split("+")
        }
        if (!window.enable_sidebar_multiple_choice && !$(this).prev().is(":checked")) {
          var i = $(this).parents(".sidebar-tag").find("input:checked");
          if (i.length > 0) {
            var s = i.val();
            if (s) {
              var o = r.indexOf(s);
              if (o >= 0) {
                r.splice(o, 1)
              }
            }
          }
        }
        var s = $(this).prev().val();
        if (s) {
          var o = cart.indexOf(s);
          if (o >= 0) {
            cart.splice(o, 1)
          } else {
            cart.push(s)
          }
        }
        if (cart.length) {
          Shopify.queryParams.constraint = cart.join("+")
        } else {
          delete Shopify.queryParams.constraint
        }
        mt.sidebarAjaxClick();
        n.preventDefault()
      })
    },
    sidebarMapCategories: function() {

    },
    sidebarMapView: function() {

    },
    sidebarMapShow: function() {
      $(".filter-show a").click(function(n) {
        if (!$(this).parent().hasClass("active")) {
          var cart = $(this).attr("href");
          var i = $(".view-mode a.active").attr("href");
          if (i == "list") {
            Shopify.queryParams.view = "list" + cart
          } else {
            Shopify.queryParams.view = cart
          }
          mt.sidebarAjaxClick();
          $(".filter-show > button span").text(cart);
          $(".filter-show li.active").removeClass("active");
          $(this).parent().addClass("active")
        }
        n.preventDefault()
      })
    },
    sidebarInitToggle: function() {
   
    },
    sidebarMapSorting: function(n) {
      $(".browse-tags a").click(function(n) {
        if (!$(this).parent().hasClass("active")) {
          Shopify.queryParams.sort_by = $(this).attr("href");
          mt.sidebarAjaxClick();
          var cart = $(this).text();
          $(".browse-tags > button span").text(cart);
          $(".browse-tags li.active").removeClass("active");
          $(this).parent().addClass("active")
        }
        n.preventDefault()
      })
    },
    sidebarMapPaging: function() {
      $(".pagination-page a").click(function(n) {

      })
    },
    sidebarMapClearAll: function() {
      $(".refined-widgets a.clear-all").click(function($) {
        delete Shopify.queryParams.constraint;
        delete Shopify.queryParams.q;
        mt.sidebarAjaxClick();
        $.preventDefault()
      })
    },
    sidebarMapClear: function() {
 
    },
    sidebarMapEvents: function() {
      mt.sidebarMapTagEvents();
      mt.sidebarMapCategories();
      mt.sidebarMapView();
      mt.sidebarMapShow();
      mt.sidebarMapSorting();
      mt.goColorSwatchGridInit();
    },
    reActivateSidebar: function() {
      $(".sidebar-custom .active, .sidebar-links .active").removeClass("active");
      $(".sidebar-tag input:checked").attr("checked", false);
      var n = location.pathname.match(/\/collections\/(.*)(\?)?/);
      if (n && n[1]) {
        $(".sidebar-links a[href='" + n[0] + "']").addClass("active")
      }
      if (Shopify.queryParams.view) {
        $(".view-mode .active").removeClass("active");
        var cart = Shopify.queryParams.view;
        if (cart.indexOf("list") >= 0) {
          cart(".view-mode .list").addClass("active");
          cart = cart.replace("list", "")
        } else {
          $(".view-mode .grid").addClass("active")
        }
        $(".filter-show > button span").text(cart);
        $(".filter-show li.active").removeClass("active");
        $(".filter-show a[href='" + cart + "']").parent().addClass("active")
      }
      mt.goSortby()
    },
    goSortby: function() {
      if (Shopify.queryParams.sort_by) {
        var mt = Shopify.queryParams.sort_by;
        var n = $(".browse-tags a[href='" + mt + "']").text();
        $(".browse-tags > button span").text(n);
        $(".browse-tags li.active").removeClass("active");
        $(".browse-tags a[href='" + mt + "']").parent().addClass("active")
      }
    },
    sidebarMapData: function(n) {
      var rs = $(".col-main .products-grids");
      if (rs.length == 0) {
        rs = $(".col-main .product-list")
      }
      var is = $(n).find(".col-main .products-grids");
      if (is.length == 0) {
        is = $(n).find(".col-main .product-list")
      }
      var cart = $(".col-main .products-grid");
      if (cart.length == 0) {
        cart = $(".col-main .product-list")
      }
      var i = $(n).find(".col-main .products-grid");
      if (i.length == 0) {
        i = $(n).find(".col-main .product-list")
      }
      if (i.length > 0 && i.hasClass("products-grid")) {
        if (window.product_image_resize) {
          i.find("img").fakecrop({
            fill: window.images_size.is_crop,
            widthSelector: ".products-grid .grid-item .product-image",
            ratioWrapper: window.images_size
          })
        }
      }
      cart.replaceWith(i);
      rs.replaceWith(is);
      if ($(".padding").length > 0) {
        $(".padding").replaceWith($(n).find(".padding"))
      } else {
        $(".main-content .col-main").append($(n).find(".padding"))
      }
      var s = $(".page-header");
      var o = $(n).find(".page-header");
      if (s.find("h2").text() != o.find("h2").text()) {
        s.find("h2").replaceWith(o.find("h2"));
        if (s.find(".rte").length) {
          if (o.find(".rte").length) {
            s.find(".rte").replaceWith(o.find(".rte"))
          } else {
            s.find(".rte").hide()
          }
        } else {
          if (o.find(".rte").length) {
            s.find("h2").after(o.find(".rte"))
          }
        }
      }
      $(".refined-widgets").replaceWith($(n).find(".refined-widgets"));
      $(".sidebar-block").replaceWith($(n).find(".sidebar-block"))
    },
    sidebarCreateUrl: function(mt) {
      var n = $.param(Shopify.queryParams).replace(/%2B/g, "+");
      if (mt) {
        if (n != "") return mt + "?" + n;
        else return mt
          }
      return location.pathname + "?" + n
    },
    sidebarAjaxClick: function(e) {
      delete Shopify.queryParams.page;
      var n = mt.sidebarCreateUrl(e);
      mt.isSidebarAjaxClick = true;
      History.pushState({
        param: Shopify.queryParams
      }, n, n);
      mt.sidebarGetContent(n)
    },
    get_isotope: function() {   

    },
    sidebarGetContent: function(n) {
      $.ajax({
        type: "get",
        url: n,
        beforeSend: function() {
          mt.showLoading()
        },
        success: function(e) {
          mt.sidebarMapData(e);
          mt.sidebarMapPaging();
          mt.sidebarMapTagEvents();
          mt.sidebarInitToggle();
          mt.sidebarMapClear();
          mt.sidebarMapClearAll();
          mt.hideLoading();
          mt.goAddToCart();
          mt.goWishlist();
          mt.goColorSwatchGridInit();
          mt.get_isotope();
          mt.goQuickView();
          mt.goInfiniteScrolling();
        },
        error: function(n, cart) {
          mt.hideLoading();
          $(".loading-modal").hide();
          $(".ajax-error-message").text($.parseJSON(n.responseText).description);
          mt.showBox(".ajax-error-modal")
        }
      })
    },
    sidebarParams: function() {
      Shopify.queryParams = {};
      if (location.search.length) {
        for (var e, mt = 0, n = location.search.substr(1).split("&"); mt < n.length; mt++) {
          e = n[mt].split("=");
          if ($.length > 1) {
            Shopify.queryParams[decodeURIComponent(e[0])] = decodeURIComponent(e[1])
          }
        }
      }
    },

    goSidebar: function() {
      if ($("#filter-sidebar").length > 0) {
        mt.sidebarParams();
        mt.goSortby();
        mt.sidebarMapEvents();
        mt.sidebarMapPaging();
        mt.sidebarInitToggle();
        mt.sidebarMapClear();
        mt.sidebarMapClearAll();
        mt.goColorSwatchGridInit();
        mt.goQuickView();
      }
    },

    goWishlist: function() {
      $(".grid-item button.wishlist").click(function(n) {
        n.preventDefault();
        var r = $(this).parent();
        var i = r.parents(".grid-item");
        $.ajax({
          type: "POST",
          url: "/contact",
          data: r.serialize(),
          beforeSend: function() {
            mt.showLoading()
          },
          success: function(n) {
            mt.hideLoading();
            r.html('<a class="wishlist harman_btn3" href="/pages/wish-list" title="Go to wishlist"><i class="fa fa-check"></i></a>');
            $(".ajax-success-cbox").find(".show-wishlist").show();
            $(".ajax-success-cbox").find(".show-cart").hide();
            mt.showBox(".ajax-success-cbox")
          },
          error: function(n, r) {
            mt.hideLoading();
            $(".loading").hide();
            $(".ajax-error-message").text($.parseJSON(n.responseText).description);
            mt.showBox(".ajax-error-cbox")
          }
        })
      })
    },
    goProductWishlist: function() {
      $(".product button.wishlist").click(function(n) {
        n.preventDefault();
        var r = $(this).parent();
        var i = r.parents(".grid-item");
        $.ajax({
          type: "POST",
          url: "/contact",
          data: r.serialize(),
          beforeSend: function() {
            mt.showLoading()
          },
          success: function(n) {
            mt.hideLoading();
            r.html('<a class="wishlist harman_btn3" href="/pages/wish-list" title="Go to wishlist"><i class="fa fa-check"></i></a>');
            $(".ajax-success-cbox").find(".show-wishlist").show();
            $(".ajax-success-cbox").find(".show-cart").hide();
            mt.showBox(".ajax-success-cbox")
          },
          error: function(n, r) {
            mt.hideLoading();
            $(".loading").hide();
            $(".ajax-error-message").text($.parseJSON(n.responseText).description);
            mt.showBox(".ajax-error-cbox")
          }
        })
      })
    },
    
    goRemoveWishlist: function() {
      $(".btn-remove-wishlist").click(function(n) {
        var r = $(this).parents("tr");
        var i = r.find(".tag-id").val();
        var s = jQuery("#remove-wishlist-form");
        s.find("input[name='contact[tags]']").val("x" + i);
        $.ajax({
          type: "POST",
          url: "/contact",
          data: s.serialize(),
          beforeSend: function() {
            mt.showLoading()
          },
          success: function(e) {
            mt.hideLoading();
            r.fadeOut(1e3)
          },
          error: function(n, r) {
            mt.hideLoading();
            $(".loading-modal").hide();
            $(".ajax-error-message").text($.parseJSON(n.responseText).description);
            mt.showBox(".ajax-error-cbox")
          }
        })
      })
    },
    goResizeImage: function() {
      if (window.product_image_resize) {
        $(".products-grid .product-image img").fakecrop({
          fill: window.images_size.is_crop,
          widthSelector: ".products-grid .grid-item .product-image",
          ratioWrapper: window.images_size
        })
      }
    },



    showBox: function(n) {
      $(n).fadeIn(500);
      mt.atTimeout = setTimeout(function() {
        $(n).fadeOut(500)
      }, 5e3)
    },


    goBox: function() {
      $(".continue-shopping").click(function() {
        clearTimeout(mt.atTimeout);
        $(".ajax-success-cbox").fadeOut(500)
      });
      $(".close-cbox").click(function() {
        clearTimeout(mt.atTimeout);
        $(".ajax-success-cbox").fadeOut(500)
      })
    },

    goCloudzoom: function() {
      if ($("#product-featured-image").length > 0) {

        $("#product-featured-image").elevateZoom({
          gallery: "zt_list_product",
          zoomType	: "inner",
          onImageSwapComplete: function() {
            $(".gallery-images div").hide()
          },
          loadingIcon: window.loading_url
        });
        $("#product-featured-image").bind("click", function(mt) {
          var n = $("#product-featured-image").data("elevateZoom");
          $.fancybox(n.getGalleryList());
          return false
        })

      }
    },



    goScrollTop: function() {
      $("#back-top").click(function() {
        $("body,html").animate({
          scrollTop: 0
        }, 400);
        return false
      })
    },
    goProductAddToCart: function() {
      if ($("#product-add-to-cart").length > 0) {
        $("#product-add-to-cart").click(function(n) {
          n.preventDefault();
          if ($(this).attr("disabled") != "disabled") {
            if (!window.ajax_cart) {
              $(this).closest("form").submit()
            } else {
              var cart = $("#add-to-cart-form select[name=id]").val();
              if (!cart) {
                cart = $("#add-to-cart-form input[name=id]").val()
              }
              var i = $("#add-to-cart-form input[name=quantity]").val();
              if (!i) {
                i = 1
              }

              var o = $("#product-featured-image").attr("src");
              mt.doAjaxAddToCart(cart, i, o)
            }
          }
          return false
        })
      }
    },
    goAddToCart: function() {
      if ($(".add-to-cart-btn").length > 0) {
        $(".add-to-cart-btn").click(function(n) {
          n.preventDefault();
          if ($(this).attr("disabled") != "disabled") {
            var cart = $(this).parents(".product-item");
            var i = $(cart).attr("id");
            i = i.match(/\d+/g);
            if (!window.ajax_cart) {
              $("#product-actions-" + i).submit()
            } else {
              var s = $("#product-actions-" + i + " select[name=id]").val();
              if (!s) {
                s = $("#product-actions-" + i + " input[name=id]").val()
              }
              var o = $("#product-actions-" + i + " input[name=quantity]").val();
              if (!o) {
                o = 1
              }
              var u = $(cart).find(".product-title").text();
              mt.doAjaxAddToCart(s, o, u)
            }

          }
          return false
        })
      }
    },
    showLoading: function() {
      $(".loading").show()
    },
    hideLoading: function() {
      $(".loading").hide()
    },
    doAjaxAddToCart: function(n, r, i, s) {
      $.ajax({
        type: "post",
        url: "/cart/add.js",
        data: "quantity=" + r + "&id=" + n,
        dataType: "json",
        beforeSend: function() {
          mt.showLoading()
        },
        success: function(n) {
          mt.hideLoading();
          $(".ajax-success-cbox").find(".ajax-product-title").text(i);
          $(".ajax-success-cbox").find(".show-wishlist").hide();
          jQuery('#dropdown-cart').addClass('active');
          jQuery('.wrapper-container').addClass('show-cart');
          mt.updateDropdownCart()
        },
        error: function(n, r) {
          mt.hideLoading();
          $(".ajax-error-message").text($.parseJSON(n.responseText).description);
          mt.showBox(".ajax-error-cbox")
        }
      })
    },
    loadQuickViewSlider: function(n, cart) {
      var s = Shopify.resizeImage(n.featured_image, "grande");
      cart.find(".quickview-featured-image").append('<a href="' + n.url + '"><img src="' + s + '" title="' + n.title + '"/><div style="height: 100%; width: 100%; top:0; left:0 z-index: 2000; position: absolute; display: none; background: url(' + window.loading_url + ') 50% 50% no-repeat;"></div></a>');
      if (n.images.length > 0) {
        var o = cart.find(".more-view ul");
        for (i in n.images) {
          var u = Shopify.resizeImage(n.images[i], "grande");
          var a = Shopify.resizeImage(n.images[i], "compact");
          var f = '<li><a href="javascript:void(0)" data-image="' + u + '"><img src="' + a + '"  /></a></li>';
          o.append(f)
        }
        o.find("a").click(function() {
          var mt = cart.find(".quickview-featured-image img");
          var n = cart.find(".quickview-featured-image div");
          if (mt.attr("src") != jQuery(this).attr("data-image")) {
            mt.attr("src", jQuery(this).attr("data-image"));
            n.show();
            mt.load(function(t) {
              n.hide();
              jQuery(this).unbind("load");
              n.hide()
            })
          }
        });
        if (o.hasClass("quickview-more-views-owlslider")) {
          mt.goQuickViewCarousel(o)
        } else {
          mt.goQuickViewVerticalMoreview(o)
        }
      } else {
        cart.find(".quickview-more-views").remove();
        cart.find(".quickview-more-view-wrapper-jcarousel").remove()
      }
    },
    goQuickView: function() {
      jQuery(".quickview-button a").click(function() {
        var n = jQuery(this).attr("id");
        Shopify.getProduct(n, function(n) {
          var cart = jQuery("#quickview-popup").html();
          jQuery(".product-quickview").html(cart);
          var pre = n.description.indexOf('pre-order-label');

          if(pre > 0){
            jQuery('.actions').addClass('pre');
            jQuery('.actions .add-to-cart-btn').append( "<span>Pre-Order</span>" );	

          }


          var i = jQuery(".product-quickview");

          var s = n.description.replace(/(<([^>]+)>)/ig, "");
          var s = s.replace(/\[countdown\](.*)\[\/countdown\]/ig, "");
          var s = s.replace(/\[item-gallery]/ig, "");
          var s = s.replace(/\[label-icon-new]/ig, "");
          var s = s.replace(/\[pre-order-label]/ig, "");
          var s = s.replace(/\[video\](.*)\[\/video\]/ig, "");
          var s = s.replace(/\[short-description\](.*)\[\/short-description\]/ig, "");
          var s = s.replace(/\[custom_html\](.*)\[\/custom_html\]/ig, "");
          var s = s.replace(/\[tabs\](.*)/ig, "");
          var s = s.replace(/\[tab\](.*)\[\/tab\]/ig, "");
          var s = s.replace(/\[tabs\](.*)\[\/tabs\]/ig, "");

          s = s.split(" ").splice(0, 20).join(" ") + "...";
          i.find(".product-title a").text(n.title);
          i.find(".product-title a").attr("href", n.url);
          if (i.find(".product-vendor span").length > 0) {
            i.find(".product-vendor span").text(n.vendor)
          }


          if (i.find(".product-type span").length > 0) {
            i.find(".product-type span").text(n.type)
          }
          if (i.find(".product-inventory span").length > 0) {
            var o = n.variants[0].inventory_quantity;
            if (o > 0) {
              if (n.variants[0].inventory_management != null) {
                i.find(".product-inventory span").text(o + " in stock")
              } else {
                i.find(".product-inventory span").text("Many in stock")
              }
            } else {
              i.find(".product-inventory span").text("Out of stock")
            }
          }
          i.find(".product-description").text(s);
          i.find(".price").html(Shopify.formatMoney(n.price, window.money_format));
          i.find(".product-item").attr("id", "product-" + n.id);
          i.find(".variants").attr("id", "product-actions-" + n.id);
          i.find(".variants select").attr("id", "product-select-" + n.id);
          if (n.compare_at_price > n.price) {
            i.find(".compare-price").html(Shopify.formatMoney(n.compare_at_price_max, window.money_format)).show();
            i.find(".price").addClass("on-sale")
          } else {
            i.find(".compare-price").html("");
            i.find(".price").removeClass("on-sale")
          }
          if (!n.available) {
            i.find("select, input, .total-price, .dec, .inc, .variants label").remove();
            i.find(".add-to-cart-btn").text("Unavailable").addClass("disabled").attr("disabled", "disabled");
          } else {
            i.find(".total-price span").html(Shopify.formatMoney(n.price, window.money_format));
            if (window.use_color_swatch) {
              mt.createQuickViewVariantsSwatch(n, i)
            } else {
              mt.createQuickViewVariants(n, i)
            }
          }
          i.find(".button").on("click", function() {
            var n = i.find(".quantity").val(),
                cart = 1;
            if (jQuery(this).text() == "+") {
              cart = parseInt(n) + 1
            } else if (n > 1) {
              cart = parseInt(n) - 1
            }
            i.find(".quantity").val(cart);
            if (i.find(".total-price").length > 0) {
              mt.updatePricingQuickview()
            }
          });
          if (window.show_multiple_currencies) {
            if(typeof Currency != 'undefined')
            Currency.convertAll(window.shop_currency, jQuery('.currencies_ul .currency.selected').data('currency'), 'span.money', 'money_format')
          }
          mt.loadQuickViewSlider(n, i);
          mt.goQuickviewAddToCart();
          jQuery(".product-quickview").fadeIn(500);
          if (jQuery(".product-quickview .total-price").length > 0) {
            jQuery(".product-quickview input[name=quantity]").on("change", mt.updatePricingQuickview)
          }
        });
        return false
      });
      jQuery(".product-quickview .overlay, .close-popup").live("click", function() {
        mt.closeQuickViewPopup();
        return false
      })
    },
    updatePricingQuickview: function() {
      var mt = /([0-9]+[.|,][0-9]+[.|,][0-9]+)/g;
      var n = jQuery(".product-quickview .price").text().match(mt);
      if (!n) {
        mt = /([0-9]+[.|,][0-9]+)/g;
        n = jQuery(".product-quickview .price").text().match(mt)
      }
      if (n) {
        var cart = n[0];
        var i = cart.replace(/[.|,]/g, "");
        var s = parseInt(jQuery(".product-quickview input[name=quantity]").val());
        var o = i * s;
        var u = Shopify.formatMoney(o, window.money_format);
        u = u.match(mt)[0];
        var a = new RegExp(r, "g");
        var f = jQuery(".product-quickview .price").html().replace(a, u);
        jQuery(".product-quickview .total-price span").html(f)
      }
    },
    goQuickviewAddToCart: function() {
      if (jQuery(".product-quickview .add-to-cart-btn").length > 0) {
        jQuery(".product-quickview .add-to-cart-btn").click(function() {
          var n = jQuery(".product-quickview select[name=id]").val();
          if (!n) {
            n = jQuery(".product-quickview input[name=id]").val()
          }
          var cart = jQuery(".product-quickview input[name=quantity]").val();
          if (!cart) {
            cart = 1
          }
          var i = jQuery(".product-quickview .product-title a").text();
          var s = jQuery(".product-quickview .quickview-featured-image img").attr("src");
          mt.doAjaxAddToCart(n, cart, i, s);
          mt.closeQuickViewPopup()
        })
      }
    },
    updateDropdownCart: function() {
      Shopify.getCart(function(e) {
        mt.doUpdateDropdownCart(e)
      })
    },
    doUpdateDropdownCart: function(n) {
      $("#cart-count").text(n.item_count);
    },


    convertToSlug: function(e) {
      return $.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")
    },



    //cart function



    updateDropdownCart: function() {
      Shopify.getCart(function(e) {
        mt.doUpdateDropdownCart(e)
      })
    },
    doUpdateDropdownCart: function(n) {
      var cart = '<li class="item" id="cart-item-{ID}"><a href="{URL}" title="{TITLE}" class="product-image"><img src="{IMAGE}" alt="{TITLE}"></a><div class="product-inner"><a href="javascript:void(0)" title="Remove Item" class="btn-remove"><i class="cs-font clever-icon-close"></i></a><p class="product-name"><a href="{URL}">{TITLE}</a></p><div class="cart-collateral"><span class="price">{PRICE}</span>Qty:  {QUANTITY}</div></div></li>';
      $("#cart-count").text(n.item_count);
      $("#cartToggle .price-cart-mini").html(Shopify.formatMoney(n.total_price, window.money_format));
      $("#dropdown-cart .summary .price").html(Shopify.formatMoney(n.total_price, window.money_format));
      $("#dropdown-cart .cart-list").html("");
      if (n.item_count > 0) {
        for (var i = 0; i < n.items.length; i++) {
          var s = cart;
          s = s.replace(/\{ID\}/g, n.items[i].id);
          s = s.replace(/\{URL\}/g, n.items[i].url);
          s = s.replace(/\{TITLE\}/g, n.items[i].title);
          s = s.replace(/\{QUANTITY\}/g, n.items[i].quantity);
          s = s.replace(/\{IMAGE\}/g, Shopify.resizeImage(n.items[i].image, "small"));
          s = s.replace(/\{PRICE\}/g, Shopify.formatMoney(n.items[i].price, window.money_format));
          $("#dropdown-cart .cart-list").append(s)
        }
        $("#dropdown-cart .btn-remove").click(function(n) {
          n.preventDefault();
          var cart = $(this).parents(".item").attr("id");
          cart = cart.match(/\d+/g);
          Shopify.removeItem(cart , function(e) {
            mt.doUpdateDropdownCart(e)
          })
        });
        if (mt.checkNeedToConvertCurrency()) {
          if(typeof Currency != 'undefined')
          Currency.convertAll(window.shop_currency, jQuery('.currencies_ul .currency.selected').data('currency'), "#dropdown-cart span.money", "money_format")
        }
      }
      mt.checkItemsInDropdownCart()
    },
    checkNeedToConvertCurrency: function() {
      if(typeof Currency != 'undefined')
      return window.show_multiple_currencies && Currency.currentCurrency != shopCurrency
    },

    //endcart
    loadQuickViewSlider: function(n, cart) {
      var s = Shopify.resizeImage(n.featured_image, "original");
      cart.find(".quickview-featured-images").append('<a href="' + n.url + '"><img src="' + s + '" title="' + n.title + '"/><div style="height: 100%; width: 100%; top:0; left:0 z-index: 2000; position: absolute; display: none; background: url(' + window.loading_url + ') 50% 50% no-repeat;"></div></a>');

      var o = cart.find(".more-view ul");
      for (i in n.images) {
        var u = Shopify.resizeImage(n.images[i], "original");
        var a = Shopify.resizeImage(n.images[i], "original");
        var f = '<li><a href="javascript:void(0)" data-image="' + u + '"><img src="' + a + '"  /></a></li>';
        o.append(f)
      }
      o.find("a").click(function() {
        var mt = cart.find(".quickview-featured-image img");
        var n = cart.find(".quickview-featured-image div");
        if (mt.attr("src") != jQuery(this).attr("data-image")) {
          mt.attr("src", jQuery(this).attr("data-image"));
          n.show();
          mt.load(function(t) {
            n.hide();
            jQuery(this).unbind("load");
            n.hide()
          })
        }
      });
      if (o.hasClass("quickview-more-views-owlslider")) {
        mt.goQuickViewCarousel(o)
      } else {
        mt.goQuickViewVerticalMoreview(o)
      }

    },
    goQuickViewCarousel: function(e) {
      if (e) {
        e.owlCarousel({
          autoPlay : true,
          navigation: true,
          navigationText : ['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
          pagination : false,
          items: 1
        }).css("visibility", "visible")
      }
    },
    goQuickViewVerticalMoreview: function(mt) {

    },
    convertToSlug: function(e) {
      return e.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")
    },
    createQuickViewVariantsSwatch: function(mt, n) {
      if (mt.variants.length > 1) {
        for (var cart = 0; cart < mt.variants.length; cart++) {
          var i = mt.variants[cart];
          var s = '<option value="' + i.id + '">' + i.title + "</option>";
          n.find("form.variants > select").append(s)
        }
        new Shopify.OptionSelectors("product-select-" + mt.id, {
          product: mt,
          onVariantSelected: selectCallbackQuickview
        });
        var o = window.file_url.substring(0, window.file_url.lastIndexOf("?"));
        var u = window.asset_url.substring(0, window.asset_url.lastIndexOf("?"));
        var a = "";
        for (var cart = 0; cart < mt.options.length; cart++) {

          a += '<div class="swatch clearfix swatch-' + cart + '" data-option-index="' + cart + '">';
          a += '<div class="header">' + mt.options[cart].name + "</div>";
          var f = false;
          if (/Color|Colour/i.test(mt.options[cart].name)) {
            f = true
          }
          var l = new Array;
          for (var c = 0; c < mt.variants.length; c++) {
            var i = mt.variants[c];
            var h = i.options[cart];
            var p = this.convertToSlug(h);
            var d = "swatch-" + cart + "-" + p;
            if (l.indexOf(h) < 0) {
              a += '<div data-value="' + h + '" class="swatch-element ' + (f ? "color" : "") + p + (i.available ? " available " : " soldout ") + '">';

              a += '<input id="' + d + '" type="radio" name="option-' + cart + '" value="' + h + '" ' + (c == 0 ? " checked " : "") + (i.available ? "" : " disabled") + " />";
              if (f) {
                a += '<label for="' + d + '" style="background-color: ' + p + "; background-image: url(" + o + p + '.png)"><img class="crossed-out" src="' + u + 'soldout.png" /></label>'
              } else {
                a += '<label for="' + d + '">' + h + '<img class="crossed-out" src="' + u + 'soldout.png" /></label>'
              }
              a += "</div>";
              if (i.available) {
                jQuery('.product-quickview .swatch[data-option-index="' + cart + '"] .' + p).removeClass("soldout").addClass("available").find(":radio").removeAttr("disabled")
              }
              l.push(h)
            }
          }
          a += "</div>"
        }
        n.find("form.variants > select").after(a);
        n.find(".swatch :radio").change(function() {
          var mt = jQuery(this).closest(".swatch").attr("data-option-index");
          var n = jQuery(this).val();
          jQuery(this).closest("form").find(".single-option-selector").eq(mt).val(n).trigger("change")
        });
        if (mt.available) {
          Shopify.optionsMap = {};
          Shopify.linkOptionSelectors(mt)
        }
      } else {
        n.find("form.variants > select").remove();
        var v = '<input type="hidden" name="id" value="' + mt.variants[0].id + '">';

        n.find("form.variants").append(v)
      }
    },
    createQuickViewVariants: function(mt, n) {
      if (mt.variants.length > 0) {
        for (var cart = 0; cart < mt.variants.length; cart++) {
          var i = mt.variants[cart];
          var s = '<option value="' + i.id + '">' + i.title + "</option>";
          n.find("form.variants > select").append(s)
        }
        new Shopify.OptionSelectors("product-select-" + mt.id, {
          product: mt,
          onVariantSelected: selectCallbackQuickview
        });
        jQuery(".product-quickview .single-option-selector").selectize();
        jQuery(".product-quickview .selectize-input input").attr("disabled", "disabled");
        if (mt.options.length == 1) {
          jQuery(".selector-wrapper:eq(0)").prepend("<label>" + mt.options[0].name + "</label>")
        }
        n.find("form.variants .selector-wrapper label").each(function(n, cart) {
          jQuery(this).html(mt.options[n].name)
        })
      } else {
        n.find("form.variants > select").remove();
        var o = '<input type="hidden" name="id" value="' + mt.variants[0].id + '">';
        n.find("form.variants").append(o)
      }
    },
    closeQuickViewPopup: function() {
      jQuery(".product-quickview").fadeOut(500)
    }

  }
  $(document).ready(function(){
    $('.up-qty').click(function(){
      quantity =$('#quantity').val();
      $('#quantity').val(parseInt(quantity) + 1);
    });
    $('.down-qty').click(function(){
      quantity =$('#quantity').val();
      if(quantity > 1)
        $('#quantity').val(parseInt(quantity) - 1);
    });
  });


})(jQuery);