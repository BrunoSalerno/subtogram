require 'sequel'
require 'sinatra'
require 'sinatra/asset_pipeline'

require './app/config/database.rb'
require './app/config/mapbox.rb'

require './app/lib/sequel/geometry'

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
           @config[:zoom], @config[:bearing] = geo[2..3]
        end

        param_lines = if params[:lines]
            params[:lines].split(',')
        end

        @lines = {}
        @lines_style = {}
        @city.lines.each { |line|
            @lines[line.name] = {show: param_lines && !param_lines.include?(line.name) ? false : true}
            @lines_style[line.name]  = line.style
        }

        #TODO: plan_lines

        erb :city    
    end
end
