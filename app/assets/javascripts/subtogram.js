var Subtogram = function(map, style, lines){
  this.map = map;
  this.style = style;
  this.addLayers();

  for (var line in lines) {
    if (lines[line].show) this.linesShown.push(line);
  };
};

Subtogram.prototype = {
  map: null,
  style: null,

  currentHoverId: {sections: ['none'], stations: ['none']},
  currentYear: null,
  linesShown: [],

  layers: {
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
  },

  _addSource: function(type) {
    var sourceName = type + '_source';

    if (this.map.getSource(sourceName)) {
      return sourceName;
    }

    this.map.addSource(sourceName, {
      type: 'geojson',
      data: '/api/source/' + type
    });

    return sourceName;
  },

  addLayers: function() {
    var self = this;
    ['sections', 'stations'].forEach(function(type){
      for (var k in self.layers[type]) {
        var sourceName = self._addSource(type);
        var featureType = type === 'sections' ? 'line' : 'circle';
        var layer = self.layers[type][k];
        self._addLayer(sourceName, layer, featureType);
      }
    });
  },

  _addLayer: function(sourceName, layerName, featureType) {
    var layer = {
      id: layerName,
      source: sourceName,
      type: featureType,
      interactive: true,
      paint: this.style.get(layerName)
    };

    this.map.addLayer(layer);
  },

  setYear: function(year) {
    this.currentYear = year;
    this.filter();
  },

  setHoverIds: function(type, ids) {
    if ((ids && this.currentHoverId[type] == ids) ||
        (!ids && this.currentHoverId[type] == ['none'])) return;

    if (!ids) {
      this.currentHoverId[type] = ['none'];
    } else {
      this.currentHoverId[type] = ids;
    }
    this.filter();
  },

  toggleLine: function(line, callback) {
    var index = this.linesShown.indexOf(line);
    if (index === -1) {
      this.linesShown.push(line);
    } else {
      this.linesShown.splice(index, 1);
    }
    this.filter();
    return this.linesShown;
  },

  filter: function() {
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
  },
}

module.exports = Subtogram;
