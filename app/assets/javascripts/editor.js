var $ = require('jquery');
var MapboxDraw = require('mapbox-gl-draw');

var Editor = function(map, sections, stations) {
  this.map = map;

  var options = {
    boxSelect: false,
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
      $("#feature-properties").html('');
      return;
    }
    var feature = selection.features[0];
    var header = feature.properties.klass + ' ' + feature.properties.id;
    $("#feature-header").html(header);
    self.showFeatureProperties(feature.properties);
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
  },

  showFeatureProperties: function(properties) {
    var fields = [];
    for (var prop in properties) {
      var disabled = (['id', 'length', 'klass', 'buildstart_end', 'line_url_name'].indexOf(prop) !== -1) ? 'disabled' : '';
      // FIXME: replace line with dropdown
      var str = '<div class="o-form-element">';
      str += '<label class="c-label" for="nickname">' + prop + '</label>';
      str += '<input id="' + prop + '" value="' + properties[prop] + '" class="c-field u-small" ' + disabled + ' >';
      str += '</div>';
      fields.push(str);
    }
    $("#feature-properties").html(fields.join(''));
  }
}

module.exports = Editor;
