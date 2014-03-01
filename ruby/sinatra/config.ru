require './gauge'

use Rack::ShowExceptions
 
run Gauge.new