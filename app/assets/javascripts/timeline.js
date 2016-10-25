var Timeline = function(subtogram, years){
  this.subtogram = subtogram;
  this.years = years;
};

Timeline.prototype = {
  subtogram: null,
  years: null,
  speed: 10,

  toYear: function(year) {
    this.subtogram.filterYear(year);
    this.years.current = year;
  },

  animateToYear: function(year) {
    var self = this;
    var difference = year - this.years.current;
    if (difference == 0) return;

    var sum = difference > 0 ? 1 : -1;
    var y = this.years.current;

    var interval = setInterval(function(){
      if (y == year) {
        clearInterval(interval);
        return;
      }
      y += sum;
      self.toYear(y);
    }, this.speed);
  }
}

module.exports = Timeline;
