require 'sinatra'
require 'sinatra/json'
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
  register Sinatra::JSON

  namespace '/gauge/api' do
    get '/' do

    end

    get '/states.json' do

      content_type :json

      user_id = params[:user_id]
      session_id = params[:session_id]

      errors = Array.new()

      if user_id == nil
        errors << Error.new(102, "Missing user_id.")
      end

      if session_id == nil
        errors << Error.new(103, "Missing session_id.")
      end

      if errors.count > 0
        status 400
        json errors: errors
      end

    end
    
  end

end