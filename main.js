(function(){

  var App = function(defaults,data,projects_data,map,years,styles,starting_year,lines_to_show,plans_to_show){
    var self = this;

    this.change_line_to_year = function(year_start,year_end,line){
      if (self.timeline.busy()) return;
      var speed=1;
      self.timeline.get_busy();
      var y = year_start;
      var interval;

      if (year_end > year_start) {
        interval = setInterval(function(){
          if (y > year_end) {
            self.timeline.release();
            clearInterval(interval);
          } else {
            self.timeline.up_to_year(y,line);
          }
          y++;
        },speed);
      } else {
        interval = setInterval(function(){
          if (y < year_end) {
            self.timeline.release();
            clearInterval(interval);
          } else {
            self.timeline.down_to_year(y,line);
          }
          y--;
        },speed);
      }
    };

    this.change_to_year = function(year,speed,from_input){
      if (year > years.end) return;
      if (self.timeline.busy()) return;

      self.timeline.get_busy();

      var interval;
      var y = self.timeline.current_year();

      if (year > self.timeline.current_year()) {
        interval = setInterval(function(){
          if (y > year) {
            save_params(year,null);
            clearInterval(interval);
            self.timeline.release();
          }else{
            self.timeline.up_to_year(y);
            if (!from_input) $('.current-year').val(y);
            self.set_year_maker(y);
          }
          y++;
        }, speed || defaults.speed);
      } else if (year < self.timeline.current_year()){
        interval = setInterval(function(){
          if (y < year) {
            save_params(year,null);
            clearInterval(interval);
            self.timeline.release();
          }else{
            self.timeline.down_to_year(y);
            if (!from_input) $('.current-year').val(y);
            self.set_year_maker(y);
          }
          y--;
        }, speed || defaults.speed);
      } else {
        self.timeline.release();
      }
    };

    this.create_slider = function(years){
      for (var i = years.start; i < (years.end); i += 10){
        var left = (i-years.start)/(years.end-years.start+5)*100;
        var width = 100 / (years.end-years.start+5) * 10;
        var year = $("<div class='vertical_line' style='left:"+ left +"%;width:"+width+"%'>"+
          i +'</div>');

        $('.reference').
          append(year).
          click(function(e){
            var posX = $(this).offset().left;
            var left = (e.pageX - posX) / $(this).width();
            var year = parseInt(left * (years.end - years.start +5) + years.start);
            self.change_to_year(year);}).
          mousemove(function(e){
            var posX = $(this).offset().left;
            var left = (e.pageX - posX) / $(this).width();
            var year = parseInt(left * (years.end - years.start +5) + years.start);
            $('.year-hover').html(year).css({left:left*100+'%'}).fadeIn();
          }).
          mouseleave(function(){
            $('.year-hover').fadeOut();
          })
      }
    };

    this.set_year_maker = function (y){
      var left =(y-years.start)/(years.end-years.start+5)*100;
      $('.year-marker').css('left',left+'%');
    };

    this.planification = new Planification(projects_data,map,styles);
    this.timeline = new Timeline(data,map,years,styles);
    this.create_slider(years);

    // Current year functionality
    // --------------------------
    $('.current-year').
      attr('min',years.start).
      attr('max',years.end).
        change(function(e){
      var new_year = parseInt($(this).val());
      if (new_year < years.start || new_year > years.end){
        $(this).blur();
        $(this).val(years.current);
      } else {
        $(this).blur();
        self.change_to_year(new_year,null,true);
      }
    });

    // Tabs toggle
    // -----------
    $(".tab").click(function(){
      var tab = $(this)[0].classList[1];
      var bottom;

      if ($(".panel-container").css('bottom')=='58px') {
        if (!$(".content."+tab).is(":visible")){
          $(".content").hide();
          $(".tab").not(".tab."+tab).addClass('not-selected');
          $(".tab."+tab).removeClass('not-selected');
          $(".content."+tab).show();
          return;
        }
        bottom = 58 - $(".panel").height() + 'px';
      } else {
        bottom = '58px';
      }
      $(".content").hide();
      $(".tab").not(".tab."+tab).addClass('not-selected');
      $(".tab."+tab).removeClass('not-selected');
      $(".content."+tab).show();
      $('.panel-container').animate({bottom:bottom});
    });

    // layers
    // -------
    if (lines_to_show) {
      this.timeline.set_lines(lines_to_show);
    }

    if (plans_to_show){
      this.planification.set_plans_lines(plans_to_show)
    }

    var lines = this.timeline.lines();
    var lines_str='<ul class="lines">';
    for (var line in lines){
      var checked_str = (lines[line].show) ? 'checked' : '';
      lines_str += '<li><input type="checkbox" id="checkbox_'+line+'" ' + checked_str + '/>' +
        '<label id="label_'+line+
        '" for="checkbox_'+line+'" style="background-color: '+styles.line.opening[line].color+'">' +
        line + '</label></li>';
    }

    var plans = this.planification.plans();
    $.each(plans,function(i,plan){
      lines_str += '<li><div class="plan-label">'+plan.label+'</div></li>';
      for (var line in plan.lines){
        var checked_str = (plan.lines[line].show) ? 'checked' : '';
        lines_str += '<li><input type="checkbox" id="checkbox_'+plan.name.replace(' ','-')+
          '_'+line+'" ' + checked_str + '/>' +
          '<label id="label_'+plan.name.replace(' ','-')+'_'+line +
          '" for="checkbox_'+plan.name.replace(' ','-')+'_'+line +
          '" style="background-color: '+styles.line.project[plan.name][line].color+'">' +
          line + '</label></li>';
      }
    });

    lines_str += '</ul>';

    $(".content.layers").append(lines_str);

    for (var l in this.timeline.lines()){
      $('#label_'+l).click(function(e){
        if (self.timeline.busy()){
          e.preventDefault();
          return;
        }

        var line= $(this).attr('id').split('_')[1];
        var lines_params = self.timeline.toggle_line(line);
        var year_start = (self.timeline.lines()[line].show) ? years.start : self.timeline.current_year();
        var year_end = (self.timeline.lines()[line].show) ? self.timeline.current_year() : years.start;

        self.change_line_to_year(year_start,year_end,line);
        save_params(null,null,lines_params);
      });
    }

    $.each(this.planification.plans(),function(i,p){
      for (l in p.lines){
        $('#label_'+ p.name.replace(' ','-')+'_'+l).click(function(e){
          var checkbox_info = $(this).attr('id').split('_');
          var plans_params = self.planification.toggle(checkbox_info[1].replace('-',' '),checkbox_info[2]);

          save_params(null,null,null,plans_params);
        });
      }
    });

    // Init to the start year
    // ----------------------
    this.timeline.up_to_year(years.start);
    $('.current-year').val(years.start);
    self.set_year_maker(years.start);

    if (starting_year) this.change_to_year(starting_year,1);
  };

  var load_map = function(defaults,callback){
    var options = {
      zoomControl: false,
      attributionControl: false
    };

    var map = L.map('map', options).setView(defaults.coords, defaults.zoom);

    L.tileLayer('https://{s}.tiles.mapbox.com/v4/brunosalerno.mmfg5lpk/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYnJ1bm9zYWxlcm5vIiwiYSI6IlJxeWpheTAifQ.yoZDrB8Hrn4TvSzcVUFHBA').addTo(map)

    L.control.zoom({position:'topright'}).addTo(map);

    map.whenReady(function(){
      if (typeof callback === 'function') callback(map);
    });

    map.on('moveend',function(){
      save_params(null,map);
    });
  };

  var load_data = function(callback){
    var data = {stations:null,lines:null};
    var project_data = {stations:null,lines:null};

    $.getJSON('geojson/estaciones.geojson', function(stations){
      data.stations = stations;
      $.getJSON('geojson/subte.geojson', function(lines){
        data.lines = lines;
        $.getJSON('geojson/projects-lines.geojson',function(p_lines){
          project_data.lines = p_lines;
          $.getJSON('geojson/projects-stations.geojson',function(p_stations){
            project_data.stations = p_stations;
            if (typeof callback == 'function') callback(data,project_data);
          });
        })
      });
    });
  };


  // Styles loader
  var load_styles = function(callback){
    $.getJSON('styles.json', function(json){
      if (typeof callback == 'function') callback(json)
    });
  };

  $(document).ready(function(){
    var defaults = {
      coords : [-34.6050499,-58.4122003],
      zoom   : 13,
      init_year : 1911,
      speed : 50
    };

    var years = {start:1910,end:2015, current:null, previous:null};

    $(".spinner-container").show().addClass('spinner');

    var params = getSearchParameters();

    if (params.coords) {
      defaults.coords = [params.coords.lat,params.coords.lon];
      defaults.zoom = params.coords.z;
    }

    load_map(defaults, function(map){
      load_data(function(data,projects_data){
        load_styles(function(styles){
          window.app = new App(defaults,data,projects_data,map,years,styles,params.year,params.lines,params.plans);
          $(".spinner-container").fadeOut();
          $(".slider").show();
          $(".current-year").fadeIn();
          $(".panel-container").show().css('bottom',58-$(".panel").height()+'px');
        });
      });
    });
  });
})();
