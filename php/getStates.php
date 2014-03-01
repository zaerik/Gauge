<?php
	class Error
	{
		public $message;
		public $code;

		function __construct($message, $code)
		{
			$this->message = $message;
			$this->code = $code;
		}
	}

	require("./dbconfig.php");

	$errors = array();
        $states = array();

        $con = mysql_connect($db_host, $db_user, $db_pass);

        if (!$con)
        {
		array_push($errors, new Error("Could not connect to database", 101));
        }
        else
        {

                mysql_select_db($db_name, $con);

                date_default_timezone_set("UTC");

                if(isset($_GET["user_id"]))
                {
			$user_id = mysql_real_escape_string($_GET["user_id"]);
                }
                else
                {
			array_push($errors, new Error("Missing user_id", 102));
                }

		if(isset($_GET["session_id"]))
		{
			$session_id = mysql_real_escape_string($_GET["session_id"]);
		}
		else
		{
			array_push($errors, new Error("Missing session_id", 103));
		}
        }

	if(count($errors) > 0)
	{
		$output = array("errors" => $errors);
	}
	else
	{
		/*if(isset($_GET["start"]) && is_numeric($_GET["start"]))
               	{
	                $start = mysql_real_escape_string($_GET["start"]);
                }
               	else
               	{
                       	// Default to the past 48 hours
 	                $start = time() - 60 * 60 * 48;

                	$description .= "Invalid or missing start time.";
                }

                if(isset($_GET["end"]) && is_numeric($_GET["end"]))
                {
                        $end = mysql_real_escape_string($_GET["end"]);
                }
                else
                {
                        // Default to now
                        $end = time();

                        $description .= "Invalid or missing end time.";
                }*/

		/*$start_date = date($format_string, $start);
                $end_date = date($format_string, $end);

                $result = mysql_query("SELECT * FROM observations WHERE station_id='$station_id' AND observation_time BETWEEN '$start_date' AND '$end_date'");

                while($row = mysql_fetch_array($result, MYSQL_ASSOC))
                {
                        array_push($observations, $row);
                }*/

		$output = array("user_id" => $user_id, "session_id" => $session_id, "start_time" => $start_time, "end_time" => $end_time, "states" => $states);
	}

	header('Content-Type: application/json');

        echo(json_encode($output));

        mysql_close($con);
?>
