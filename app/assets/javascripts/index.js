var Style = require('./style');
var Subtogram = require('./subtogram');
var mapboxgl = require('mapbox-gl');
var $ = require('jquery');
var Misc = require('./misc');
var Timeline = require('./timeline');

var App = function(map, styles, years) {
  var style = new Style(styles);
  var subtogram = new Subtogram(map, style);
  var timeline = new Timeline(subtogram, years);

  timeline.toYear(years.default || 1913);

  $(".spinner-container").fadeOut();

  $("#panel-toggler").show().click(function(){
    $("#panel").toggle();
  });

  $('#current-year').
    attr('min', years.start).
    attr('max', years.end).
    change(function(e){
      var year = parseInt($(this).val());
      if (year < years.start || year > years.end) return;
      timeline.toYear(year);
    });

  $('#action').click(function(){
    timeline.animateToYear(years.end);
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
    new App(map, styles, config.years, lines, plans);
  });

  map.on('moveend',function(){
    Misc.saveParams(null,map);
  });
}
