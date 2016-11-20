var $ = require('jquery');
var MapboxDraw = require('mapbox-gl-draw');

var Editor = function(map) {
  var options = {
    displayControlsDefault: false,
    controls: {
      point: true,
      line_string: true,
      trash: true
    }
  }
  var Draw = new MapboxDraw(options);
  map.addControl(Draw)

  $(".spinner-container").fadeOut();
}

module.exports = Editor;
