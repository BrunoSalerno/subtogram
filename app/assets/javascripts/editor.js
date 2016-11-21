var $ = require('jquery');
var MapboxDraw = require('mapbox-gl-draw');

var Editor = function(map, sections, stations) {
  this.map = map;

  var options = {
    displayControlsDefault: false,
    controls: {
      point: true,
      line_string: true,
      trash: true
    }
  }

  this.draw = new MapboxDraw(options);
  this.map.addControl(this.draw)

  var self = this;
  [sections, stations].forEach(function(features) {
    self.addFeatures(features);
  });

  this.map.on('draw.selectionchange', function(selection) {
    console.log(selection);
    if (!selection.features.length) {
      $("#feature-header").html('Ningún elemento seleccionado');
      $("#feature-properties").val('');
      return;
    }
    // FIXME: don't allow to select multiple features
    var feature = selection.features[0];
    var header = feature.properties.klass + ' ' + feature.properties.id;
    $("#feature-header").html(header);
    $("#feature-properties").val(JSON.stringify(feature.properties, null, 2));
  });

  $("#panel-toggler").show().click(function(){
    $("#panel").toggle();
  });

  $(".spinner-container").fadeOut();
}

Editor.prototype = {
  map: null,
  draw: null,

  addFeatures: function(features) {
    this.draw.add(features);
  }
}

module.exports = Editor;
