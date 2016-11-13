var Subtogram = require('./subtogram');

var SubtogramLines = function(args){
  Subtogram.call(this, args);

  for (var line in args.lines) {
    if (args.lines[line].show) this.linesShown.push(line);
  };
};

SubtogramLines.prototype = Object.create(Subtogram.prototype);

SubtogramLines.prototype.layers = {
  sections: {
    BUILDSTART: 'sections_buildstart',
    OPENGING: 'sections_opening',
    HOVER: 'sections_hover'
  },
  stations: {
    BUILDSTART: 'stations_buildstart',
    OPENGING: 'stations_opening',
    HOVER: 'stations_hover',
    INNER_LAYER: 'stations_inner_layer'
  }
};

SubtogramLines.prototype.filter = function() {
  var self = this;

  var hoverId = this.currentHoverId;
  var year = this.currentYear;

  ['sections', 'stations'].forEach(function(type){
    for (var k in self.layers[type]) {
      var layer = self.layers[type][k];
      var filter;

      if (layer.indexOf('hover') !== -1){
        var ids = ["in", "id"].concat(hoverId[type]);
        filter = ["all", ids];
      } else if (layer.indexOf('buildstart') !== -1) {
        filter = [
          "all",
          ["<=", "buildstart", year],
          [">", "buildstart_end", year],
        ];
      } else if (layer.indexOf('opening') !== -1){
        filter = [
          "all",
          ["<=", "opening", year],
          [">", "closure", year],
        ];
      } else if (layer.indexOf('inner') !== -1){
        filter = [
          "all",
          ["<=", "buildstart", year],
          [">", "closure", year],
        ];
      }

      if (self.linesShown) {
        var linesShownFilter = ["in", "line"].concat(self.linesShown);
        filter.push(linesShownFilter);
      }

      if (filter) self.map.setFilter(layer, filter);
    }
  });
}

SubtogramLines.prototype.currentYear = null;

SubtogramLines.prototype.setYear = function(year) {
  this.currentYear = year;
  this.filter();
};

module.exports = SubtogramLines;
