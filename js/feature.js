var Feature = function(opts){
    var self = this;
    self.source_name = opts.source_name;
    self.style = opts.style;
    self.feature = opts.feature;
    self.map = opts.map;
    self.before_layer = opts.before_layer;
    self.type = opts.type;
     
    this.source_data = function(features){
        return {"data":{
                    "type" : "FeatureCollection",
                    "features":features
                }}
    }
    
    this.load = function(){
        var source = self.map.getSource(self.source_name);
        if (!source){
            var feature = self.feature instanceof Array ? self.feature : [self.feature]
            source = new mapboxgl.GeoJSONSource(self.source_data(feature))
            self.map.addSource(self.source_name, source)
            self.map.addLayer(self._layer(),self.before_layer);
            
            // Remove hover layers if this layer is not a hover layer
            if (self.source_name.indexOf('hover') == -1){
                ['line_hover','station_hover'].forEach(function(l){
                    if (!self.map.getLayer(l)) return;
                    self.map.removeLayer(l);
                    self.map.removeSource(l);
                })
            }        
        }else{
            features = source._data.features;

            if (self.feature instanceof Array){
                features = features.concat(self.feature);
            }else{
                features.push(self.feature);
            }
            source.setData(self.source_data(features).data);
        }
    }

    this.remove = function(){
        var source = self.map.getSource(self.source_name);
        
        features = $.grep(source['_data']['features'], function(element) {
            return (!self.match_condition(element));
        });

        source.setData(self.source_data(features).data);
    };
    
    this.match_condition = function(element){
        return (!self.feature.properties.plan &&
        !element.properties.plan && 
        element.properties.id == self.feature.properties.id) || 
        (self.feature.properties.plan &&
        self.feature.properties.plan == element.properties.plan &&
        self.feature.properties.id == element.properties.id) 
    }

    this._layer = function(){
        var layer = {
                id: self.source_name,
                source: self.source_name,
                interactive:true,
                type: (self.type =='line') ? self.type : 'circle',
                paint:$.extend(true,{},self.style)
            };

        if (self.type == 'line'){
            $.extend(layer,{"layout": {
                    "line-join": "round",
                    "line-cap": "round"}})
        }

        return layer;
    }
    
    this.load();
}