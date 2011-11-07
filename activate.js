jQuery(document).ready(function(){
    var appConfig = window.bookmarkletConfig;
    var selector = appConfig.defaultCssSelector;
    if(appConfig.cssPopup){
        selector = prompt("CSS selector for the annotation (e.g. p, body, div#content...)", appConfig.defaultCssSelector);
    }
    jQuery('.loadingDiv')
    .hide()  // hide it initially
    .ajaxStart(function() {
        jQuery(this).show();
    })
    .ajaxStop(function() {
        jQuery(this).hide();
    });

    var z = window.myVie = new VIE();
    z.loadSchemaOrg();
    z.use(new z.StanbolService({url : appConfig.stanbolUri, proxyDisabled: true}));

    // make the content element editable
    jQuery(selector)
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
            var entity = z.entities.get(ui.linkedEntity.uri);
            console.info('select event', event, ui);
        },
        remove: function(event, ui){
            console.info('remove event', event, ui);
        }

    })
    .each(function(){
        jQuery(this)
        .annotate('enable', function(success, widget){
            console.info("success:", success);
        });
    });
});

