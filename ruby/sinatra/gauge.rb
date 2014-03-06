require 'sinatra/base'
require 'jbuilder'
require 'sinatra/namespace'

class Error

  attr_accessor :code, :message

  def initialize(code, message)
    @code = code
    @message = message
  end

end

class Gauge < Sinatra::Base

  register Sinatra::Namespace

  get '/' do
    'Gauge'
  end

  namespace '/api' do

    get do
      'API'
    end

    get '/states.json' do

      content_type :json

      user_id = params[:user_id]
      session_id = params[:session_id]

      errors = Array.new

      if user_id == nil
        errors << Error.new(102, "Missing user_id.")
      end

      if session_id == nil
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
        
      end

    end
    
  end

end