//
// This implementation of Myrmex is by M. C. DeMarco, based on an implementation of Adaman by Felbrigg Herriot, released under a Creative Commons Attribution NonCommercial ShareAlike 3.0 License
//

var myrmex = {};

(function(context) { 

	var defaultSettings = {speed: 300,
						   magnification: false,
						   blackmoons: true,
						   level: 'minor'};
	var speed;
	var tablArray = [];
	var deck;


context.init = (function () {

	return {
		load: load,
		getCardIndexByID: getCardIndexByID,
		startButtonClick: startButtonClick
	};

	function load() {
		//The initialization function called on document ready.

		context.settings.init();
		context.ui.init();
		
		//Init dealer.
		$("#drawDeckLocation").click(function () {
			//Add back in later as an option.
			//		if (areEmptyTableauSpaces()) {
			//			alerter("You must fill all tableau spaces before dealing.");
			//		} else { 
			context.ui.popDealer();
			if (dealToTheTableau(false))
				refreshDragsDrops();
			//		}
		});	
	
		initializeDeck();

	}

	function initializeDeck(again) {

		// Build a deck of myrmex cards
		deck = myrmexCreateDeck();

		// create the on screen card image tags
		context.cards.create(again);

	}

	function startButtonClick(replay) {
		$('.panel').hide();

		//Set the other two settings here for convenience.
		if (context.settings.checkForChanges()) {
			//If certain values have changed since the deck was created, then we need to recreate it.
			initializeDeck(true);
		} else {
			context.cards.create(true);
		}
		tablArray = [];
		context.ui.initDealer();
		if (!replay)
			decktet.shuffle.deck(deck);
		
		//stackDeck();
		//Deal to the tableau 4 times plus more for variants
		dealTheTableau();
		//Initialize the card motion.
		refreshDragsDrops();
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

	if (shift < 0) {
		//Case for spaceIndex < 0 or shift < 0:  moving to unoccupied spaces.
		$("#" + spaceID).append($(card.selector));
		$(card.selector).delay(delay).fadeIn();
		//Draggable is messing up lots of CSS, so also unmess (z-index still messed up).
		$(card.selector).css({"top":0,"left":0});
		$(".magnify " + card.selector).css({"top":0,"left":0});
	} else {
		//Case for moving to an occupied tableau space.  Needs transitions.
		$(deck[tablArray[spaceIndex][shift]].selector).append($(card.selector));
		$(card.selector).delay(delay).fadeIn();
		//Need to get the delay/transition onto removeClass.
		//$(card.selector).css("z-index",shift).delay(delay).transition({left:targetOffset.left, top:targetOffset.top + 22*shift},speed,"snap").fadeIn();
		//Draggable is messing up lots of CSS, so also unmess (z-index still messed up).
		$(card.selector).css({"top":22,"left":0,"z-index":(shift + 1)});
		$(".magnify " + card.selector).css({"top":44,"left":0,"z-index":(shift + 1)});
	}
	$(card.selector).css("z-index",(shift+1));
	//Add to array, cleaning up any old version.
	var oldColumn = getIndexOfTableau(card.Location);
	var removed = [];
	if (oldColumn >= 0) {
		//If it existed, pop it and any children from its previous array location and push onto new location.
		var pops = $(card.selector).find('.card').length + 1;
		removed = tablArray[oldColumn].splice(tablArray[oldColumn].length - pops,pops);
		if (spaceIndex > -1) {
			tablArray[spaceIndex] = tablArray[spaceIndex].concat(removed);
			console.log("removed " + removed + " (" + card.Name + ") from " + oldColumn + ": " + tablArray[oldColumn] + " to " + spaceIndex + ": " + tablArray[spaceIndex]);
		} else {
			//No push.
			console.log("removed " + removed + " (" + card.Name + ") from " + oldColumn + ": " + tablArray[oldColumn] + " to " + spaceID);
		}
	} else if (spaceIndex < 0) {
		//No push to weird spaces.
	} else {
		//It didn't exist but it does now so it's a single card that needs some CSS and a push.
		tablArray[spaceIndex].push(indexOfCard);
	}

	// reset card locations, including fellow-travellers'
	card.Location = spaceID;
	for (var r=0;r<removed.length;r++)
		deck[removed[r]].Location = spaceID;

	//The removed array is returned for use in foundation moves.
	return removed;
	
}

function getIndexOfTableau(spaceID) {
	if (spaceID.indexOf("tableau") != 0)
		return -1;
	else
		return parseInt(spaceID.split("tableau")[1],10);
}

function getShiftOfTableau(tablIndex) {
	//Calculate the tablArray index of the top card in the current space.
	if (tablIndex < 0) 
		return -1;
	else
		return tablArray[tablIndex].length - 1;
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

// deal cards to the tableau.

function dealTheTableau() {
	//Create the tableau array.
	for (var f=0; f<8;f++) tablArray[f] = [];
	//Deal the whole tableau at the start.
	var row;
	var vari = context.settings.getVariant();
	for (row=1;row<=3;row++) {
		dealToTheTableau(context.settings.isBeetle(),(row-1)*8);
	}
	row = 4;
	if (vari == 'minor' || vari == 'queen') {
		dealToTheTableau(false,(row-1)*8,true);
	} else {//major and double, for now
		for (var p=0;p<6;p++)
			dealCardToTheTableau(p,context.settings.isBeetle(),(row-1)*8 + p);
		row = 5;
			dealToTheTableau(false,(row-1)*8,true);
	}
}

function dealToTheTableau(faceDown,delayUnits) {
	//Deal a row of the tableau, optionally face down.
	if (!delayUnits) delayUnits = 0;
	for (var f=0;f<8;f++) {
		var dealt = dealCardToTheTableau(f,faceDown,delayUnits + f);
		if (f==0 && !dealt) return false;
	}
	return true;
}

function dealCardToTheTableau(tableauNo,faceDown,delayUnits) {
	//Deal a card to a tableau location.
	var c = getIndexOfTopCardOnDrawDeck();
	if (c >= 0) {
		deck[c].FaceUp = !faceDown;
		if (deck[c].FaceUp)
			$(deck[c].selector + " img.realBack").hide();
		else
			$(deck[c].selector + " img.realBack").show();
		moveCardToSpace(c, "tableau" + tableauNo, delayUnits);
		return true;
	} else {
		return false;
	}
}

function refreshDragsDrops() {
	//Refresh all dragging and dropping bindings in the tableau.
	for (var f=0;f<8;f++)
		refreshDragDrop(f);
}

function refreshDragDrop(tablIndex) {
	//Refresh dragging and dropping bindings for a single tableau stack.
	//Also check for a pile to put on the foundation.
	var length = tablArray[tablIndex].length;
	if (length == 0) {
		var tableauID = "tableau" + tablIndex;
		//The special case of an empty tableau column.
		$("#" + tableauID).droppable({addClasses:false,disabled:false,accept:".card",drop:function(event, ui){dropper(null,$(ui.draggable).prop("id"),tableauID);}});
		return;
	} else {
		$("#" + tableauID).droppable({addClasses:false,disabled:true});
	}
	var card = deck[tablArray[tablIndex][length-1]];
	var hasAce = (card.Rank == "Ace");
	console.log("Ace: " + hasAce);
	//Flip if appropriate.
	if (!card.FaceUp || $(card.selector + " img.realBack").is(":visible")) {
		card.FaceUp = true;
		$(card.selector + " img.realBack").hide();
	}

	//We always know what happens with the top card.  Note: Stack not working.
	$(card.selector).draggable({addClasses:false,disabled:false,zIndex:100,revert:'invalid'});
	$(card.selector).droppable({addClasses:false,disabled:false,accept:".value"+(card.Value - 1),drop:function(event, ui){dropper(tablArray[tablIndex][length-1],$(ui.draggable).prop("id"));}});
	$(card.selector).addClass("topmost");

	//To check the other cards for suit going upwards/inwards from the top/uppermost card, we cheat with classes.
	$(card.selector).addClass(card.Suit1 + " " + card.Suit2 + " " + card.Suit3);
	var prevCard = card;
	var nuking = false;
	for (var c=length-2;c>=0;c--) {
		card = deck[tablArray[tablIndex][c]];
		if (!card.FaceUp) break;
		$(card.selector).removeClass("topmost");
		//Can only drop on the top card, so all these are disabled.
		$(card.selector).droppable({disabled:true});
		//Remove all suit classes and draggability before re-adding.
		$(card.selector).removeClass("Knots Leaves Moons Suns Waves Wyrms");
		$(card.selector).draggable({disabled:true});
		if (nuking) continue;
		//Check values...
		if (card.Value != prevCard.Value + 1) {
			//TODO: Disable any more visible ones.
			nuking = true;
			continue;
		}
		//Check suits...
		if ($(prevCard.selector).hasClass(card.Suit1)) {
			$(card.selector).addClass(card.Suit1);
			$(card.selector).draggable({addClasses:false,disabled:false,zIndex:100,revert:'invalid'});
			//Because a Crown has only one suit, this is the only place where we need to test for it.
			if (hasAce && card.Rank == "CROWN") {
				moveToFoundation(tablIndex,c);
				//Will have to call the whole function again from there, so...
				return;
			}
		}
		if (card.Suit2 && $(prevCard.selector).hasClass(card.Suit2)) {
			$(card.selector).addClass(card.Suit2);
			$(card.selector).draggable({addClasses:false,disabled:false,zIndex:100,revert:'invalid'});
		}
		if (card.Suit3 && $(prevCard.selector).hasClass(card.Suit3)) {
			$(card.selector).addClass(card.Suit3);
			$(card.selector).draggable({addClasses:false,disabled:false,zIndex:100,revert:'invalid'});
		}
		prevCard = card;
		//Check for foundation pile, probably also with classes, and remove.
		//   In this case we want to start the whole refresh over (so call refreshDragDrop again on the same index).
	}
}

function dropper(droppedOnCardIndex,dragAndDropMeID,droppedOnTableauID) {
	//Officially move the card.
	var spaceID = (droppedOnTableauID ? droppedOnTableauID : deck[droppedOnCardIndex].Location);
	console.log("drop " + dragAndDropMeID + " on " + spaceID);
	var cardIndex = getIndexOfCardFromID(dragAndDropMeID);
	var originalCardLocation = deck[cardIndex].Location;
	//Avoid bugs in dropping multiple cards back on their source stack.
	if (spaceID == originalCardLocation) 
		return;
	else
		moveCardToSpace(cardIndex, spaceID, 0);

	//Update all the draggability:
	//0. the drop recipient should no longer be draggable in most cases.
	//1. the drop recipient definitely should not be droppable.
	//2. update draggability for the stack it came from
	//3. possibly flip a card.
	refreshDragDrop(getIndexOfTableau(originalCardLocation));
	refreshDragDrop(getIndexOfTableau(spaceID));
}

function moveToFoundation(tablIndex,crownRow) {
	//Move a completed set to the next available chamber.
	var spaceID = getNextChamber();
	var removed = moveCardToSpace(tablArray[tablIndex][crownRow],spaceID); //more delay?
	//Turn off its draggables.  Turn off all droppables just to be safe, though there should be only one.
	for (var r=0;r<removed.length;r++) {
		$(deck[removed[r]].selector).draggable({addClasses:false,disabled:true}).droppable({addClasses:false,disabled:true}).addClass("teeny").css("top",0);
	}
	//Re-refresh the source column or win.
	if (spaceID == "chamber6")
		context.ui.win(1);
	else
		refreshDragDrop(tablIndex);	
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

function getNextChamber() {
	for (var ch = 1; ch <= 6; ch++) {
		var spaceID = "chamber" + ch;
		if ($("#" + spaceID).has(".card").length == 0) {
			return spaceID;
		}
	}
}

//
// create a deck of cards suitable for Myrmex
//
function myrmexCreateDeck() {
	var level = context.settings.get('level');
	var myrmexDeck = decktet.create.deck((level == "double" ? 4 : 2));
	//myrmexify
	myrmexDeck = decktet.remove.theExcuse(myrmexDeck);
	myrmexDeck = decktet.remove.rankByDeck(myrmexDeck,'Ace',2);
	myrmexDeck = decktet.remove.rankByDeck(myrmexDeck,'CROWN',2);
	if (level == "double") {
		myrmexDeck = decktet.remove.rankByDeck(myrmexDeck,'Ace',4);
		myrmexDeck = decktet.remove.rankByDeck(myrmexDeck,'CROWN',4);
	}
	if (level == "minor" || level == "larval") {
		//The normal deck.
		myrmexDeck = decktet.remove.courts(myrmexDeck);
		myrmexDeck = decktet.remove.pawns(myrmexDeck);
	} else {
		//Remove the unwanted Pawns.
		myrmexDeck = decktet.remove.card(myrmexDeck,'the LIGHT KEEPER');
		if (level == "major" || level == "beetleMajor") {
			//Remove all the Courts.
			myrmexDeck = decktet.remove.courts(myrmexDeck);
		} else {
			//Remove the unwanted Courts.
			myrmexDeck = decktet.remove.card(myrmexDeck,'the RITE');
		}
	}
	
	myrmexDeck = decktet.shuffle.deck(myrmexDeck);
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



function areEmptyTableauSpaces() {
	for (var t=0;t<8;t++) {
		if ($("#tableau" + t).has(".card").length == 0)
			return true;
	}
	return false;
}

function getIndexOfCardFromID(ID) {
	for (var i = 0; i < deck.length; i++) {
		if (deck[i].divID == ID) {
			return i;
		}
	}
	return -1;
}

})();
	

context.cards = (function () {

	return {
		create: create
	};

	function create(again) {
		if (again) {
			//Delete existing cards.
			$(".card").remove();
		}
		// create a series of image tags and load up the card images.
		for (var i = deck.length - 1; i >= 0; i--) {
			//Not moving back anymore, so set these here.
			deck[i].Location = 'drawDeckLocation';
			deck[i].FaceUp = false;
			
			//Create.
			createOnScreenCard(deck[i],i);
			//For touch?
			$(deck[i].selector).click(context.ui.shifter);
			//Big draggability issues for hover.
			//$(deck[i].selector).hover(shifter, unshifter);
		}
		//stackDeck();
	}	

	function createOnScreenCard(card,index) {
		// create an on-screen card element
		var emblacken = context.settings.get('blackmoons');
		var cardImage = card.Image;
		if (emblacken && (card.Suit1 == "Moons" || card.Suit2 == "Moons" || card.Suit3 == "Moons"))
			cardImage = cardImage.split(".png")[0] + "_black.png";
		var imageLit = '<div id="' + card.divID + '" class="card value' + card.Value + '" style="background-image:url(cards/' + cardImage + ');">';
		if (card.Rank == 'Ace') {
			//Adjust the ace.
			imageLit += '<img class="aceAdjust" src="cards/' + card.Suit1.toLowerCase() + (card.Suit1 == "Moons" && emblacken ? '_black' : '') + '.png' + '"/>';
		} else {
			imageLit += '<img class="suit1" src="cards/' + card.Suit1.toLowerCase() + (card.Suit1 == "Moons" && emblacken ? '_black' : '') + '.png' + '"/>';
			if (card.Suit2) {
				imageLit += '<img class="suit2" src="cards/' + card.Suit2.toLowerCase() + (card.Suit2 == "Moons" && emblacken ? '_black' : '') + '.png' + '"/>';
				if (card.Suit3) {
					imageLit += '<img class="suit3" src="cards/' + card.Suit3.toLowerCase() + (card.Suit3 == "Moons" && emblacken ? '_black' : '') + '.png' + '"/>';
				}
			}
		}
		imageLit += '<img class="realBack" src="cards/back.png" /></div>';
		$(imageLit).appendTo('#gamewrapper').hide();
		if (card.FaceUp) 
			$("#" + card.divID + " img.realBack").hide();
	}

	function stackDeck() {
		// stack the cards with z-index - not used atm
		for (var i = 0; i < deck.length; i++) {
			$(deck[i].selector).css("z-index",i + 3);
		}
	}
	
})();
	

context.settings = (function () {

	return {
		init: init,
		checkForChanges: checkForChanges,
		get: get,
		set: set,
		getVariant: getVariant,
		isBeetle: isBeetle
	};

	function alerter(msg) {
		//TODO: replace with something nice, if we're actually using this.
		alert(msg);
	}

	function init() {
		//Initialize settings during page init.
		
		// need speed first.
		speed = get('speed');
		$('input#speed').val(speed);
	
		//speed monitor
		$('input#speed').change(function() {
			if (parseInt($("input#speed").val()) > -1)
				speed = parseInt($("input#speed").val());
			set('speed',speed);
		});

		// need magnification to set up the button
		// This is a little awkward but will be cleaned up later for a third option
		if (get('magnification') == true) {
			$('body').addClass('magnify');
			$('#plusButton').html("Normal");
		}
		$('#plusButton').click(function () {
			$('body').toggleClass('magnify');
			if ($('#plusButton').html() == "Enlarge") {
				set('magnification',true);
				$('#plusButton').html("Normal");
			} else {
				set('magnification',false);
				$('#plusButton').html("Enlarge");
			}
		});
		
		//Fill in the rest of the settings form
		$("input[name=level]").val([get('level')]);
		$("input#emblacken").prop("checked",get('blackmoons'));

	}

	function checkForChanges() {
		if (get('level') != $("input[name=level]:checked").val() || get('blackmoons') != $("input#emblacken").is(":checked")) {
			set('level', $("input[name=level]:checked").val());
			set('blackmoons', $("input#emblacken").is(":checked").toString());
			return true;
		} else {
			return false;
		}
	}

	function get(setting) {
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

	function set(setting, value) {
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
		var level = get('level');
		if (level == 'major' || level == 'beetleMajor') return 'major';
		if (level == 'queen' || level == 'beetleQueen') return 'queen';
		if (level == 'double') return 'double';
		return 'minor';
	}
	
	function isBeetle() {
		var level = get('level');
		if (level == "minor" || level == "beetleMajor" || level == "beetleQueen" || level == "double")
			return true;
		else
			return false;
	}

})();
	

context.ui = (function () {

	return {
		init: init,
		initDealer: initDealer,
		popDealer: popDealer,
		shifter: shifter,
		show: show,
		win: win
	};

	function init() {
		//Init buttons.
			
		// set up the click events for the panels
		$('#showStoryButton').click(function () {
			show('whatsthestory');
		});
		$('#settingsButton').click(function () {
			show('settingsPanel');
		});
		$('#creditsButton').click(function () {
			show('gameCredits');
		});
		$('.close.button').click(function () {
			show();
		});
		
		// events for the start/replay buttons
		$('#startButton').click(function () {
			context.init.startButtonClick();
		});
		$('#replayButton').click(function () {
			context.init.startButtonClick(true);
		});

	}

	function initDealer() {
		//Place the fake cards on the fake deal stack.
		$("#drawDeckLocation").append("<div class='back'><div class='back'><div class='back'><div class='back'></div></div></div></div>");
	}

	function popDealer() {
		//Remove a fake card from the fake deal stack.
		$("#drawDeckLocation").find(".back:empty").remove();
	}

	function shifter(event) {
		event.stopPropagation();
		//Shift cards for visibility on hover or click
		if (!$(this).hasClass("card") || $(this).find("img.realBack").is(":visible")) return;
		var cardID = this.id;
		var tableau = deck[context.init.getCardIndexByID(cardID)].Location;
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
	}

	function show(panelID) {
		//Hide others.
		$('.panel').hide();
		//Show requested panel.
		if (panelID)
			$("#" + panelID).fadeIn(speed);
	}
	
	function unshifter(tableau) {
		//Undo the shift.
		if (tableau)
			$("#" + tableau + " .card").removeClass("shifted");
		else
			$(".card").removeClass("shifted");
	}
	
	function win(delayUnits) {
		$("#gameOver").fadeIn(delayUnits*speed);
	}
	
})();

})(myrmex);


/* eof */
