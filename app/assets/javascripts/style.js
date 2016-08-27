var Style = function(styles){
    this.__styles = styles;    
}

Style.prototype = {
    STATION_INNER_LAYER: 'station_inner',
    
    __styles: null,
    cache: {},
    cacheKey: function(type,operation,line,opts){
        if (opts.source_name == this.STATION_INNER_LAYER)
            return opts.source_name;

        var key = type + '-' + operation;

        return key;    
    },
    calculate: function(type,operation,line,opts){
        opts = opts || {};

        var cachedStyleKey = this.cacheKey(type,operation,line,opts);
        var cachedStyle = this.cache[cachedStyleKey];
        if (cachedStyle) return cachedStyle;
    
        var style;
            var colorCategory = type === 'sections' ? 'line-color' : 'circle-color';
            var styleCategory = type === 'sections' ? 'line' : 'station';

            if (operation == 'opening'){
              style = $.extend(true, {}, this.__styles[styleCategory][operation]);

              if (type === 'sections') {
                style = $.extend(true, style, this.__styles[styleCategory][operation].default);
              }

              var stops = [];
              
              for (var l in this.__styles.line[operation]){
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
            } else {
              style = $.extend(true,{},this.__styles[styleCategory][operation]);
              style[colorCategory] = style["color"];
            }
            
            if (type === 'stations') {
                if (opts.source_name == this.STATION_INNER_LAYER) {
                    style["circle-color"] = style["fillColor"];
                    style["circle-radius"] = style["circle-radius"] - 3;
                }
                delete style["line-width"];
            }

        delete style["labelFontColor"];    
        delete style["fillColor"];
        delete style["color"];

        this.cache[cachedStyleKey] = style;

        return style;
    },
    hover: function(type){
        var str_type = (type == 'stations')? 'station' : 'line';
        return this.__styles[str_type]["hover"]; 
    },
    lineColor: function(line){
        return this.__styles.line.opening[line].color; 
    },
    lineLabelFontColor: function(line){
        return this.__styles.line.opening[line].labelFontColor;
    }
    
}
