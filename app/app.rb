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
        @lines_style = {}
        @city.lines.each { |line|
            @lines[line.name] = {show: param_lines && !param_lines.include?(line.name) ? false : true}
            @lines_style[line.name]  = line.style
        }

        # Plans

        param_plan_lines = if params[:plans]
            p = params[:plans].split(',')
            plan_lines = {}
            p.each { |pair|
                plan,line = pair.split('.')
                plan.gsub!('_', ' ')
                plan_lines[plan] = [] unless plan_lines[plan]
                plan_lines[plan].push(line)
            }
            plan_lines
        end

        @plans = {}
        @city.plans
        .sort_by{ |plan| plan.extra["year"].to_i }
        .each { |plan|
            lines = plan.plan_lines.map {|line|
                @lines_style[line.name] = line.style
                {show: param_plan_lines && param_plan_lines[plan.name] && param_plan_lines[plan.name].include?(line.name),
                 name: line.name,
                 id: line.id}
            }
            @plans[plan.name]= {
                lines: lines,
                year: plan.extra["year"],
                url: plan.extra["url"]
            }
        }

        erb :city    
    end

    get '/api/:url_name/plan_line' do |url_name|
        plan_line_id = params[:id].split(',')
        @lines = PlanLine.where(id: plan_line_id)

        @lines.map { |l|
            {line: l.feature, stations: l.plan_stations.map(&:feature)}
        }.to_json
    end

    get '/api/source/:type' do |type|
      features = if type == 'sections'
                   Section.map(&:feature)
                 else
                   Station.map(&:feature)
                 end

      {type: "FeatureCollection",
       features: features}.to_json
    end

    get '/api/lines' do
      {lines: Line.all.map(&:name)}.to_json
    end
end
