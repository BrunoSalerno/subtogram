var Misc = require('./misc');
var MouseEvents = require('./mouse_events');
var Plan = require('./plan');
var Planification = require('./planification');
var LayerUpdate = require('./render_helpers').LayerUpdate;
var RenderUpdates = require('./render_helpers').RenderUpdates;
var Section = require('./section');
var Style = require('./style');
var Timeline = require('./timeline');

var App = function(config,lines,linesData,plansData,map,styles,callback){
    this.interval = null;
    var self = this;
    this.years = config.years;

    this.change_line_to_year = function(year_start,year_end,line,callback){
      if (self.timeline.busy) return;
      self.timeline.getBusy();

      if (year_end > year_start) {
        self.timeline.up_to_year(year_start,year_end,[line]);
        self.timeline.release();
      } else {
        self.timeline.down_to_year(year_start,year_end,[line]);
        self.timeline.release();
      }
    };

    this.change_to_year = function(year,speed,from_input,callback){
      if (year > self.years.end) return;
      if (self.timeline.busy) return;
      
      self.timeline.getBusy();

      var old_year = self.timeline.current_year();
      
      if (year > self.timeline.current_year()) {
        if (speed == 0){
            self.timeline.up_to_year(old_year,year);
            self.timeline.set_year(year);
            self.set_year_marker(year);
            self.set_current_year_info(year);
            self.timeline.release(); 
            if (typeof callback == 'function') callback(true);
            return;
        }
        var y = self.timeline.current_year()+1;
        self.interval = setInterval(function(){
          if (y > year) {
            Misc.saveParams(year);
            clearInterval(self.interval);
            self.timeline.release();
            if (typeof callback == 'function') callback(true);
          }else{
            self.timeline.up_to_year(old_year,y);
            self.timeline.set_year(y);
            if (!from_input) self.set_current_year_info(y); 
            self.set_year_marker(y);
          }
          old_year = y;
          y++;
        }, speed || config.speed);
      } else if (year < self.timeline.current_year()){
        if (speed == 0){
            self.timeline.down_to_year(old_year,year);
            self.timeline.set_year(year);
            self.set_year_marker(year);
            self.set_current_year_info(year); 
            self.timeline.release();
            if (typeof callback == 'function') callback(true);
            return;
        }
        var y = self.timeline.current_year();
        self.interval = setInterval(function(){
          if (y < year) {
            Misc.saveParams(year);
            clearInterval(self.interval);
            self.timeline.release();
            if (typeof callback == 'function') callback(true);
          }else{
            self.timeline.down_to_year(old_year,y);
            self.timeline.set_year(y);
            if (!from_input) self.set_current_year_info(y);
            self.set_year_marker(y);
          }
          old_year = y;
          y--;
        }, speed || config.speed);
      } else {
        self.timeline.release();
        if (typeof callback == 'function') callback(false);
      }
    };


    $('#slider')
      .attr('min',self.years.start)
      .attr('max',self.years.end)
      .click(function(e){
        var year = parseInt($(this).val());
        self.action_button_is_playing();
        self.change_to_year(year,0,true,function(){
          mic.saveParams(year);
          self.set_current_year_info();
          self.action_button_is_paused();
        });
      });

    this.action_button_is_playing = function(){
      $('#action span').removeClass('fa-play').addClass('fa-pause');
    };

    this.action_button_is_paused = function(){
      $('#action span').removeClass('fa-pause').addClass('fa-play');
    };

    this.set_year_marker = function(y){
      $('#slider').val(y);
    };

    this.play = function(){
      self.action_button_is_playing();
      self.change_to_year(self.years.end,null,false,function(){
        self.action_button_is_paused();
      });
    };

    this.pause = function(){
      self.action_button_is_paused();
      clearInterval(self.interval);
      self.timeline.release();
      self.set_current_year_info(self.timeline.current_year());
      Misc.saveParams(self.timeline.current_year());
    };

    this.set_current_year_info = function(year){
        if (year) $('#current-year').val(year);
        var y_i = self.timeline.year_information();
        var kmTotal = round(y_i.km_operating + self.planification.current_km());

        kmTotal ? $("#km-total").show() : $("#km-total").hide();
        y_i.km_operating ? $("#km-operating").show() : $("#km-operating").hide();
        y_i.km_under_construction ? $("#km-under-construction").show() : $("#km-under-construction").hide();

        $("#km-total").html('Total: ' + kmTotal + 'km');
        $("#km-operating").html('Operativos: ' + y_i.km_operating + 'km');
        $("#km-under-construction").html('En construcción: ' + y_i.km_under_construction + 'km');
    };
    
    this.style = new Style(styles);
    this.planification = new Planification(plansData,map,this.style);
    this.timeline = new Timeline(lines,linesData,map,this.years,this.style);

    // Current year functionality
    // --------------------------
    $('#current-year').
      attr('min',self.years.start).
      attr('max',self.years.end).
        change(function(e){
      var new_year = parseInt($(this).val());
      if (new_year < self.years.start || new_year > self.years.end){
        $(this).blur();
        $(this).val(self.years.current);
      } else {
        $(this).blur();
        self.action_button_is_playing();
        self.change_to_year(new_year,null,true,function(){
          self.set_current_year_info();
          self.action_button_is_paused();
        });
      }
    });


    // Play/Pause
    // ----------
    $('#action').click(function(){
      if ($('#action span').hasClass('fa-play')){
        self.play();
      } else {
        self.pause();
      }
    });

    // Panel toggle
    $("#panel-toggler").show().click(function(){
        $("#panel").toggle();
    })

    // Hover & Popup
    //--------------
    self.mouse_events = new MouseEvents(map,self.style);
    
    // Init to the start year
    // ----------------------
    self.timeline.up_to_year(this.years.start);
    self.timeline.set_year(this.years.start);
    self.set_current_year_info(this.years.start);
    self.set_year_marker(this.years.start);

    if (config.years.default) {
        this.change_to_year(config.years.default,0,false,function(){
            if (typeof callback === 'function') callback();
        });
    }else{
        if (typeof callback === 'function') callback();    
    }
};

module.exports = App;
