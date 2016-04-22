var Section = function(map, feature, style, type){
  this.status = null;
  
  this.raw_feature = feature;
  this.feature = null;
  this.feature_extra = null;
  this.properties = feature.properties;
  this.map = map;
  this.style = style;
  this.__type = type;
  this.__length = feature.properties.length;
  
  var self = this;
  
  const STATION_INNER_LAYER = 'station_inner';
  const STATION_TOP_LAYER = 'line_hover';
   
  this.source_name = function(t,s){
    var t = t || self.__type;

    var str = t + "_";
    
    if (s){
        str += s;
    } else {
        if (self.status=='buildstart')
           str += self.status;
        else if (self.status=='opening' && self.__type == 'station')
           str += 'opening';
        else // line cases
           str += self.properties.line;
    }

    return str;
  }

  this.before_layer = function(){
    var b = self.source_name('station','buildstart');
    if (self.__type == 'station' || !self.map.getLayer(b)) b = STATION_TOP_LAYER;
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

  this.__style = function(operation,opts){
    return self.style.calculate(self.type(),operation,self.line(),opts); 
  };

  this.draw = function(operation){
    var style = self.__style(operation);
    var f_extra = null;
    var opts = {
        map:self.map,
        source_name:self.source_name(),
        feature:self.raw_feature,
        style:style,
        before_layer: self.before_layer(),
        type:self.__type
    }

    if (self.__type == 'station'){
        var extra_opts = $.extend({},opts,{
            source_name: STATION_INNER_LAYER,
            before_layer: null,
            style: self.__style(operation,{source_name: STATION_INNER_LAYER})
        });
        
        self.feature_extra = new Feature(extra_opts);
    }
    
    return new Feature(opts);
  };
  
  this.__update_feature = function(){
    if (self.feature) {
        self.feature.remove();
    }
    self.feature = self.draw(self.status);
  }

  this.buildstart = function(){
    self.status = 'buildstart';
    self.__update_feature();
  };

  this.open = function(){
    self.status = 'opening';
    self.__update_feature();
  };

  this.close = function(){
    self.status = 'closure';
    if (self.feature){
      self.feature.remove();
      self.feature = null;
      
      if (self.feature_extra){
        self.feature_extra.remove();
        self.feature_extra = null;
      }
    } else {
      //console.log('closure: inexistent ' + self.type());
    }
  };
}
