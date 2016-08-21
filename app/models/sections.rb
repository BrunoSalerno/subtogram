require "./app/lib/length"
include Length

class Section < Sequel::Model(:sections)
    many_to_one :line

    plugin :geometry

    def set_length
        self.length = self.calculate_length
    end

    def feature
        super.merge({properties: {length: self.length,
                                  line: self.line.name,
                                  id: self.id,
                                  opening: self.opening,
                                  buildstart: self.buildstart,
                                  closure: self.closure}})
    end
end
