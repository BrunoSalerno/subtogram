require "./app/lib/length"
include Length

class Section < Sequel::Model(:sections)
    many_to_one :line

    plugin :geometry

    def feature
        h = super
        h[:properties].merge!({length: self.length,
                               line: self.line.name,
                               opening: self.opening,
                               buildstart: self.buildstart,
                               closure: self.closure})
        h
    end
end
