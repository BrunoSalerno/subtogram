class Station < Sequel::Model(:stations)
    many_to_one :line

    plugin :geometry


    def feature
        h = super
        h[:properties].merge!({line:self.line.name,
                               name: self.name,
                               opening: self.opening || 10000,
                               buildstart: self.buildstart,
                               closure: self.closure || 10000})
        h
    end
end
