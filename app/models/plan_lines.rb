require "./app/lib/length"
include Length

class PlanLine < Sequel::Model(:plan_lines)
    many_to_one :plan
    one_to_many :plan_stations

    plugin :geometry

    def feature
        h = super
        h[:properties].merge!({line: self.name,
                               plan: self.plan.name,
                               url: self.plan.extra["url"],
                               year: self.plan.extra["year"],
                               length: self.length})
        h
    end

    def style
        self.plan.city.style["line"]["opening"][self.name]
    end
end
