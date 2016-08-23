var Planification = function(plans,map,style){
  this.map = map;
  this.style = style;
  this.__plans = {};

  this.drawnLines = {};

  var self = this;
 
  this.current_km = function(){
    var km = 0;
    
    for (var plan in self.__plans){
        for (var k in self.__plans[plan].lines()){
          if (self.drawnLines[plan + '_' + k]) {
            km += self.__plans[plan].lines()[k].length
          }
        }
    }
    return round(km);
  }


  this.toggle = function(plan, line, planLineId){
    var deferred = new $.Deferred();
    var planLineKey = plan + '_' + line;

    if (self.drawnLines[planLineKey]){
      delete self.drawnLines[planLineKey];
      deferred.resolve(self.processChanges(self.__plans[plan].undraw(line)));
    } else {
      self.drawnLines[planLineKey] = true;
      if (self.__plans[plan] && self.__plans[plan].hasLine(line)) {
        deferred.resolve(self.processChanges(self.__plans[plan].draw(line)));
      } else {
        $.when(self.fetchPlanLines([planLineId])).then(function(){
            deferred.resolve(self.processChanges(self.__plans[plan].draw(line)));
        })
      }
    }
    return deferred.promise();
  };

  this.processChanges = function(changes){
    var renderUpdates = new RenderUpdates({map: self.map});
    renderUpdates.render(changes);

    var plan_lines = [];

    for (var plan in self.__plans){
        for (var k in self.__plans[plan].lines()){
          if (self.drawnLines[plan + '_' + k]) {
            plan_lines.push(plan.replace(' ','_')+'.'+k)
          }
        }
    }

    return plan_lines;
  }

  this.loadPlans = function(plans) {
    var ids = []
    for (var plan in plans) {
        plans[plan].lines.forEach(function(line){
            if (line.show) {
                ids.push(line.id);
            }
        });
    }
    $.when(self.fetchPlanLines(ids)).then(function(data){
        data.forEach(function(d){
            self.toggle(d.plan, d.line);
        });
    });
  }

  this.fetchPlanLines = function(ids) {
    var deferred = new $.Deferred();
    var params = {id: ids.join(',')}
    var url = 'http://' + location.host + '/api' + location.pathname + '/plan_line'
    $.getJSON(url, params).then(function(data){
        var loaded = [];
        data.forEach(function(planLine){
            self.loadData(planLine.line, planLine.stations);
            loaded.push({plan: planLine.line.properties.plan, line: planLine.line.properties.line})
        });
        deferred.resolve(loaded);
    });
    return deferred.promise();
  }

  this.loadData = function(line, stations){
      var plan_name = line.properties.plan;
      var line_name = line.properties.line;
      var plan_url = line.properties.url;
      var length = line.properties.length;

      if (!self.__plans[plan_name]) {
        self.__plans[plan_name] = new Plan(self.map,plan_name,line.properties.year,plan_url,self.style);
      }

      if (!self.__plans[plan_name].lines()[line_name]){
        self.__plans[plan_name].add_line(line_name,line,length)
      }

    $.each(stations, function(index,station){
      var obj ={section: null,raw_feature:station};
      self.__plans[plan_name].add_station(line_name,obj);
    });
  };

  this.loadPlans(plans)
};
