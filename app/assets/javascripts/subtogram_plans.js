var $ = require('jquery');
var Subtogram = require('./subtogram');

var SubtogramPlans = function(args) {
  // Super
  Subtogram.call(this, args);

  var self = this;

  for (var plan in args.plans) {
    args.plans[plan].lines.forEach(function(line){
      if (line.show) self.linesShown.push(line.parent_url_name);
    });
  }

  this.addLinesToSource(this.linesShown);
};

SubtogramPlans.prototype = Object.create(Subtogram.prototype);

SubtogramPlans.prototype.layers = {
  sections: {
    PLANS: 'sections_plans'
  },
  stations: {
    PLANS: 'stations_plans',
    INNER_LAYER: 'stations_inner_layer_plans'
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

/*
 * @param {string[]} lines
 * @callback callback
 */
SubtogramPlans.prototype.addLinesToSource =  function(lines, callback) {
  this.alreadyLoadedLines = this.alreadyLoadedLines.concat(lines);

  var url = '/api' + location.pathname + '/plan/?plan_lines=' + lines.join(',');

  var self = this;
  $.get(url, function(response){
    var json = JSON.parse(response)
    var lineFeatures = [];
    var stationFeatures = [];

    json.forEach(function(o){
      lineFeatures.push(o.line);
      stationFeatures = stationFeatures.concat(o.stations);
    });

    self._updateSource('sections_plans_source', lineFeatures);
    self._updateSource('stations_plans_source', stationFeatures)
    if (typeof callback === 'function') callback();
  });
}

/*
 * @param {string} line
 * @callback callback
 */
SubtogramPlans.prototype.addLineToSourceIfNeeded = function(line, callback) {
  if (this.alreadyLoadedLines.indexOf(line) !== -1) {
    if (typeof callback === 'function') callback();
    return;
  }
  this.addLinesToSource([line], function(){
    if (typeof callback === 'function') callback();
  });
}

SubtogramPlans.prototype._updateSource = function(name, feature) {
  var source = this.map.getSource(name);
  var features = (source._data.features || []).concat(feature);
  source.setData(this._sourceData(features));
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
