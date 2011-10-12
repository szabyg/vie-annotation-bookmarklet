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

    // Load a list of scripts and run cb
    var loadScripts = function(scripts, cb) {
        var script, _i, _len, _results;
        if(scripts.length){
            script = scripts.shift();
            loadScript(script, function(){
                loadScripts(scripts.slice(0));
            });
        } else {
            console.info("all scripts loaded.");
        }
    };

    var loadStyles = function(csss) {
      var css, _i, _len, _results;
      for (_i = 0, _len = csss.length; _i < _len; _i++) {
        css = csss[_i];
        var e = document.createElement('link');
        e.setAttribute('rel','stylesheet');
        e.setAttribute('href', css);document.body.appendChild(e);
      }
    };
    function salt(){
        return Math.random().toString().substring(2);
    }
    var appRoot = window.bookmarkletConfig.appRoot;
    // Loading style definitions
    loadStyles([
        appRoot + "annotate.css",
        appRoot + "annotate.js/lib/Smoothness/jquery.ui.all.css"
    ]);
    // Loading the scripts
    loadScripts([
        appRoot + "annotate.js/lib/jquery-1.5.1.js",
        appRoot + "annotate.js/lib/jquery-ui.1.9m5.js",
        appRoot + "annotate.js/lib/underscore-min.js",
        appRoot + "annotate.js/lib/backbone.js",

        appRoot + "annotate.js/lib/hallo/hallo.js",
        appRoot + "annotate.js/lib/hallo/format.js",

        appRoot + "annotate.js/lib/jquery.rdfquery.debug.js",
        appRoot + "annotate.js/lib/vie/vie-latest.debug.js?" + salt(),

        appRoot + "annotate.js/lib/annotate.js?" + Math.random().toString().substring(2),
        appRoot + "activate.js?" + Math.random().toString().substring(2)
    ]);
})();
