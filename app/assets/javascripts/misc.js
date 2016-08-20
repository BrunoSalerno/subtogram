/*
 Taken from http://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript
 weltraumpirat answer
 */

function getSearchParameters() {
  var prmstr = decodeURIComponent(window.location.search.substr(1));
  return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
}

function transformToAssocArray( prmstr ) {
  var params = {};
  var prmarr = prmstr.split("&");
  for ( var i = 0; i < prmarr.length; i++) {
    var tmparr = prmarr[i].split("=");
    params[tmparr[0]] = tmparr[1];
  }
  return params;
}


function save_params(year,map,lines,plans){
  var current_params = getSearchParameters();

  var url=location.pathname+'?';
  year = (year)? year : current_params.year;
  if (year) url += 'year=' + year;

  if (map){
    var center = map.getCenter();
    url += '&geo=' + center.lat.toFixed(6) + ',' + center.lng.toFixed(6) + ',' + map.getZoom().toFixed(2) + ',' + map.getBearing().toFixed(2);
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
}

function round(number){
    return Number(number.toFixed(2));    
}
