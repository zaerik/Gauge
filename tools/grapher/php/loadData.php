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
	
	if(isset($_FILES["file"]))
	{
		if($_FILES["file"]["type"] == "application/gzip" || $_FILES["file"]["type"] == "application/x-gzip")
		{
			$file = fopen($_FILES["file"]["tmp_name"], "r");
			$gzip = fread($file, filesize($_FILES["file"]["tmp_name"]));
			fclose($file);
			
			$uncomp = gzdecode($gzip);
			$output = json_decode($uncomp);
			
			// TODO: Add file validation, etc.
			
		}
		else
		{
			array_push($errors, new Error("Invalid file type", 112));
		}
	}
	else
	{
		array_push($errors, new Error("No file received", 111));
	}
	
	if(count($errors) > 0)
	{
		header("HTTP/1.1 400 Bad Request", true, 400);

		$output = array("errors" => $errors);
	}
	else
	{
		
	}
	
	header('Content-Type: application/json');
	
	echo(json_encode($output));
?>
