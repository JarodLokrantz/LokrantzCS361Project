import time
import csv


def main():
	exit = False
	while exit == False:
		time.sleep(3)
		requestFile = open("natureWalkDataRequest.txt")
		requestText = requestFile.read()
		
		#check if no request has been made
		if len(requestText) == 0:
			requestFile.close()
			continue

		#Parse request if one has been made
		request = parseRequest(requestText)

		#Close file for reading and clear it so duplicate requests aren't made
		requestFile.close()
		open("natureWalkDataRequest.txt", "w").close()

		#if the request is to halt the microservice, quit the loop and end the program
		if (request is None):
			exit = True
			continue
		elif type(request) == str:
			continue

		#Write the results back to natureWalkDataResponse.txt
		responseFile = open("natureWalkDataResponse.txt", "w")
		for entry in request.results:
			if entry is request.results[-1]:
				responseFile.write("%s\n" % entry)
			else:
				responseFile.write("%s,\n" % entry)
		responseFile.close()
				

def parseRequest(requestText):
	request = None
	lines = requestText.splitlines()

	#determine the user's command and create an appropriate query object
	requestName = lines[0].strip(" {")
	print(requestName.upper())
	if requestName.upper() == "FIND":
		request = FindNatureWalkQuery()
	elif requestName.upper() == "NEW":
		request = NewNatureWalkQuery()
	elif requestName.upper() == "EXIT":
		return request
	else: 
		print("\tInvalid command.")
		return requestName
	
	#Add search/insert criteria to the query based on the data in the provided requestText
	for line in lines[1:-1]:
		cleanLine = line.strip("\t")
		attributeValuePair = cleanLine.split(":")
		attributeValuePair[1] = attributeValuePair[1].strip(" ,")
		request.addCriteria(attributeValuePair[0], attributeValuePair[1])
	
	#Execute the query with the added criteria and return the fulfilled request object
	request.execute()
	return request


class NatureWalkQuery:
	""" def __init__(self):
		self.criteria = {
			"entry_num": None,
			"time": None,
			"distance": None,
			"notes": None,
			"pictureURL": None
		} """
	def __init__(self):
		self.criteria = {
			"entry_num": None,
			"user_id": None,
			"password": None,
			"date": None,
			"distance": None,
			"duration": None,
			"location_address": None,
			"location_city": None,
			"location_zip": None,
			"location_state": None,
			"location_country": None,
			"notes": None,
			"picture_name": None,
			"picture_storage": None
		}
		self.results = [] 

	def addCriteria(self, attribute, value):
		self.criteria[attribute] = value
		return self


class FindNatureWalkQuery(NatureWalkQuery):
	def addCriteria(self, attribute, value):
		self.criteria[attribute] = value
	
	def execute(self):
		#Open and load CSV
		dataFile = open("natureWalkData.csv")
		natureWalkDataFile = csv.reader(dataFile)

		#Create iterable list from CSV
		natureWalkData = []
		for row in natureWalkDataFile:
			natureWalkData.append(row)

		#Examine each entry for query matches
		matchingQueries = []
		for i in range(1, len(natureWalkData)):
			
			#Create a dictionary out of the list element of natureWalkData that is currently being examined
			keys = [label for label in natureWalkData[0]]
			natureWalkDict = dict.fromkeys(keys)
			idx = 0
			for key in keys:
				natureWalkDict.update({key: natureWalkData[i][idx]})
				idx += 1

			#Create a dictionary of all items whose keys are in both natureWalkDict and self.criteria and have the
			# same value in both dictionaries (or the matching item in self.criteria is None)
			shared_items = {k: natureWalkDict[k] for k in natureWalkDict if k in self.criteria and (natureWalkDict[k] == self.criteria[k] or self.criteria[k] is None)}

			#If all attributes match or are None in the criteria, add the current nature walk to the list of
			# matching queries.
			if len(shared_items) == len(natureWalkData[0]):
				matchingQueries.append(natureWalkData[i])
		
		#save the matching queries to results and close the file
		self.results = matchingQueries
		dataFile.close()

		return self



class NewNatureWalkQuery(NatureWalkQuery):
	def execute(self):
		#Open dataFile to count current number of entries for entry_num calculation
		dataFile = open("natureWalkData.csv", "r")
		csvFile = csv.reader(dataFile, delimiter=",")

		newEntryNum = sum(1 for row in csvFile)
		self.addCriteria("entry_num", str(newEntryNum))

		dataFile.close()

		#Open dataFile in which to append
		dataFile = open("natureWalkData.csv", "a", newline="")
		csvFile = csv.writer(dataFile, delimiter=",")
		newCsvLine = []

		#Create iterable from which to write the row
		for val in self.criteria.values():
			newCsvLine.append("" if val is None else val)

		csvFile.writerow(newCsvLine)
		dataFile.close()

		#Test that the new entry is really in the datafile by performing a find query on it with the calculated new entry_num
		testRequest = FindNatureWalkQuery()
		testRequest.addCriteria("entry_num", str(newEntryNum))
		testRequest.execute()

		#Write to natureWalkDataResponse.txt the status of the NEW query based on the results of the find query above
		if len(testRequest.results) > 0:
			self.results.append("0")
		else:
			self.results.append("1")
			self.results.append("There was an issue trying to add the new entry to the CSV file.")


		return self

if __name__ == "__main__":
	main()