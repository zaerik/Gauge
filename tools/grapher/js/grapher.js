var obd2PIDInfo;
var torquePIDInfo;

var dateFormatString = "yyyy MMM dd, HH:mm";

$(document).ready()
{
	var userID = "2eb9298f0ab2e17d470f015efe13f255";

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
			async: false	// Wait until the file is loaded before continuing
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
			async: false	// Wait until the file is loaded before continuing
		}
	);

	// Load Torque PID Units file (since the units are user configurable in the app)
	$.ajax(
		{
			url: config.torquePIDUnitsURI,
			
			success:
				function(data)
				{
					var endI = data.length;
					var endJ = torquePIDInfo.length;

					for(i = 0; i < endI; i++)
					{
						for(j = 0; j < endJ; j++)
						{
							if(torquePIDInfo[j].pid == data[i].pid)
							{
								torquePIDInfo[j].unit = data[i].unit;

								break;
							}
						}
					}
				},

			dataType: "json",
			async: false	// Wait until the file is loaded before continuing
		}
	);

	$.ajax(
		{
			url: config.getSessionsURI + "?user_id=" + userID,

			success:
				function(data)
				{
					fillSessionsDropdown(data.sessions.sort(sortBySessionID).reverse());

					displayStates(userID, data.sessions.sort(sortBySessionID).reverse()[0]);
				},

			dataType: "json"
		}
	);
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

function getPIDDescription(pidString, addUnits)
{
	var output = "";

	if(pidString.toLowerCase() == "time")
	{
		output = "Time";
	}
	else
	{
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
			if(torquePIDInfo !== undefined)
			{
				var length = torquePIDInfo.length;

				for(h = 0; h < length; h++)
				{
					if(torquePIDInfo[h].pid.toUpperCase() == pidString)
					{
						output = torquePIDInfo[h].description;

						if(addUnits && torquePIDInfo[h].unit !== undefined && torquePIDInfo[h].unit !== null)
						{
							output += " (" + torquePIDInfo[h].unit + ")";
						}

						break;
					}
				}
			}
		}
		else	// Otherwise, it is a standard PID
		{
			if(obd2PIDInfo !== undefined)
			{
				var length = obd2PIDInfo.length;

				for(h = 0; h < length; h++)
				{
					if(obd2PIDInfo[h].pid.toUpperCase() == pidString)
					{
						output = obd2PIDInfo[h].description;

						if(addUnits && obd2PIDInfo[h].unit !== undefined && obd2PIDInfo[h].unit !== null)
						{
							output += " (" + obd2PIDInfo[h].unit + ")";
						}

						break;
					}
				}
			}
		}

		// In case no result is found, use the PID as the label
		if(output == "")
		{
			output = pidString;
		}
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
				(startTime ? ("&start_time=" + startTime) : "") +	// Optional parameters
				(endTime ? ("&end_time=" + endTime) : ""),

			success:
				function(data)
				{
					// Enable download button
					$("#downloadSessionButton").removeAttr("disabled")
						.click(
							function(event)
							{
								downloadSession(data);
							}
						);
					displayData(data.states.sort(sortByTime), ["kc", "kff1001"]);	// Sort by time
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

function displayData(states, parameterNames, xParameterName)
{
	// If there is any data
	if(states.length > 0)
	{
		var timeMode = false;

		// Default to plotting Engine RPM (PID 0C)
		if(parameterNames === undefined)
		{
			parameterNames = ["kc"];
		}

		// Default to time as the x-axis
		if(xParameterName === undefined)
		{
			xParameterName = "time";
		}

		if(xParameterName == "time")
		{
			timeMode = true;
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
			if(timeMode)
			{
				var date = new Date(Number(states[j].time));
			}

			for(i = 0; i < endI; i++)
			{
				plotData[i][j] =
				[
					// If x-axis is time, use date object
					(timeMode ? date.getTime() : Number(states[j][xParameterName])),

					// The DB stores parameter names in lowercase
					Number(states[j][parameterNames[i].toLowerCase()])
				];
			}
		}

		var pidDescriptions = new Array();
		var flotOptionsYAxes = new Array();

		// Create the object to pass into Flot
		for(i = 0; i < endI; i++)
		{
			pidDescriptions[i] = getPIDDescription(parameterNames[i], (parameterNames[i] == "kc" ? false : true));
			flotData[i] =
			{
				data: plotData[i],
				label: pidDescriptions[i],
				yaxis: i + 1
			};

			flotOptionsYAxes[i] =
			{
				axisLabel: pidDescriptions[i],
			};
		}

		// Create Flot options object
		var flotOptions =
		{
			xaxis:
			{
				mode: (timeMode ? "time" : null),	// Only if the x-axis is time

				tickFormatter:
					(timeMode ?	// Only if the x-axis is time
						function(tickValue, axis)
						{
							var date = new Date(tickValue);

							return $.format.date(date, dateFormatString);
						}
					:
						null
					),

				axisLabel: getPIDDescription(xParameterName)
			},

			yaxes: flotOptionsYAxes,
			
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
		);

		// Somewhere this gets arbitrarily set, so reset it to default
		$(".axisLabels").css("color", "");
	}
	else
	{
		$("#consoleContainer").html($("#consoleContainer").html() + "No Data");
		$("#mainContainer").html("");
	}
}

function fillSessionsDropdown(sessions)
{
	output = "<select>";
	
	for(i = 0; i < sessions.length; i++)
	{
		output +=	"<option value='" + sessions[i] + "'>" +
						sessions[i] +
						"&nbsp;&nbsp;(" + $.format.date(new Date(Number(sessions[i])), dateFormatString) + ")" +
					"</option>";
	}
	
	output += "</select>";
	
	$("#sessionSelectContainer").html(output)
		.children("select")
		.change(	// Bind onchange event
			function(event)
			{	
				displayStates(userID, $(this).val());
			}
		);
}

function downloadSession(sessionData)
{
	// There has to be a better way to do open a new window/tab and start a download triggered by POST data...
	window.open('', 'TheWindow');
	$(
		"<form method='post' action='" + config.saveDataURI + "' target='TheWindow'>" +
			"<input type='hidden' name='session_id' value='" + sessionData.session_id + "'>" +
			"<input type='hidden' name='data' value='" + JSON.stringify(sessionData) + "'>" +
		"</form>"
	).submit();
}

function sortByTime(a, b)
{
	return Number(a.time) - Number(b.time);
}

function sortBySessionID(a, b)
{
	return Number(a) - Number(b);
}
