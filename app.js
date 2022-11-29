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

/* var client = new net.Socket()
app.get("/", function (req, res, next){
	client.connect(5000, os.hostname(), function (){
		client.write("GETONWATERTEMP,65,85")
	})
	client.on("data", function (data){
		console.log("recieved: " + data)
		client.destroy()
		res.status(200).write("Recieved: " + data)
		res.end()
	})
}) */

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
 * @param {Date} dateObj 
 * @returns a string containing the date stored in dateObj formatted as mm-dd-yyyy
 */
function getDateString(dateObj){
	day = String(dateObj.getDate()).padStart(2, "0")
	month = String(dateObj.getMonth() + 1).padStart(2, "0")
	year = String(dateObj.getFullYear())
	return month + "-" + day + "-" + year
}


/**
 * Used to create a call to the relevant APIs at the same time every day.
 */
var job = cron.job("*/5 * * * * *", async function (){
	var hourlyForecastUrl = await getHourlyForecastUrl()
	console.log(hourlyForecastUrl)
	var todaysHourlyForecast = await getTodaysHourlyForecast(hourlyForecastUrl)
	console.log(todaysHourlyForecast)
})
job.start()


weatherAPIcalloptions = {
	headers: {
		"User-Agent": "(lokrantj@oregonstate.edu)",
		"Accept": "application/geo+json"
	}
}
function getHourlyForecastUrl(){
	console.log("Getting gridpoint from weather.gov api.")
	return new Promise((resolve, reject) => {
		https.get("https://api.weather.gov/points/44.2271,-124.1096", weatherAPIcalloptions, (resp) => {
			var data = ""
	
			resp.on("data", (chunk) => {
				data += chunk
			})
	
			resp.on("end", () => {
				console.log("Recieved:")
				console.log(JSON.parse(data))
				resolve(JSON.parse(data).properties.forecastHourly)
			})
		}).on("error", (error) => {
			reject(error)
		})
	})
}


function getTodaysHourlyForecast(hourlyForecastUrl){
	return new Promise((resolve, reject) => {
		https.get(hourlyForecastUrl, weatherAPIcalloptions, (resp) => {
			var data = ""
	
			resp.on("data", (chunk) => {
				data += chunk
			})
	
			resp.on("end", () => {
				var hourlyForecast = JSON.parse(data).properties.periods
				var todaysHourlyForecast = []
				for (var i = 0; i < 24; i++){
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