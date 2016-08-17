class Station < Sequel::Model(:stations)
    many_to_one :line

    plugin :geometry


    def feature
        super.merge({properties: {line:self.line.name,
                                  id: self.id,
                                  name: self.name,
                                  opening: self.opening,
                                  buildstart: self.buildstart,
                                  closure: self.closure}})
    end
end
