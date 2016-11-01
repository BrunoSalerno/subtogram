class Station < Sequel::Model(:stations)
    many_to_one :line

    plugin :geometry

    def feature
        h = super

        closure = self.closure || Section::FUTURE

        h[:properties].merge!({line:self.line.name,
                               name: self.name,
                               opening: self.opening || Section::FUTURE,
                               buildstart: self.buildstart,
                               buildstart_end: self.opening || closure,
                               closure: closure })
        h
    end
end
