var addGuideButton = document.getElementById("add-guide-button")
var modalCancelButtons = document.getElementsByClassName("guide-creation-modal-cancel")
var modalSubmitButton = document.getElementById("guide-creation-modal-submit")

document.body.addEventListener("click", function (event){
	var elementClicked = event.target

	if (elementClicked === addGuideButton){
		toggleModal()
		return
	}

	if (elementClicked === modalSubmitButton){
		addNewGuide()
		return
	}

	for (var i = 0; i < modalCancelButtons.length; i++){
		if (elementClicked === modalCancelButtons[i]){
			toggleModal()
			return
		}
	}
})

function toggleHidden(elementToHide){
	elementToHide.classList.toggle("hidden")
}

function toggleModal(){
	toggleHidden(document.getElementById("guide-creation-modal"))
	toggleHidden(document.getElementById("modal-dimming-area"))
}

function addNewGuide(){
	//get the title description and thumbnail url
	var guideTitle = document.getElementById("guide-creation-modal-title-input").value
	var guideDescription = document.getElementById("guide-creation-modal-description-input").value
	var guideThumbnailURL = document.getElementById("guide-creation-modal-image-url").value

	var guideElement = document.createElement("article")
	guideElement.classList.add("guide-partial")
	
}