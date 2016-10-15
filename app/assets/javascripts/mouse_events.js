var MouseEvents = function(map,style){
    this.features = {};
    this.style = style;
    this.map = map;

    var self = this

    var STATION_HOVER_LAYER = 'stations_hover';

    function layers() {
      var candidates = ['stations_opening','stations_buildstart','sections_buildstart', 'sections_opening'];
      var existingLayers = [];
      self.alreadyCreatedLayers = self.alreadyCreatedLayers || {};

      candidates.forEach(function(candidate){
        if (self.alreadyCreatedLayers[candidate] || self.map.getLayer(candidate)) {
          self.alreadyCreatedLayers[candidate] = true;
          existingLayers.push(candidate);
        }
      });

      return existingLayers;
    }

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
        return map.queryRenderedFeatures(point, {layers: layers()});
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
               var beforeLayer = (type == 'stations')? self.style.STATION_INNER_LAYER : STATION_HOVER_LAYER;

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
