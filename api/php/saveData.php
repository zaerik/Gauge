<?php
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
		
		header("Content-Type: application/gzip");
		header("Content-disposition: attachment; filename=" . $session_id . ".json.gz");
		
		$data = $_POST["data"];
		
		echo(gzencode($data));
	}
	else
	{
		echo("No data");
	}
?>