var Section = require('./section');
var Misc = require('./misc');

var Plan = function(map,style){
  this.style = style;
  this.lines = {};
  this.map = map;

  var self = this;

  this.hasLine = function(line){
    return typeof this.lines[line] !== 'undefined';
  }

  this.addLine = function(name, raw_feature, length){
    self.lines[name] = {
        raw_feature: raw_feature,
        section:null,
        stations:[],
        length: Misc.round(length/1000)}
  };

  this.addStation = function(line,station){
    self.lines[line].stations.push(station)
  };


  this.draw = function(line){
    var changes = [];
    if (!self.lines[line].section)
        self.lines[line].section = new Section(self.map,
                                                 self.lines[line].raw_feature,
                                                 self.style,
                                                 'sections');

    changes.push(self.lines[line].section.open())

    self.lines[line].stations.forEach(function(s){
      if (!s.section)
        s.section = new Section(self.map,
                                s.raw_feature,
                                self.style,
                                'stations');
      changes.push(s.section.open());
    });

    return changes;
  };

  this.undraw = function(line){
    var changes = [];
    changes.push(self.lines[line].section.close());
    self.lines[line].stations.forEach(function(s){
      changes.push(s.section.close());
    });
    return changes;
  };
};

module.exports = Plan;
