require 'yaml'

mapbox = YAML::load_file('app/config/mapbox.yml')

MAPBOX_ACCESS_TOKEN = mapbox['access_token']
MAPBOX_STYLE = mapbox['style']
