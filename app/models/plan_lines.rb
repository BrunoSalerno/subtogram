require "./app/lib/length"
include Length

class PlanLine < Sequel::Model(:plan_lines)
    many_to_one :plan
    one_to_many :stations

    plugin :geometry

    def set_year(year)
        self.extra.year = year
    end

    def set_length
        self.extra.length = self.calculate_length
    end
end
