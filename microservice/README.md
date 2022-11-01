A request to the microservice includes 3 parts: the command, the {} brackets, and the attributes with values in the following form:

[FIND || NEW] {
	attribute_name: value,
	attribute_name: value
}

The formatting is important until I can increase the robustness of the parser.


|-----------------|  |----------------|     |-----------------|
|   Program       |  |   Microservice |     |   Database/Csv  |
|-----------------|  |----------------|     |-----------------|
        |                    |                       |
		|                    |                       |
		_    FIND or NEW     _                       |
	   | |----------------> | |Search for/add entry  _
	   | |                  | |-------------------->| |
	   | |                  | |                     | |
	   | |                  | |<--------------------|_|
	   |_|<-----------------|_|Return results/confirmation
	    Response with a list   
		of results or a 
		confirmation that 
		the new entry was 
		added.
