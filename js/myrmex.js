//
// This implementation of Myrmex is by M. C. DeMarco, based on an implementation of Adaman by Felbrigg Herriot, released under a Creative Commons Attribution NonCommercial ShareAlike 3.0 License
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
		$('body').addClass('magnify');
		$('#plusButton').html("Normal");
	}
	$('#plusButton').click(function () {
		$('body').toggleClass('magnify');
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
	
	// events for the start/replay buttons
	$('#startButton').click(function () {
		startButtonClick();
	});
	$('#replayButton').click(function () {
		startButtonClick(true);
	});
	
	initializeDeck();
}

function initializeDeck(again) {

	// Build a deck of myrmex cards
	deck = myrmexCreateDeck();

	// create the on screen card image tags
	createOnScreenCards(again);

}

//
// Start button click event
//
function startButtonClick(replay) {
	$('.panel').hide();

	//Set the other two settings here for convenience.
	if (getSetting('level') != $("input[name=level]:checked").val() || getSetting('blackmoons') != $("input#emblacken").is(":checked")) {
		setSetting('level', $("input[name=level]:checked").val());
		setSetting('blackmoons', $("input#emblacken").is(":checked").toString());
		//If these values have changed since the deck was created, then we need to recreate it.
		initializeDeck(true);
	} else {
		createOnScreenCards(true);
	}
	foundArray = [];

	if (!replay)
		decktetShuffle(deck);
	//stackDeck();
	//Deal to the tableau 4 times plus more for variants
	dealTheTableau();
	//Initialize the card motion.
	refreshDragsDrops();

	//Init dealer.
	$("#drawDeckLocation").click(function () {
		dealToTheTableau(false);
		refreshDragsDrops();
	});	
}

function isBeetle() {
	var level = getSetting('level');
	if (level == "minor" || level == "beetleMajor" || level == "beetleQueen" || level == "double")
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
	var spaceIndex = getIndexOfTableau(spaceID);
	var shift = getShiftOfTableau(spaceIndex);
	var card = deck[indexOfCard];
	//console.log(spaceIndex + ", " + (shift + 1) + ": " + indexOfCard);
	if (shift < 0) {
		$("#" + spaceID).append($(card.selector));
		$(card.selector).delay(delay).show();
	} else {
		//Needs transitions.
		$(deck[foundArray[spaceIndex][shift]].selector).append($(card.selector));
		$(card.selector).delay(delay).show();
		//Need to get the delay/transition onto removeClass.
		//$(card.selector).css("z-index",shift).delay(delay).transition({left:targetOffset.left, top:targetOffset.top + 22*shift},speed,"snap").show();
	}
	$(card.selector).css("z-index",(shift+1));
	//Add to array, cleaning up any old version.
	var oldColumn = getIndexOfTableau(card.Location);
	var removed = [];
	if (oldColumn >= 0) {
		//If it existed, pop it and any children from its previous array location and push onto new location.
		var pops = $(card.selector).find('.card').length + 1;
		removed = foundArray[oldColumn].splice(foundArray[oldColumn].length - pops,pops);
		foundArray[spaceIndex] = foundArray[spaceIndex].concat(removed);
		console.log("removed " + removed + " from " + foundArray[oldColumn] + " to " + foundArray[spaceIndex]);
		
		//Draggable is messing up lots of CSS, so also unmess (z-index still messed up).
		$(card.selector).css({"top":22,"left":0,"z-index":(shift + 1)});
	} else if (shift >= 0) {
		//If it didn't exist, it needs some CSS and a push.
		$(card.selector).css("top",22);
		foundArray[spaceIndex].push(indexOfCard);
	} else {
		//Only push?
		foundArray[spaceIndex].push(indexOfCard);
	}

	// reset card locations, including fellow-travellers'
	card.Location = spaceID;
	for (var r=0;r<removed.length;r++)
		deck[r].Location = spaceID;
	
	//$(card.selector + " img").delay(delay).transition({width:124, height:174});
	if (card.FaceUp && $(card.selector + " img").is(":visible"))
		$(card.selector + " img").hide();
	else if (!card.FaceUp && !$(card.selector + " img").is(":visible"))
		$(card.selector + " img").show();
}

function getIndexOfTableau(spaceID) {
	if (spaceID.indexOf("tableau") != 0)
		return -1;
	else
		return parseInt(spaceID.split("tableau")[1],10)-1;
}

function getShiftOfTableau(foundIndex) {
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

function dealTheTableau() {
	//Create the tableau array.
	for (var f=0; f<8;f++) foundArray[f] = [];
	//Deal the whole tableau at the start.
	var row;
	var vari = getVariant();
	for (row=1;row<=3;row++) {
		dealToTheTableau(isBeetle(),(row-1)*8);
	}
	row = 4;
	if (vari == 'minor' || vari == 'queen') {
		dealToTheTableau(false,(row-1)*8,true);
	} else {//major and double, for now
		for (var p=0;p<6;p++)
			dealCardToTheTableau(p,isBeetle(),(row-1)*8 + p);
		row = 5;
			dealToTheTableau(false,(row-1)*8,true);
	}
}

function dealToTheTableau(faceDown,delayUnits) {
	//Deal a row of the tableau, optionally face down.
	for (var f=0;f<8;f++) {
		dealCardToTheTableau(f,faceDown,delayUnits + f);
	}
}

function dealCardToTheTableau(tableauNo,faceDown,delayUnits) {
	//Deal a card to a tableau location.
	var c = getIndexOfTopCardOnDrawDeck();
	if (c >= 0) {
		//foundArray[tableauNo].push(c);
		//deck[c].Location = "tableau" + (tableauNo + 1);
		deck[c].FaceUp = !faceDown;
		moveCardToSpace(c, "tableau" + (tableauNo + 1), delayUnits);
	} else {
		$("#drawDeckLocation").removeClass("full");
	}
}

function refreshDragsDrops() {
	//Refresh all dragging and dropping bindings in the tableau.
	for (var f=0;f<8;f++)
		refreshDragDrop(f);
}

function refreshDragDrop(foundIndex) {
	//Refresh dragging and dropping bindings for a single tableau stack.
	var length = foundArray[foundIndex].length;
	var card = deck[foundArray[foundIndex][length-1]];
	//Flip if appropriate.
	if (!card.FaceUp || $(card.selector + " img").is(":visible")) {
		card.FaceUp = true;
		$(card.selector + " img").hide();
	}

	//We always know what happens with the top card.  Note: Stack not working.
	$(card.selector).draggable({addClasses:false,disabled:false,zIndex:100,stack:'.card',scope:card.Value,revert:'invalid'});
	$(card.selector).droppable({addClasses:false,disabled:false,scope:(card.Value - 1),drop:function(event, ui){dropper(foundArray[foundIndex][length-1],$(ui.draggable).prop("id"));}});
	
	//To check the other cards for suit going upwards/inwards from the top/uppermost card, we cheat with classes.
	$(card.selector).addClass(card.Suit1 + " " + card.Suit2 + " " + card.Suit3);
	var prevCard = card;
	for (var c=length-2;c>=0;c--) {
		card = deck[foundArray[foundIndex][c]];
		if (!card.FaceUp) break;
		//Can only drop on the top card, so all these are disabled.
		$(card.selector).droppable({disabled:true});
		//Remove all suit classes and draggability before readding.
		$(card.selector).removeClass("Knots Leaves Moons Suns Waves Wyrms");
		$(card.selector).draggable({disabled:true});
		//Check values...
		if (card.Value != prevCard.Value + 1) break;
		//Check suits...
		if ($(prevCard.selector).hasClass(card.Suit1)) {
			$(card.selector).addClass(card.Suit1);
			$(card.selector).draggable({addClasses:false,disabled:false,zIndex:100,scope:card.Value,revert:'invalid'});
		}
		if (card.Suit2 && $(prevCard.selector).hasClass(card.Suit2)) {
			$(card.selector).addClass(card.Suit2);
			$(card.selector).draggable({addClasses:false,disabled:false,zIndex:100,scope:card.Value,revert:'invalid'});
		}
		if (card.Suit3 && $(prevCard.selector).hasClass(card.Suit3)) {
			$(card.selector).addClass(card.Suit3);
			$(card.selector).draggable({addClasses:false,disabled:false,zIndex:100,scope:card.Value,revert:'invalid'});
		}
		prevCard = card;
		//Check for foundation pile, probably also with classes, and remove.
		//   In this case we want to start the whole refresh over (so call refreshDragDrop again on the same index).
	}
}

function dropper(droppedOnMeIndex,dragAndDropMeID) {
	//Officially move the card.
	console.log("drop " + dragAndDropMeID + " on " + deck[droppedOnMeIndex].divID);
	var spaceID = deck[droppedOnMeIndex].Location;
	var cardIndex = getIndexOfCardFromID(dragAndDropMeID);
	var originalCardLocation = deck[cardIndex].Location;
	moveCardToSpace(cardIndex, spaceID, 0);
	refreshDragDrop(getIndexOfTableau(originalCardLocation));
	refreshDragDrop(getIndexOfTableau(spaceID));
	//Update all the draggability:
	//0. the drop recipient should no longer be draggable in most cases.
	//1. the drop recipient definitely should not be droppable.
	//2. update draggability for the stack it came from
	//3. possibly flip.
}



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
	myrmexDeck = decktetRemoveRankByDeckNo(myrmexDeck,'Ace',2);
	myrmexDeck = decktetRemoveRankByDeckNo(myrmexDeck,'CROWN',2);
	if (level == "double") {
		myrmexDeck = decktetRemoveRankByDeckNo(myrmexDeck,'Ace',4);
		myrmexDeck = decktetRemoveRankByDeckNo(myrmexDeck,'CROWN',4);
	}
	if (level == "minor" || level == "larval") {
		//The normal deck.
		myrmexDeck = decktetRemoveCOURT(myrmexDeck);
		myrmexDeck = decktetRemovePAWN(myrmexDeck);
	} else {
		//Remove the unwanted Pawns.
		myrmexDeck = decktetRemoveCardByName(myrmexDeck,'the LIGHT KEEPER');
		if (level == "major" || level == "beetleMajor") {
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
			if (level == "major" || level == "beetleMajor")
				myrmexDeck[i].Value = 11;
			if (level == "queen" || level == "beetleQueen" || level == "double")
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
	for (var i = deck.length - 1; i >= 0; i--) {
		//Not moving back anymore, so set these here.
		deck[i].Location = 'drawDeckLocation';
		deck[i].FaceUp = false;
		
		//Create.
		createOnScreenCard(deck[i],i);
		//For touch?
		$(deck[i].selector).click(shifter);
		//Big draggability issues for hover.
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
	var imageLit = '<div id="' + card.divID + '" class="card" style="background-image:url(cards/' + cardImage + ');"><img src="cards/back.png" /></div>';
	$(imageLit).appendTo('#gamewrapper').hide();
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
	if (level == 'major' || level == 'beetleMajor') return 'major';
	if (level == 'queen' || level == 'beetleQueen') return 'queen';
	if (level == 'double') return 'double';
	return 'minor';
}


function shifter(event) {
	event.stopPropagation();
	//Shift cards for visibility on hover or click
	if (!$(this).hasClass("card") || $(this).find("img").is(":visible")) return;
	var cardID = this.id;
	/*
	var startShift = $("#" + cardID).parents(".card").length;
	console.log(cardID + ": " + startShift);
	 */
	var tableau = deck[getCardIndexByID(cardID)].Location;
	unshifter(tableau);
	if ($("#" + tableau).hasClass("shifted")) {
		//Toggle.
		$("#" + tableau).removeClass("shifted");
		//We already unshifted to clean up.
		return;
	} else {
		$("#" + tableau).addClass("shifted");
		$("#" + cardID).addClass("shifted");
	}
	/*
	var tableauNo = getIndexOfTableau(tableau);
	
	for (var s=startShift+1;s<foundArray[tableauNo].length; s++) {
		$(deck[foundArray[tableauNo][s]].selector).css("margin-left",22);// * (s - startCard));
	}
	 */
}

function unshifter(tableau) {
	//Undo the shift.
	if (tableau)
		$("#" + tableau + " .card").removeClass("shifted");//css("margin-left",0);
	else
		$(".card").removeClass("shifted");//.css("margin-left",0);
}
