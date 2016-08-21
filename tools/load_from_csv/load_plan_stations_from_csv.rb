# This scrip loads plan stations

require 'csv'
require './app/app'

city_id = ENV["CITY_ID"]
file = ENV["FILE"]

abort "Missing args" unless (city_id && file)

@city = City[city_id]

DB.transaction do
    CSV.foreach(file, headers: true, header_converters: :symbol) do |row|
        plan = Plan.find(city_id: @city.id, name: row[:plan])
        line = PlanLine.find(plan_id: plan.id, name: row[:line])

        # We assume that the line has been created by the plan_lines script
        abort "PlanLine missing" unless line
         
        station = PlanStation.new(
            plan_line_id: line.id,
            name: row[:name],
        )
        
        station.set_geometry_from_wkt(row[:wkt])
        station.save
    end
end
