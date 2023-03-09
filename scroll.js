var scroll_history;
(function () {
    var CP_ScrollTracking = (function () {
        /* configuration start */
        var SETTINGS = {
            "percentage_threshold": 100, // this disables scroll tracking when the viewable space is not much greater than the full space, a value of "100" will always track.
            "pageview_delay": 100, // delay in milliseconds to wait for content to render on pageload events
            "scroll_grouping": 25, // 10(Deciles), 20(Quintiles), or 25(Quartiles) , needs to be changed in vars
            "data_layer_event_name": "scroll",
            "data_layer_event_param1_name": "percent_scrolled"
        }
        /* configuration ends */

        var _current_bucket = 0
        var max_scroll = 0;
        scroll_history = {};
        var bucket;

        // add event listener function
        function addListener(obj, type, fn) {
            ////////// remove another scroll tracker events to prevent duplication (updated 6/3)
            removeListener(obj, type, fn);
            if (obj.attachEvent) {
                obj['e' + type + fn] = fn;
                obj[type + fn] = function () { obj['e' + type + fn](window.event); }
                obj.attachEvent('on' + type, obj[type + fn]);
            } else {
                obj.addEventListener(type, fn, false);
            }
        }

        // remove event listener function
        function removeListener(obj, type, fn) {
            if (obj.detachEvent) {
                obj.detachEvent('on' + type, obj[type + fn]);
                obj[type + fn] = null;
            } else {
                obj.removeEventListener(type, fn, false);
            }
        }

        /**
        * Get current browser viewpane height
        *
        * @return {number} height.
        */
        function _get_window_height() {
            return window.innerHeight || documentElement.clientHeight ||
                document.body.clientHeight || 0;
        }

        /**
        * Get current absolute window scroll position
        *
        * @return {number} YScroll.
        */
        function _get_window_Yscroll() {
            return window.pageYOffset || document.body.scrollTop ||
                document.documentElement.scrollTop || 0;
        }

        /**
        * Get current absolute document height
        *
        * @return {number} Current document height.
        */
        function _get_doc_height() {
            return Math.max(
                document.body.scrollHeight || 0, document.documentElement.scrollHeight || 0,
                document.body.offsetHeight || 0, document.documentElement.offsetHeight || 0,
                document.body.clientHeight || 0, document.documentElement.clientHeight || 0
            );
        }

        /**
        * Get current vertical scroll percentage
        *
        * @return {number} Current vertical scroll percentage.
        */
        function _get_scroll_percentage() {
            return (
                (_get_window_Yscroll() + _get_window_height()) / _get_doc_height()
            ) * 100;
        }

        //check if another milestone is hit 
        function scrollTracker() {
            max_scroll = _get_scroll_percentage()
            bucket = (max_scroll > SETTINGS.scroll_grouping ? 1 : 0) * Math.floor((max_scroll) / SETTINGS.scroll_grouping) * SETTINGS.scroll_grouping;
            if (bucket > _current_bucket) {
                _current_bucket = max_scroll;
                if (typeof (dataLayer) !== 'undefined' && scroll_history[bucket] != true) {
                    sentHit(bucket)
                }
            }
        }
        //send hit and back fill skipped milestones 
        function sentHit(percent_num) {
            if (scroll_history[percent_num] != true) {
                var dL = new Object();
                dL["event"] = SETTINGS.data_layer_event_name;
                dL[SETTINGS.data_layer_event_param1_name] = bucket;
                dataLayer.push(dL);
                scroll_history[percent_num] = true;
            }
            //back fill for skipped milestones
            while (percent_num > SETTINGS.scroll_grouping) {
                percent_num -= SETTINGS.scroll_grouping
                sentHit(percent_num)
            }
        }

        //remove listener on back button click to prevent duplication 
        function removeonpop() {
            removeListener(window, "scroll", scrollTracker);
        }

        return {
            // public interface
            init: function () {
                var _timeout = SETTINGS.pageview_delay;
                setTimeout(function () {
                    // adding timeout as time required to wait for SPA content to render
                    if (Math.round((window.innerHeight / document.documentElement.scrollHeight) * 100) <= SETTINGS.percentage_threshold) {
                        addListener(window, "scroll", scrollTracker);
                    }
                }, _timeout);

                ////////// remove another scroll tracker events to prevent duplication on popstate (updated 6/3)
                window.addEventListener('popstate', removeonpop, { once: true });
                return true;
            }
        }
    })();

    try {
        CP_ScrollTracking.init();
    } catch (error) {
        console.log(error);
    }

})();
