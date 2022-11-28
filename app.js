/**
 * Server Setup
 */
//importing libraries
var os = require("os")
var fs = require("fs")
var express = require("express")
var exphbrs = require('express-handlebars')
var net = require("net")

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
	try {
		receivedData = await queryDB("GETONDATE,07-31-2022,07-31-2022")
	} catch (error){
		res.status(500).send(error)
		return
	}
	console.log(receivedData)
	res.status(200).render("homepage", {
		data: receivedData,
		pageTitle: "Homepage"
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
			resolve(data)
		})
		client.on("error", function (){
			reject(error)
		})
		client.write(queryTerm)
	})
}

