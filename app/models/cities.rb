require 'json'

class City < Sequel::Model(:cities)
    SRID = 4326

    def set_coords(lat,lon)
        self.coords = Sequel.lit("ST_GeomFromText('POINT(#{lon} #{lat})', #{SRID})")
    end

    def geojson_coords
        point = self.class.dataset.where(id: self.id).geojson(:coords)
        JSON.parse(point, :symbolize_names => true)[:coordinates]
    end

    def generate_url_name
        self.url_name = self.name.gsub(' ','-').downcase
    end

    def url
        "/#{self.url_name}"
    end

    dataset_module do
        def geojson(column)
            self.get(Sequel.function :ST_AsGeoJSON, column)
        end
    end
end
