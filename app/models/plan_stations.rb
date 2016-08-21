class PlanStation < Sequel::Model(:plan_stations)
    many_to_one :plan_line

    plugin :geometry

    def feature
        super.merge({properties: {plan: self.plan_line.plan.name,
                                  line: self.plan_line.name,
                                  name: self.name}})
    end
end
