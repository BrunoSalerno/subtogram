var $ = require('jquery');
var Subtogram = require('./subtogram');

var SubtogramPlans = function(args) {
  // Super
  Subtogram.call(this, args);

  // TODO: load args.plans
};

SubtogramPlans.prototype = Object.create(Subtogram.prototype);

SubtogramPlans.prototype.layers = {
  sections: {
    PLANS: 'sections_plans'
  },
  stations: {
    PLANS: 'stations_plans'
  }
};

SubtogramPlans.prototype.alreadyLoadedLines = [];

// We override this method
SubtogramPlans.prototype._addSource = function(type) {
  var sourceName = type + '_plans_source';

  if (this.map.getSource(sourceName)) {
    return sourceName;
  }

  this.map.addSource(sourceName, {
    type: 'geojson',
    data:  this._sourceData()
  });

  return sourceName;
};

SubtogramPlans.prototype._sourceData = function(features) {
  features = features || [];
  return {
      type: "FeatureCollection",
      features: features
    }
}

SubtogramPlans.prototype.addLineToSourceIfNeeded = function(line, callback) {
  if (this.alreadyLoadedLines.indexOf(line) !== -1) {
    if (typeof callback === 'function') callback();
    return;
  }

  this.alreadyLoadedLines.push(line);

  var lineParts = line.split('_');
  var planName = lineParts[0];
  var lineName = lineParts[1];

  var url = '/api' + location.pathname + '/plan/' + planName + '/' + lineName;
  //FIXME: the API should allow to fetch multiple lines with the same request
  var self = this;
  $.get(url, function(response){
    var json = JSON.parse(response); // This doesn't work because the GET returns an array
    self._updateSource('sections_plans_source', [json.line]);
    self._updateSource('stations_plans_source', json.stations)
    if (typeof callback === 'function') callback();
  });
}

SubtogramPlans.prototype._updateSource = function(name, feature) {
  var source = this.map.getSource(name);
  var features = (source._data.features || []).concat(feature);
  source.setData(name, this._sourceData(features));
}

SubtogramPlans.prototype.toggleLine = function(line, callback) {
  var self = this;
  this.addLineToSourceIfNeeded(line, function(){
    // Super
    Subtogram.prototype.toggleLine.apply(self, [line, callback]);
  });
}

SubtogramPlans.prototype.filter = function() {
  //TODO
}

module.exports = SubtogramPlans;
