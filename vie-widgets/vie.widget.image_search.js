// VIE Widgets - Vienna IKS Editable Widgets
// (c) 2011 Sebastian Germesin, IKS Consortium
// VIE Widgets may be freely distributed under the MIT license.
// (see LICENSE)

(function($, undefined) {
    $.widget('view.vieImageSearch', {
        
        _create: function () {
            //extend VIE with an ontological representation of the images
            var v = this.options.vie;
            if (v.types.get("ImageObject").attributes.get("depicts") !== undefined) {
                v.types.get("ImageObject").attributes.add("depicts", ["Thing"]);
                v.types.get("Thing").attributes.get("image").range.push("ImageObject");
                v.types.add("VIEImageResult", [
                   {
                   "id"    : "query",
                   "range" : ["Text", "Thing"]
                   },
                   {
                   "id"    : "service",
                   "range" : ["Text", "Thing"]
                   },
                   {
                    "id"    : "time",
                    "range" : "Date"
                   },
                   {
                    "id"    : "entity",
                    "range" : "Thing"
                   }]
                ).inherit(v.types.get("Thing"));
            }
            return this;
        },
        
        _init: function () {
            this.triggerSearch(this.options.entity);
        },
        
        render: function (data) {
            data.time = (data.time)? data.time : new Date();
            if (data.queryId === this.options.query_id) {
                for (var p = 0; p < data.photos.length; p++) {
                    this._triplifyImage(data.photos[p], data.time, data.serviceId, data.entityId, data.queryId);
                    this.options.photos.push(data.photos[p]);
                }
                delete data["photos"];
                var render = (this.options.render)? this.options.render : this._render;
                render.call(this, data);
            } else {
                //discard results as they depend on an old query
            }
        },
        
        _render: function (data) {
            var self = this;
            
            var photos = self.options.photos;
            var time = data.time;
            
            // clear the container element
            $(self.element).empty();
                        
            //rendering
            for (var p = 0; p < photos.length && p < this.options.bin_size; p++) {
                var photo = photos[p];
                var image = $('<a class="' + self.widgetBaseClass + '-image" target="_blank" href="' + photo.original + '"></a>')
                    .append($("<img src=\"" + photo.thumbnail + "\" />"));
                $(self.element).append(image);
            }
            return this;
        },
        
        triggerSearch: function (entityId, pageNum) {
            var self = this;
            
            if (this.options.timer) {
                clearTimeout(this.options.timer);
            }
            this.options.query_id++;
            var qId = this.options.query_id;
            this.options.photos = [];
            this.options.page_num = (pageNum)? pageNum : 0;
            
            var entity = undefined;
            if (typeof entityId === "string") {
                entity = this.options.vie.entities.get(entityId);
            } else {
                entity = entityId;
            }

            if (entity) {
                var queryPerformed = false;
                for (var s in this.options.services) {
                    var service = this.options.services[s];
                    if (service.use) {
                        this._trigger('start_query', undefined, {entity: entity, service: s, time: new Date(), queryId : qId});
                        service.query(entity, s, this, qId);
                        queryPerformed = true;
                    }
                }
                if (queryPerformed) {
                    this.options.timer = setTimeout(function (widget) {
                        return function () {
                            // discard all results that return after this timeout happened
                            widget.options.query_id++;
                        };
                    }(this), this.options.timeout, "JavaScript");
                }
            } else {
                this._trigger('error', undefined, {msg: "Entity needs to be registered in VIE.", id : entityId});
            }
            return this;
        },
        
        _triplifyImage: function (photo, time, serviceId, entityId, queryId) {
            var entity = this.options.vie.entities.get(entityId);
            
            var imageId = "<" + photo.original + ">";
            this.options.vie.entities.addOrUpdate({
                '@subject' : imageId, 
                '@type'    : "ImageObject",
                "time"     : time.toUTCString(),
                "query"    : queryId,
                "service"  : serviceId,
                "entity"   : entity.id,
                "image"    : photo.original
            });
            entity.setOrAdd('image', imageId);
        },
        
        _getUrlMainPartFromEntity : function (entity, serviceId) {
            var service = this.options.services[serviceId];
            
            entity = ($.isArray(entity))? entity : [ entity ];

            for (var e = 0; e < entity.length; e++) {
                var types = entity[e].get('@type');
                types = ($.isArray(types))? types : [types];
                
                for (var t = 0; t < types.length; t++) {
                    var type = this.options.vie.types.get(types[t]);
                    if (type) {
                        var tsKeys = [];
                        for (var q in this.options.ts_url) {
                            tsKeys.push(q);
                        }
                        //sort the keys in ascending order!
                        tsKeys = this.options.vie.types.sort(tsKeys, false);
                        for (var q = 0; q < tsKeys.length; q++) {
                            var key = tsKeys[q];
                            if (type.isof(key) && this.options.ts_url[key][serviceId]) {
                                var ret = this.options.ts_url[key][serviceId].call(this, entity[e], serviceId);
                                if (ret) {
                                    return ret;
                                }
                            }
                        }
                    }
                }
            }
            return "";
        },
        
        options: {
            vie         : new VIE(),
            timeout     : 10000,
            bin_size  : 10,
            services    : {
                /*'europeana' : {
                    use       : false,
                    api_key   : undefined,
                    base_url  : "http://api.europeana.eu/api/opensearch.rss?",
                    tail_url  : function (widget, service) {
                        //TODO
                    },
                    query : function (entity, serviceId, widget) {
                        //TODO
                    },
                    callback : function (widget, service) {
                        //TODO
                    }
                },*/
                'gimage' : {
                    use       : false,
                    api_key   : undefined,
                    safe      : "active", //active,moderate,off
                    base_url  : "https://ajax.googleapis.com/ajax/services/search/images?v=1.0",
                    tail_url  : function (widget, service) {
                        var url = "&safe=" + service.safe;
                        
                        url += "&rsz=" + widget.options.bin_size;
                        url += "&start=" + (widget.options.page_num * widget.options.bin_size);
                        url += "&callback=?";
                        
                        return url;
                    },
                    query : function (entity, serviceId, widget, queryId) {
                        // assemble the URL
                        
                        var mainUrl = widget._getUrlMainPartFromEntity(entity, serviceId);
                        
                        if (mainUrl) {
                            var url = this.base_url;
                            url += mainUrl.replace(/ /g, '+');
                            url += this.tail_url(widget, this);
                            // trigger the search & receive the data via callback
                            $.getJSON(url, this.callback(widget, entity.id, serviceId, queryId));
                        } else {
                            widget._trigger("error", undefined, {
                                msg: "No type-specific URL can be acquired for entity. Please add/overwrite widget.options[<widget_type>][" + serviceId + "]!", 
                                id : entity.id, 
                                service : serviceId, 
                                queryId : queryId});
                        }
                    },
                    callback  : function (widget, entityId, serviceId, queryId) {
                        return function (data) {
                            var photos = [];
                            if (data && data.responseStatus === 200) {
                                var rData = data.responseData.results;
                                for (var r = 0; r < rData.length; r++) {
                                    var thumnail = rData[r].tbUrl;
                                    var original = rData[r].url;
                                    var photoObj = {
                                        "thumbnail" : thumnail,
                                        "original" : original
                                    };
                                    photos.push(photoObj);
                                }
                            }
                            var data = {entityId : entityId, serviceId: serviceId, queryId : queryId, time: new Date(), photos: photos};
                            widget._trigger('end_query', undefined, data);
                            widget.render(data);
                          };
                    }
                },
                'flickr' : {
                    use       : false,
                    api_key   : undefined,
                    sort      : 'relevance',
                    safe      : 1,
                    base_url  : "http://api.flickr.com/services/rest/?method=flickr.photos.search",
                    tail_url  : function (widget, service) {
                        var url = "&sort=" + service.sort;
                        
                        url += "&per_page=" + widget.options.bin_size;
                        url += "&page=" + widget.options.page_num;
                        url += "&api_key=" + service.api_key;
                        url += "&safe_search=" + service.safe; // safe search
                        url += "&extras=url_o&format=json&jsoncallback=?";
                        
                        return url;
                    },
                    query : function (entity, serviceId, widget, queryId) {
                        
                        var mainUrl = widget._getUrlMainPartFromEntity(entity, serviceId);
                        
                        if (mainUrl) {
                            // assemble the URL
                            var url = this.base_url;
                            url += mainUrl;
                            url += this.tail_url(widget, this);
                            // trigger the search & receive the data via callback
                            $.getJSON(url, this.callback(widget, entity.id, serviceId, queryId));
                        } else {
                            widget._trigger("error", undefined, {
                                msg: "No type-specific URL can be acquired for entity. Please add/overwrite widget.options[<widget_type>][" + serviceId + "]!", 
                                id : entityId, 
                                service : serviceId, 
                                queryId : queryId});
                        }
                    },
                    callback  : function (widget, entityId, serviceId, queryId) {
                        return function (data) {
                              var photos = [];
                              if (data.stat === 'ok' && data.photos.total > 0) {
                                  //put them into bins
                                  for (var i = 0; i < data.photos.photo.length; i++) {
                                      var photo = data.photos.photo[i];
                                      var imgS = 'http://farm' + 
                                              photo.farm + '.static.flickr.com/' + 
                                              photo.server + '/' + 
                                              photo.id + '_' + 
                                              photo.secret + '_s.jpg';
                                      
                                      var imgZ = 'http://farm' + 
                                              photo.farm + '.static.flickr.com/' + 
                                              photo.server + '/' + 
                                              photo.id + '_' + 
                                              photo.secret + '_z.jpg';
                                      
                                      var photoObj = {
                                              "thumbnail" : imgS,
                                              "original" : imgZ
                                      };
                                      photos.push(photoObj);
                                  }
                              }
                              var data = {entityId : entityId, serviceId: serviceId, queryId : queryId, time: new Date(), photos: photos};
                              widget._trigger('end_query', undefined, data);
                              widget.render(data);
                          };
                    }
                }
            },
            ts_url : {
                "Thing" : {
                    'flickr' : function (entity, serviceId) {
                        var url = "";
                        if (entity.has("name")) {
                            var name = entity.get("name");
                            if ($.isArray(name) && name.length > 0) {
                                for (var i = 0; i < name.length; i++) {
                                    if (name[i].indexOf('@en') > -1) {
                                        name = name[i];
                                        break;
                                    }
                                }
                                if ($.isArray(name)) name = name[0]; //just take the first
                                url += "&text="; // *no* type-specific keywords
                                url += name;
                                return url;
                            }
                        }
                        return undefined;
                    },
                    'gimage' : function (entity, serviceId) {
                        var url = "";
                        if (entity.has("name")) {
                            var name = entity.get("name");
                            if ($.isArray(name) && name.length > 0) {
                                for (var i = 0; i < name.length; i++) {
                                    if (name[i].indexOf('@en') > -1) {
                                        name = name[i];
                                        break;
                                    }
                                }
                                if ($.isArray(name)) name = name[0]; //just take the first
                                url += "&q="; // *no* type-specific keywords
                                url += name.replace(/ /g, '+').replace(/@.*/, '').replace(/"/g, '');
                                return url;
                            }
                        }
                        return undefined;
                    }
                },
                "Person" : {
                    'flickr' : function (entity, serviceId) {
                        var url = "";
                        if (entity.has("name")) {
                            var name = entity.get("name");
                            if ($.isArray(name) && name.length > 0) {
                                for (var i = 0; i < name.length; i++) {
                                    if (name[i].indexOf('@en') > -1) {
                                        name = name[i];
                                        break;
                                    }
                                }
                                if ($.isArray(name)) name = name[0]; //just take the first
                                url += "&text="; // *no* type-specific keywords
                                url += name.replace(/ /g, '%20').replace(/@.*/, '').replace(/"/g, '');
                                return url;
                            }
                        }
                        return undefined;
                    },
                    'gimage' : function (entity, serviceId) {
                        var url = "";
                        if (entity.has("name")) {
                            var name = entity.get("name");
                            if ($.isArray(name) && name.length > 0) {
                                for (var i = 0; i < name.length; i++) {
                                    if (name[i].indexOf('@en') > -1) {
                                        name = name[i];
                                        break;
                                    }
                                }
                                if ($.isArray(name)) name = name[0]; //just take the first
                                url += "&imgtype=face"; // type-specific search for faces
                                url += "&q="; // *no* type-specific keywords
                                url += name.replace(/ /g, '+').replace(/@.*/, '').replace(/"/g, '');
                                return url;
                            }
                        }
                        return undefined;
                    }
                },
                "GeoCoordinates" : {
                    'flickr' : function (entity, serviceId) {
                        var url = "";
                        
                        if (entity.has('latitude') && 
                            entity.has('longitude')) {
                            var ts = Math.round((new Date()).getTime() / 1000);
                            var minUploadDate = ts - 604800 * 100; // last 100 weeks
                            var radius = 10;
                            var radiusUnits = "km";
                            
                            var lat = entity.get("latitude");
                            if ($.isArray(lat) && lat.length > 0) {
                                lat = lat[0]; //just take the first
                            }
                            var lon = entity.get("longitude");
                            if ($.isArray(lon) && lon.length > 0) {
                                lon = lon[0]; //just take the first
                            }
                            
                            url += "&lat=" + lat + "&lon=" + lon;
                            url += "&min_upload_date=" + minUploadDate;
                            url += "&radius=" + radius;
                            url += "&text=tourist attraction"; // type-specific keywords!
                            url += "&radius_units=" + radiusUnits;
                            return url;
                        }
                        return undefined
                    },
                    'gimage' : function (entity, serviceId) {
                        return undefined;
                    }
                },
                "Place" : {
                    'flickr' : function (entity, serviceId) {
                        var url = "";
                        
                        if (entity.has('schema:geo')) {
                            var geo = entity.get("schema:geo");
                            return this._getUrlMainPartFromEntity(geo, serviceId);
                        } else if (entity.has('containedIn')) {
                            var containedIn = entity.get('containedIn');
                            return this._getUrlMainPartFromEntity(containedIn, serviceId);
                        } else if (entity.has('name')) {
                            var name = entity.get("name");
                            if ($.isArray(name) && name.length > 0) {
                                for (var i = 0; i < name.length; i++) {
                                    if (name[i].indexOf('@en') > -1) {
                                        name = name[i];
                                        break;
                                    }
                                }
                                if ($.isArray(name)) name = name[0]; //just take the first
                                url += "&text="; // *no* type-specific keywords
                                url += name.replace(/ /g, '%20').replace(/@.*/, '').replace(/"/g, '');
                                return url;
                            }
                        }
                        return undefined
                    },
                    'gimage' : function (entity, serviceId) {
                        var url = "";
                        if (entity.has('name')) {
                            var name = entity.get("name");
                            if ($.isArray(name) && name.length > 0) {
                                for (var i = 0; i < name.length; i++) {
                                    if (name[i].indexOf('@en') > -1) {
                                        name = name[i];
                                        break;
                                    }
                                }
                                if ($.isArray(name)) name = name[0]; //just take the first
                                url += "&imgtype=photo"; // type-specific commands
                                url += "&q=tourist+attraction+" + name.replace(/ /g, '+').replace(/@.*/, '').replace(/"/g, '');
                                return url;
                            }
                        }
                        return undefined;
                    }
                },
                "Organization" : {
                    'flickr' : function (entity, serviceId) {
                        var url = "";
                        
                        if (entity.has('location')) {
                            var containedIn = entity.get('location');
                            return this._getUrlMainPartFromEntity(containedIn, serviceId);
                        } else if (entity.has('name')) {
                            var name = entity.get("name");
                            if ($.isArray(name) && name.length > 0) {
                                for (var i = 0; i < name.length; i++) {
                                    if (name[i].indexOf('@en') > -1) {
                                        name = name[i];
                                        break;
                                    }
                                }
                                if ($.isArray(name)) name = name[0]; //just take the first
                                url += "&text="; // *no* type-specific keywords
                                url += name.replace(/ /g, '%20').replace(/@.*/, '').replace(/"/g, '');
                                return url;
                            }
                        }
                        return undefined
                    },
                    'gimage' : function (entity, serviceId) {
                        var url = "";
                        if (entity.has('name')) {
                            var name = entity.get("name");
                            if ($.isArray(name) && name.length > 0) {
                                for (var i = 0; i < name.length; i++) {
                                    if (name[i].indexOf('@en') > -1) {
                                        name = name[i];
                                        break;
                                    }
                                }
                                if ($.isArray(name)) name = name[0]; //just take the first
                                url += "&imgtype=photo"; // type-specific commands
                                url += "&q=headquarter+" + name.replace(/ /g, '+').replace(/@.*/, '').replace(/"/g, '');
                                return url;
                            }
                        }
                        return undefined;
                    }
                }
            },
            
            // helper
            render      : undefined,
            entity      : undefined,
            photos      : [],
            timer       : undefined,
            page_num    : 1,
            query_id    : 0,
            
            // events
            start_query : function () {},
            end_query   : function () {},
            error       : function () {}
        }
        
    });
})(jQuery);
