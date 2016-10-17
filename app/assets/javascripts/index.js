var App = require('./app');
var mapboxgl = require('mapbox-gl');
var $ = require('jquery');
var Misc = require('./misc');

var MapLoader = function(config, mapboxAccessToken, mapboxStyle){
  this.deferred = new $.Deferred();
  var self = this;
  mapboxgl.accessToken = mapboxAccessToken;
  var map = new mapboxgl.Map({
    container: 'map',
    style: mapboxStyle,
    center: config.coords,
    zoom: config.zoom,
    bearing: config.bearing,
    pitch: config.pitch
  });

  map.addControl(new mapboxgl.NavigationControl());
  map.on('load',function(){
    self.deferred.resolve(map);
  });

  map.on('moveend',function(){
    Misc.saveParams(null,map);
  });
};


window.loadApp = function(lines, lineFeaturesByYear, plans, style, config, mapboxAccessToken, mapboxStyle) {
  var m = new MapLoader(config, mapboxAccessToken, mapboxStyle);
  $.when(m.deferred)
  .then(function(map){
    window.app = new App(config,
      lines,
      lineFeaturesByYear,
      plans,
      map,
      style,
      function(){
        $(".spinner-container").fadeOut();
      });
  });
};
