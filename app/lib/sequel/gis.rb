module Sequel
    module Plugins
        module Gis
            SRID = 4326

            module InstanceMethods
                def wkt(geometry)
                    Sequel.lit("ST_GeomFromText('#{geometry}', #{SRID})")
                end

                def geojson_geometry(column = :geometry)
                    self.class.dataset.where(id: self.id).geojson(column)
                end
            end

            module DatasetMethods
                def geojson(column)
                    self.get(Sequel.function :ST_AsGeoJSON, column)
                end
            end
        end
    end
end
