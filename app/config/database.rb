require 'yaml'

config = YAML::load_file('app/config/database.yml')

connection = "postgres://#{config['user']}:#{config['password']}@#{config['host']}:#{config['port']}/#{config['database']}"

DB = Sequel.connect(connection)
