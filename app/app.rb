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
        @city.plans.each { |plan|
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
end
