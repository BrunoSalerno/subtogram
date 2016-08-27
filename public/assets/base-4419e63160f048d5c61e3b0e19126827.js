/*
 Taken from http://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript
 weltraumpirat answer
 */


function getSearchParameters() {
  var prmstr = decodeURIComponent(window.location.search.substr(1));
  return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
}

function transformToAssocArray( prmstr ) {
  var params = {};
  var prmarr = prmstr.split("&");
  for ( var i = 0; i < prmarr.length; i++) {
    var tmparr = prmarr[i].split("=");
    params[tmparr[0]] = tmparr[1];
  }
  return params;
}


function save_params(year,map,lines,plans){
  var current_params = getSearchParameters();

  var url=location.pathname+'?';
  year = (year)? year : current_params.year;
  if (year) url += 'year=' + year;

  if (map){
    var center = map.getCenter();
    url += '&geo=' + center.lat.toFixed(6) + ',' + center.lng.toFixed(6) + ',' + map.getZoom().toFixed(2) + ',' + map.getBearing().toFixed(2);
  } else if (current_params.geo) {
    url += '&geo=' + current_params.geo;
  }

  if (lines){
    url += '&lines=' + (lines.join(',') || 0)
  } else if (current_params.lines){
    url += '&lines=' + current_params.lines;
  }

  if (plans){
    url += '&plans=' + (plans.join(',') || 0)
  } else if (current_params.plans){
    url += '&plans=' + current_params.plans;
  }

  history.pushState(document.title + ' ' + year ,document.title,url);
}

function round(number){
    return Number(number.toFixed(2));    
}
;
var Style = function(styles){
    this.__styles = styles;    
}

Style.prototype = {
    STATION_INNER_LAYER: 'station_inner',
    
    __styles: null,
    cache: {},
    cacheKey: function(type,operation,line,opts){
        if (opts.source_name == this.STATION_INNER_LAYER)
            return opts.source_name;

        var key = type + '-' + operation;

        return key;    
    },
    calculate: function(type,operation,line,opts){
        opts = opts || {};

        var cachedStyleKey = this.cacheKey(type,operation,line,opts);
        var cachedStyle = this.cache[cachedStyleKey];
        if (cachedStyle) return cachedStyle;
    
        var style;
            var colorCategory = type === 'sections' ? 'line-color' : 'circle-color';
            var styleCategory = type === 'sections' ? 'line' : 'station';

            if (operation == 'opening'){
              style = $.extend(true, {}, this.__styles[styleCategory][operation]);

              if (type === 'sections') {
                style = $.extend(true, style, this.__styles[styleCategory][operation].default);
              }

              var stops = [];
              
              for (var l in this.__styles.line[operation]){
                delete style[l];
                if (l !== 'default'){
                    stops.push([l, this.lineColor(l)]);
                }
              }
              
              style[colorCategory] = {
                    type: "categorical",
                    property : "line",
                    stops : stops
                  }
            } else {
              style = $.extend(true,{},this.__styles[styleCategory][operation]);
              style[colorCategory] = style["color"];
            }
            
            if (type === 'stations') {
                if (opts.source_name == this.STATION_INNER_LAYER) {
                    style["circle-color"] = style["fillColor"];
                    style["circle-radius"] = style["circle-radius"] - 3;
                }
                delete style["line-width"];
            }

        delete style["labelFontColor"];    
        delete style["fillColor"];
        delete style["color"];

        this.cache[cachedStyleKey] = style;

        return style;
    },
    hover: function(type){
        var str_type = (type == 'stations')? 'station' : 'line';
        return this.__styles[str_type]["hover"]; 
    },
    lineColor: function(line){
        return this.__styles.line.opening[line].color; 
    },
    lineLabelFontColor: function(line){
        return this.__styles.line.opening[line].labelFontColor;
    }
    
}
;
var LayerUpdate = function(args){
    this.layerName = args.layerName;
    this.map = args.map;
    this.type = args.type;

    this.featuresToAdd = [];
    this.featuresToRemove = [];
};

LayerUpdate.prototype = {
    sourceData: function(features){
        return {"type": "geojson",
                "data":{
                    "type" : "FeatureCollection",
                    "features": features
                }}
    },

    _layer: function(){
        var layer = {
                id: this.layerName,
                source: this.layerName,
                interactive: true,
                type: (this.type =='sections') ? 'line' : 'circle',
                paint:$.extend(true, {}, this.style)
            };

        if (this.type == 'sections'){

            $.extend(layer,{"layout": {
                    "line-join": "round",
                    "line-cap": "round"}})
        }
        
        return layer;
    },

    addFeature: function(feature, style, beforeLayer){
        if (beforeLayer) this.beforeLayer = beforeLayer;
        if (style) this.style = style;
        this.featuresToAdd.push(feature);
    },
    removeFeature: function(feature){
        this.featuresToRemove.push(feature);        
    },
    newSource: function(){
        var source = this.sourceData(this.featuresToAdd);
        this.map.addSource(this.layerName, source)
        this.map.addLayer(this._layer(), this.beforeLayer);
        
        var self = this;
        // Remove hover layers if this layer is not a hover layer
        if (this.layerName.indexOf('hover') == -1){
            ['line_hover','station_hover'].forEach(function(l){
                if (!self.map.getLayer(l)) return;
                self.map.removeLayer(l);
                self.map.removeSource(l);
            })
        }
    },
    updateSource: function(source){
        var features = source._data.features || [];
        var self = this;
        
        // We remove the features set to be removed
        features = $.grep(features, function(element) {
            return (!self._elementInArray(self.featuresToRemove,element));
        });
        
        // We add the features set to be added
        features = features.concat(this.featuresToAdd);
        
        source.setData(this.sourceData(features).data);
    },
    _elementInArray: function(array, element){
        var isPresent = false;
        
        var self = this;
        array.forEach(function(a){
            if (self._matchCondition(a,element)) {
                isPresent = true;
            }            
        });

        return isPresent;
    },
     
    _matchCondition: function(a,b){
        return (a.properties.klass === b.properties.klass &&
        a.properties.id === b.properties.id)
    },

    render: function(){
        var source = this.map.getSource(this.layerName);
 
        if (!source){
            if (this.featuresToAdd.length == 0) return;

            this.newSource();
        } else {
            this.updateSource(source);
        }
    }
}

var RenderUpdates = function(args){
    this.map = args.map;    
};

RenderUpdates.prototype = {
    render: function(changes){
      var layerUpdates = {}
      
      var self = this;
      changes.forEach(function(change){
        for (var o in change){
            change[o].forEach(function(l){
                if (window.DEBUG) {
                    console.log(o, 'a', l.type, 'feature',(o == 'add') ? 'to' : 'from', l.layerName);
                };

                if (!layerUpdates[l.layerName]) {
                    layerUpdates[l.layerName] = new LayerUpdate({
                        map: self.map,
                        layerName: l.layerName,
                        type: l.type
                    })
                }

                if (o == 'add'){
                    layerUpdates[l.layerName].addFeature(l.feature, l.style, l.beforeLayer);
                } else {
                    layerUpdates[l.layerName].removeFeature(l.feature);
                }
            });

        }
      });

      for (var layerName in layerUpdates){
        layerUpdates[layerName].render();
      }    
    }
}
;
var Plan = function(map,style){
  this.style = style;
  this.lines = {};
  this.map = map;

  var self = this;

  this.hasLine = function(line){
    return typeof this.lines[line] !== 'undefined';
  }

  this.addLine = function(name, raw_feature, length){
    self.lines[name] = {
        raw_feature: raw_feature,
        section:null,
        stations:[],
        length: round(length/1000)}
  };

  this.addStation = function(line,station){
    self.lines[line].stations.push(station)
  };


  this.draw = function(line){
    var changes = [];
    if (!self.lines[line].section)
        self.lines[line].section = new Section(self.map,
                                                 self.lines[line].raw_feature,
                                                 self.style,
                                                 'sections');

    changes.push(self.lines[line].section.open())

    $.each(self.lines[line].stations,function(i,s){
      if (!s.section)
        s.section = new Section(self.map,
                                s.raw_feature,
                                self.style,
                                'stations');
      changes.push(s.section.open());
    });

    return changes;
  };

  this.undraw = function(line){
    var changes = [];
    changes.push(self.lines[line].section.close());
    $.each(self.lines[line].stations,function(i,s){
      changes.push(s.section.close());
    });
    return changes;
  };
};
var Planification = function(plans,map,style){
  this.map = map;
  this.style = style;
  this.plans = {};

  this.drawnLines = {};

  var self = this;
 
  this.current_km = function(){
    var km = 0;
    
    for (var plan in self.plans){
        for (var k in self.plans[plan].lines){
          if (self.drawnLines[plan + '_' + k]) {
            km += self.plans[plan].lines[k].length
          }
        }
    }
    return round(km);
  }


  this.toggle = function(plan, line, planLineId){
    var deferred = new $.Deferred();
    var planLineKey = plan + '_' + line;

    if (self.drawnLines[planLineKey]){
      delete self.drawnLines[planLineKey];
      deferred.resolve(self.processChanges(self.plans[plan].undraw(line)));
    } else {
      self.drawnLines[planLineKey] = true;
      if (self.plans[plan] && self.plans[plan].hasLine(line)) {
        deferred.resolve(self.processChanges(self.plans[plan].draw(line)));
      } else {
        $.when(self.fetchPlanLines([planLineId])).then(function(){
            deferred.resolve(self.processChanges(self.plans[plan].draw(line)));
        })
      }
    }
    return deferred.promise();
  };

  this.processChanges = function(changes){
    var renderUpdates = new RenderUpdates({map: self.map});
    renderUpdates.render(changes);

    var plan_lines = [];

    for (var plan in self.plans){
        for (var k in self.plans[plan].lines){
          if (self.drawnLines[plan + '_' + k]) {
            plan_lines.push(plan.replace(' ','_')+'.'+k)
          }
        }
    }

    return plan_lines;
  }

  this.loadPlans = function(plans) {
    var ids = []
    for (var plan in plans) {
        plans[plan].lines.forEach(function(line){
            if (line.show) {
                ids.push(line.id);
            }
        });
    }
    $.when(self.fetchPlanLines(ids)).then(function(data){
        data.forEach(function(d){
            self.toggle(d.plan, d.line);
        });
    });
  }

  this.fetchPlanLines = function(ids) {
    var deferred = new $.Deferred();
    var params = {id: ids.join(',')}
    var url = 'http://' + location.host + '/api' + location.pathname + '/plan_line'
    $.getJSON(url, params).then(function(data){
        var loaded = [];
        data.forEach(function(planLine){
            self.loadData(planLine.line, planLine.stations);
            loaded.push({plan: planLine.line.properties.plan, line: planLine.line.properties.line})
        });
        deferred.resolve(loaded);
    });
    return deferred.promise();
  }

  this.loadData = function(line, stations){
      var plan_name = line.properties.plan;
      var line_name = line.properties.line;
      var plan_url = line.properties.url;
      var length = line.properties.length;

      if (!self.plans[plan_name]) {
        self.plans[plan_name] = new Plan(self.map,self.style);
      }

      if (!self.plans[plan_name].lines[line_name]){
        self.plans[plan_name].addLine(line_name,line,length)
      }

    $.each(stations, function(index,station){
      var obj ={section: null,raw_feature:station};
      self.plans[plan_name].addStation(line_name,obj);
    });
  };

  this.loadPlans(plans)
};
var Section = function(map, feature, style, type){
  this.status = null;
  
  this.raw_feature = feature;
  this.properties = feature.properties;
  this.map = map;
  this.__style = style;
  this.__type = type;
  this.__length = feature.properties.length;
  
  var self = this;
  
  const STATION_INNER_LAYER = 'station_inner';
  const STATION_TOP_LAYER = 'line_hover';
  const STATION_BUILDSTART_LAYER = 'station_buildstart';

  this.sourceName = function(){
    var str = self.__type + "_";

    if (!self.status || self.status == 'closure')
        return;

    return str + self.status;
  }

  this.before_layer = function(){
    var b = STATION_BUILDSTART_LAYER;
    if (self.__type == 'stations' || !self.map.getLayer(b)) b = STATION_TOP_LAYER;
    if (!self.map.getLayer(b)) b = STATION_INNER_LAYER;
    return b;
  }

  this.has_building_data = function(){
    return self.properties.buildstart != null;
  };

  this.been_inaugurated = function(){
    return self.properties.opening != null;
  };

  this.line = function(){
    return self.properties.line
  };

  this.type = function(){
    return self.__type;
  };

  this.length = function(){
    return round((self.__length/1000)); //in km
  };

  this.style = function(operation,opts){
    return self.__style.calculate(self.type(),operation,self.line(),opts);
  };

  this.buildChange = function(args){
    return $.extend(args,{type: self.type()});
  };

  this.update =  function(newStatus){
    var previousSourceName = self.sourceName();
    var previousStatus = $.extend({},{status: self.status}).status;
    self.status = newStatus;

    var changes = {remove:[], add:[]};

    if (newStatus == 'closure' || (previousSourceName && previousSourceName != self.sourceName())){
        changes.remove.push(self.buildChange({
                             layerName: previousSourceName,
                             feature: self.raw_feature
                            }));
    }

    if (newStatus != 'closure'){
        changes.add.push(self.buildChange({
            layerName:self.sourceName(),
            feature: self.raw_feature,
            style: self.style(newStatus),
            beforeLayer: self.before_layer()
        }));

        if (self.type() == 'stations' && (!previousStatus || previousStatus == 'closure')) {
            changes.add.push(self.buildChange({
            layerName: STATION_INNER_LAYER,
            feature: self.raw_feature,
            style: self.style(newStatus,{source_name: STATION_INNER_LAYER}),
            beforeLayer:null
           }));
        }
    }

    if (newStatus == 'closure' && self.type() == 'stations'){
        changes.remove.push(self.buildChange({
            layerName: STATION_INNER_LAYER,
            feature: self.raw_feature}));
    }

    return changes;
  }

  this.buildstart = function(){
    return self.update('buildstart');
  };

  this.open = function(){
    return self.update('opening');
  };

  this.close = function(){
    return self.update('closure');
  };
}
;
var Timeline = function(lines,data,map,years,style){
  var self = this;

  this.busy = false;
  this.lines = lines;

  this.map = map;
  this.years = years;
  this.style = style;
  this.sections = {};
  this.data = data;

  this.visibleLines = function(){
    lines = [];
    for (var l in self.lines){
        if (self.lines[l].show) lines.push(l);
    }
    return lines;
  }

  this.toggleLine = function(line){
    self.lines[line].show = !self.lines[line].show
    var linesParams = [];
    for (var l in self.lines){
      if (self.lines[l].show) linesParams.push(l)
    }
    return linesParams;
  };

  this.getBusy = function(){
    self.busy = true;
  };

  this.release = function(){
    self.busy = false;
  };

  this.current_year = function(){
    return years.current;
  };

  this.starting_year = function(){
    return years.start;
  };

  this.down_to_year = function(start_year,end_year,lines){
    lines = lines || self.visibleLines();
    
    var features = {};
    features['buildstart'] = [];
    features['opening'] = [];
    features['closure'] = [];
    var current_year_data;
    
    for (var year = start_year;year > end_year;year--){
        current_year_data = self.data[year]
        if (!current_year_data) continue;
        
        ['stations','sections'].forEach(function(category){
            for (var c in current_year_data[category]){
                current_year_data[category][c].forEach(function(obj){
                    if (lines.indexOf(obj.properties.line) == -1) return;
                    var id = category + '_' + obj.properties.id;
                    
                    if (!self.sections[id]) self.sections[id] = new Section(self.map,obj,self.style,category);          
                     
                    if (c == 'opening'){
                        features['opening'] = $.grep(features['opening'],function(element){
                            return (element != id);
                        });
                        if (self.sections[id].has_building_data()){
                            features['buildstart'].push(id);
                        }else{
                            features['closure'].push(id); 
                        }
                    }

                    if (c == 'buildstart'){
                        features['buildstart'] = $.grep(features['buildstart'],function(element){
                            return (element != id);
                        });
                        features['closure'].push(id); 
                    }

                    if (c == 'closure'){
                        features['closure'] = $.grep(features['closure'],function(element){
                            return (element != id);
                        });
                        if (self.sections[id].been_inaugurated()){
                            features['opening'].push(id);    
                        } else {
                            features['buildstart'].push(id);    
                        }
                    }
                });
            };
        });
    }
    
    self.featuresToMap(features);
  };
  
  this.up_to_year = function(year_start,year,lines){
    lines = lines || self.visibleLines();
    var features = self.features_in_a_year(year_start,year,lines); 
    self.featuresToMap(features);
  };
  
  this.features_in_a_year = function(year_start,year_end,lines){
    var features = {};
    features['buildstart'] = [];
    features['opening'] = [];
    features['closure'] = [];
    
    var current_year_data;
    
    for (var year = year_start + 1; year <= year_end;year++){
        current_year_data = self.data[year];
        if (!current_year_data) continue;

        ['stations','sections'].forEach(function(category){
            for (var c in current_year_data[category]){
                current_year_data[category][c].forEach(function(obj){
                    if (lines.indexOf(obj.properties.line) == -1) return;
                    
                    var id = category + '_' + obj.properties.id;
                    if (!self.sections[id]) self.sections[id] = new Section(self.map,obj,self.style,category);          
                    
                    if (c=='buildstart' || c=='opening') {
                        if (!features[c]) features[c] = [];
                        features[c].push(id)       
                        
                        if (c=='opening'){
                            features['buildstart'] = $.grep(features['buildstart'],function(element){
                                return (element != id)
                            });
                        }
                    }

                    if (c == 'closure'){
                        ['buildstart','opening'].forEach(function(cc){   
                            features[cc] = $.grep(features[cc],function(element){
                                return (element != id);
                            });
                        });
                        features[c].push(id);
                    }
                });
            };
        });
    }
    return features;    
  };

  this.featuresToMap = function(features){
      var changes = [];
      for (var o in features){
        if (!features[o]) return;

        features[o].forEach(function(id){
            var action;
            if (o == 'buildstart')
                action = self.sections[id].buildstart();
            else if (o == 'opening')
                action = self.sections[id].open();
            else
                action = self.sections[id].close();

            changes.push(action);
        });
      }

      var renderUpdates = new RenderUpdates({map: self.map});
      renderUpdates.render(changes);
    }

  this.set_year = function(year){
    self.years.previous = self.years.current;
    self.years.current = year;
  };

  this.year_information = function(){
    var information = {
        km_operating: 0,
        km_under_construction:0,
        stations:0
    };

    var y = self.years.current;
    for (var s in self.sections){
      var section = self.sections[s];
      switch (section.type()){
        case 'sections':
            if (section.status == 'opening'){
                information.km_operating += section.length();
                information.km_operating = round(information.km_operating);
            } else if (section.status == 'buildstart') {
                information.km_under_construction += section.length();
                information.km_under_construction = round(information.km_under_construction);
            }
        break;
        case 'stations':
            if (section.status == 'opening'){
                information.stations += 1;
            }
        break;
      }
    };      
    
    return information;
  };

};
var MouseEvents = function(map,style){
    this.features = {};
    this.style = style;
    this.map = map;
   
    var self = this
    
    this.layers = ['stations_opening','stations_buildstart','sections_buildstart', 'sections_opening'];

    var STATION_INNER_LAYER = 'station_inner';
    var STATION_HOVER_LAYER = 'station_hover';

    function lineLabel(line){
       var color = style.lineLabelFontColor(line) ? style.lineLabelFontColor(line) : 'white';
       var s ='margin-left:5px; color:' + color + ';background-color:'+ style.lineColor(line) + ';';
       return '<span class="c-text--highlight" style="' + s + '">'+ line +'</span>';
    }
    function feature_info(f){
        str = '<div class="c-text popup-feature-info"><ul class="c-list c-list--unstyled">';
        if (f.name) {
            str += '<li class="c-list__item"><strong> Estación ' + f.name + '</strong>' + lineLabel(f.line) + '</li>';
        } else {
            str += '<li class="c-list__item"><strong>' + ((!f.plan)? 'Tramo': '') + '</strong>' + lineLabel(f.line) +'</li>'
        }

        // We have to parse null values because Mapbox GL stringifies them.
        for (var key in f) {
            if (f[key] == 'null') f[key] = null;
        }

        if (f.buildstart) str += '<li class="c-list__item">La construcción empezó en ' + f.buildstart + '</li>';
        if (f.opening) str += '<li class="c-list__item">Se inauguró en ' + f.opening + '</li>';
        if (f.closure) str += '<li class="c-list__item">Se cerró en ' + f.closure +'</li>';
        if (f.plan && f.year) str +='<li class="c-list__item">'+f.plan + ' ' + f.year + '</li>'
        if (f.length) str += '<li class="c-list__item">Longitud aproximada: '+ (parseFloat(f.length)/1000).toFixed(2) + 'km</li>';
        if (f.plan && f.url) str += '<li class="c-list__item"><a class="c-link c-link--primary" target="_blank" href="'+f.url+'">Más información</a></li>';
        str += '<ul></div>';
        return str;
    }

    this.queryRenderedFeatures = function(point){
        var features = [];
        try {
            features = map.queryRenderedFeatures(point, {layers:self.layers});
        } catch (error) {
            console.log("Missing layer", error);
        }
        return features;
    }

    map.on('click',function(e){
        var point = [e.point.x,e.point.y];
        var features = self.queryRenderedFeatures(point);
        var html = '';
        features.forEach(function(f){
            html+= feature_info(f.properties);
        });

        if (html == '') return;
        var popup = new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);
    });

    map.on("mousemove", function(e){
        var point = [e.point.x,e.point.y];
        var features = self.queryRenderedFeatures(point);
        var ids = [];

        // Cursor pointer
        map.getCanvas().style.cursor = features.length ? 'pointer' : '';

        hoverActions = [];

        features.forEach(function(f){
            var type = f.layer.type == 'circle'? 'stations' : 'sections';
            var id = type +'_' + f.properties.id + '_' + f.properties.line + '_' + f.properties.plan;

            ids.push(id);

            if (!self.features[id]){
               var style = self.style.hover(type);
               var beforeLayer = (type == 'stations')? STATION_INNER_LAYER : STATION_HOVER_LAYER;

               var hoverFeature = {layerName: type + '_hover',
                                   type: type,
                                   feature: f,
                                   style: style,
                                   beforeLayer: beforeLayer};

                self.features[id] = hoverFeature;
                hoverActions.push({add: [hoverFeature]});
            }
        });

        for (var i in self.features){
            if (ids.indexOf(i) == -1){
                hoverActions.push({remove: [self.features[i]]});
                delete self.features[i];
            }
        };

        var renderUpdates = new RenderUpdates({map: self.map});
        renderUpdates.render(hoverActions);
    });
}
;
var App = function(config,lines,linesData,plansData,map,styles,callback){
    this.interval = null;
    var self = this;
    this.years = config.years;

    this.change_line_to_year = function(year_start,year_end,line,callback){
      if (self.timeline.busy) return;
      self.timeline.getBusy();

      if (year_end > year_start) {
        self.timeline.up_to_year(year_start,year_end,[line]);
        self.timeline.release();
      } else {
        self.timeline.down_to_year(year_start,year_end,[line]);
        self.timeline.release();
      }
    };

    this.change_to_year = function(year,speed,from_input,callback){
      if (year > self.years.end) return;
      if (self.timeline.busy) return;
      
      self.timeline.getBusy();

      var old_year = self.timeline.current_year();
      
      if (year > self.timeline.current_year()) {
        if (speed == 0){
            self.timeline.up_to_year(old_year,year);
            self.timeline.set_year(year);
            self.set_year_marker(year);
            self.set_current_year_info(year);
            self.timeline.release(); 
            if (typeof callback == 'function') callback(true);
            return;
        }
        var y = self.timeline.current_year()+1;
        self.interval = setInterval(function(){
          if (y > year) {
            save_params(year);
            clearInterval(self.interval);
            self.timeline.release();
            if (typeof callback == 'function') callback(true);
          }else{
            self.timeline.up_to_year(old_year,y);
            self.timeline.set_year(y);
            if (!from_input) self.set_current_year_info(y); 
            self.set_year_marker(y);
          }
          old_year = y;
          y++;
        }, speed || config.speed);
      } else if (year < self.timeline.current_year()){
        if (speed == 0){
            self.timeline.down_to_year(old_year,year);
            self.timeline.set_year(year);
            self.set_year_marker(year);
            self.set_current_year_info(year); 
            self.timeline.release();
            if (typeof callback == 'function') callback(true);
            return;
        }
        var y = self.timeline.current_year();
        self.interval = setInterval(function(){
          if (y < year) {
            save_params(year);
            clearInterval(self.interval);
            self.timeline.release();
            if (typeof callback == 'function') callback(true);
          }else{
            self.timeline.down_to_year(old_year,y);
            self.timeline.set_year(y);
            if (!from_input) self.set_current_year_info(y);
            self.set_year_marker(y);
          }
          old_year = y;
          y--;
        }, speed || config.speed);
      } else {
        self.timeline.release();
        if (typeof callback == 'function') callback(false);
      }
    };


    $('#slider')
      .attr('min',self.years.start)
      .attr('max',self.years.end)
      .click(function(e){
        var year = parseInt($(this).val());
        self.action_button_is_playing();
        self.change_to_year(year,0,true,function(){
          save_params(year);
          self.set_current_year_info();
          self.action_button_is_paused();
        });
      });

    this.action_button_is_playing = function(){
      $('#action span').removeClass('fa-play').addClass('fa-pause');
    };

    this.action_button_is_paused = function(){
      $('#action span').removeClass('fa-pause').addClass('fa-play');
    };

    this.set_year_marker = function(y){
      $('#slider').val(y);
    };

    this.play = function(){
      self.action_button_is_playing();
      self.change_to_year(self.years.end,null,false,function(){
        self.action_button_is_paused();
      });
    };

    this.pause = function(){
      self.action_button_is_paused();
      clearInterval(self.interval);
      self.timeline.release();
      self.set_current_year_info(self.timeline.current_year());
      save_params(self.timeline.current_year());
    };

    this.set_current_year_info = function(year){
        if (year) $('#current-year').val(year);
        var y_i = self.timeline.year_information();
        var kmTotal = round(y_i.km_operating + self.planification.current_km());

        kmTotal ? $("#km-total").show() : $("#km-total").hide();
        y_i.km_operating ? $("#km-operating").show() : $("#km-operating").hide();
        y_i.km_under_construction ? $("#km-under-construction").show() : $("#km-under-construction").hide();

        $("#km-total").html('Total: ' + kmTotal + 'km');
        $("#km-operating").html('Operativos: ' + y_i.km_operating + 'km');
        $("#km-under-construction").html('En construcción: ' + y_i.km_under_construction + 'km');
    };
    
    this.style = new Style(styles);
    this.planification = new Planification(plansData,map,this.style);
    this.timeline = new Timeline(lines,linesData,map,this.years,this.style);

    // Current year functionality
    // --------------------------
    $('#current-year').
      attr('min',self.years.start).
      attr('max',self.years.end).
        change(function(e){
      var new_year = parseInt($(this).val());
      if (new_year < self.years.start || new_year > self.years.end){
        $(this).blur();
        $(this).val(self.years.current);
      } else {
        $(this).blur();
        self.action_button_is_playing();
        self.change_to_year(new_year,null,true,function(){
          self.set_current_year_info();
          self.action_button_is_paused();
        });
      }
    });


    // Play/Pause
    // ----------
    $('#action').click(function(){
      if ($('#action span').hasClass('fa-play')){
        self.play();
      } else {
        self.pause();
      }
    });

    // Panel toggle
    $("#panel-toggler").show().click(function(){
        $("#panel").toggle();
    })

    // Hover & Popup
    //--------------
    self.mouse_events = new MouseEvents(map,self.style);
    
    // Init to the start year
    // ----------------------
    self.timeline.up_to_year(this.years.start);
    self.timeline.set_year(this.years.start);
    self.set_current_year_info(this.years.start);
    self.set_year_marker(this.years.start);

    if (config.years.default) {
        this.change_to_year(config.years.default,0,false,function(){
            if (typeof callback === 'function') callback();
        });
    }else{
        if (typeof callback === 'function') callback();    
    }
};









