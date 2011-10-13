$(document).ready(function(){
    var appConfig = window.bookmarkletConfig;
    var selector = appConfig.defaultCssSelector;
    if(appConfig.cssPopup){
        selector = prompt("CSS selector for the annotation (e.g. p, body, div#content...)", appConfig.defaultCssSelector);
    }
    $('#loadingDiv')
    .hide()  // hide it initially
    .ajaxStart(function() {
        $(this).show();
    })
    .ajaxStop(function() {
        $(this).hide();
    });

    var z = new VIE();
    z.use(new z.StanbolService({url : appConfig.stanbolUri, proxyDisabled: true}));
    // make the content element editable
    console.log("analyzing", selector, $(selector));
    $(selector)
    .hallo({
        plugins: {
          'halloformat': {}
        },
        editable: true
    })
    .annotate({
        vie: z,
        vieServices: ["stanbol"],
        debug: true,
        decline: function(event, ui){
            console.info('decline event', event, ui);
        },
        select: function(event, ui){
            console.info('select event', event, ui);
        },
        remove: function(event, ui){
            console.info('remove event', event, ui);
        }

    })
    .each(function(){
        $(this)
        .annotate('enable', function(success){
            console.info("success:", success);
        });
    });
});

