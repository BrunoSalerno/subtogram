require "./app/lib/length"
include Length

class Section < Sequel::Model(:sections)
    many_to_one :line

    plugin :geometry

    FUTURE = 999999

    def city
        self.line.city
    end

    def feature
        h = super

        closure = self.closure || FUTURE

        h[:properties].merge!({length: self.length,
                               line: self.line.name,
                               opening: self.opening || FUTURE,
                               buildstart: self.buildstart,
                               buildstart_end: self.opening || closure,
                               closure: closure })
        h
    end
end
