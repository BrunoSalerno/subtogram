var Subtogram = function(args){
  args = args || {};
  this.map = args.map;
  this.style = args.style;
  this.addLayers();
};

Subtogram.prototype = {
  map: null,

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

  filterYear: function(year) {
    var self = this;
    ['sections', 'stations'].forEach(function(type){
      for (var k in self.layers[type]) {
        var layer = self.layers[type][k];

        if (layer.indexOf('hover') === -1 || layer.indexOf('buildstart') === -1) {
          var filter = [
            "all",
            [">=", "opening", year],
            ["<", "closure", year],
          ];

          self.map.setFilter(layer, filter);
        }
      }
    });
  }
}

module.exports = Subtogram;
