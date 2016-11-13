var Timeline = function(subtogram, years){
  this.subtogram = subtogram;
  this.years = years;
};

Timeline.prototype = {
  subtogram: null,
  years: null,
  speed: 1,
  interval: null,
  playing: false,

  toYear: function(year) {
    this.subtogram.setYear(year);
    this.years.current = year;
  },

  animateToYear: function(year, yearCallback, endCallback) {
    var self = this;
    var difference = year - this.years.current;
    if (difference == 0) return;

    var sum = difference > 0 ? 1 : -1;
    var y = this.years.current;

    this.playing = true;

    this.interval = setInterval(function(){
      if (y == year) {
        self.stopAnimation();
        if (typeof endCallback === 'function') endCallback();
        return;
      }
      y += sum;
      self.toYear(y);
      if (typeof yearCallback == 'function') yearCallback(y);
    }, this.speed);
  },

  stopAnimation: function(callback) {
    clearInterval(this.interval);
    this.playing = false;
    if (typeof callback === 'function') callback(this.years.current);
  }
}

module.exports = Timeline;
