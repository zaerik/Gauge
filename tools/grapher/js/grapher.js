var obd2PIDInfo;
var torquePIDInfo;

$(document).ready()
{
	// Load OBD2 PID Info file
	$.ajax(
		{
			url: config.obd2PIDInfoURI,

			success:
				function(data)
				{
					obd2PIDInfo = data;
				},

			dataType: "json",
			async: false
		}
	);

	// Load Torque PID Info file
	$.ajax(
		{
			url: config.torquePIDInfoURI,
			
			success:
				function(data)
				{
					torquePIDInfo = data;
				},

			dataType: "json",
			async: false
		}
	);

	displayStates("2eb9298f0ab2e17d470f015efe13f255", "1393518715834");
}

function displayServerErrors(errors)
{
	output = "<div class='errorTitle'>Server Errors</div>";

	for(h = 0; h < errors.length; h++)
	{
		output +=
			"<span class='errorLabel'>Error code </span>" +
			"<span class='errorCode'>" + errors[h].code + "</span>" +
			"<span class='errorLabel'>: </span>" +
			"<span class='errorMessage'>" + errors[h].message + "</span>" +
			"<br />";
	}

	$("#consoleContainer").html(output);
}

function getPIDDescription(pidString)
{
	var output = "";

	// Remove the leading 'k' and convert to upper case
	pidString = pidString.slice(1).toUpperCase();

	// Add a preceding '0' if necessary
	if(pidString.length <= 1)
	{
		pidString = "0" + pidString;
	}

	// If it has more than 2 digits, then it is a Torque internal PID
	if(pidString.length > 2)
	{
		var length = torquePIDInfo.length;

		for(h = 0; h < length; h++)
		{
			if(torquePIDInfo[h].pid.toUpperCase() == pidString)
			{
				output = torquePIDInfo[h].description;

				break;
			}
		}
	}
	else	// Otherwise, it is a standard PID
	{
		var length = obd2PIDInfo.length;

		for(h = 0; h < length; h++)
		{
			if(obd2PIDInfo[h].pid.toUpperCase() == pidString)
			{
				output = obd2PIDInfo[h].description;

				break;
			}
		}
	}

	// In case no result is found, use the PID as the label
	if(output == "")
	{
		output = pidString;
	}

	return output;
}

function displayStates(userID, sessionID, startTime, endTime)
{
	$.ajax(
		{
			url:
				config.getStatesURI + "?user_id=" + userID +
				"&session_id=" + sessionID +
				(startTime ? ("&start_time=" + startTime) : "") +	// Optional paramters
				(endTime ? ("&end_time=" + endTime) : ""),

			success:
				function(data)
				{
					displayData(data.states.sort(sortByTime));	// Sort by time
				},

			error:
				function(jqXHR)
				{
					$("#mainContainer").html("");

					displayServerErrors($.parseJSON(jqXHR.responseText).errors);
				},

			dataType: "json"
		}
	);
}

function displayData(states, parameterNames)
{
	// If there is any data
	if(states.length > 0)
	{
		if(parameterNames === undefined)
		{
			parameterNames = ["kc"];
		}

		var plotData = new Array();
		var flotData = new Array();

		var endI = parameterNames.length;
		var endJ = states.length;

		// Setup plotData array
		for(i = 0; i < endI; i++)
		{
			plotData[i] = new Array();
		}

		// Populate plotData array
		for(j = 0; j < endJ; j++)
		{
			for(i = 0; i < endI; i++)
			{
				var date = new Date(Number(states[j].time));

				plotData[i][j] = [date.getTime(), Number(states[j][parameterNames])];
			}
		}

		// Create the object to pass into Flot
		for(i = 0; i < endI; i++)
		{
			flotData[i] =
			{
				data: plotData[i],
				label: getPIDDescription(parameterNames[i]),
				yaxis: i + 1
			};
		}

		// Create Flot options object
		var flotOptions =
		{
			xaxis:
			{
				mode: "time",

				tickFormatter:
					function(tickValue, axis)
					{
						var date = new Date(tickValue);

						return $.format.date(date, "MMM dd, HH:mm")
					},
			},
			
			legend:
			{
				show: true,
				position: "nw",
				backgroundOpacity: .5
			}
		};

		// Create the Flot container
		$("#mainContainer").html("<div id='flotContainer'></div>");

		// Plot the data
		$.plot(
			$("#flotContainer"),
			flotData,
			flotOptions
		)
	}
	else
	{
		$("#consoleContainer").html($("#consoleContainer").html() + "No Data");
		$("#mainContainer").html("");
	}
}

function sortByTime(a, b)
{
	return Number(a.time) - Number(b.time);
}
