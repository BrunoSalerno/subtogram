var $ = require('jquery');

var Info = function(args) {
  args = args || {};
  if (args.lengths) this.lengths = args.lengths;
  if (args.updateCallback) this.updateCallback = args.updateCallback;
}

Info.prototype = {
  lengths: {},
  lines: [],
  plans: [],
  year: null,
  updateCallback: null,

  update: function(args) {
    args = args || {};

    for (var key in args) {
      this[key] = args[key];
    }

    this.render();
    if (typeof this.updateCallback === 'function') this.updateCallback();
  },

  render: function() {
    var underConstruction = 0;
    var operative = 0;
    var plans = 0;

    if (this.year && this.lines.length) {
      var currentYear = this.lengths.lines[this.year];
      this.lines.forEach(function(line){
        if (!currentYear[line]) return;

        if (currentYear[line].under_construction) {
          underConstruction += currentYear[line].under_construction;
        }

        if (currentYear[line].operative) {
          operative += currentYear[line].operative;
        }
      });
    }

    if (this.plans.length) {
      var self = this;
      this.plans.forEach(function(plan){
        plans += self.lengths.plans[plan];
      });
    }

    if (underConstruction) {
      $('#km-under-construction').html(this.format('En construcción', underConstruction)).show();
    } else {
      $('#km-under-construction').hide();
    }

    if (operative) {
      $("#km-operative").html(this.format('Operativos', operative)).show();
    } else {
      $("#km-operative").hide();
    }

    if (plans) {
      $("#km-plans").html(this.format('Planes', plans)).show();
    } else {
      $("#km-plans").hide();
    }
  },

  format: function(label, value) {
    var strValue = parseInt(value/1000).toString();
    return label + ': ' + strValue + 'km';
  }
}

module.exports = Info;
