require 'sequel'
require 'sinatra'
require 'sinatra/asset_pipeline'

require './app/config/database.rb'
require './app/config/mapbox.rb'

require './app/lib/sequel/geometry'

require './app/helpers/city_helpers'

Dir['./app/models/*.rb'].each {|file| require file}

DEFAULT_ZOOM = 12
DEFAULT_BEARING = 0
DEFAULT_PITCH = 0
DEFAULT_SPEED = 1

class App < Sinatra::Base
    set :public_folder, './public'
    set :assets_prefix, %w(assets)
    set :assets_precompile, %w(bundle.js *.css *.png)
      
    configure do
        set :title, 'Subtogram'
    end
 
    register Sinatra::AssetPipeline

    helpers CityHelpers

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
            pitch: DEFAULT_PITCH,
            speed: DEFAULT_SPEED,
            years: { start: @city.start_year,
                     end: Date.today.year,
                     current: nil,
                     previous: nil,
                     default: params[:year] ? params[:year].to_i : nil
            }
        }

        if params[:geo]
           geo = params[:geo].split(',')
           @config[:coords] = geo[0..1].reverse
           @config[:zoom] = geo[2]
           @config[:bearing] = geo[3]
           @config[:pitch] = geo[4]
        end

        @lines = city_lines(@city, params)
        @plans = city_plans(@city, params)

        @lengths = {
          lines: lines_length_by_year(@city),
          plans: plans_length(@city)
        }

        erb :city
    end

    get '/:url_name/edit' do |url_name|
        @city = City[url_name: url_name]
        @title =  "#{@city.name} - Editor #{settings.title}"

        @config = {
            coords: @city.geojson_coords,
            zoom: DEFAULT_ZOOM,
            bearing: DEFAULT_BEARING,
            pitch: DEFAULT_PITCH,
            speed: DEFAULT_SPEED
        }

        erb :editor
    end

    get '/api/:url_name/plan/' do |url_name|
        @city = City[url_name: url_name]
        plan_lines = params[:plan_lines].split(',')
        plan_ids = Plan.where(city_id: @city.id).select_map(:id)
        PlanLine.where(plan_id: plan_ids, parent_url_name: plan_lines).map{ |line|
          {line: line.feature, stations: line.plan_stations.map(&:feature)}
        }.to_json
    end

    get '/api/:url_name/source/:type' do |url_name, type|
      @city = City[url_name: url_name]
      lines_features_collection(@city, type).to_json
    end
end
