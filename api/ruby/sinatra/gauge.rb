require 'sinatra/base'
require 'sinatra/namespace'
require 'jbuilder'
require 'yaml'
require 'mysql2'

class Error

  attr_accessor :code, :message

  def initialize(code, message)
    @code = code
    @message = message
  end

end

DB_CONFIG = YAML::load(File.open('database.yml'))

class Gauge < Sinatra::Base

  register Sinatra::Namespace  

  @@client = Mysql2::Client.new(host: DB_CONFIG['host'], username: DB_CONFIG['username'], password: DB_CONFIG['password'], database: DB_CONFIG['database'], symbolize_keys: true)

  get '/' do
    'Gauge'
  end

  namespace '/api' do

    get do
      'API'
    end

    get '/states.json' do

      content_type :json

      errors = Array.new

      if params[:user_id] == nil
        errors << Error.new(102, "Missing user_id.")
      end

      if params[:session_id] == nil
        errors << Error.new(103, "Missing session_id.")
      end

      if errors.count > 0

        status 400

        Jbuilder.encode do |json|
          json.errors errors.each do |error|
            json.code error.code
            json.message error.message
          end
        end

      else

        user_id = @@client.escape(params[:user_id])
        session_id = @@client.escape(params[:session_id])

        states = @@client.query("SELECT time,session,id,kff1005,kff1006,kff1001,kc,kd FROM raw_logs WHERE id='#{user_id}' AND session='#{session_id}'")

        Jbuilder.encode do |json|
          json.array! states.each do |state|
            state.each do |key, value|
              json.set! key, value
            end
          end
        end

      end

    end

  end

end
