# This scrip loads stations

require 'csv'
require './app/app'

city_id = ENV["CITY_ID"]
file = ENV["FILE"]

abort "Missing args" unless (city_id && file)

@city = City[city_id]

DB.transaction do
    CSV.foreach(file, headers: true, header_converters: :symbol) do |row|
        line = Line.find(city_id: @city.id, name: row[:line])

        # We assume that the line has been created by the sections script
        abort "Line missing" unless line
         
        station = Station.new(
            line_id: line.id,
            name: row[:name],
            buildstart: row[:buildstart],
            opening: row[:opening],
            closure: row[:closure]
        )
        
        station.set_geometry_from_wkt(row[:wkt])
        station.save
    end
end
