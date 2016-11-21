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
