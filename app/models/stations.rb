class Station < Sequel::Model(:stations)
    many_to_one :line

    plugin :geometry


    def feature
        h = super
        h[:properties].merge!({line:self.line.name,
                               name: self.name,
                               opening: self.opening,
                               buildstart: self.buildstart,
                               closure: self.closure})
        h
    end
end
