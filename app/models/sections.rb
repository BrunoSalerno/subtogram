class Section < Sequel::Model(:sections)
    many_to_one :line

    plugin :geometry

    def set_length
        # When calculating the length of the section we project the geometry to 
        # SRID 3857 (Web Mercator)
        # FIXME Use a local projection to refine the numbers
        self.length = Sequel.lit("ST_Length(ST_Transform(geometry, 3857))::int")
    end

    def feature
        super.merge({properties: {length: self.length, line: self.line.name}})
    end
end
