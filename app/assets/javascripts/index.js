var Style = require('./style');
var Subtogram = require('./subtogram');
var mapboxgl = require('mapbox-gl');
var $ = require('jquery');
var Misc = require('./misc');

var App = function(map, styles) {
  var style = new Style(styles);
  var subtogram = new Subtogram({map: map,
                                 style: style});

  subtogram.filterYear(2009);

  $(".spinner-container").fadeOut();

  $("#panel-toggler").show().click(function(){
    $("#panel").toggle();
  });
}

window.loadApp = function(lines, plans, styles, config, mapboxAccessToken, mapboxStyle) {
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
    new App(map, styles, lines, plans);
  });

  map.on('moveend',function(){
    Misc.saveParams(null,map);
  });
}
