class PlanStation < Sequel::Model(:plan_stations)
    many_to_one :plan_line

    plugin :geometry
end
