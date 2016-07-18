require 'sinatra'
require 'sinatra/asset_pipeline'
require 'sequel'
require_relative 'config/database.rb'

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

    get '/:url_name' do
        erb :city    
    end
end
