Subtogram
==========

This repository contains the source-code of [Subtogram](http://www.subtogram.com),
a web app intended to help to analyze and describe the history of the Metro systems of the World.

Subtogram stack
---------------

* Ruby
* Sinatra
* Postgres 9.5.4 with Postgis 2.2.1
* Browserify
* [Mapbox GL](https://github.com/mapbox/mapbox-gl-js)

Development
-----------
First of all, you will need to set up the DB and a dump. And you will need credentials
for Mapbox. You can create your own Mapbox account and use your credentials or I can give them
to you. Check out the `app/config/*.yml.sample` files.

* Install Ruby dependencies:

```
bundle install
```

* Run migrations:

```
rake db:migrate
```

* Install JS dependencies:

```
npm install
```

* Build:

```
npm run build
```

* Assets need to be compiled before deployment:

```
RACK_ENV=production rake assets:precompile
```

Contribute
----------

If you want to contribute please contact me!
