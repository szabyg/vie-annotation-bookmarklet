$(document).ready(function(){
    var appConfig = window.bookmarkletConfig;
    var selector = appConfig.defaultCssSelector;
    if(appConfig.cssPopup){
        appConfig.defaultCssSelector = selector = prompt("CSS selector for the annotation (e.g. p, body, div#content...)", appConfig.defaultCssSelector);
    }
    
    $("head")[0].insertBefore($("<script>window.bookmarkletConfig = " + JSON.stringify(appConfig) + "</script>")[0], $("head").children()[0]);
    $('#loadingDiv')
    .hide()  // hide it initially
    .ajaxStart(function() {
        $(this).show();
    })
    .ajaxStop(function() {
        $(this).hide();
    });
    function getResUri() {
        var duKey = _($("tr")).filter(function(tr){
            if(tr.children.length === 2 && tr.children[0].textContent.trim() === "DU-Key:"){
                return true;
            }
        })[0].children[1].textContent.trim();
        return escape(duKey);
    }
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
//            var baseUri = "http://kis28:8080/LMF";
            var baseUri = "http://labs.newmedialab.at/ORF";
//            var baseUri = "http://lmf.newmedialab.at/LMF";

            var sparqlUrl = baseUri + "/sparql/update";
            var resUri = baseUri + "/resource/" + getResUri();
            var enhancementType = ui.entityEnhancement._enhancement.get("enhancer:entity-type");
            console.info("enhancement type:", enhancementType);
            var sparql = "PREFIX dc: <http://purl.org/dc/elements/1.1/> INSERT { <" + 
                    resUri + "> dc:related  <" +
                    ui.entityEnhancement.getUri() +
                    "> } WHERE {}";
            console.info("sparql command:", sparql);
            $.ajax({
                url: sparqlUrl,
                type: "POST",
                contentType: "",
                data: sparql,
                success: function() {
                    console.info("sparql update:", arguments);
                },
                error: function() {
                    console.error("sparql update:", arguments);
                }
            });
            function getHtml(){
                $(":IKS-hallo").trigger("blur");
                return $("html").html();
            }
            function createResource(uri){
                $.ajax({
                    url: uri,
                    type: "POST",
                    statusCode: {
                        300: function(){
                            console.info("300:", arguments);
                            storeHtml(uri);
                        },
                        302: function(){
                            console.info("302:", arguments);
                            storeHtml(uri);
                        }
                    },

                    success: function() {
                        console.info("createResource:", arguments);
                        storeHtml(resUri);
                    },
                    error: function() {
                        console.error("createResource:", arguments);
                    }
                });
            }
            createResource(resUri);
            function storeHtml(url){
                $.ajax({
                    url: url,
                    type: "PUT",
                    data: getHtml(),
                    beforeSend: function(xhr){
                        xhr.setRequestHeader("Content-Type", "text/html;rel=content");
                    },
                    success: function() {
                        console.info("storeHtml:", arguments);
                    },
                    error: function() {
                        console.error("storeHtml:", arguments);
                    }
                });
            }
            console.info("entityEnhancement:", ui.entityEnhancement._enhancement.as("JSON"));
            console.info("entity uri:", ui.entityEnhancement.getUri());
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

