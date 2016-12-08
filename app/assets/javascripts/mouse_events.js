var mapboxgl = require('mapbox-gl');

var MouseEvents = function(map, style, mappers){
  this.map = map;
  this.style = style;
  this.mappers = mappers;

  var self = this;

  map.on("mousemove", function(e){
    var point = [e.point.x,e.point.y];
    var features = self.queryRenderedFeatures(point);
    var ids = {lines: {sections: [], stations: []}, plans: {sections: [], stations: []}};

    map.getCanvas().style.cursor = features.length ? 'pointer' : '';

    hoverActions = [];

    features.forEach(function(f){
      var type = f.layer.type == 'circle'? 'stations' : 'sections';
      var id = f.properties.id;

      var mapperType = f.properties.plan ? 'plans' : 'lines';

      ids[mapperType] = ids[mapperType] || {};
      ids[mapperType][type] = ids[type] || [];
      ids[mapperType][type].push(id);
    });

    for (var mapperType in self.mappers) {
      for (var type in ids[mapperType]) {
        var mapper = self.mappers[mapperType];
        mapper.setHoverIds(type, ids[mapperType][type]);
      }
    }
  });

  map.on('click',function(e){
    var point = [e.point.x,e.point.y];
    var features = self.queryRenderedFeatures(point);
    var html = '';
    features.forEach(function(f){
      html+= self.featureInfo(f.properties);
    });

    if (html == '') return;
    var popup = new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(html)
      .addTo(map);
  });
}

MouseEvents.prototype =  {
  map: null,
  style: null,
  mappers: null,

  validValue: function(value) {
    return (value !== null && value !== 999999)
  },

  layerNames: function() {
    var layers = [];
    for (var mapperType in this.mappers){
      var mapper = this.mappers[mapperType];
      for (var type in mapper.layers) {
        for (var layer in mapper.layers[type]) {
          var name = mapper.layers[type][layer];
          if (name.indexOf('hover') === -1 && name.indexOf('inner') === -1) {
            layers.push(name);
          }
        }
      }
    }
    return layers;
  },

  lineLabel: function (line, line_url_name) {
    var color = this.style.lineLabelFontColor(line_url_name) ? this.style.lineLabelFontColor(line_url_name) : 'white';
    var s ='margin-left:5px; color:' + color + ';background-color:'+ this.style.lineColor(line_url_name) + ';';
    return '<span class="c-text--highlight popup-line-indicator" style="' + s + '">'+ line +'</span>';
  },

  featureInfo: function (f){
    str = '<div class="c-text popup-feature-info"><ul class="c-list c-list--unstyled">';
    if (f.name) {
      str += '<li class="c-list__item"><strong> Estación ' + f.name + '</strong>' + this.lineLabel(f.line, f.line_url_name) + '</li>';
    } else {
      str += '<li class="c-list__item"><strong>' + ((!f.plan)? 'Tramo de la línea': 'Línea') + '</strong>' + this.lineLabel(f.line, f.line_url_name) +'</li>'
    }

    // We have to parse null values because Mapbox GL stringifies them.
    for (var key in f) {
      if (f[key] == 'null') f[key] = null;
    }

    if (!f.plan && f.buildstart) str += '<li class="c-list__item">Comienzo de construcción: ' + f.buildstart + '</li>';
    if (!f.plan && this.validValue(f.opening)) str += '<li class="c-list__item">Inauguración: ' + f.opening + '</li>';
    if (!f.plan && this.validValue(f.closure)) str += '<li class="c-list__item">Cierre: ' + f.closure +'</li>';
    if (f.plan && f.year) str +='<li class="c-list__item"><i>'+f.plan + ' ' + f.year + '</i></li>'
    if (f.length) str += '<li class="c-list__item">Longitud aproximada: '+ (parseFloat(f.length)/1000).toFixed(2) + 'km</li>';
    if (f.plan && f.url) str += '<li class="c-list__item"><a class="c-link c-link--primary" target="_blank" href="'+f.url+'">Más información</a></li>';
    str += '<ul></div>';
    return str;
  },

  queryRenderedFeatures: function(point){
    return this.map.queryRenderedFeatures(point, {layers: this.layerNames()});
  }
}

module.exports = MouseEvents;
