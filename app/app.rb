require 'sinatra'
require 'sinatra/asset_pipeline'

class App < Sinatra::Base
    set :public_folder, './public'
    set :assets_prefix, %w(assets assets/vendor)
 
    register Sinatra::AssetPipeline

    get '/' do
        erb :index
    end

    get '/:city' do
        erb :city    
    end
end
