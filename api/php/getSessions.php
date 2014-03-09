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
	$sessions = array();

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
	}

	if(count($errors) > 0)
	{
		header("HTTP/1.1 400 Bad Request", true, 400);

		$output = array("errors" => $errors);
	}
	else
	{
		$result = mysql_query("SELECT DISTINCT session FROM raw_logs WHERE id='$user_id'");

		while($row = mysql_fetch_array($result, MYSQL_ASSOC))
		{
			array_push($sessions, $row["session"]);
		}

		$output = array("user_id" => $user_id, "sessions" => $sessions);
	}

	header('Content-Type: application/json');

	echo(json_encode($output));

	mysql_close($con);
?>
