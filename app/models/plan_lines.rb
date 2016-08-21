require "./app/lib/length"
include Length

class PlanLine < Sequel::Model(:plan_lines)
    many_to_one :plan
    one_to_many :plan_stations

    plugin :geometry

    def feature
        super.merge({properties: {line: self.name,
                                  plan: self.plan.name,
                                  url: self.plan.extra["url"],
                                  year: self.plan.extra["year"],
                                  length: self.length}})
    end
end
