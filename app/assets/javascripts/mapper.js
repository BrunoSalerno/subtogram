var Mapper = function(args){
  args = args || {};
  this.map = args.map;
  this.style = args.style;

  this.linesShown = [];
  this.currentHoverId = {sections: ['none'], stations: ['none']};

  this.addLayers();
};

Mapper.prototype = {
  map: null,
  style: null,

  layers: null,

  _addSource: function(type) {
    var sourceName = type + '_source';

    if (this.map.getSource(sourceName)) {
      return sourceName;
    }

    this.map.addSource(sourceName, {
      type: 'geojson',
      data: '/api' + location.pathname + '/source/' + type
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
      paint: this.style.get(layerName)
    };

    this.map.addLayer(layer);
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

  filter: null
}

module.exports = Mapper;
