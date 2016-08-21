require 'yaml'

config = YAML::load_file('app/config/database.yml')

connection = "postgres://#{config['username']}:#{config['password']}@#{config['host']}:#{config['port']}/#{config['database']}"

DB = Sequel.connect(connection)

DB.extension :pg_json
