var $ = require('jquery');

var Style = function(styles){
    this._styles = styles;
}

Style.prototype = {
    _styles: null,

    get: function(layerName) {
      var parts = layerName.split('_');
      var type = parts[0];
      var operation = parts[1];

      // Plans use the lines style
      if (operation.indexOf('plan') !== -1) {
        operation = 'opening';
      }

      if (operation === 'hover') {
        return this.hover(type);
      }

      return this.calculate(type, operation);
    },

    calculate: function(type, operation){
        var style;
        var colorCategory = type === 'sections' ? 'line-color' : 'circle-color';
        var styleCategory = type === 'sections' ? 'line' : 'station';

        if (operation == 'opening'){
          style = $.extend(true, {}, this._styles[styleCategory][operation]);

          if (type === 'sections') {
            style = $.extend(true, style, this._styles[styleCategory][operation].default);
          }

          var stops = [];

          for (var l in this._styles.line[operation]){
            delete style[l];
            if (l !== 'default'){
              stops.push([l, this.lineColor(l)]);
            }
          }

          style[colorCategory] = {
            type: "categorical",
            property : "line",
            stops : stops
          }
        } else if (operation === 'buildstart'){
          style = $.extend(true,{},this._styles[styleCategory][operation]);
          style[colorCategory] = style["color"];
        } else if (operation === 'inner') {
          style = $.extend(true, {}, this._styles[styleCategory]['buildstart']);
          style["circle-color"] = style["fillColor"];
          style["circle-radius"] = style["circle-radius"] - 3;
        }

        if (type !== 'sections') {
          delete style["line-width"];
        }

        delete style["labelFontColor"];
        delete style["fillColor"];
        delete style["color"];

        return style;
    },
    hover: function(type){
        var str_type = (type == 'stations')? 'station' : 'line';
        return this._styles[str_type]["hover"];
    },
    lineColor: function(line){
        return this._styles.line.opening[line].color;
    },
    lineLabelFontColor: function(line){
        return this._styles.line.opening[line].labelFontColor;
    }

}

module.exports = Style;
