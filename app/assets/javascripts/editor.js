var $ = require('jquery');
var MapboxDraw = require('mapbox-gl-draw');

var Editor = function(map, sections, stations, lines, style) {
  this.map = map;
  this.lines = lines;
  this.style = style;

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
      self.unselectAll();
      return;
    }

    var feature = selection.features[0];
    var header = feature.properties.klass;
    if (feature.properties.id) {
      header += ' <code class="c-code">Id: ' + feature.properties.id + '</code>';
    } else {
      header = 'Nueva ' + header;
    }

    $("#feature-header").html(header);
    self.setFeatureForm(feature);
  });

  this.map.on('draw.update', function(update) {
    update.features.forEach(function(feature) {
      if (self.modifiedFeaturesGeometries.indexOf(feature.id) === -1 && self.newFeatures.indexOf(feature.id) === -1) {
        self.modifiedFeaturesGeometries.push(feature.id);
      }
      self.setModifications();
    });
    console.log('modified geometries', self.modifiedFeaturesGeometries);
  });

  this.map.on('draw.create', function(data){
    data.features.forEach(function(feature){
      var klass = feature.geometry.type === 'Point' ? 'Station' : 'Section';

      self.draw.setFeatureProperty(feature.id, 'klass', klass);
      // FIXME: set line_url_name and line
      if (klass === 'Station') {
        self.draw.setFeatureProperty(feature.id, 'name', 'Nueva ' + klass);
      }
      self.draw.setFeatureProperty(feature.id, 'buildstart', null);
      self.draw.setFeatureProperty(feature.id, 'opening', null);
      self.draw.setFeatureProperty(feature.id, 'closure', 999999);

      self.newFeatures.push(feature.id);
      self.setModifications();
    })
  });

  this.map.on('draw.delete', function(data) {
    data.features.forEach(function(feature) {
      var addToList = true;

      var newFeatureIndex = self.newFeatures.indexOf(feature.id);
      if (newFeatureIndex !== -1) {
        self.newFeatures.splice(newFeatureIndex,1);
        addToList = false;
      }

      var modifiedPropertiesIndex = self.modifiedFeaturesProperties.indexOf(feature.id);
      if (modifiedPropertiesIndex !== -1) {
        self.modifiedFeaturesProperties.splice(modifiedPropertiesIndex, 1);
      }

      var modifiedGeometryIndex = self.modifiedFeaturesGeometries.indexOf(feature.id);
      if (modifiedGeometryIndex !== -1) {
        self.modifiedFeaturesGeometries.splice(modifiedGeometryIndex, 1);
      }

      if (addToList) self.deletedFeatures[feature.id] = feature;
      self.setModifications();
      self.unselectAll();
    });
  });

  $("#edit-elements").click(function(){
    $("#edit-lines").removeClass("c-button--active");
    $(this).addClass("c-button--active");
    $("#panel").removeClass("panel-full-width");
    $(".editor-cards-container .c-card[id!='edit-lines-card']").show();
    $(".editor-cards-container .c-card#edit-lines-card").hide();
    self.updateLayout();
  });

  $("#edit-lines").click(function(){
    $("#edit-elements").removeClass("c-button--active");
    $(this).addClass("c-button--active");
    $("#panel").addClass("panel-full-width");
    $(".editor-cards-container .c-card[id!='edit-lines-card']").hide();
    $(".editor-cards-container .c-card#edit-lines-card").show();
    $(".editor-cards-container .c-card#edit-lines-card .c-paragraph").html(self.linesForm());
    self.updateLayout();
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
  newFeatures: [],
  deletedFeatures: {},

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
      self.draw.setFeatureProperty(feature.id, prop, value);
      if (self.modifiedFeaturesProperties.indexOf(feature.id) === -1 && self.newFeatures.indexOf(feature.id) === -1) {
        self.modifiedFeaturesProperties.push(feature.id);
      }
      self.setModifications();
      console.log('modified properties', self.modifiedFeaturesProperties);
    });

    this.updateLayout();
  },

  setModifications: function() {
    var modifications = [];
    var self = this;
    this.modifiedFeaturesGeometries.forEach(function(id) {
      var type = '<span class="c-badge">Geometría</span>';
      if (self.modifiedFeaturesProperties.indexOf(id) !== -1) {
        type += ' <span class="c-badge">Propiedades</span>';
      }
      var feature = self.draw.get(id);
      modifications.push(feature.properties.klass + ' <code class="c-code">Id: ' + feature.properties.id + '</code> ' + type);
    });

    this.modifiedFeaturesProperties.forEach(function(id) {
      if (self.modifiedFeaturesGeometries.indexOf(id) === -1) {
        var feature = self.draw.get(id);
        modifications.push(feature.properties.klass + ' <code class="c-code">Id: ' + feature.properties.id + '</code> <span class="c-badge">Propiedades</span>');
      }
    });

    this.newFeatures.forEach(function(id) {
      var feature = self.draw.get(id);
      modifications.push(feature.properties.klass + ' <span class="c-badge c-badge--success">Nuevo</span>');
    });

    for (var id in this.deletedFeatures) {
      var deletedFeature = this.deletedFeatures[id];
      modifications.push(deletedFeature.properties.klass + ' <code class="c-code">Id: ' + deletedFeature.properties.id + '</code> <span class="c-badge c-badge--error">Eliminado</span>');
    };

    modifications.forEach(function(modif,i) {
      modifications[i] = '<p class="c-paragraph">' + modif + '</p>';
    })

    if (!modifications.length) {
      $("#modifications-header").html("Ningún elemento modificado");
      $("#modifications").html("");
      return;
    };
    $("#modifications-header").html(modifications.length + ' elementos modificados');
    $("#modifications").html(modifications.join(''));
  },

  unselectAll: function() {
    $("#feature-header").html('Ningún elemento seleccionado');
    $("#feature-properties").html('');
  },

  updateLayout: function() {
    var panelHeaderHeight = $('.panel-header').outerHeight();
    var panelBody = $('.panel-body')
    var parentHeight = panelBody.parent().innerHeight();
    var bottomPadding = 20;
    panelBody.height(parentHeight - panelHeaderHeight - bottomPadding);
  },

  linesForm: function() {
    var els = '<div class="o-fieldset">';
    var self = this;

    els += '<div class="o-form-element">';
    els += '<label class="c-label">Default</label>';
    var lineStyle = JSON.stringify(self.style.line.opening.default, undefined, 2);
    els += '<div class="c-field line-code" contentEditable>' + lineStyle + '</div>';
    els += '</div>';

    this.lines.forEach(function(line) {
      els += '<div class="o-form-element">';
      els += '<label class="c-label">Línea ' + line.name + '</label>';
      var lineStyle = JSON.stringify(self.style.line.opening[line.url_name], undefined, 2);
      els += '<div class="c-field line-code" contentEditable>' + lineStyle + '</div>';
      els += '</div>';
    });
    els += '</fieldset>';
    return els;
  }
}

module.exports = Editor;
