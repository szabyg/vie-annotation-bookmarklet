(function(){
    // Load the script from url and when it's ready loading run the callback.
    function loadScript(url, callback) {
        var head = document.getElementsByTagName("head")[0];
        var script = document.createElement("script");
        script.src = url;

        // Attach handlers for all browsers
        var done = false;
        script.onload = script.onreadystatechange = function()
        {
            if( !done && ( !this.readyState 
                || this.readyState == "loaded" 
                || this.readyState == "complete") )
            {
                done = true;

                // Continue your code
                callback();

                // Handle memory leak in IE
                script.onload = script.onreadystatechange = null;
                head.removeChild( script );
            }
        };

        head.appendChild(script);
    }

    // Load a list of scripts *one after the other* and run cb
    var loadScripts = function(scripts, cb) {
        var script, _i, _len, _results;
        if(scripts.length) {
            script = scripts.shift();
            loadScript(script, function(){
                loadScripts(scripts.slice(0), cb);
            });
        } else {
            console.info("all scripts loaded.");
            if (cb) cb();
        }
    };

    var loadStyles = function(csss) {
      var css, _i, _len, _results;
      for (_i = 0, _len = csss.length; _i < _len; _i++) {
        css = csss[_i];
        var e = document.createElement('link');
        e.setAttribute('rel','stylesheet');
        e.setAttribute('href', css);document.head.appendChild(e);
      }
    };
    function noCache(){
        return Math.random().toString().substring(2);
    }
    var appRoot = window.bookmarkletConfig.appRoot;
    // Loading style definitions
    loadStyles([
        appRoot + "annotate.css",
        appRoot + "annotate.js/lib/jquery/jquery-ui.min.css",
        appRoot + "annotate.js/lib/Smoothness/jquery.ui.all.css",
        appRoot + "vie-widgets/jquery.anythingslider/anythingslider.css",
        appRoot + "vie-widgets/jquery.anythingslider/theme-polished.css",
        appRoot + "vie-widgets/jquery.fancybox/jquery.fancybox-1.3.4.css",
        appRoot + "vie-widgets/widgets.css"
    ]);
    // Loading the scripts
    loadScripts([
        appRoot + "annotate.js/lib/jquery/jquery-1.8.2.js",
        appRoot + "annotate.js/lib/jqueryui/jquery-ui.1.9.2.js",
        appRoot + "annotate.js/lib/underscore-min.js",
        appRoot + "annotate.js/lib/backbone-min.js",

        appRoot + "annotate.js/lib/hallo/hallo.js",
        appRoot + "annotate.js/lib/hallo/format.js",

        // TODO switch back as soon https://github.com/bergie/VIE/pull/91 is approved
        // appRoot + "annotate.js/lib/jquery.rdfquery.debug.js",
        appRoot + "jquery.rdfquery.debug.js?",

        appRoot + "annotate.js/lib/vie/vie-latest.debug.js?", // + noCache(),

        appRoot + "annotate.js/lib/annotate.js?",
        appRoot + "vie-widgets/vie.widget.image_search.js?",
        appRoot + "vie-widgets/schemaOrg/schema.json?",
        appRoot + "vie-widgets/schemaOrg/wrapper.js?",
        appRoot + "vie-widgets/jquery.anythingslider/jquery.anythingslider.min.js?",
//        appRoot + "vie-widgets/jquery.anythingslider/jquery.anythingslider.video.js?",
//        appRoot + "vie-widgets/jquery.anythingslider/swfobject.js?",
        appRoot + "vie-widgets/jquery.fancybox/jquery.fancybox-1.3.4.pack.js?",
        appRoot + "vie-widgets/jquery.fancybox/jquery.mousewheel-3.0.4.pack.js?",
        appRoot + "vie-widgets/jquery.fancybox/jquery.easing-1.3.pack.js?",
        appRoot + "activate.js?",
        // appRoot + "imagesearch.js?"
    ]);
    loadScripts(window.bookmarkletConfig.scriptsToLoad);

    // Show spinner
    var e = document.createElement("div");
    e.setAttribute("class", "loadingDiv");
    e.innerHTML = "<img src='" + appRoot + "spinner.gif'/>";
    document.body.appendChild(e);
})();
