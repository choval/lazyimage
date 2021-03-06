/* global $ */

/**
 * LazyImage
 */
var LazyImage = {
    // Vars
    threshold: 200,
    viewport_top: 0,
    viewport_bottom: 0,
    debug: false,
    unloads: false,
    // Hook
    hook: function () {
        if (typeof $ != 'undefined') {
            $(document).on('scroll', LazyImage.run);
            $(window).on('resize', LazyImage.run);
            $.fn.isInView = function () {
                return LazyImage.checkElement(this);
            };
            LazyImage.run();
            return;
        }
        setTimeout(LazyImage.hook, 100);
    },
    // Unhook
    unhook: function () {
        $(window).off('resize', LazyImage.run);
        $(document).off('scroll', LazyImage.run);
    },
    // Run
    run: function () {
        LazyImage.viewport_top = window.scrollY;
        LazyImage.viewport_bottom = window.scrollY + window.innerHeight;
        $('img[data-lazy-src],img[data-lazy-srcset],img[data-lazy-sizes],[data-lazy-background-image],[data-lazy-class]')
            .each(function () {
                LazyImage.checkElement($(this));
            });
    },
    initializeElement: function ($obj) {
        $obj.data('initialized', true);
        const origSrc = $obj.attr('src');
        $obj.data('lazy-src-original', origSrc);
        const origBackgroundImage = $obj.css('background-image');
        if (origBackgroundImage) {
            $obj.data('lazy-background-image-original', origBackgroundImage);
        }
        const origSrcset = $obj.attr('srcset');
        if (origSrcset) {
            $obj.data('lazy-srcset-original', origSrcset); 
        }
        const origSizes = $obj.attr('sizes');
        if (origSizes) {
            $obj.data('lazy-sizes-original', origSizes); 
        }
    },
    getLazyData: function ($obj) {
        const data = {};
        data.lazySrc = $obj.data('lazy-src') || false;
        data.lazySrcset = $obj.data('lazy-srcset') || false;
        data.lazySizes = $obj.data('lazy-sizes') || false;
        data.lazyBackgroundImage = $obj.data('lazy-background-image') || false;
        data.lazyClass = $obj.data('lazy-class') || false;
        data.lazyUnload = $obj.data('lazy-unload') || LazyImage.unloads;
        return data;
    },
    loadImage: async function ($obj) {
        const data = LazyImage.getLazyData($obj);
        $obj.data('lazy-loaded', true);
        if (data.lazySrc) {
            $obj.attr('src', data.lazySrc);
            if (LazyImage.debug) {
                console.log('LazyImage loaded: '+data.lazySrc);
            }
        }
        if (data.lazySrcset) {
            $obj.attr('srcset', data.lazySrcset);
            if (LazyImage.debug) {
                console.log('LazyImage loaded: '+data.lazySrcset);
            }
        }
        if (data.lazySizes) {
            $obj.attr('sizes', data.lazySizes);
        }
        if (data.lazyClass) {
            $obj.addClass(data.lazyClass);
        }
        if (data.lazyBackgroundImage) {
            await LazyImage.preloadUri(data.lazyBackgroundImage);
            $obj.css('background-image', 'url("'+data.lazyBackgroundImage+'")');
            if (LazyImage.debug) {
                console.log('LazyImage loaded: '+data.lazyBackgroundImage);
            }
        }
        $obj.trigger('lazy-loaded');
        return true;
    },
    unloadImage: function ($obj) {
        const data = LazyImage.getLazyData($obj);
        if (!data.lazyUnload) {
            return false;
        }
        $obj.data('lazy-loaded', false);
        if (data.lazySrc) {
            $obj.attr('src', $obj.data('lazy-src-original')||'');
            if (LazyImage.debug) {
                console.log('LazyImage unloaded: '+data.lazySrc);
            }
        }
        if (data.lazySrcset) {
            $obj.attr('srcset', $obj.data('lazy-srcset-original')||'');
            if (LazyImage.debug) {
                console.log('LazyImage unloaded: '+data.lazySrcset);
            }
        }
        if (data.lazySizes) {
            $obj.attr('sizes', $obj.data('lazy-sizes-original')||'');
        }
        if (data.lazyBackgroundImage) {
            $obj.css('background-image', $obj.data('lazy-background-image-original')||'none');
            if (LazyImage.debug) {
                console.log('LazyImage unloaded: '+data.lazyBackgroundImage);
            }
        }
        if (data.lazyClass) {
            $obj.removeClass(data.lazyClass);
        }
        $obj.trigger('lazy-unloaded');
        return false;
    },
    checkElement: function ($obj) {
        const visible = LazyImage.isInView($obj);
        const loaded = $obj.data('lazy-loaded');
        if (visible) {
            if (loaded) {
                return true;
            }
        } else {
            if (!loaded) {
                return false;
            }
        }
        const initialized = $obj.data('initialized') || false;
        if (!initialized) {
            LazyImage.initializeElement($obj);
        }
        if (visible) {
            return LazyImage.loadImage($obj);
        }
        return LazyImage.unloadImage($obj);
    },
    // Return if an object is visible
    isInView: function ($elem) {
        const elem_height = $elem.height();
        const elem_top = $elem.offset().top;
        let threshold = $elem.data('lazy-threshold') || LazyImage.threshold || window.innerHeight;
        if (typeof threshold === 'string' && threshold.substr(-1) === '%') {
            threshold = window.innerHeight * parseInt(threshold) / 100;
        }
        const compare_top = elem_top - threshold;
        const compare_bottom = elem_top + elem_height + threshold;
        return ((compare_top <= LazyImage.viewport_bottom) &&
            (compare_bottom >= LazyImage.viewport_top));
    },
    // Preload image
    // Based on https://stackoverflow.com/a/11274150/8998926
    preloadUri: function (uri) {
        return new Promise(function (resolve, reject) {
            const img = new Image();
            img.onload = () => resolve(uri);
            img.onerror = () => reject(uri);
            img.onabort = () => reject(uri);
            img.src = uri;
        });
    },
};
(function () {
    LazyImage.hook();
}());

