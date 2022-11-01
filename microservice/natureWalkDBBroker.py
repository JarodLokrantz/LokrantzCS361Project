import time
import os
import csv


def main():
	dataFile = open("natureWalkData.csv")
	natureWalkData = csv.reader(dataFile)

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
					
		requestFile.close()
		print(request.results)
	dataFile.close()

def parseRequest(requestText):
	""" request = []
	currentWord = 0
	for line in requestText:
		lineWords = line.split(" ")
		for i in range(lineWords.len()):
			word = lineWords[i]
			if word == "{" or word == "}":
				continue
			if word.endswith(":"):
				#if the word defines an attribute or value of an attribute, save the word without the colon or comma.
				word = word[:-1]

			request[currentWord] = word
	return request """

	request = None
	lines = requestText.splitlines()

	requestName = lines[0].strip(" {")
	print(requestName)
	if requestName.upper() == "FIND":
		request = FindNatureWalkQuery()
	elif requestName.upper() == "NEW":
		request = NewNatureWalkQuery()
	

	line = 1
	while lines[line] != "}":
		lineWords = lines[line].split(" ")
		attribute = lineWords[0].strip("\t:")
		value = lineWords[1].strip(",")
		print("Att: " + str(attribute) + "; Val: " + str(value))
		request.addCriteria(attribute, value)
		line += 1
	
	request.execute()
	return request


class FindNatureWalkQuery:
	def __init__(self):
		self.criteria = ["time", None, "distance", None, "Notes", None, "pictureURL", None]
		self.results = []
	
	def addCriteria(self, attribute, value):
		if attribute == "time":
			self.criteria[1] = value
		elif attribute == "distance":
			self.criteria[3] = value
		elif attribute == "Notes":
			self.criteria[5] = value
		elif attribute == "pictureURL":
			self.criteria[7] = value
		else:
			raise "attribute error"
	
	def execute(self):
		dataFile = open("natureWalkData.csv")
		natureWalkDataFile = csv.reader(dataFile)

		natureWalkData = []
		for row in natureWalkDataFile:
			natureWalkData.append(row)

		matchingQueries = []
		for i in range(1, len(natureWalkData)):
			numMatching = 0
			if self.criteria[1] is None or self.criteria[1] == natureWalkData[i][0]:
				numMatching += 1
			if self.criteria[3] is None or self.criteria[3] == natureWalkData[i][1]:
				numMatching += 1
			if self.criteria[5] is None or self.criteria[5] == natureWalkData[i][2]:
				numMatching += 1
			if self.criteria[7] is None or self.criteria[7] == natureWalkData[i][3]:
				numMatching += 1

			print(numMatching)

			if numMatching == 2:
				matchingQueries.append(natureWalkData[i])
		
		self.results = matchingQueries
		dataFile.close()



class NewNatureWalkQuery:
	def __init__(self):
		self.criteria = ["time", None, "distance", None, "Notes", None, "pictureURL", None]
	
	def execute(self):
		dataFile = open("natureWalkData.csv", "a")
		csvFile = csv.writer(dataFile, delimiter=",")
		newCsvLine = []

		for i in range(1, len(self.criteria), 2):
			newCsvLine.append("" if self.criteria[i] is None else self.criteria[i])

		csvFile.writerow(newCsvLine)

		dataFile.close()

if __name__ == "__main__":
	main()