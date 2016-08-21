module Length

    def calculate_length
        # When calculating the length of we project the geometry to
        # SRID 3857 (Web Mercator)
        # FIXME Use a local projection to refine the numbers
        Sequel.lit("ST_Length(ST_Transform(geometry, 3857))::int")
    end

end
