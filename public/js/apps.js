/* NProgress (c) 2013, Rico Sta. Cruz
 *  http://ricostacruz.com/nprogress */
;(function(factory) {

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        this.NProgress = factory();
    }

})(function() {
    var NProgress = {};

    NProgress.version = '0.1.3';

    var Settings = NProgress.settings = {
        minimum: 0.08,
        easing: 'ease',
        positionUsing: '',
        speed: 200,
        trickle: true,
        trickleRate: 0.02,
        trickleSpeed: 800,
        showSpinner: true,
        barSelector: '[role="bar"]',
        spinnerSelector: '[role="spinner"]',
        template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
    };

    /**
     * Updates configuration.
     *
     *     NProgress.configure({
     *       minimum: 0.1
     *     });
     */
    NProgress.configure = function(options) {
        var key, value;
        for (key in options) {
            value = options[key];
            if (value !== undefined && options.hasOwnProperty(key)) Settings[key] = value;
        }

        return this;
    };

    /**
     * Last number.
     */

    NProgress.status = null;

    /**
     * Sets the progress bar status, where `n` is a number from `0.0` to `1.0`.
     *
     *     NProgress.set(0.4);
     *     NProgress.set(1.0);
     */

    NProgress.set = function(n) {
        var started = NProgress.isStarted();

        n = clamp(n, Settings.minimum, 1);
        NProgress.status = (n === 1 ? null : n);

        var progress = NProgress.render(!started),
            bar = progress.querySelector(Settings.barSelector),
            speed = Settings.speed,
            ease = Settings.easing;

        progress.offsetWidth; /* Repaint */

        queue(function(next) {
            // Set positionUsing if it hasn't already been set
            if (Settings.positionUsing === '') Settings.positionUsing = NProgress.getPositioningCSS();

            // Add transition
            css(bar, barPositionCSS(n, speed, ease));

            if (n === 1) {
                // Fade out
                css(progress, {
                    transition: 'none',
                    opacity: 1
                });
                progress.offsetWidth; /* Repaint */

                setTimeout(function() {
                    css(progress, {
                        transition: 'all ' + speed + 'ms linear',
                        opacity: 0
                    });
                    setTimeout(function() {
                        NProgress.remove();
                        next();
                    }, speed);
                }, speed);
            } else {
                setTimeout(next, speed);
            }
        });

        return this;
    };

    NProgress.isStarted = function() {
        return typeof NProgress.status === 'number';
    };

    /**
     * Shows the progress bar.
     * This is the same as setting the status to 0%, except that it doesn't go backwards.
     *
     *     NProgress.start();
     *
     */
    NProgress.start = function() {
        if (!NProgress.status) NProgress.set(0);

        var work = function() {
            setTimeout(function() {
                if (!NProgress.status) return;
                NProgress.trickle();
                work();
            }, Settings.trickleSpeed);
        };

        if (Settings.trickle) work();

        return this;
    };

    /**
     * Hides the progress bar.
     * This is the *sort of* the same as setting the status to 100%, with the
     * difference being `done()` makes some placebo effect of some realistic motion.
     *
     *     NProgress.done();
     *
     * If `true` is passed, it will show the progress bar even if its hidden.
     *
     *     NProgress.done(true);
     */

    NProgress.done = function(force) {
        if (!force && !NProgress.status) return this;

        return NProgress.inc(0.3 + 0.5 * Math.random()).set(1);
    };

    /**
     * Increments by a random amount.
     */

    NProgress.inc = function(amount) {
        var n = NProgress.status;

        if (!n) {
            return NProgress.start();
        } else {
            if (typeof amount !== 'number') {
                amount = (1 - n) * clamp(Math.random() * n, 0.1, 0.95);
            }

            n = clamp(n + amount, 0, 0.994);
            return NProgress.set(n);
        }
    };

    NProgress.trickle = function() {
        return NProgress.inc(Math.random() * Settings.trickleRate);
    };

    /**
     * Waits for all supplied jQuery promises and
     * increases the progress as the promises resolve.
     *
     * @param $promise jQUery Promise
     */
    (function() {
        var initial = 0,
            current = 0;

        NProgress.promise = function($promise) {
            if (!$promise || $promise.state() == "resolved") {
                return this;
            }

            if (current == 0) {
                NProgress.start();
            }

            initial++;
            current++;

            $promise.always(function() {
                current--;
                if (current == 0) {
                    initial = 0;
                    NProgress.done();
                } else {
                    NProgress.set((initial - current) / initial);
                }
            });

            return this;
        };

    })();

    /**
     * (Internal) renders the progress bar markup based on the `template`
     * setting.
     */

    NProgress.render = function(fromStart) {
        if (NProgress.isRendered()) return document.getElementById('nprogress');

        addClass(document.documentElement, 'nprogress-busy');

        var progress = document.createElement('div');
        progress.id = 'nprogress';
        progress.innerHTML = Settings.template;

        var bar = progress.querySelector(Settings.barSelector),
            perc = fromStart ? '-100' : toBarPerc(NProgress.status || 0),
            spinner;

        css(bar, {
            transition: 'all 0 linear',
            transform: 'translate3d(' + perc + '%,0,0)'
        });

        if (!Settings.showSpinner) {
            spinner = progress.querySelector(Settings.spinnerSelector);
            spinner && removeElement(spinner);
        }

        document.body.appendChild(progress);
        return progress;
    };

    /**
     * Removes the element. Opposite of render().
     */

    NProgress.remove = function() {
        removeClass(document.documentElement, 'nprogress-busy');
        var progress = document.getElementById('nprogress');
        progress && removeElement(progress);
    };

    /**
     * Checks if the progress bar is rendered.
     */

    NProgress.isRendered = function() {
        return !!document.getElementById('nprogress');
    };

    /**
     * Determine which positioning CSS rule to use.
     */

    NProgress.getPositioningCSS = function() {
        // Sniff on document.body.style
        var bodyStyle = document.body.style;

        // Sniff prefixes
        var vendorPrefix = ('WebkitTransform' in bodyStyle) ? 'Webkit' :
            ('MozTransform' in bodyStyle) ? 'Moz' :
            ('msTransform' in bodyStyle) ? 'ms' :
            ('OTransform' in bodyStyle) ? 'O' : '';

        if (vendorPrefix + 'Perspective' in bodyStyle) {
            // Modern browsers with 3D support, e.g. Webkit, IE10
            return 'translate3d';
        } else if (vendorPrefix + 'Transform' in bodyStyle) {
            // Browsers without 3D support, e.g. IE9
            return 'translate';
        } else {
            // Browsers without translate() support, e.g. IE7-8
            return 'margin';
        }
    };

    /**
     * Helpers
     */

    function clamp(n, min, max) {
        if (n < min) return min;
        if (n > max) return max;
        return n;
    }

    /**
     * (Internal) converts a percentage (`0..1`) to a bar translateX
     * percentage (`-100%..0%`).
     */

    function toBarPerc(n) {
        return (-1 + n) * 100;
    }


    /**
     * (Internal) returns the correct CSS for changing the bar's
     * position given an n percentage, and speed and ease from Settings
     */

    function barPositionCSS(n, speed, ease) {
        var barCSS;

        if (Settings.positionUsing === 'translate3d') {
            barCSS = {
                transform: 'translate3d(' + toBarPerc(n) + '%,0,0)'
            };
        } else if (Settings.positionUsing === 'translate') {
            barCSS = {
                transform: 'translate(' + toBarPerc(n) + '%,0)'
            };
        } else {
            barCSS = {
                'margin-left': toBarPerc(n) + '%'
            };
        }

        barCSS.transition = 'all ' + speed + 'ms ' + ease;

        return barCSS;
    }

    /**
     * (Internal) Queues a function to be executed.
     */

    var queue = (function() {
        var pending = [];

        function next() {
            var fn = pending.shift();
            if (fn) {
                fn(next);
            }
        }

        return function(fn) {
            pending.push(fn);
            if (pending.length == 1) next();
        };
    })();

    /**
     * (Internal) Applies css properties to an element, similar to the jQuery
     * css method.
     *
     * While this helper does assist with vendor prefixed property names, it
     * does not perform any manipulation of values prior to setting styles.
     */

    var css = (function() {
        var cssPrefixes = ['Webkit', 'O', 'Moz', 'ms'],
            cssProps = {};

        function camelCase(string) {
            return string.replace(/^-ms-/, 'ms-').replace(/-([\da-z])/gi, function(match, letter) {
                return letter.toUpperCase();
            });
        }

        function getVendorProp(name) {
            var style = document.body.style;
            if (name in style) return name;

            var i = cssPrefixes.length,
                capName = name.charAt(0).toUpperCase() + name.slice(1),
                vendorName;
            while (i--) {
                vendorName = cssPrefixes[i] + capName;
                if (vendorName in style) return vendorName;
            }

            return name;
        }

        function getStyleProp(name) {
            name = camelCase(name);
            return cssProps[name] || (cssProps[name] = getVendorProp(name));
        }

        function applyCss(element, prop, value) {
            prop = getStyleProp(prop);
            element.style[prop] = value;
        }

        return function(element, properties) {
            var args = arguments,
                prop,
                value;

            if (args.length == 2) {
                for (prop in properties) {
                    value = properties[prop];
                    if (value !== undefined && properties.hasOwnProperty(prop)) applyCss(element, prop, value);
                }
            } else {
                applyCss(element, args[1], args[2]);
            }
        }
    })();

    /**
     * (Internal) Determines if an element or space separated list of class names contains a class name.
     */

    function hasClass(element, name) {
        var list = typeof element == 'string' ? element : classList(element);
        return list.indexOf(' ' + name + ' ') >= 0;
    }

    /**
     * (Internal) Adds a class to an element.
     */

    function addClass(element, name) {
        var oldList = classList(element),
            newList = oldList + name;

        if (hasClass(oldList, name)) return;

        // Trim the opening space.
        element.className = newList.substring(1);
    }

    /**
     * (Internal) Removes a class from an element.
     */

    function removeClass(element, name) {
        var oldList = classList(element),
            newList;

        if (!hasClass(element, name)) return;

        // Replace the class name.
        newList = oldList.replace(' ' + name + ' ', ' ');

        // Trim the opening and closing spaces.
        element.className = newList.substring(1, newList.length - 1);
    }

    /**
     * (Internal) Gets a space separated list of the class names on the element.
     * The list is wrapped with a single space on each end to facilitate finding
     * matches within the list.
     */

    function classList(element) {
        return (' ' + (element.className || '') + ' ').replace(/\s+/gi, ' ');
    }

    /**
     * (Internal) Removes an element from the DOM.
     */

    function removeElement(element) {
        element && element.parentNode && element.parentNode.removeChild(element);
    }

    return NProgress;
});
;"use strict";

// Global defenition
if (typeof App != "object") {
    window.App = {}
}

App.BaseUrl = location.protocol + '//' + location.host;
App.API_BaseUrl = location.protocol + '//' + location.host + '/api';
App.User = {};
App.Mustache = $.Mustache;
App.Mustache.directory = App.BaseUrl + '/mustache';


if(window.isLogin) {

  var currentUser = $.jStorage.get('current_user');

  if( _.isObject(currentUser) ) {

    App.User.session = currentUser;

    console.log(App.User.session);

  } else {
    $.ajax({
        url : App.API_BaseUrl + '/user/current/'
      , type: 'GET'
      , cache: true
      , async: false
      , success: function (res) {
        var data = res.data;

        App.User.session = res.data;

        $.jStorage.set("current_user", App.User.session, {TTL : 60000});
      }
    });
  }
};

NProgress.configure({ ease: 'ease', speed: 500, trickle: false });
NProgress.start();

$(window).load(function() {
  // executes when complete page is fully loaded, including all frames, objects and images
  NProgress.done();
});
;App.User = _.extend( App.User, {
  init: function () {
    this.forgotPassword();
    this.resetPassword();
  },
  forgotPassword: function () {
    var formForgot = $('form.form-forgot-password');

    formForgot.submit(function(e) {
      e.preventDefault();

    }).validate({
      rules: {
        email: {
          required: true,
          email: true
        }
      },
      submitHandler : function(form){

        var emailInput = formForgot.find('input[type="text"]');

        var btnSubmit = formForgot.find('.btn-forgot');

        $.ajax({
          url      : App.BaseUrl + '/forgot-password',
          type     : 'POST',
          dataType : "json",
          data     : {
            '_csrf': $('input[name="_csrf"]').val(),
            email: emailInput.val()
          },
          beforeSend: function(xhr, opts){
            btnSubmit.attr('disabled', 'disabled');
            NProgress.start();
          }
        })
        .fail(function(res) {
          NProgress.done();
          btnSubmit.attr('disabled', false);

          if(_.isObject(res.responseJSON.error)) {
            Notifier.show(res.responseJSON.error.message, 'err');
          } else {
            Notifier.show(res.responseJSON.message, 'err');
          }
        })
        .done(function(res) {
          NProgress.done();
          emailInput.val('');
          Notifier.show('An e-mail has been sent to' + emailInput.val() + ' with further instructions.' )
          btnSubmit.attr('disabled', false);
        });
      }
    });
  },
  resetPassword: function () {
    var formReset = $('form.form-reset-password');

    formReset.submit(function(e) {
      e.preventDefault();

    }).validate({
      rules: {
        new_password: {
          required: true,
          minlength: 6
        },
        confirm_new_password: {
          required: true,
          minlength: 6,
          equalTo: "#new_password"
        }
      },
      messages: {
        new_password: {
          required: "Please provide a password",
          minlength: "Your password must be at least 6 characters long"
        },
        confirm_new_password: {
          required: "Please provide a confirm password",
          equalTo: "Please enter the same password as above"
        }
      },
      submitHandler : function(form){
        var newPassword  = formReset.find('input#new_password');
        var confirmNewPassword = formReset.find('input#confirm_new_password');
        var btnSubmit = formReset.find('.btn-reset-password');
        var tokenReset = $('input.token').val();

        $.ajax({
          url      : App.BaseUrl + '/reset/' + tokenReset,
          type     : 'POST',
          dataType : "json",
          data : {
            password: newPassword.val(),
            confirm_password : confirmNewPassword.val(),
            '_csrf': $('input[name="_csrf"]').val(),
          },
          beforeSend: function(xhr, opts){
            btnSubmit.attr('disabled', 'disabled');
            NProgress.start();
          }
        })
        .fail(function(res) {
          btnSubmit.attr('disabled', false);
          Notifier.show(res.responseJSON.message, 'err');
          NProgress.done();
        })
        .done(function(res) {
          NProgress.done();
          newPassword.val('');
          confirmNewPassword.val('');
          window.location.href = App.BaseUrl + '/login';
        });
      }
    });
  }
});

$(function() {

  App.User.init();
});
;$(function() {

  $('#flash-message').delay(7000).fadeOut(5000);

  Home.init();

  NProgress.set(0.3);

});


var Home = App.Home = {
  init: function() {
    var This = Home;
    var Trick = App.Trick;

    This.renderAllTricks();
  },
  renderAllTricks: function() {

    var blockHome = $('#home-page');

    if(blockHome.length > 0) {
      $.Mustache
        .load(App.Mustache.directory + "/tricks.mustache")
        .fail(function () {
          console.log('Failed to load templates from <code>' + Trick.mustacheTemplateDir + '</code>');
        })
        .done(function () {
          Home.getAllTrick(blockHome);
        });
    }
  },
  getAllTrick: function(el){
    $.ajax({
      url: App.API_BaseUrl + '/trick',
      method: 'GET',
      cache: false,
      dataType: "JSON",
      beforeSend: function( xhr ) {
      }
    })
    .done(function(res) {
      var list_tricks = res.data;

      App.Trick.renderTrick(el, list_tricks);

    })
    .fail (function(jqXHR, textStatus) {
      Notifier.show('there is something wrong to load catalogue, please try again', 'err');
    })
  }
}
;"use strict";

$(function() {

  Trick.init();
})

var Trick = App.Trick = {
  init: function() {
    var This = Trick;
    This.mustacheTemplateDir = App.Mustache.directory + "/tricks.mustache";
    This.createNewTrick();
    This.importBookmark();
    This.tricksByUser();
  },
  tricksByUser: function() {
    var blockUserTrick = $('.block-tricks-user');

    if(blockUserTrick.length > 0) {
      $.Mustache
        .load(Trick.mustacheTemplateDir)
        .fail(function () {
          console.log('Failed to load templates from <code>' + Trick.mustacheTemplateDir + '</code>');
        })
        .done(function () {
          Trick.getTrickByUser(blockUserTrick);
        });
    }
  },
  getTrickByUser: function(el) {
    var user_id = el.data('id');
    var username = el.data('username');

    var from_jStorage = $.jStorage.get('tricks-by-'+ username);
    console.log(from_jStorage);

    if( _.isNull(from_jStorage) ) {
      $.ajax({
        url: App.API_BaseUrl + '/trick/tricks-user',
        method: 'GET',
        cache: false,
        data: {
          user_id: user_id
        },
        dataType: "JSON",
        beforeSend: function( xhr ) {
        }
      })
      .done(function(res) {
        var list_tricks = res.tricks;
        var tricks_count = res.tricks_count;

        Trick.renderTrick(el, list_tricks);


        if($('.profile-card').length > 0) {
          $('.profile-card').find('.tricks-count').html(tricks_count);
        };

        if(_.size(list_tricks) > 0) {
          $.jStorage.set('tricks-by-'+ username, res, {TTL : 600000}); // set localStorange to 10 Minutes
        }
      })
      .fail (function(jqXHR, textStatus) {
        Notifier.show('there is something wrong to load catalogue, please try again', 'err');
      })

    } else {
      console.log('from jStorage');
      var list_tricks = from_jStorage.tricks;

      var tricks_count = from_jStorage.tricks_count;

      if($('.profile-card').length > 0) {
        $('.profile-card').find('.tricks-count').html(tricks_count);
      };

      Trick.renderTrick(el, list_tricks);
    }
  },
  renderTrick: function(el, list_tricks) {

    var render = render || el;

    render.html('');

    _.each(list_tricks, function(trick) {

      if(trick.user.photo_profile === undefined) {
        trick.user.photo_profile = 'https://gravatar.com/avatar/' + md5(trick.user.email) + '?s=200&d=retro'
      }

      if(!_.isArray(trick.tags)) {
        trick.tags = trick.tags.split(/\s*,\s*/);
      }
      console.log(trick.user);
      delete trick.user.email;

      render.append($.Mustache.render('trickItem', trick ));
    });

    var container = document.querySelector('.block-tricks-user');
    var msnry;
    // initialize Masonry after all images have loaded
    imagesLoaded( container, function() {
      msnry = new Masonry( container );
    });

  },
  createNewTrick: function() {

    var formNewTrick = $('form.new-trick');

    formNewTrick.submit(function(e) {
      e.preventDefault();

    }).validate({
      rules: {
        title: {
          required: true
        },
        origin_url: {
          required: true
        },
        tags : {
          required: true
        }
      },
      submitHandler : function(form){
        var data = {
            title : formNewTrick.find("input#title").val(),
            origin_url : formNewTrick.find("input#origin_url").val(),
            description : formNewTrick.find("input#desc").val(),
            tags : $("input#tags").tagsinput('items'),
            '_csrf': $('input[name="_csrf"]').val()
          };

        $.ajax({
          url      : App.API_BaseUrl + '/trick/create',
          type     : 'POST',
          dataType : "json",
          data     : data
        })
        .fail(function(res) {
          Notifier.show(res.responseJSON.message, 'err');
        })
        .done(function(res) {
          Notifier.show("Your Tricks success created");

          formNewTrick.find('input[type=text]').val('');
          formNewTrick.find('textarea').val('');

          setTimeout(function() {
            window.location.href = App.BaseUrl + '/' + App.User.session.username+ '/tricks'
          }, 5000);
        });
      }
    });
  }, // end of createNewTrick
  importBookmark: function() {
    if($('#fileupload').length > 0) {
      var prgressBar = Trick.progressBarDOM();
      $('footer').after(prgressBar);
      $('#fileupload').fileupload({
        url: App.API_BaseUrl + '/trick/import',
        dataType: 'json',
        done: function (e, data) {
          var res = data.result;

          if(res.status == 200) {

          } else {
            Notifier.show(res.message, err);
          }

          setTimeout(function(){
            $('#progress').fadeOut();
          }, 3000);

        },
        progressall: function (e, data) {
            $('#progress').fadeIn();
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $('#progress .progress-bar').css( 'width', progress + '%');
        }
      }).prop('disabled', !$.support.fileInput).parent().addClass($.support.fileInput ? undefined : 'disabled');
    }

  },
  progressBarDOM : function() {
    return '<div id="progress" class="progress progress-xs progress-striped"><div data-toggle="tooltip" class="progress-bar bg-info lter"></div></div>';
  }
}
