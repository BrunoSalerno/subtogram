require "./app/lib/length"
include Length

class PlanLine < Sequel::Model(:plan_lines)
    many_to_one :plan
    one_to_many :plan_stations

    plugin :geometry
end
