var Subtogram = function(args){
  args = args || {};
  this.map = args.map;
};

Subtogram.prototype = {
  map: null,

  layers: {
    sections: {
      BUILDSTART: 'sections_buildstart',
      OPENGING: 'sections_openging',
      HOVER: 'sections_hover'
    },
    stations: {
      BUILDSTART: 'stations_buildstart',
      OPENGING: 'stations_openging',
      HOVER: 'stations_hover',
      INNER_LAYER: 'stations_inner_layer'
    }
  },

  _addSource: function(type) {
    var sourceName = type + '_source';
    // addSource, with the url directly to de server (new api endpoint)
    return sourceName;
  },

  addLayers: function() {
    var self = this;
    ['sections', 'stations'].forEach(function(type){
      for (var k in this.layers[type]) {
        var sourceName = _addSource(type);
        var featureType = type === 'sections' ? 'line' : 'circle';
        self._addLayer(sourceName, this.layers[type][k], featureType);
      }
    });
  },

  _addLayer: function(sourceName, layerName, featureType) {
    var layer = {
      id: layerName,
      source: sourceName,
      type: featureType,
      interactive: true,
      paint: this.style(layerName)
    };

    this.map.addLayer(layer);
  },

  style: function(layerName) {
    //return style;
  },

  filter: function(year) {
    // setFilter on layers
  }
}

// Outisde here, in the index file, this class should be instantiated:
// - Subtogram
// - A Timeline class that requires as parameter Subtogram
// - MouseEvents class that also requires Subtogram (or subtogram layers);
// And in index there should be the jQuery and the interactions
