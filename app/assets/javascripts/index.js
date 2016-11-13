var Style = require('./style');
var SubtogramLines = require('./subtogram_lines');
var mapboxgl = require('mapbox-gl');
var $ = require('jquery');
var Misc = require('./misc');
var Timeline = require('./timeline');
var MouseEvents = require('./mouse_events');

var App = function(map, styles, years, lines) {
  var style = new Style(styles);
  var subtogramLines = new SubtogramLines({map: map, style: style, lines: lines});
  var timeline = new Timeline(subtogramLines, years);
  var mouseEvents = new MouseEvents(map, style, subtogramLines);

  $(".c-tree__item").click(function(){
    var el = $(this);
    if (el.hasClass("c-tree__item--expanded")) {
      el.removeClass("c-tree__item--expanded");
      el.addClass("c-tree__item--expandable");
      el.children(".c-tree").hide();
    } else if (el.hasClass("c-tree__item--expandable")) {
      el.removeClass("c-tree__item--expandable");
      el.addClass("c-tree__item--expanded");
      el.children(".c-tree").show();
    }
  });

  $('#current-year, #slider').
    attr('min', years.start).
    attr('max', years.end);

  $('#slider')
    .on('input', function(){
      var year = parseInt($(this).val());
      $('#current-year').val(year);
      timeline.toYear(year);
    })
    .change(function(e){
      var year = parseInt($(this).val());
      Misc.saveParams(year, map);
    });

  $('#current-year').change(function(){
      var year = parseInt($(this).val());
      if (year < years.start || year > years.end) return;
      $('#slider').val(year);
      timeline.toYear(year);
      Misc.saveParams(year, map);
  });

  $('#action').click(function(){
    if (years.current === years.end) return;

    if (timeline.playing) {
      $("#action span").removeClass('fa-pause').addClass('fa-play');
      timeline.stopAnimation(function(year){
        Misc.saveParams(year, map);
      });
      return;
    }

    $("#action span").removeClass('fa-play').addClass('fa-pause');

    timeline.animateToYear(years.end,
      function(year){
        $('#current-year, #slider').val(year);
      },
      function(){
        $("#action span").removeClass('fa-pause').addClass('fa-play');
        Misc.saveParams(years.end, map);
      });
  });

  $('.checkbox-toggle').change(function(){
    var line = $(this)[0].id.split('_')[1];
    var linesShown = subtogramLines.toggleLine(line);
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
