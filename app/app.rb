require 'sequel'
require 'sinatra'
require 'sinatra/asset_pipeline'

require './app/config/database.rb'
require './app/config/mapbox.rb'

require './app/lib/sequel/gis'

Dir['./app/models/*.rb'].each {|file| require file}

DEFAULT_ZOOM = 12
DEFAULT_BEARING = 0
DEFAULT_SPEED = 1

class App < Sinatra::Base
    set :public_folder, './public'
    set :assets_prefix, %w(assets assets/vendor)
    
    configure do
        set :title, 'Subtogram'
    end
 
    register Sinatra::AssetPipeline

    get '/' do
        erb :index
    end

    get '/:url_name' do |url_name|
        @city = City[url_name: url_name]
        
        @title =  "#{@city.name} - #{settings.title}"

        @config = {
            coords: @city.geojson_coords,
            zoom: DEFAULT_ZOOM,
            bearing: DEFAULT_BEARING,
            speed: DEFAULT_SPEED,
            years:{start: @city.start_year, end: Date.today.year, current: nil, previous: nil}}

        erb :city    
    end
end
