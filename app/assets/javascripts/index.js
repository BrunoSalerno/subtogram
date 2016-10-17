var App = require './app'
var mapboxgl = require('mapbox-gl');
var $ = require('jquery')

var MapLoader = function(config){
  this.deferred = new $.Deferred();
  var self = this;
  mapboxgl.accessToken = <%= MAPBOX_ACCESS_TOKEN.to_json %>;
  var map = new mapboxgl.Map({
    container: 'map',
    style: <%= MAPBOX_STYLE.to_json %>,
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
    save_params(null,map);
  });
};


$(document).ready(function(){
  var config = <%= @config.to_json %>;;

  var m = new MapLoader(config);

  var lines = <%= @lines.to_json %>;
  var lineFeaturesByYear = <%= @city.line_features_by_year.to_json %>;
  var plans = <%= @plans.to_json %>;
  var style = <%= @city.style.to_json %>;

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
});
