var fs = require("fs")
var express = require("express")
var exphbrs = require('express-handlebars')
var net = require("net")

var port = 4008
var socketport = 5000

var app = express()
app.engine("handlebars", exphbrs.engine())
app.set("view engine", "handlebars")

app.listen(port, function (){
	console.log("Server is listening on port: ", port)
})

var client = new net.Socket()
app.get("/", function (req, res, next){
	client.connect(5000, "JarodsYoga", function (){
		client.write("GETONWATERTEMP,65,85")
	})
	client.on("data", function (data){
		console.log("recieved: " + data)
		client.destroy()
		res.status(200).write("Recieved: " + data)
		res.end()
	})
})