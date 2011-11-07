jQuery(document).ready(function(){

    var acceptAllButton = jQuery("<button class='acceptAll'>Accept all</button>")
    .button()
    .click(function(){
        jQuery(":IKS-annotate").each(function(){
            jQuery(this).annotate("acceptAll");
        });
    })

    // TODO documentation: what element is for what
    jQuery('<div id="viewidgets-container">')
    .hover (
            function () {jQuery(this).animate({"right" : "-10px"})},
            function () {jQuery(this).animate({"right" : "-250px"})}
    )
    .append(acceptAllButton)
    .appendTo(jQuery('<div id="viewidgets-wrapper">').appendTo(jQuery('body')))
    .append(jQuery('<div id="viewidgets-persons" class="entities">Persons</div>').append(jQuery('<div class="container">')))
    .append(jQuery('<div id="viewidgets-places" class="entities">Places</div>').append(jQuery('<div class="container">')))
    .append(jQuery('<div id="viewidgets-organizations" class="entities">Organizations</div>').append(jQuery('<div class="container">')));

    jQuery(":IKS-annotate")
    .bind("annotateselect", function(event, ui){
        console.info("that's it!");
        var entity = window.myVie.entities.get(ui.linkedEntity.uri);
        // Show imageSearch element
        renderImageSearch(entity);
    });

    var renderImageSearch = function (entity) {
        var jQuerycontainer;
        if (entity.isof("Person")) {
            jQuerycontainer = jQuery('#viewidgets-persons').find('.container').first();
        } else if (entity.isof("Place")) {
            jQuerycontainer = jQuery('#viewidgets-places').find('.container').first();
        } else if (entity.isof("Organization")) {
            jQuerycontainer = jQuery('#viewidgets-organizations').find('.container').first();
        } else {
            console.warn("Non-supported entity-type(s)", entity.get('@type'));
            return;
        }
        var jQueryul = jQuery('<ul>')
        .vieImageSearch({
            vie    : window.myVie,
            bin_size: 5,
            services : {
                gimage : {
                    use: true
                }
            },
            render: function (data) {
                var self = this;
                var jQueryelem = jQuery(self.element);
//                jQueryelem = jQuery("#viewidgets-container");
                var photos = self.options.photos;
                // clear the container element
                //rendering
                var groupId = Math.random().toString().substring(2);
                for (var p = 0; p < photos.length && p < this.options.bin_size; p++) {
                    var photo = photos[p];
                    var link = jQuery('<a rel="pics-group-' + groupId + '" href="' + photo.original + '"/>');
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
                jQueryelem
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
});
