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
    if (!selection.features.length) {
      $("#feature-header").html('Ningún elemento seleccionado');
      $("#feature-properties").html('');
      return;
    }
    var feature = selection.features[0];
    var header = feature.properties.klass + ' ' + feature.properties.id;
    $("#feature-header").html(header);
    self.setFeatureForm(feature);
  });

  this.map.on('draw.update', function(update) {
    update.features.forEach(function(feature) {
      self.modifiedFeaturesGeometries[feature.id] = feature;
    });
    console.log('modified geometries', self.modifiedFeaturesGeometries);
  });

  $(window).resize(function(){
    self.updateLayout();
  });

  $("#panel-toggler").show().click(function(){
    $("#panel").toggle();
  });

  $(".spinner-container").fadeOut();
}

Editor.prototype = {
  map: null,
  draw: null,

  modifiedFeaturesProperties: {},
  modifiedFeaturesGeometries: {},
  addedFeatures: {},
  deletedFeatures: {},

  addFeatures: function(features) {
    this.draw.add(features);
  },

  setFeatureForm: function(feature) {
    var properties = feature.properties;
    var fields = [];
    var self = this;

    for (var prop in properties) {
      var disabled = (['id', 'length', 'klass', 'buildstart_end', 'line_url_name'].indexOf(prop) !== -1) ? 'disabled' : '';

      // FIXME: replace 'line' attribute with dropdown
      var str = '<div id="feature-properties-form" class="o-form-element">';
      str += '<label class="c-label" for="' + prop + '">' + prop + '</label>';
      str += '<input id="' + prop + '" value="' + properties[prop] + '" class="c-field u-small" data-property="' + prop + '" ' + disabled + ' >';
      str += '</div>';
      fields.push(str);
    }

    $("#feature-properties").html(fields.join(''));

    $("#feature-properties-form input").change(function(){
      var prop = $(this).data('property');
      var value = $(this).val();
      properties[prop] = value;
      self.draw.setFeatureProperty(feature.id, prop, value);
      self.modifiedFeaturesProperties[feature.id] = feature;
      console.log('modified properties', self.modifiedFeaturesProperties);
    });

    this.updateLayout();
  },

  updateLayout: function() {
    var panelHeaderHeight = $('.panel-header').outerHeight();
    var panelBody = $('.panel-body')
    var parentHeight = panelBody.parent().innerHeight();
    var bottomPadding = 20;
    panelBody.height(parentHeight - panelHeaderHeight - bottomPadding);
  }
}

module.exports = Editor;
