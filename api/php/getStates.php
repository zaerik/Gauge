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

	$link = mysqli_connect($db_host, $db_user, $db_pass, $db_name);

	if (!$link)
	{
		array_push($errors, new Error("Could not connect to database", 101));
	}
	else
	{
		date_default_timezone_set("UTC");

		if(isset($_GET["user_id"]))
		{
			$user_id = mysqli_real_escape_string($link, $_GET["user_id"]);
		}
		else
		{
			array_push($errors, new Error("Missing user_id", 102));
		}

		if(isset($_GET["session_id"]))
		{
			$session_id = mysqli_real_escape_string($link, $_GET["session_id"]);
		}
		else
		{
			array_push($errors, new Error("Missing session_id", 103));
		}
	}

	if(count($errors) > 0)
	{
		header("HTTP/1.1 400 Bad Request", true, 400);

		$output = array("errors" => $errors);
	}
	else
	{
		if(isset($_GET["start_time"]) && is_numeric($_GET["start_time"]))
		{
			$start_time = mysqli_real_escape_string($link, $_GET["start_time"]);
		}
		else
		{
			// Default to the time at beginning of the session, which happens to be what is used for the session_id
			$start_time = $session_id;	// Assuming this $session_id is already sanitized (above)
		}

		if(isset($_GET["end_time"]) && is_numeric($_GET["end_time"]))
		{
			$end_time = mysqli_real_escape_string($link, $_GET["end_time"]);
		}
		else
		{
			// Default to the current time
			$end_time = mysqli_real_escape_string($link, time() . "000");	// There has to be a better way of doing this, but if time() is multiplied by 1000, it turns into a float and its string representation becomes one that MySQL apparently can't understand...
		}

		$result = mysqli_query($link, "SELECT * FROM raw_logs WHERE id='$user_id' AND session='$session_id' AND time BETWEEN '$start_time' AND '$end_time'");

		while($row = mysqli_fetch_array($result))
		{
			array_push($states, $row);
		}

		$output = array("user_id" => $user_id, "session_id" => $session_id, "start_time" => $start_time, "end_time" => $end_time, "states" => $states);
	}

	header('Content-Type: application/json');

	echo(json_encode($output));

	mysqli_close($link);
?>
