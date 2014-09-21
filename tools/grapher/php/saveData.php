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
	
	$errors = array();
	
	if(isset($_POST["data"]))
	{
		if(isset($_POST["session_id"]))
		{
			$session_id = $_POST["session_id"];
		}
		else
		{
			$session_id = "grapher_session";
		}
		
		$data = $_POST["data"];
	}
	else
	{
		array_push($errors, new Error("No data received", 110));
	}
	
	if(count($errors) > 0)
	{
		header("HTTP/1.1 400 Bad Request", true, 400);
		header('Content-Type: application/json');
		
		$output = array("errors" => $errors);
	
		echo(json_encode($output));
	}
	else
	{
		header("Content-Type: application/gzip");
		header("Content-disposition: attachment; filename=" . $session_id . ".json.gz");
		
		echo(gzencode($data));
	}
?>
