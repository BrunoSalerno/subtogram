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
    var header = feature.properties.klass + ' ID: ' + feature.properties.id;
    $("#feature-header").html(header);
    self.setFeatureForm(feature);
  });

  this.map.on('draw.update', function(update) {
    update.features.forEach(function(feature) {
      if (self.modifiedFeaturesGeometries.indexOf(feature.id) === -1) self.modifiedFeaturesGeometries.push(feature.id);
      self.setModifications();
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

  modifiedFeaturesProperties: [],
  modifiedFeaturesGeometries: [],
  addedFeatures: [],
  deletedFeatures: [],

  addFeatures: function(features) {
    this.draw.add(features);
  },

  setFeatureForm: function(feature) {
    var properties = feature.properties;
    var fields = [];
    var self = this;

    for (var prop in properties) {
      if (['id', 'klass', 'buildstart_end'].indexOf(prop) !== -1) continue;

      var disabled = (['length', 'line_url_name'].indexOf(prop) !== -1) ? 'disabled' : '';

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
      if (self.modifiedFeaturesProperties.indexOf(feature.id) === -1) self.modifiedFeaturesProperties.push(feature.id);
      self.setModifications();
      console.log('modified properties', self.modifiedFeaturesProperties);
    });

    this.updateLayout();
  },

  setModifications: function() {
    var modifications = {};
    var self = this;
    this.modifiedFeaturesGeometries.forEach(function(id) {
      var type;
      if (self.modifiedFeaturesProperties.indexOf(id) !== -1) {
        type = "Geometría y Propiedades";
      } else {
        type = "Geometría";
      }
      var feature = self.draw.get(id);
      modifications[id] = "[" + type +"] " + feature.properties.klass + ' ID: ' + feature.properties.id;
    });

    this.modifiedFeaturesProperties.forEach(function(id) {
      if (!modifications[id]) {
        var feature = self.draw.get(id);
        modifications[id] = "[Propiedades] " + feature.properties.klass + ' ID: ' + feature.properties.id;
      }
    })

    var modificationsArray = [];
    for (var k in modifications) {
      modificationsArray.push('<p class="c-paragraph">' + modifications[k] + '</p>');
    }

    if (!modificationsArray.length) {
      $("#modifications-header").html("Ningún elemento modificado");
      $("#modifications").html("");
      return;
    };
    $("#modifications-header").html(modificationsArray.length + ' elementos modificados');
    $("#modifications").html(modificationsArray.join(''));
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
