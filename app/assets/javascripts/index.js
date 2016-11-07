var Style = require('./style');
var Subtogram = require('./subtogram');
var mapboxgl = require('mapbox-gl');
var $ = require('jquery');
var Misc = require('./misc');
var Timeline = require('./timeline');
var MouseEvents = require('./mouse_events');

var App = function(map, styles, years) {
  var style = new Style(styles);
  var subtogram = new Subtogram(map, style);
  var timeline = new Timeline(subtogram, years);
  var mouseEvents = new MouseEvents(map, style, subtogram);

  $('#current-year, #slider').
    attr('min', years.start).
    attr('max', years.end).
    change(function(e){
      var year = parseInt($(this).val());
      $('#current-year, #slider').val(year);
      if (year < years.start || year > years.end) return;
      timeline.toYear(year);
      Misc.saveParams(year, map);
    });

  $('#action').click(function(){
    if (years.current === years.end) return;

    if (timeline.playing) {
      $("#action span").removeClass('fa-pause').addClass('fa-play');
      timeline.stopAnimation();
      return;
    }

    $("#action span").removeClass('fa-play').addClass('fa-pause');

    timeline.animateToYear(years.end,
      function(year){
        $('#current-year, #slider').val(year);
        Misc.saveParams(year, map);
      },
      function(){
        $("#action span").removeClass('fa-pause').addClass('fa-play');
      });
  });

  $('.checkbox-toggle').change(function(){
    var line = $(this)[0].id.split('_')[1];
    var linesShown = subtogram.toggleLine(line);
    Misc.saveParams(null,null,linesShown);
  });

  var startingYear = years.default || years.start;
  timeline.toYear(startingYear);
  $('#current-year, #slider').val(startingYear);

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
    new App(map, styles, config.years, lines, plans);
  });

  map.on('moveend',function(){
    Misc.saveParams(null,map);
  });
}
