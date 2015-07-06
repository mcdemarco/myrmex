//
// This file was created by Felbrigg Herriot and remixed by M. C. DeMarco, and is released under a Creative Commons Attribution NonCommercial ShareAlike 3.0 License
//

//
// Global Variables
//
var defaultSettings = {speed: 300,
					   magnification: false,
					   blackmoons: true,
					   level: 'minor'};
var speed;
var foundArray = [];


//
// runs when the page first loads
//
function init() {

	//Settings.
	// need speed first.
	speed = getSetting('speed');
	$('input#speed').val(speed);
	
	//speed monitor
	$('input#speed').change(function() {
		if (parseInt($("input#speed").val()) > -1)
			speed = parseInt($("input#speed").val());
		setSetting('speed',speed);
	});

	// need magnification to set up the button
	// This is a little awkward but will be cleaned up later for a third option
	if (getSetting('magnification') == true) {
		$('body').addClass('embiggen1');
		$('#plusButton').html("Normal");
	}
	$('#plusButton').click(function () {
		$('body').toggleClass('embiggen1');
		if ($('#plusButton').html() == "Enlarge") {
			setSetting('magnification',true);
			$('#plusButton').html("Normal");
		} else {
			setSetting('magnification',false);
			$('#plusButton').html("Enlarge");
		}
	});

	//Fill in the rest of the settings form
	$("input[name=level]").val([getSetting('level')]);
	$("input#emblacken").prop("checked",getSetting('blackmoons'));
	
	
	// set up the click events for the panels
	$('#showStoryButton').click(function () {
		$('.panel').hide();
		$('#whatsthestory').fadeIn(speed);
	});
	$('#settingsButton').click(function () {
		$('.panel').hide();
		$('#settingsPanel').fadeIn(speed);
	});
	$('#creditsButton').click(function () {
		$('.panel').hide();
		$('#gameCredits').fadeIn(speed);
	});
	$('.close.button').click(function () {
		$('.panel').hide();
	});
	
	// event for the startbuttonclick
	$('#startButton').click(function () {
		startButtonClick();
	});
	
	initialiseDeck();
}

function initialiseDeck(again) {

	// Build a deck of myrmex cards
	deck = myrmexCreateDeck();

	// create the on screen card image tags
	createOnScreenCards(again);

}

//
// Start button click event
//
function startButtonClick() {
	$('.panel').hide();

	moveDeckBackToDrawDeck();
	//Set the other two settings here for convenience.
	if (getSetting('level') != $("input[name=level]:checked").val() || getSetting('blackmoons') != $("input#emblacken").is(":checked")) {
		setSetting('level', $("input[name=level]:checked").val());
		setSetting('blackmoons', $("input#emblacken").is(":checked").toString());
		//If these values have changed since the deck was created, then we need to recreate it.
		initialiseDeck(true);
	}
	//Make this optional.
	decktetShuffle(deck);
	stackDeck();
	//Deal to the foundation 4 times plus more for variants
	dealTheFoundation();
	//Initialize the card motion.
	refreshDragsDrops();
}

function moveDeckBackToDrawDeck() {
	$("#drawDeckLocation").addClass("full");
	for (var i = 0; i < deck.length; i++) {
		deck[i].Selected = false;
		moveCardToSpace(i, 'drawDeckLocation', 0.1);
		$(deck[i].selector).removeClass('cardselected').addClass('teeny');
	}
}

function isBlind() {
	var level = getSetting('level');
	if (level == "minor" || level == "blindMajor" || level == "blindQueen" || level == "double")
		return true;
	else
		return false;
}

//
// move specified card to a new location
//
function moveCardToSpace(indexOfCard, spaceID, delayUnits) {
	if (typeof delayUnits == 'undefined') delayUnits = 1;
	var delay = delayUnits * speed;
	if (spaceID == "drawDeckLocation") {
		$(deck[indexOfCard].selector).addClass("teeny",1);
	} else {
		$(deck[indexOfCard].selector).removeClass("teeny",1);
		var spaceIndex = getIndexOfFoundation(spaceID);
		var shift = getShiftOfFoundation(spaceIndex);
		//console.log(spaceIndex + ", " + (shift + 1) + ": " + indexOfCard);
		if (shift < 0) {
			$("#" + spaceID).append($(deck[indexOfCard].selector));
		} else {
			//Needs transitions.
			$(deck[foundArray[spaceIndex][shift]].selector).append($(deck[indexOfCard].selector));
			//Need to get the delay/transition onto removeClass.
			//$(deck[indexOfCard].selector).css("z-index",shift).delay(delay).transition({left:targetOffset.left, top:targetOffset.top + 22*shift},speed,"snap").removeClass("teeny",1);
		}
		$(deck[indexOfCard].selector).css("z-index",(shift+1));
		//Add to array, cleaning up any old version.
		var old = getIndexOfFoundation(deck[indexOfCard].Location);
		if (old >= 0) {
			//If it existed, pop from its previous array location.
			foundArray[old].pop();
			//Draggable is messing up lots of CSS, so unmess (z-index still messed up).
			$(deck[indexOfCard].selector).css({"top":22,"left":0,"z-index":(shift + 1)});
		} else if (shift >= 0) {
			//If it didn't exist, it needs some CSS.
			$(deck[indexOfCard].selector).css("top",22);
		}
		foundArray[spaceIndex].push(indexOfCard);
	}
	// reset cards location
	deck[indexOfCard].Location = spaceID;
	//$(deck[indexOfCard].selector + " img").delay(delay).transition({width:124, height:174});
	if (deck[indexOfCard].FaceUp && $(deck[indexOfCard].selector + " img").is(":visible"))
		$(deck[indexOfCard].selector + " img").delay(delay).hide();
	else if (!deck[indexOfCard].FaceUp && !$(deck[indexOfCard].selector + " img").is(":visible"))
		$(deck[indexOfCard].selector + " img").delay(delay).show();
}

function getIndexOfFoundation(spaceID) {
	if (spaceID.indexOf("foundation") != 0)
		return -1;
	else
		return parseInt(spaceID.split("foundation")[1],10)-1;
}

function getShiftOfFoundation(foundIndex) {
	//Calculate the foundArray index of the top card in the current space.
	return foundArray[foundIndex].length - 1;
}

//
// get index of the top card in the drawdeck
//
function getIndexOfTopCardOnDrawDeck() {
	var returnValue = -1;
	for (var i = 0; i < deck.length; i++) {
		if (deck[i].Location == 'drawDeckLocation') {
			returnValue = i;
			break;
		}
	}
	return returnValue;
}

// deal cards to the foundation/tableau

function dealTheFoundation() {
	//Create the foundation array.
	for (var f=0; f<8;f++) foundArray[f] = [];
	//Deal the whole foundation at the start.
	var row;
	var vari = getVariant();
	for (row=1;row<=3;row++) {
		dealToTheFoundation(isBlind(),(row-1)*8);
	}
	row = 4;
	if (vari == 'minor' || vari == 'queen') {
		dealToTheFoundation(false,(row-1)*8,true);
	} else {//major and double, for now
		for (var p=0;p<6;p++)
			dealCardToTheFoundation(p,isBlind(),(row-1)*8 + p);
		row = 5;
			dealToTheFoundation(false,(row-1)*8,true);
	}
}

function dealToTheFoundation(faceDown,delayUnits) {
	//Deal a row of the foundation, optionally face down.
	for (var f=0;f<8;f++) {
		dealCardToTheFoundation(f,faceDown,delayUnits + f);
	}
}

function dealCardToTheFoundation(foundationNo,faceDown,delayUnits) {
	//Deal a card to a foundation location.
	var c = getIndexOfTopCardOnDrawDeck();
	if (c >= 0) {
		//foundArray[foundationNo].push(c);
		//deck[c].Location = "foundation" + (foundationNo + 1);
		deck[c].FaceUp = !faceDown;
		moveCardToSpace(c, "foundation" + (foundationNo + 1), delayUnits);
	}
}

function refreshDragsDrops() {
	//Refresh all dragging and dropping bindings.
	for (var f=0;f<8;f++)
		refreshDragDrop(f);
}

function refreshDragDrop(foundIndex) {
	//Refresh dragging and dropping bindings for a single foundation stack.
	var length = foundArray[foundIndex].length;
	//We always know what happens with the top card.
	var card = deck[foundArray[foundIndex][length-1]];
	//Stack not working.
	$(card.selector).draggable({zIndex:100,stack:'.card',scope:card.Value,revert:'invalid'});
	$(card.selector).droppable({scope:(card.Value - 1),drop:function(event, ui){dropper(foundArray[foundIndex][c],$(ui.draggable).prop("id"));}});
	//Check the other cards for suit.
	for (var c=0;c<length-1;c++) {
		card = deck[foundArray[foundIndex][c]];
		//Can only drop on the top card.
		$(card.selector).droppable({disabled:true});
		//Check suits...
		//if (suits satisfactory) {
		//		$(card.selector).draggable({zIndex:100,scope:card.Value,revert:'invalid'});
		//} else {
		$(card.selector).draggable({disabled:true});
		//}
	}
}

function dropper(droppedOnMeIndex,dragAndDropMeID) {
	//Officially move the card.
	console.log("drop " + dragAndDropMeID + " on " + deck[droppedOnMeIndex].divID);
	moveCardToSpace(getIndexOfCardFromID(dragAndDropMeID), deck[droppedOnMeIndex].Location, 0);
	//Update all the draggability:
	//1. thisDropped should no longer be draggable in most cases.
	//1a. thisDropped should definitely not be droppable.
	//2. update draggability for the stack it came from and possibly flip.
}


/* not useful? */
//
// deselect cards on specified row
//
function deselectAllCardsOnRow(rowName) {
	for (var i = 0; i < deck.length; i++) {
		if (deck[i].Location.substring(0, rowName.length) == rowName) {
			if (deck[i].Selected == true) {
				deck[i].Selected = false;
				$(deck[i].selector).removeClass('cardselected');
			}
		}
	}
}

//
// The Game is over as there are no available moves
//
function gameIsOver(delayUnits) {
	gameOVER = true;
	delayUnits = typeof delayUnits !== 'undefined' ? delayUnits : 0;
	$('#gameOver').delay(delayUnits * speed).show(speed);
}








/* back to useful */

//
// get card index based on id
//
function getCardIndexByID(theID) {
	var returnValue = -1;
	for (var i = 0; i < deck.length; i++) {
		if (deck[i].divID == theID) {
			returnValue = i;
			break;
		}
	}
	return returnValue;
}

//
// create a deck of cards suitable for Myrmex
//
function myrmexCreateDeck() {
	var level = getSetting('level');
	var myrmexDeck = decktetCreateDeck((level == "double" ? 4 : 2));
	//myrmexify
	myrmexDeck = decktetRemoveTheExcuse(myrmexDeck);
	myrmexDeck = decktetRemoveRankByDeckNo(myrmexDeck,1,2);
	myrmexDeck = decktetRemoveRankByDeckNo(myrmexDeck,10,2);
	if (level == "double") {
		myrmexDeck = decktetRemoveRankByDeckNo(myrmexDeck,1,4);
		myrmexDeck = decktetRemoveRankByDeckNo(myrmexDeck,10,4);
	}
	if (level == "minor" || level == "larval") {
		//The normal deck.
		myrmexDeck = decktetRemoveCOURT(myrmexDeck);
		myrmexDeck = decktetRemovePAWN(myrmexDeck);
	} else {
		//Remove the unwanted Pawns.
		myrmexDeck = decktetRemoveCardByName(myrmexDeck,'the LIGHT KEEPER');
		if (level == "major" || level == "blindMajor") {
			//Remove all the Courts.
			myrmexDeck = decktetRemoveCOURT(myrmexDeck);
		} else {
			//Remove the unwanted Courts.
			myrmexDeck = decktetRemoveCardByName(myrmexDeck,'the RITE');
		}
	}
	
	myrmexDeck = decktetShuffle(myrmexDeck);
	for (var i = 0; i < myrmexDeck.length; i++) {
		myrmexDeck[i].Location = 'drawDeckLocation';
		myrmexDeck[i].divID = myrmexDeck[i].Name.replace(/\s+/g, '') + myrmexDeck[i].DeckNo;
		myrmexDeck[i].selector = '#' + myrmexDeck[i].divID;
		//Tweak values of pawns and courts.
		if (myrmexDeck[i].Rank == "PAWN")
			myrmexDeck[i].Value = 10;
		if (myrmexDeck[i].Rank == "COURT")
			myrmexDeck[i].Value = 11;
		if (myrmexDeck[i].Rank == "CROWN") {
			if (level == "major" || level == "blindMajor")
				myrmexDeck[i].Value = 11;
			if (level == "queen" || level == "blindQueen" || level == "double")
				myrmexDeck[i].Value = 12;
		}
	}
	return myrmexDeck;
}

//
// create a series of image tags and load up the card images.
// 
function createOnScreenCards(again) {
	pleaseWaitOn();
	if (again) {
		//Delete existing cards.
		$(".card").remove();
	}
//	var p = $('#drawDeckLocation').offset();
	for (var i = deck.length - 1; i >= 0; i--) {
		createOnScreenCard(deck[i],i);
//		$(deck[i].selector).css({ top: 0, left: 0 });
		//For touch?
		$(deck[i].selector).click(shifter);
		//Big draggability problems.
		//$(deck[i].selector).hover(shifter, unshifter);
	}
	pleaseWaitOff();
}

//
// create an on-screen card element
//
function createOnScreenCard(card,index) {
	var emblacken = getSetting('blackmoons');
	var cardImage = card.Image;
	if (emblacken && (card.Suit1 == "Moons" || card.Suit2 == "Moons" || card.Suit3 == "Moons"))
		cardImage = cardImage.split(".png")[0] + "_black.png";
	var imageLit = '<div id="' + card.divID + '" class="teeny card" style="background-image:url(cards/' + cardImage + ');"><img src="cards/back.png" /></div>';
	$(imageLit).appendTo('#drawDeckLocation');
	if (card.FaceUp) 
		$("#" + card.divID + " img").hide();
}

//
// stack the cards
//
function stackDeck() {
	for (var i = 0; i < deck.length; i++) {
		$(deck[i].selector).css("z-index",deck.length-i);
	}
}


//
// "Please wait" functions
//
function pleaseWaitOn() { $('#pleaseWait').show();}
function pleaseWaitOff() { $('#pleaseWait').hide();}


function getIndexOfCardFromID(ID) {
	for (var i = 0; i < deck.length; i++) {
		if (deck[i].divID == ID) {
			return i;
		}
	}
	return -1;
}

function getSetting(setting) {
	if (window.localStorage && typeof window.localStorage.getItem(setting) !== 'undefined' && window.localStorage.getItem(setting) !== null) {
		var value;
		try {
			value = window.localStorage.getItem(setting);
		} catch (e) {
			value = defaultSettings[setting];
		}
		if (setting == 'blackmoons' || setting == 'magnification')  value = (value.toLowerCase() === "true");
		return value;
	} else {
		return defaultSettings[setting];
	}
}

function setSetting(setting, value) {
	if (window.localStorage) {
		try {
			window.localStorage.setItem(setting, value);
			return true;
		} catch (e) {
			return false;
		}
	} else {
		return false;
	}
}

function getVariant() {
	//Get a simpler version of the level.
	var level = getSetting('level');
	if (level == 'major' || level == 'blindMajor') return 'major';
	if (level == 'queen' || level == 'blindQueen') return 'queen';
	if (level == 'double') return 'double';
	return 'minor';
}


function shifter(event) {
	event.stopPropagation();
	//Shift cards for visibility on hover or click
	if (!$(this).hasClass("card") || $(this).find("img").is(":visible")) return;
	unshifter();
	var cardID = this.id;
	var startShift = $("#" + cardID).parents(".card").length;
	console.log(cardID + ": " + startShift);
	var foundation = deck[getCardIndexByID(cardID)].Location;
	if ($("#" + foundation).hasClass("shifted")) {
		//Toggle.
		$("#" + foundation).removeClass("shifted");
		unshifter();
		return;
	} else {
		$("#" + foundation).addClass("shifted");
	}
	var foundationNo = getIndexOfFoundation(foundation);
	for (var s=startShift+1;s<foundArray[foundationNo].length; s++) {
		$(deck[foundArray[foundationNo][s]].selector).css("margin-left",22);// * (s - startCard));
	}
}

function unshifter() {
	//Undo the shift.
	$(".card").css("margin-left",0);
}
