# This scrip loads sections and create lines if they don't exist

require 'csv'
require './app/app'

city_id = ENV["CITY_ID"]
file = ENV["FILE"]

abort "Missing args" unless (city_id && file)

@city = City[city_id]

DB.transaction do
    CSV.foreach(file, headers: true, header_converters: :symbol) do |row|
        line = Line.find(city_id: @city.id, name: row[:line])

        unless line
            line = Line.new(city_id: @city.id, name: row[:line])
            line.save 
        end
        
        section = Section.new(
            line_id: line.id,
            buildstart: row[:buildstart],
            opening: row[:opening],
            closure: row[:closure]
        )
        
        section.set_geometry_from_wkt(row[:wkt])
        section.save
        section.set_length
        section.save
    end
end
