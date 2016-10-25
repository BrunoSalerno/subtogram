require "./app/lib/length"
include Length

class Section < Sequel::Model(:sections)
    many_to_one :line

    plugin :geometry

    def city
        self.line.city
    end

    def feature
        h = super
        h[:properties].merge!({length: self.length,
                               line: self.line.name,
                               opening: self.opening || 10000,
                               buildstart: self.buildstart,
                               closure: self.closure || 10000 })
        h
    end
end
