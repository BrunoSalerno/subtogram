require 'sequel'
require 'sinatra/asset_pipeline/task'
require './app/config/database.rb'
require './app/app'

Sinatra::AssetPipeline::Task.define! App

desc "Run database migrations"
namespace :db do
    task :migrate do
        require 'sequel/extensions/migration'
        Sequel::Migrator.run(DB, "db/migrations",
                use_transactions: true)
        puts "=> db:migrate executed"
    end
end
