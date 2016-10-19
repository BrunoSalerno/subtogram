/*
 Taken from http://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript
 weltraumpirat answer
 */
var Misc = {
  getSearchParameters: function() {
    var prmstr = decodeURIComponent(window.location.search.substr(1));
    return prmstr != null && prmstr != "" ? this.transformToAssocArray(prmstr) : {};
  },

  transformToAssocArray: function(prmstr) {
    var params = {};
    var prmarr = prmstr.split("&");
    for ( var i = 0; i < prmarr.length; i++) {
      var tmparr = prmarr[i].split("=");
      params[tmparr[0]] = tmparr[1];
    }
    return params;
  },

  saveParams: function(year,map,lines,plans){
    var current_params = this.getSearchParameters();

    var url=location.pathname+'?';
    year = (year)? year : current_params.year;
    if (year) url += 'year=' + year;

    if (map){
      var center = map.getCenter();
      url += '&geo=' + center.lat.toFixed(6) + ',' + center.lng.toFixed(6) + ',' + map.getZoom().toFixed(2) + ',' + map.getBearing().toFixed(2) + ',' + map.getPitch().toFixed(2);
    } else if (current_params.geo) {
      url += '&geo=' + current_params.geo;
    }

    if (lines){
      url += '&lines=' + (lines.join(',') || 0)
    } else if (current_params.lines){
      url += '&lines=' + current_params.lines;
    }

    if (plans){
      url += '&plans=' + (plans.join(',') || 0)
    } else if (current_params.plans){
      url += '&plans=' + current_params.plans;
    }

    history.pushState(document.title + ' ' + year ,document.title,url);
  },

  round(number){
      return Number(number.toFixed(2));
  }
}

module.exports = Misc;
