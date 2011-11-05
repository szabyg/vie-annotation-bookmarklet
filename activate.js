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

    var z = new VIE();
    z.loadSchemaOrg();
    z.use(new z.StanbolService({url : appConfig.stanbolUri, proxyDisabled: true}));
    // make the content element editable

    jQuery('<div id="viewidgets-container">')
    .hover (
            function () {jQuery(this).animate({"right" : "-10px"})},
            function () {jQuery(this).animate({"right" : "-250px"})}
    )
    .appendTo(jQuery('<div id="viewidgets-wrapper">').appendTo(jQuery('body')))
    .append(jQuery('<div id="viewidgets-persons" class="entities">Persons</div>').append(jQuery('<div class="container">')))
    .append(jQuery('<div id="viewidgets-places" class="entities">Places</div>').append(jQuery('<div class="container">')))
    .append(jQuery('<div id="viewidgets-organizations" class="entities">Organizations</div>').append(jQuery('<div class="container">')));
    
    var renderImageSearch = function (jQuerycontainer, entity) {
        var jQueryul = jQuery('<ul>')
        .vieImageSearch({
            vie    : z,
            bin_size: 5,
            services : {
                gimage : {
                    use: true
                }
            },
            render: function (data) {
                var self = this;
                var jQueryelem = jQuery(self.element);
                var photos = self.options.photos;
                // clear the container element
                //rendering
                var groupId = Math.random().toString().substring(2);
                for (var p = 0; p < photos.length && p < this.options.bin_size; p++) {
                    var photo = photos[p];
                    var link = jQuery('<a rel="pics-group-' + groupId + '" href="' + photo.original + '">');
                    var image = jQuery("<img src=\"" + photo.original + "\" />")
                    .css({width: "100%", height:"100%"});
                    jQuery('<li>')
                    .addClass("panel" + p)
                    .append(link.append(image))
                    .appendTo(jQueryelem);
                }
                jQueryelem.find('a').fancybox({
                    cycling: true
                });
                jQueryelem
                .css({
                    width: "250px",
                    height: "150px"                        
                })
                .anythingSlider({
                    theme : "polished",
                    autoPlay: true,
                    resizeContents      : true,
                    hashTags            : false
                });
                var container = jQueryelem.closest('.entities').first();
                container.attr('scrollTop', 0);
                return this;
            }
        })
        .vieImageSearch({
            entity: entity
        });
        jQuerycontainer.prepend(jQueryul);
        jQuerycontainer.parent().animate({"background-color": "#ff9"}, 500, function () {
            jQuery(this).animate({"background-color": "transparent"}, 5000);
        });                
    };
    
    
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
            
            if (entity.isof("Person")) {
                renderImageSearch(jQuery('#viewidgets-persons').find('.container').first(), entity);
            } else if (entity.isof("Place")) {
                renderImageSearch(jQuery('#viewidgets-places').find('.container').first(), entity);
            } else if (entity.isof("Organization")) {
                renderImageSearch(jQuery('#viewidgets-organizations').find('.container').first(), entity);
            } else {
                console.warn("Non-supported entity-type(s)", entity.get('@type'));
            }
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

