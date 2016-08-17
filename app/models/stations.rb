class Station < Sequel::Model(:stations)
    many_to_one :line

    plugin :geometry


    def feature
        super.merge({properties: {line: self.line.name, id: self.id}})
    end
end
