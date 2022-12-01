var activityDropdown = document.getElementById("today-activity-selector")
activityDropdown.addEventListener("input", updateRowColorsOnActivityDropdownValue)

updateRowColorsOnActivityDropdownValue()

function updateRowColorsOnActivityDropdownValue(event){
	var activityDropdownValue = document.getElementById("today-activity-selector").value
	var allTableRows = document.getElementsByClassName("hourly-forecast-table-row")
	
	var scoreClassPrefix = activityDropdownValue.toLowerCase() + "-score-"
	var scoreClasses = [
		scoreClassPrefix + "0", 
		scoreClassPrefix + "1", 
		scoreClassPrefix + "2"
	]
	
	for (var i = 0; i < allTableRows.length; i++){
		if (allTableRows[i].classList.contains(scoreClasses[0])){
			allTableRows[i].style.backgroundColor = "#d66565"	//red
		} else if (allTableRows[i].classList.contains(scoreClasses[1])){
			allTableRows[i].style.backgroundColor = "#d6b560"	//yellow
		} else if (allTableRows[i].classList.contains(scoreClasses[1])){
			allTableRows[i].style.backgroundColor = "#6cd660"	//green
		}
	}
}