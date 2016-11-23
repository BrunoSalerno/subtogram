var Style = require('./style');
var LinesMapper = require('./lines_mapper');
var PlansMapper = require('./plans_mapper');
var $ = require('jquery');
var Misc = require('./misc');
var Timeline = require('./timeline');
var MouseEvents = require('./mouse_events');
var Info = require('./info');

var App = function(map, styles, years, lines, plans, lengths) {
  var style = new Style(styles);
  var linesMapper = new LinesMapper({map: map, style: style, lines: lines});
  var plansMapper = new PlansMapper({map: map, style: style, plans: plans});
  var timeline = new Timeline(linesMapper, years);
  var mouseEvents = new MouseEvents(map, style, {lines: linesMapper, plans: plansMapper});
  var info = new Info({
    lengths: lengths,
    updateCallback: function() {
      $(window).resize();
    }
  });

  map.on('moveend',function(){
    Misc.saveParams(null,map);
  });

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
      info.update({year: year});
      Misc.saveParams(year, map);
    });

  $('#current-year').change(function(){
      var year = parseInt($(this).val());
      if (year < years.start || year > years.end) return;
      $('#slider').val(year);
      timeline.toYear(year);
      info.update({year: year});
      Misc.saveParams(year, map);
  });

  $('#action').click(function(){
    if (years.current === years.end) return;

    if (timeline.playing) {
      $("#action span").removeClass('fa-pause').addClass('fa-play');
      timeline.stopAnimation(function(year){
        info.update({year: years.end});
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
        info.update({year: years.end});
        Misc.saveParams(years.end, map);
      });
  });

  $('.checkbox-toggle').change(function(){
    var line = $(this).data("line");
    var linesShown = linesMapper.toggleLine(line);
    info.update({lines: linesShown});
    Misc.saveParams(null,null,linesShown);
  });

  $('.checkbox-toggle-plan').change(function(){
    var line = $(this).data("line");
    plansMapper.toggleLine(line, function(linesShown){
      info.update({plans: linesShown});
      Misc.saveParams(null,null,null,linesShown);
    });
  });

  $(window).resize(function(){
    var panelHeaderHeight = $('.panel-header').outerHeight();
    var panelBody = $('.panel-body')
    var parentHeight = panelBody.parent().innerHeight();
    var bottomPadding = 20;
    panelBody.height(parentHeight - panelHeaderHeight - bottomPadding);
  });

  // Init
  var startingYear = years.default || years.start;
  timeline.toYear(startingYear);

  info.update({
    year: startingYear,
    lines: linesMapper.linesShown,
    plans: plansMapper.linesShown
  });

  $(window).resize();

  $('#current-year, #slider').val(startingYear);

  $(".spinner-container").fadeOut();

  $("#panel-toggler").show().click(function(){
    $("#panel").toggle();
  });
}

module.exports = App;
