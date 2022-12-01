/**
 * Server Setup
 */
//importing libraries
var os = require("os")
var express = require("express")
var exphbrs = require('express-handlebars')
var net = require("net")
var cron = require("cron")
var https = require("https")

//Ports used by server processes
var port = 4008
var socketport = 4005

//express/handlebars setup
var app = express()
app.engine("handlebars", exphbrs.engine({ defaultLayout: "main" }))
app.set("view engine", "handlebars")

//Constant declarations
const HOURS_IN_DAY = 24
const MINUTES_BETWEEN_TIDAL_BULGES = 770 //12h 50m (6h 25m between tidal extremes)
const SIX_AM_IN_MINUTES = 360
const ELEVEN_AM_IN_MINUTES = 660
const SIX_PM_IN_MINUTES = 1080

//instanciate global forecast object with correct information for November 28, 2022. 
//For all intents and purposes, this is dummy information so that the server starts out with a populated water temp prediction 
todaysForecast = {
	date: new Date('November 28, 2022'),
	hourlyForecast: [
		{
			temperature: 46
		},
		{
			temperature: 45
		},
		{
			temperature: 45
		},
		{
			temperature: 45
		},
		{
			temperature: 45
		},
		{
			temperature: 45
		},
		{
			temperature: 46
		},
		{
			temperature: 46
		},
		{
			temperature: 46
		},
		{
			temperature: 47
		},
		{
			temperature: 46
		},
		{
			temperature: 47
		},
		{
			temperature: 47
		},
		{
			temperature: 46
		},
		{
			temperature: 45
		},
		{
			temperature: 45
		},
		{
			temperature: 45
		},
		{
			temperature: 45
		},
		{
			temperature: 46
		},
		{
			temperature: 47
		},
		{
			temperature: 46
		},
		{
			temperature: 46
		},
		{
			temperature: 46
		},
		{
			temperature: 45
		}
	],
	tidalPredictions: [
		{
			t: "2022-11-28 4:52",
			v: "7.302"
		}, 
		{
			t: "2022-11-28 10:07",
			v: "4.051"
		}, 
		{
			t: "2022-11-28 15:45",
			v: "7.928"
		}, 
		{
			t: "2022-11-28 22:52",
			v: "-0.205"
		}
	],
	waterTempObservations: [
		{
			t: "2022-11-28 00:00",
			v: "46.9"
		}, 
		{
			t: "2022-11-28 01:00",
			v: "47.1"
		}, 
		{
			t: "2022-11-28 02:00",
			v: "48.0"
		}, 
		{
			t: "2022-11-28 03:00",
			v: "49.5"
		}, 
		{
			t: "2022-11-28 04:00",
			v: "50.2"
		}, 
		{
			t: "2022-11-28 05:00",
			v: "50.4"
		}, 
		{
			t: "2022-11-28 06:00",
			v: "50.4"
		}, 
		{
			t: "2022-11-28 07:00",
			v: "50.4"
		}, 
		{
			t: "2022-11-28 08:00",
			v: "50.2"
		}, 
		{
			t: "2022-11-28 09:00",
			v: "48.6"
		}, 
		{
			t: "2022-11-28 10:00",
			v: "49.1"
		}, 
		{
			t: "2022-11-28 11:00",
			v: "49.1"
		}, 
		{
			t: "2022-11-28 12:00",
			v: "48.0"
		}, 
		{
			t: "2022-11-28 13:00",
			v: "48.7"
		}, 
		{
			t: "2022-11-28 14:00",
			v: "49.3"
		}, 
		{
			t: "2022-11-28 15:00",
			v: "49.8"
		}, 
		{
			t: "2022-11-28 16:00",
			v: "50.0"
		}, 
		{
			t: "2022-11-28 17:00",
			v: "50.0"
		}, 
		{
			t: "2022-11-28 18:00",
			v: "50.0"
		}, 
		{
			t: "2022-11-28 19:00",
			v: "49.8"
		}, 
		{
			t: "2022-11-28 20:00",
			v: "48.7"
		}, 
		{
			t: "2022-11-28 21:00",
			v: "48.3"
		}, 
		{
			t: "2022-11-28 22:00",
			v: "47.5"
		}, 
		{
			t: "2022-11-28 23:00",
			v: "46.9"
		}
	],
	currentHour: 23,
	hours: []
}


/**
 * Express server middleware functions
 */
//serve plaintext files from public directory
app.use(express.static(__dirname + "/public"))

//log all requests to the server
app.use(function (req, res, next){
	console.log("Request recieved")
	console.log("Method: " + req.method)
	console.log("URL: " + req.url)
	console.log("Headers: " + req.headers)

	next()
})

//Render homepage. Does not pass to any other middleware function.
app.get("/", async function(req, res, next){
	var receivedData = null
	try {
		// receivedData = await queryDB("GETONDATE,07-31-2022,07-31-2022")
		receivedData = await queryDB("INSERT,11-28-2022,80,90,15:00")
		// receivedData = await queryDB("GETONDATE,11-28-2022,11-28-2022")
	} catch (error){
		res.status(500).send(error)
		return
	}
	console.log(receivedData.toString())
	res.status(200).render("homepage", {
		data: receivedData,
		pageTitle: "Homepage",
		date: getTodaysDate()
	})
})



/**
 * Server listener
 */
app.listen(port, function (){
	console.log("Server is listening on port: ", port)
})



/**
 * Server functions
 */


/**
 * Used to create a call to the relevant APIs at consistent intervals.
 */
 var dailyJobs = cron.job("*/5 * * * * *", async function (){
	//save yesterday's data to the database
	var queryString = getInsertQueryStringFromForecast(todaysForecast)
	var dbbrokerreply = await queryDB(queryString)
	
	//get new predictions from the apis
	var hourlyForecastUrl = await getHourlyForecastUrl()
	// console.log(hourlyForecastUrl)
	var todaysHourlyForecast = await getTodaysHourlyForecast(hourlyForecastUrl)
	// console.log(todaysHourlyForecast)
	var todaysTidalPredictions = await getTodaysTidalPredictions()
	// console.log(todaysTidalPredictions)
	
	//update the daily forecast with new predictions
	resetDailyForecast(todaysHourlyForecast, todaysTidalPredictions)

	//update individual hours' scores for different activities
	var peakHighTide = getPeakHighTideTime(todaysForecast.tidalPredictions)
	var highTides = getHighTidesArray(peakHighTide)
	for (var i = 0; i < HOURS_IN_DAY; i++){
		var currHourWaterTemp = parseFloat(todaysForecast.waterTempObservations[i].v)
		var currHourAirTemp = todaysForecast.hourlyForecast[i].temperature
		todaysForecast.hours[i] = getActivityScores(todaysForecast.date, currHourWaterTemp, currHourAirTemp, highTides, i)
	}
})
var hourlyJobs = cron.job("25 * * * *", async function (){
	//get the most recent water temperature observation and update today's forcast with it.
	var todaysWaterTempObservations = await getHourlyWaterTempObservations()
	console.log(todaysWaterTempObservations)
	var numObservations = todaysWaterTempObservations.length
	todaysForecast.waterTempObservations[numObservations - 1] = todaysWaterTempObservations[numObservations - 1]
	todaysForecast.currentHour = numObservations - 1
})
dailyJobs.start()
hourlyJobs.start()



/**
 * Resets the values of the daily forecast. Intended to be used at the beginning of a new day.
 * @param {array} todaysHourlyForecast an array of js objects that represent the new forecast
 * @param {array} todaysTidalPredictions an array of js objects that represent the new tidal predictions
 */
function resetDailyForecast(todaysHourlyForecast, todaysTidalPredictions){
	todaysForecast.date = new Date()
	todaysForecast.hourlyForecast = todaysHourlyForecast
	todaysForecast.tidalPredictions = todaysTidalPredictions
	todaysForecast.currentHour = -1
	todaysForecast.hours = []
}


/**
 * Queries the DB broker microservice provided by Miles Riviera. Should be used with await so that the data can be resolved before it is used.
 * @param {string} queryTerm 
 * @returns Promise of the data returned by the db broker. 
 */
function queryDB(queryTerm){
	var client = new net.Socket()
	return new Promise((resolve, reject) => {
		client.connect(socketport, os.hostname(), () => {
			console.log("Connected to db broker microservice")
		})
		client.on("data", function (data){
			client.destroy()
			console.log(data.toString())
			resolve(data)
		})
		client.on("error", function (error){
			reject(error)
		})
		client.write(queryTerm)
	})
}


/**
 * 
 * @returns a string containing today's date in mm-dd-yyyy format
 */
function getTodaysDate(){
	var today = new Date()
	var todaysDate = getDateString(today)
	return todaysDate
}


/**
 * returns the date stored in dateObj as a string formatted as mm-dd-yyyy
 * @param {Date} dateObj a Date object containing the date from which to generate a string
 * @returns a string containing the date stored in dateObj formatted as mm-dd-yyyy
 */
function getDateString(dateObj){
	day = String(dateObj.getDate()).padStart(2, "0")
	month = String(dateObj.getMonth() + 1).padStart(2, "0")
	year = String(dateObj.getFullYear())
	return month + "-" + day + "-" + year
}


/**
 * Creates an insert query to pass to the db broker microservice in order to record previous days weather conditions
 * @param {*} forecastObj an object containing a full day's weather conditions. Intended only to be used with todaysForecast after the day is complete.
 * @returns a string containing a valid insert query to be passed to queryDB()
 */
function getInsertQueryStringFromForecast(forecastObj){
	var queryString = "INSERT,"
	
	//append date string of date in forecastObj to query
	queryString = queryString + getDateString(forecastObj.date) + ","

	//append average water temp of waterTempObservations in forecastObj to query
	var avgWaterTemp = 0
	for (var i in forecastObj.waterTempObservations){
		avgWaterTemp += parseFloat(forecastObj.waterTempObservations[i].v)
	}
	var avgWaterTemp = Math.round(avgWaterTemp / forecastObj.waterTempObservations.length)
	queryString = queryString + avgWaterTemp + ","

	//append average air temp of hourlyForecast in forecastObj to query
	var avgAirTemp = 0
	for (var i in forecastObj.hourlyForecast){
		avgAirTemp += forecastObj.hourlyForecast[i].temperature
	}
	avgAirTemp = Math.round(avgAirTemp / forecastObj.hourlyForecast.length)
	queryString = queryString + avgAirTemp + ","

	//append peak high tide time of tidalPredictions in forecastObj to query
	var peakHighTide = getPeakHighTideTime(forecastObj.tidalPredictions)
	queryString = queryString + peakHighTide

	return queryString
}



/**
 * Gets the time of peak high tide on a given day given that day's tidal predicions
 * @param {array} tidalPredictions an array of js objects that represents the tidal predictions for the day
 * @returns a string containing the time of the peak high tide
 */
function getPeakHighTideTime(tidalPredictions){
	var highestTideIdx = 0
	for (var i = 1; i < tidalPredictions.length; i++){
		var candidate = parseFloat(tidalPredictions[i].v)
		var previous = parseFloat(tidalPredictions[highestTideIdx].v)
		if (candidate >= previous){
			highestTideIdx = i
		}
	}
	var peakHighTide = tidalPredictions[highestTideIdx].t.split(" ")[1]
	return peakHighTide
}



/**
 * Gets an array of all the high tides in a day. The max length of this array is therefore 2.
 * @param {*} peakHighTide a string that represents the time of peak high tide of a given day. This value will be in the array.
 * @returns an array of numbers. Each number represents the time that a high tide will occur in the number of minutes since midnight.
 */
function getHighTidesArray(peakHighTide){
	highTidesArray = []
	
	//convert peak high tide into minutes since midnight
	hoursnminutes = peakHighTide.split(":")
	peakHighTideMinutes = (parseInt(hoursnminutes[0]) * 60) + parseInt(hoursnminutes[1])

	//determine if there is another high tide and what it is
	if (peakHighTideMinutes >= MINUTES_BETWEEN_TIDAL_BULGES){
		highTidesArray.push(peakHighTideMinutes - MINUTES_BETWEEN_TIDAL_BULGES)
	}
	highTidesArray.push(peakHighTideMinutes)
	if (peakHighTideMinutes <= (HOURS_IN_DAY * 60) - MINUTES_BETWEEN_TIDAL_BULGES){
		highTidesArray.push(peakHighTideMinutes + MINUTES_BETWEEN_TIDAL_BULGES)
	}

	return highTidesArray
}



//Required options for the NWS api calls. Abstracted out for DRY purposes.
weatherAPIcalloptions = {
	headers: {
		"User-Agent": "(lokrantj@oregonstate.edu)",
		"Accept": "application/geo+json"
	}
}
/**
 * Queries the NWS weather api to obtain the gridpoints of the specific latitude and longitude for which we want the forecast.
 * @returns a Promise that resolves to a string containing the URL to query to get the hourly forecast at the the specific latitude and longitude.
 */
function getHourlyForecastUrl(){
	console.log("Getting gridpoint from weather.gov api.")
	return new Promise((resolve, reject) => {
		https.get("https://api.weather.gov/points/44.2271,-124.1096", weatherAPIcalloptions, (resp) => {
			var data = ""
	
			resp.on("data", (chunk) => {
				data += chunk
			})
	
			resp.on("end", () => {
				resolve(JSON.parse(data).properties.forecastHourly)
			})
		}).on("error", (error) => {
			reject(error)
		})
	})
}



/**
 * Queries the NWS weather api to obtain the hourly forecast at a specific location.
 * @param {string} hourlyForecastUrl a string containing the URL to query to obtain the hourly forecast at that location
 * @returns a Promise that resolves to an array of 24 JS objects that represent the forecast in the specific location for the next 24 hours.
 */
function getTodaysHourlyForecast(hourlyForecastUrl){
	console.log("Getting hourly forecast from weather.gov api.")
	return new Promise((resolve, reject) => {
		https.get(hourlyForecastUrl, weatherAPIcalloptions, (resp) => {
			var data = ""
	
			resp.on("data", (chunk) => {
				data += chunk
			})
	
			resp.on("end", () => {
				console.log("Recieved hourly weather forecast.")
				var hourlyForecast = JSON.parse(data).properties.periods
				var todaysHourlyForecast = []
				for (var i = 0; i < HOURS_IN_DAY; i++){
					var simpleHourForecast = {
						startTime: hourlyForecast[i].startTime,
						endTime: hourlyForecast[i].endTime,
						temperature: hourlyForecast[i].temperature,
						windSpeed: hourlyForecast[i].windSpeed,
						windDirection: hourlyForecast[i].windDirection
					}
					todaysHourlyForecast.push(simpleHourForecast)
				}
				resolve(todaysHourlyForecast)
			})
		}).on("error", (error) => {
			reject(error)
		})
	})
}



/**
 * Queries the NOAA tides and currents api to obtain the tide predictions for the day
 * @returns a Promise that resolves to an array of JS objects representing the high and low tide predictions for the day.
 */
function getTodaysTidalPredictions(){
	console.log("Getting tidal predictions from noaa.gov api.")
	return new Promise((resolve, reject) => {
		var tideAPIURL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&station=9435827&product=predictions&time_zone=lst&datum=MLLW&interval=hilo&units=english&application=OSUCS361FinalProject&format=json"
		https.get(tideAPIURL, (resp) => {
			var data = ""

			resp.on("data", (chunk) => {
				data += chunk
			})

			resp.on("end", () => {
				console.log("Recieved tide predictions.")
				resolve(JSON.parse(data).predictions)
			})
		}).on("error", (error) => {
			reject(error)
		})
	})
}



/**
 * Queries the NOAA tides and currents api to obtain the water temperature observations of the day
 * @returns a Promise that resolves to an array of JS objects containing the hourly observations of water temperature since midnight on the day it was called.
 */
function getHourlyWaterTempObservations(){
	console.log("Getting water temperature observations from noaa.gov api.")
	return new Promise((resolve, reject) => {
		var waterTempAPIURL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=water_temperature&application=OSUCS361FinalProject&date=today&station=9437540&time_zone=lst&units=english&interval=h&format=json"
		https.get(waterTempAPIURL, (resp) => {
			var data = ""

			resp.on("data", (chunk) => {
				data += chunk
			})

			resp.on("end", () => {
				console.log("Recieved water temp observations.")
				resolve(JSON.parse(data).data)
			})
		}).on("error", (error) => {
			reject(error)
		})
	})
}



/**
 * Activity scoring
 */


/**
 * Gets activity scores for different water based activities. 0 is bad, 1 is okay, and 2 is good
 * @param {Date} date a Date object that is representative of the current date being analyzed
 * @param {number} WaterTemp a number that is the water temperature of the time period being analyzed
 * @param {number} AirTemp a number that is the air temperature of the time period being analyzed
 * @param {array} highTides an array that represents the high tides of the day as the number of minutes since midnight
 * @param {number} hour a number that represents the current hour being analyzed. Do not pass a value if a whole day is being analyzed.
 * @returns a js object with scores for swimming, surfing, scuba, crabbing, fishing, and clamming based on the input conditions
 */
 function getActivityScores(date, WaterTemp, AirTemp, highTides, hour = -1){
	activityScores = {
		swimming: getSwimmingActivityScore(WaterTemp),
		surfing: getSurfingActivityScore(WaterTemp, highTides, hour),
		scuba: getScubaActivityScore(date, WaterTemp, highTides, hour),
		crabbing: getCrabbingActivityScore(date, highTides, hour),
		fishing: getFishingActivityScore(date, AirTemp, highTides, hour),
		clamming: getClammingActivityScore(date, AirTemp, highTides, hour)
	}
	return activityScores
}



/**
 * Gets the activity score of the swimming activity based on the conditions passed through the parameters
 * @param {number} WaterTemp a number that is the water temperature of the time period being analyzed
 * @returns a number representing the activity score of the swimming activity
 */
function getSwimmingActivityScore(WaterTemp){
	//Swimming comfortability is directly correlated with water temperature, all other metrics are not considered here.
	if (WaterTemp >= 60){
		return 2
	} else if (WaterTemp >= 55){
		return 1
	}
	return 0
}


/**
 * Gets the activity score of the surfing activity based on the conditions passed through the parameters
 * @param {*} WaterTemp a number that is the water temperature of the time period being analyzed
 * @param {*} highTides an array that represents the high tides of the day as the number of minutes since midnight
 * @param {*} hour a number that represents the hour of the day to be analyzed. If the number is negative, the function will proceed as if it is analyzing the whole day.
 * @returns a number representing the activity score of the surfing activity
 */
function getSurfingActivityScore(WaterTemp, highTides, hour){
	//the min value of this array will become the score for the scuba activity
	var influenceArr = []

	//date has no/redundant influence over the score

	//determine the water temp's influence over the score
	if (WaterTemp >= 60){
		influenceArr.push(2)
	} else {
		influenceArr.push(1)
	}

	//air temp has no/redundant influence over the score

	//determine the tides influence over the score
	var morningHighTideExists = false
	if (highTides[0] >= SIX_AM_IN_MINUTES && highTides[0] <= ELEVEN_AM_IN_MINUTES){
		morningHighTideExists = true
	}
	if (morningHighTideExists && hour < 0){
		influenceArr.push(2)
	} else if (!morningHighTideExists && hour < 0){
		influenceArr.push(1)
	} else {
		if (morningHighTideExists && (hour * 60) >= highTides[0] - 120 && (hour * 60) <= highTides[0] + 120){
			influenceArr.push(2)
		} else if (morningHighTideExists 
					&& (hour * 60) >= highTides[0] - ((MINUTES_BETWEEN_TIDAL_BULGES / 2) / 2) 
					&& (hour * 60) <= highTides[0] + ((MINUTES_BETWEEN_TIDAL_BULGES / 2) / 2)){
			influenceArr.push(1)
		} else if (!morningHighTideExists 
					&& (hour * 60) >= highTides[0] - ((MINUTES_BETWEEN_TIDAL_BULGES / 2) / 2) 
					&& (hour * 60) <= highTides[0] + ((MINUTES_BETWEEN_TIDAL_BULGES / 2) / 2)){
			influenceArr.push(1)
		} else if (!morningHighTideExists 
					&& (hour * 60) >= highTides[1] - ((MINUTES_BETWEEN_TIDAL_BULGES / 2) / 2) 
					&& (hour * 60) <= highTides[1] + ((MINUTES_BETWEEN_TIDAL_BULGES / 2) / 2)){
			influenceArr.push(1)
		} else {
			influenceArr.push(0)
		}
	}
	return Math.min(...influenceArr)
}



/**
 * Gets the activity score of the scuba activity based on the conditions passed through the parameters
 * @param {*} date an object of the Date class that represents the date that contains the time period being analyzed
 * @param {*} WaterTemp a number that is the water temperature of the time period being analyzed
 * @param {*} highTides an array that represents the high tides of the day as the number of minutes since midnight
 * @param {*} hour a number that represents the hour of the day to be analyzed. If the number is negative, the function will proceed as if it is analyzing the whole day.
 * @returns a number representig the activity score of the scuba activity
 */
function getScubaActivityScore(date, WaterTemp, highTides, hour){
	//the min value of this array will become the score for the scuba activity
	var influenceArr = []

	//determine the date's influence over the score
	var month = date.getMonth() + 1
	if (month >= 5 && month <= 9){
		influenceArr.push(2)
	} else {
		influenceArr.push(1)
	}

	//determine the water temp's influence over the score
	if (WaterTemp >= 52){
		influenceArr.push(2)
	} else if (WaterTemp >= 45){
		influenceArr.push(1)
	} else {
		influenceArr.push(0)
	}

	//air temp has no/redundant influence over the score

	//determine the tide's influence over the score
	influenceArr.push(getSlackwaterInfluence(highTides, hour))

	return Math.min(...influenceArr)
}



/**
 * Gets the activity score for crabbing for a given time period with the conditions passed to the function in the parameters.
 * @param {Date} date an object of the Date class that represents the date that contains the time period being analyzed
 * @param {array} highTides an array of at most two numbers, representing the time of the high tides of the day containing the time period being analized. Units are minutes since midnight.
 * @param {number} hour a number that represents the hour of the day to be analyzed. If the number is negative, the function will proceed as if it is analyzing the whole day.
 * @returns an activity score that represents how "good" the activity would go if you did it during the time period being analyzed. 2 is good, 1 is okay, and 0 is bad
 */
function getCrabbingActivityScore(date, highTides, hour){
	//the min value of this array will become the score for the crabbing activity
	var influenceArr = []
	
	//determine the date's influence over the score
	var month = date.getMonth() + 1
	if (month <= 4 || month >= 9){
		if (month >= 10 && month <= 11){
			influenceArr.push(0)	//new in 2022, crabbing is banned oct 15-nov 30
		} else {
			influenceArr.push(2)
		}
	} else if (month == 5){
		influenceArr.push(1)
	} else {
		influenceArr.push(0)
	}

	//water temp has no/redundant influence over the score

	//air temp has no/redundant influence over the score

	//determine the tide's influence over the score
	influenceArr.push(getSlackwaterInfluence(highTides, hour))
	
	return Math.min(...influenceArr)
}



/**
 * Gets the activity score of the fishing activity based on the conditions passed through the parameters
 * @param {*} date a Date object that is representative of the current date being analyzed
 * @param {*} AirTemp a number that is the air temperature of the time period being analyzed
 * @param {*} highTides an array of at most two numbers, representing the time of the high tides of the day containing the time period being analized. Units are minutes since midnight.
 * @param {*} hour a number representing the current hour. Function proceeds as if analyzing a whole day if hour is negative.
 * @returns a number representing the activity score of the fishing activity
 */
function getFishingActivityScore(date, AirTemp, highTides, hour){
	//the min value of this array will become the score for the crabbing activity
	var influenceArr = []

	//determine the date's influence on the score
	var month = date.getMonth() + 1
	if (month >= 5 && month <= 10){
		influenceArr.push(2)
	} else {
		influenceArr.push(1)
	}

	//water temp has no/redundant influence on the score

	//determine the air temp's influence on the score
	if (AirTemp >= 70){
		influenceArr.push(2)
	} else if (AirTemp >= 33){
		influenceArr.push(1)
	} else {
		influenceArr.push(0)
	}

	//determine the tide's influence on the score
	var slackWaterInfluence = getSlackwaterInfluence(highTides, hour)
	if (hour < 0){
		if (slackWaterInfluence <= 1){
			slackWaterInfluence = 1
		} else {
			slackWaterInfluence = 0
		}
	} else {
		if (slackWaterInfluence > 0){
			slackWaterInfluence = 0
		} else {
			slackWaterInfluence = 2
		}
	}
	influenceArr.push(slackWaterInfluence)
	
	return Math.min(...influenceArr)
}


/**
 * Gets the activity score for the clamming activity based on the conditions passed through the parameters
 * @param {Date} date a Date object that is representative of the current date being analyzed
 * @param {number} AirTemp a number that is the air temperature of the time period being analyzed
 * @param {array} highTides an array of at most two numbers, representing the time of the high tides of the day containing the time period being analized. Units are minutes since midnight.
 * @param {number} hour a number representing the current hour. Function proceeds as if analyzing a whole day if hour is negative.
 * @returns a number representing the activity score of the clamming activity based on the conditions passed to the function.
 */
function getClammingActivityScore(date, AirTemp, highTides, hour){
	//the min value of this array will become the score for the crabbing activity
	var influenceArr = []

	//determine the date's influence on the score
	var month = date.getMonth() + 1
	if (month >= 7 && month <= 9){
		influenceArr.push(0)
	} else {
		influenceArr.push(2)
	}

	//water temp has no/redundant influence on the score

	//determine the air temp's influence on the score
	if (AirTemp >= 70){
		influenceArr.push(2)
	} else if (AirTemp >= 33){
		influenceArr.push(1)
	} else {
		influenceArr.push(0)
	}

	//determine the tide's influence on the score
	if (hour < 0){
		influenceArr.push(2)
	} else {
		lowTides = []
		for (var i = 0; i < highTides.length; i++){
			if (highTides[i] - (MINUTES_BETWEEN_TIDAL_BULGES / 2) > 0){
				lowTides.push(highTides[i] - (MINUTES_BETWEEN_TIDAL_BULGES / 2))
			}
			if (highTides[i] + (MINUTES_BETWEEN_TIDAL_BULGES / 2) < (HOURS_IN_DAY * 60)){
				lowTides.push(highTides[i] + (MINUTES_BETWEEN_TIDAL_BULGES / 2))
			}
		}
		lowTides = [...new Set(lowTides)]

		var hourIsDuringLowTide = false
		for (var i = 0; i < lowTides.length; i++){
			if ((hour * 60) >= lowTides[i] - ((MINUTES_BETWEEN_TIDAL_BULGES / 2) / 2) 
				&& (hour * 60) <= lowTides[i] + ((MINUTES_BETWEEN_TIDAL_BULGES / 2) / 2)){
				
				hourIsDuringLowTide = true
				break
			}
		}
		if (hourIsDuringLowTide){
			influenceArr.push(2)
		} else {
			influenceArr.push(1)
		}
	}

	return Math.min(...influenceArr)
}


/**
 * Gets the tide's influence on the score for activities that take into account slackwater.
 * @param {array} highTides an array of at most two numbers, representing the time of the high tides of the day containing the time period being analized. Units are minutes since midnight.
 * @param {number} hour a number representing the current hour. Function proceeds as if analyzing a whole day if hour is negative.
 * @returns a number representing the influence of the tides on the activity based on proximity to slackwater.
 */
function getSlackwaterInfluence(highTides, hour){
	var influenceScore = 0
	if (hour < 0){
		var numSlackWaterInDaylight = 0
		var todaysTidalPeaks = []
		todaysTidalPeaks.push(...highTides)
		
		//calculate the low tides around the high tides and add them to the array.
		for (var i = 0; i < highTides.length; i++){
			if (highTides[i] - (MINUTES_BETWEEN_TIDAL_BULGES / 2) > 0){
				todaysTidalPeaks.push(highTides[i] - (MINUTES_BETWEEN_TIDAL_BULGES / 2))
			}
			if (highTides[i] + (MINUTES_BETWEEN_TIDAL_BULGES / 2) < (HOURS_IN_DAY * 60)){
				todaysTidalPeaks.push(highTides[i] + (MINUTES_BETWEEN_TIDAL_BULGES / 2))
			}
		}

		//remove duplicates
		todaysTidalPeaks = [...new Set(todaysTidalPeaks)]

		//count slackwaters that are partially or wholly between 6am and 6pm
		for (var i = 0; i < todaysTidalPeaks.length; i++){
			if ((todaysTidalPeaks[i] - 60) >= SIX_AM_IN_MINUTES && (todaysTidalPeaks[i] - 60) <= SIX_PM_IN_MINUTES){
				numSlackWaterInDaylight += 1
			} else if ((todaysTidalPeaks[i] + 60) >= SIX_AM_IN_MINUTES && (todaysTidalPeaks[i] + 60) <= SIX_PM_IN_MINUTES){
				numSlackWaterInDaylight += 1
			}
		}

		//Number of slackwaters minus one is the influence because there can only be two or three whole/partial slackwaters during daylight.
		//Three is rare though
		influenceScore = numSlackWaterInDaylight - 1
	} else {
		var isInSlackWater = false
		for (var i = 0; i < highTides.length; i++){
			//calculate the low tides around the high tide
			lowTides = []
			if (highTides[i] - (MINUTES_BETWEEN_TIDAL_BULGES / 2) > 0){
				lowTides.push(highTides[i] - (MINUTES_BETWEEN_TIDAL_BULGES / 2))
			}
			if (highTides[i] + (MINUTES_BETWEEN_TIDAL_BULGES / 2) < (HOURS_IN_DAY * 60)){
				lowTides.push(highTides[i] + (MINUTES_BETWEEN_TIDAL_BULGES / 2))
			}
			
			//slack water is approximately an hour before and after high and low tide
			if ((hour * 60) >= highTides[i] - 60 && (hour * 60) <= highTides[i] + 60){
				isInSlackWater = true
				influenceScore = 2
				break
			} else {
				for (var j = 0; j < lowTides.length; j++){
					if((hour * 60) >= lowTides[i] - 60 && (hour * 60) <= lowTides[i] + 60){
						isInSlackWater = true
						influenceScore = 1
						break
					}
				}
			}
		}
		if (!isInSlackWater){
			influenceScore = 0
		}
	}
	return influenceScore
}