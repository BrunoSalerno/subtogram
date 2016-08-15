class Section < Sequel::Model(:sections)
    many_to_one :lines

    plugin :geometry
end
