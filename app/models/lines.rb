class Line < Sequel::Model(:lines)
    many_to_one :cities
    one_to_many :sections
    one_to_many :stations
end
