require 'json'

class City < Sequel::Model(:cities)
    one_to_many :lines

    plugin :geometry

    def set_coords(lat,lon)
        self.coords = self.wkt("POINT(#{lon} #{lat})")
    end

    def geojson_coords
        point = self.geojson_geometry(:coords)
        JSON.parse(point, :symbolize_names => true)[:coordinates]
    end

    def generate_url_name
        self.url_name = self.name.gsub(' ','-').downcase
    end

    def url
        "/#{self.url_name}"
    end

    def line_features_by_year
        hash = {}
        self.lines.map{|line|
            [:sections, :stations].map {|category|
                line.send(category).map {|feature|
                    [:buildstart, :opening, :closure].each do |k|
                        year = feature[k]
                        hash[year] = {} unless hash[year]
                        hash[year][category] = {} unless hash[year][category]
                        hash[year][category][k] = [] unless hash[year][category][k]
                        hash[year][category][k].push(feature.feature)
                    end
                }
            }
        }
        hash
    end
end
