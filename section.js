var Section = function(map, feature, styles, type){
  this.status = null;
  
  this.raw_feature = feature;
  this.feature = null;
  this.geometry = feature.geometry;
  this.map = map;
  this.styles = styles;
  this.properties = feature.properties;
  this.__has_building_data = false;
  this.__been_inaugurated = false;
  this.__type = type;
  this.__length = feature.properties.length;
    
  var self = this;

  this.source_name = function(){
   var str = '';
   if (self.__type == 'line'){
    str = self.type() + '_' + self.properties.name  + '_' + self.properties.line +'_id_' + self.properties.id;
   }else{
    str = self.__type+"_line_" + self.properties.line + "_" + self.status;
   }
   return str;
  }

  this.has_building_data = function(){
    return self.__has_building_data;
  };

  this.been_inaugurated = function(){
    return self.__been_inaugurated;
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

  this.__popup_content = function(){

    var content ='<div class="info-window"><div>';
    if (self.type()=='station') content += self.properties.name + ' - '
    content += 'Línea '+ self.properties.line + '</div>'

    if (self.type()=='line') content += 'Tramo de <strong>'+ self.length()+'</strong> km';+' <br />';
    content +='<ul>'
    if (self.properties.buildstart) content += '<li>Construcción: ' + self.properties.buildstart;
    if (self.properties.opening) content += '<li>Inauguración: ' + self.properties.opening;
    if (self.properties.closure) content += '<li>Clausura: ' + self.properties.closure;
    content +='</ul></div>'
    return content;
  }

  this.__style = function(operation){
    var style;
    switch (self.__type){
      case 'line':
        style = (operation == 'opening') ?
          $.extend(true,{},self.styles.line[operation]["default"],self.styles.line[operation][self.properties.line]) :
          self.styles.line[operation];
        break;
      case 'station':
        style = (operation == 'opening') ?
          $.extend(true,{},self.styles.point[operation],self.styles.line[operation][self.properties.line]) :
          self.styles.point[operation];
        break;
    }
    return style;
  };

  this.bring_to_front = function(){
    //FIXME: ver cómo reemplazar esto
    //if (self.feature) self.feature.bringToFront();
  };

  this.draw = function(operation,batch){
    var style = self.__style(operation);
   
    if (self.__type == 'line'){
        self.feature = new Feature(self.source_name(),self.geometry,style,self.map,batch)
    } else {
        self.feature = new PointFeature(self.source_name(),self.raw_feature,style,self.map,batch);    
    }
    /*
    feature_var.bindPopup(self.__popup_content());

    feature_var.on('mouseover', function (e) {
      this.setStyle({color:'#2E2E2E'});
      if (self.geometry.type=='Point') this.setStyle({weight:3});
    });

    feature_var.on('mouseout', function (e) {
      this.setStyle(self.__style(self.status));
    });*/

  };
  
  this.buildstart = function(batch){
    self.status = 'buildstart';
    self.__has_building_data = true;
    if (self.feature) {
        if (self.__type == 'line'){
            self.feature.change_style(self.__style('buildstart'),batch);
        }else{
            self.feature.change_style(self.source_name(),self.__style('buildstart'),batch);
        }
    } else {
     self.draw('buildstart',batch);
    }
  };

  this.open = function(batch){
    self.status = 'opening';
    self.__been_inaugurated = true;
    if (self.feature) {
        if (self.__type == 'line'){
            self.feature.change_style(self.__style('opening'),batch)
        }else{
            self.feature.change_style(self.source_name(),self.__style('opening'),batch)    
        }
    } else {
      self.draw('opening',batch)
    }
  };

  this.close = function(batch){
    self.status = 'closure';
    if (self.feature){
      self.feature.remove(batch);
      self.feature = null;
    } else {
      //console.log('closure: inexistent ' + self.type());
    }
  };
}
