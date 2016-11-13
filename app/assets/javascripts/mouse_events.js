var mapboxgl = require('mapbox-gl');

var MouseEvents = function(map, style, subtogram){
  this.map = map;
  this.style = style;
  this.subtogram = subtogram;

  var self = this;

  map.on("mousemove", function(e){
    var point = [e.point.x,e.point.y];
    var features = self.queryRenderedFeatures(point);
    var ids = {sections: null, stations: null};

    // Cursor pointer
    map.getCanvas().style.cursor = features.length ? 'pointer' : '';

    hoverActions = [];

    features.forEach(function(f){
      var type = f.layer.type == 'circle'? 'stations' : 'sections';
      var id = f.properties.id;

      ids[type] = ids[type] || [];
      ids[type].push(id);
    });

    for (var type in ids) {
      self.subtogram.setHoverIds(type, ids[type]);
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
  subtogram: null,

  validValue: function(value) {
    return (value !== null && value !== 999999)
  },

  layerNames: function() {
    var layers = [];
    for (var type in this.subtogram.layers) {
      for (var layer in this.subtogram.layers[type]) {
        var name = this.subtogram.layers[type][layer];
        if (name.indexOf('hover') === -1 && name.indexOf('inner') === -1) {
          layers.push(name);
        }
      }
    }
    return layers;
  },

  lineLabel: function (line) {
    var color = this.style.lineLabelFontColor(line) ? this.style.lineLabelFontColor(line) : 'white';
    var s ='margin-left:5px; color:' + color + ';background-color:'+ this.style.lineColor(line) + ';';
    return '<span class="c-text--highlight" style="' + s + '">'+ line +'</span>';
  },

  featureInfo: function (f){
    str = '<div class="c-text popup-feature-info"><ul class="c-list c-list--unstyled">';
    if (f.name) {
      str += '<li class="c-list__item"><strong> Estación ' + f.name + '</strong>' + this.lineLabel(f.line) + '</li>';
    } else {
      str += '<li class="c-list__item"><strong>' + ((!f.plan)? 'Tramo': '') + '</strong>' + this.lineLabel(f.line) +'</li>'
    }

    // We have to parse null values because Mapbox GL stringifies them.
    for (var key in f) {
      if (f[key] == 'null') f[key] = null;
    }

    if (f.buildstart) str += '<li class="c-list__item">La construcción empezó en ' + f.buildstart + '</li>';
    if (this.validValue(f.opening)) str += '<li class="c-list__item">Se inauguró en ' + f.opening + '</li>';
    if (this.validValue(f.closure)) str += '<li class="c-list__item">Se cerró en ' + f.closure +'</li>';
    if (f.plan && f.year) str +='<li class="c-list__item">'+f.plan + ' ' + f.year + '</li>'
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
