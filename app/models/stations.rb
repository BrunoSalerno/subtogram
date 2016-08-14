class Station < Sequel::Model(:stations)
    many_to_one :lines

    plugin :gis
end
