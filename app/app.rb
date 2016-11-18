require 'sequel'
require 'sinatra'
require 'sinatra/asset_pipeline'

require './app/config/database.rb'
require './app/config/mapbox.rb'

require './app/lib/sequel/geometry'

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

        # Lines

        param_lines = if params[:lines]
            params[:lines].split(',')
        end

        @lines = {}
        @city.lines.each { |line|
            @lines[line.name] = {show: param_lines && !param_lines.include?(line.url_name) ? false : true,
                                 url_name: line.url_name,
                                 style: line.style}
        }

        # Plans

        param_plan_lines = params[:plans] ? params[:plans].split(',') : []

        @plans = {}
        @city.plans
        .sort_by{ |plan| plan.extra["year"].to_i }
        .each { |plan|
            lines = plan.plan_lines.map {|line|
                {show: param_plan_lines.include?(line.parent_url_name),
                 parent_url_name: line.parent_url_name,
                 name: line.name,
                 style: line.style}
            }
            @plans[plan.name]= {
                lines: lines,
                year: plan.extra["year"],
                url: plan.extra["url"]
            }
        }

        erb :city    
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
      city_lines_ids = @city.lines.map(&:id)
      query = {line_id: city_lines_ids}

      features = if type == 'sections'
                   Section.where(query).map(&:feature)
                 else
                   Station.where(query).map(&:feature)
                 end

      {type: "FeatureCollection",
       features: features}.to_json
    end
end
