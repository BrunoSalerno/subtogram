# This scrip loads plan_lines and create plans if they don't exist

require 'csv'
require './app/app'

city_id = ENV["CITY_ID"]
file = ENV["FILE"]

abort "Missing args" unless (city_id && file)

@city = City[city_id]

DB.transaction do
    CSV.foreach(file, headers: true, header_converters: :symbol) do |row|
        plan = Plan.find(city_id: @city.id, name: row[:plan])

        unless plan
            plan = Plan.new(city_id: @city.id, name: row[:plan])
            plan.set_year(row[:year])
            plan.set_url(row[:url])
            plan.save 
        end
        
        line = PlanLine.new(
            plan_id: plan.id,
            name: row[:line]
        )
        
        line.set_geometry_from_wkt(row[:wkt])
        line.save
        line.set_length
        line.save
    end
end
