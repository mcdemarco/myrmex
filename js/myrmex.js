﻿//
// This implementation of Myrmex is by M. C. DeMarco, based on a remix of Adaman by Felbrigg Herriot.
//	     It is released under a Creative Commons Attribution NonCommercial ShareAlike 3.0 License.
//

var myrmex = {};

(function(context) { 

	var defaultSettings = {speed: 300,
												 magnification: false,
												 blackmoons: true,
												 unsnooker: false,
												 checkEmpties: false,
												 level: 'minor'};
	var speed;
	var tablArray = [];
	var chamberArray = [];
	var deck;
	var debugging = false;
	var debugLevel = 2; //Turn up to 2 or off on release.
	var undoAllowed = true;
	var version = "1.3.3";

//init
//data
//deal
//cards
//settings
//ui
//debug


context.init = (function () {

	return {
		load: load,
		newGame: newGame
	};

	function load() {
		//The initialization function called on document ready.
		
		context.debug.init();
		context.settings.init();
		context.ui.init();
	
		initializeDeck();
		$("#title").animex("fadeIn");

		context.settings.loadGame();
	}

	function initializeDeck(again) {
		context.debug.log("Creating deck...",0);

		// Build a deck of myrmex cards
		deck = context.data.createDeck();

		// create the on screen card image tags
		context.cards.create(again);
	}

	function newGame(replay) {
		context.ui.reinit();

		//Set the other two settings here for convenience.
		if (context.settings.checkForDeckChanges()) {
			//If certain values have changed since the deck was created, then we need to recreate it.
			initializeDeck(true);
		} else {
			context.cards.create(true);
		}
		
		context.ui.initDealer();
		if (!replay) {
			context.debug.log("Shuffling...",1);
			decktet.shuffle.deck(deck);
			//For testing chamber filling, switch to a sorted deck.
			//(Queen works better than major worker for this.)
			//decktet.shuffle.sort(deck,true);
		} else {
			context.debug.log("Not shuffling...",1);
		}
		//Deal to the tableau 4 times plus more for variants.
		//This calls context.data.initTableau();
		context.deal.tableau();
		context.ui.pushDealer();

		//Initialize the card motion.
		context.cards.refreshAll();
		
		context.ui.initTimer();
	}

})();

	
context.data = (function () {

	return {
		areEmptyTableauSpaces: areEmptyTableauSpaces,
		createDeck: createDeck,
		getIndexOfCardFromID: getIndexOfCardFromID,
		getIndexOfTableau: getIndexOfTableau,
		getShiftOfTableau: getShiftOfTableau,
		initTableau: initTableau,
		nextChamber: nextChamber
	};

	function createDeck() {
		// create a deck of cards suitable for Myrmex
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
		if (level == "minor" || level == "larval" || level == "double") {
			//The normal deck.
			myrmexDeck = decktet.remove.courts(myrmexDeck);
			myrmexDeck = decktet.remove.pawns(myrmexDeck);
		} else {
			//Remove the unwanted Pawns.
			myrmexDeck = decktet.remove.card(myrmexDeck,'the LIGHT KEEPER');
			if (level == "major" || level == "blindMajor") {
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
				if (level == "major" || level == "blindMajor")
					myrmexDeck[i].Value = 11;
				if (level == "queen" || level == "blindQueen" || level == "triple")
					myrmexDeck[i].Value = 12;
			}
		}
		return myrmexDeck;
	}

	function getIndexOfCardFromID(ID) {
		for (var i = 0; i < deck.length; i++) {
			if (deck[i].divID == ID) {
				return i;
			}
		}
		return -1;
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

	function initTableau() {
		//Create the tableau array.
		tablArray = [];
		for (var f=0; f<8;f++) {
			tablArray[f] = [];
		}
	}

	function nextChamber(suit,pawnName,courtName) {
		//private
		//Get and set the next chamber.
		var next = chamberArray.length;
		if (suit) {
			chamberArray[next] = {suit: suit};
			if (pawnName) 
				chamberArray[next].pawn = pawnName.replace(/\s+/g, '');
			if (courtName)
				chamberArray[next].court = courtName.replace(/\s+/g, '');
			context.ui.setChamber(next);
		}
		return "chamber" + next;
	}
	
	function areEmptyTableauSpaces() {
		for (var t=0;t<8;t++) {
			if ($("#tableau" + t).has(".card").length == 0)
				return true;
		}
		return false;
	}
	
})();
	
context.deal = (function () {
	//Didn't want to confuse matters by calling this "deck".

	return {
		getIndexOfTopCardOnDrawDeck: getIndexOfTopCardOnDrawDeck,
		restore: restore,
		row: row,
		tableau: tableau
	};

	function restore() {
		for (var t=0;t<8;t++) {
			for (var r=0;r<tablArray[t].length;r++) {
				var c = tablArray[t][r];
				context.debug.log("Restoring " + c + " to " + t + " as " + (deck[c].FaceUp ? "face up" : "face down" ),-1);
				if (deck[c].FaceUp)
					$(deck[c].selector + " img.realBack").hide();
				else
					$(deck[c].selector + " img.realBack").show();
				context.cards.move(c, "tableau" + t, 0, r - 1);
			}
		}	
	}
	
	function tableau() {
		// deal cards to the tableau.
		//Create the tableau array.
		context.data.initTableau();
		//Deal the whole tableau at the start.
		var thisRow;
		var vari = context.settings.getVariant();
		for (thisRow=1;thisRow<=3;thisRow++) {
			row(context.settings.isBeetle(),(thisRow-1)*8);
		}
		thisRow = 4;
		if (vari == 'minor' || vari == 'queen') {
			row(false,(thisRow-1)*8,true);
		} else if (vari == 'major') {
			for (var p=0;p<6;p++)
				card(p,context.settings.isBeetle(),(thisRow-1)*8 + p);
			thisRow = 5;
			row(false,(thisRow-1)*8,true);
		} else {//double
			for (thisRow=4;thisRow<8;thisRow++) {
				row(context.settings.isBeetle(),(thisRow-1)*8);
			}
			row(false,(thisRow-1)*8,true);
		}
	}
	
	function row(faceDown,delayUnits) {
		//Deal a row of the tableau, optionally face down.
		if (!delayUnits) delayUnits = 0;
		for (var f=0;f<8;f++) {
			var dealt = card(f,faceDown,delayUnits + f);
			if (f==0 && !dealt) return false;
		}
		return true;
	}

	function card(tableauNo,faceDown,delayUnits) {
		//Deal a card to a tableau location.
		var c = getIndexOfTopCardOnDrawDeck();
		if (c >= 0) {
			deck[c].FaceUp = !faceDown;
			if (deck[c].FaceUp)
				$(deck[c].selector + " img.realBack").hide();
			else
				$(deck[c].selector + " img.realBack").show();
			context.cards.move(c, "tableau" + tableauNo, delayUnits);
			return true;
		} else {
			return false;
		}
	}

	function getIndexOfTopCardOnDrawDeck() {
		// get index of the top card in the drawdeck
		var returnValue = -1;
		for (var i = 0; i < deck.length; i++) {
			if (deck[i].Location == 'drawDeckLocation') {
				returnValue = i;
				break;
			}
		}
		return returnValue;
	}

})();
	

context.cards = (function () {
	//Handling particular to the on-screen cards.
	
	return {
		create: create,
		drop: drop,
		move: move,
		moveToFoundation: moveToFoundation,
		refresh: refresh,
		refreshAll: refreshAll,
		stackDeck: stackDeck
	};

	function create(again,forRestore) {
		if (again) {
			//Delete existing cards.
			$(".card").remove();
		}
		// create a series of image tags and load up the card images.
		for (var i = deck.length - 1; i >= 0; i--) {
			if (!forRestore) {
				//Not moving back anymore, so set these here.
				deck[i].Location = 'drawDeckLocation';
				deck[i].FaceUp = false;
			}
			//Create.
			createOnScreenCard(deck[i],i);
			//Clear any drag-and-drops.
			interact(deck[i].selector).unset();

			
			//For touch?
			//$(deck[i].selector).click(context.ui.shifter);
			//Big draggability issues for hover.
			//$(deck[i].selector).hover(shifter, unshifter);
		}
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
		$(imageLit).appendTo('#playarea').hide();
		if (card.FaceUp) 
			$("#" + card.divID + " img.realBack").hide();
	}

	function drop(droppedOnCardIndex,dragAndDropMeID,droppedOnTableauID,fromFunc) {
		if (fromFunc)
			context.debug.log("Drop/move of " + dragAndDropMeID + " to " + (droppedOnCardIndex ? droppedOnCardIndex : droppedOnTableauID) + " called from " + fromFunc,2);
		//Officially move the card.
		var spaceID = (droppedOnTableauID ? droppedOnTableauID : deck[droppedOnCardIndex].Location);
		context.debug.log("dropping " + dragAndDropMeID + " on " + spaceID,2);
		var cardIndex = context.data.getIndexOfCardFromID(dragAndDropMeID);
		var originalCardLocation = deck[cardIndex].Location;
		//Avoid bugs in dropping multiple cards back on their source stack.
		if (spaceID == originalCardLocation) {
			//Still needs snapping to place.
			stackCard(deck[cardIndex]);
			return;
		}
		move(cardIndex, spaceID, 0);

		//Update all the draggability:
		//0. the drop recipient should no longer be draggable in most cases.
		//1. the drop recipient definitely should not be droppable.
		//2. update draggability for the stack it came from
		//3. possibly flip a card.
		context.debug.log("refreshing original location " + originalCardLocation,-1);
		refresh(context.data.getIndexOfTableau(originalCardLocation));
		context.debug.log("refreshing new location " + spaceID,-1);
		refresh(context.data.getIndexOfTableau(spaceID));

		//Add undo.
		undoable(cardIndex, spaceID, originalCardLocation);
	}

	function makeCardDraggable(card,disable) {
		if (disable)
			interact(card.selector).draggable({enabled:false});//.unset();
		else
			interact(card.selector).draggable({enabled:true,
																				 restrict:{
																					 restriction: "#playarea",
																					 elementRect:{ top: 0, left: 0, bottom: 1, right: 1 }
																				 },
																				 inertia:true,
																				 autoScroll:true,
																				 onmove: dragMoveListener,
																				 onend: dragMoveCleanup
																				});

		function dragMoveListener(event) {
			// keep the dragged position in the data-x/data-y attributes
			var target = event.target,
					x = (parseFloat(target.getAttribute('data-x'),10) || 0) + event.dx,
					y = (parseFloat(target.getAttribute('data-y'),10) || 0) + event.dy;

			var oldx = parseFloat(target.getAttribute('data-x'),10);
			var oldy = parseFloat(target.getAttribute('data-y'),10);
			
			// translate the element
			target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
			
			// update the posiion attributes
			target.setAttribute('data-x', x);
			target.setAttribute('data-y', y);

//			console.log(event.target.id + ", old:" + oldx + " " + oldy + ", new: " + x + " " + y + ", dxy: " + event.dx + " " + event.dy + ", location: " + event.pageX + " " + event.pageY);

			//Need to hackishly pop the card above later cards because of interact.js issue #237.
			var tableauId = $(target).closest(".cardspace").data("tableau");
			for (var t=0; t<tableauId; t++) {
				$("#tableau" + t + " .card").css("zIndex",1);
			}
			$(target).css("zIndex",1000);
		}

		function dragMoveCleanup(event) {
			var target = event.target;
			target.style.webkitTransform = target.style.transform = '';
			target.setAttribute('data-x', 0);
			target.setAttribute('data-y', 0);
			$(".card").css("zIndex","auto");
		}
	}

	function makeCardDroppable(card,disable) {
		if (disable)
			interact(card.selector).dropzone({enabled:false}); //.unset();
		else
			interact(card.selector).dropzone({enabled:true,overlap:0.33,accept:".value"+(card.Value - 1),ondrop:function(event){context.cards.drop(context.data.getIndexOfCardFromID(card.divID),event.relatedTarget.id,null,"makeCardDroppable(" + card.divID + ")");}});
	}

	function makeTableauDroppable(tableauID,disable) {
		if (disable)
			interact("#" + tableauID).dropzone({enabled:false}); //.unset();
		else
			interact("#" + tableauID).dropzone({enabled:true,overlap:0.33,accept:".card",ondrop:function(event){context.cards.drop(null,event.relatedTarget.id,tableauID,"makeTableauDroppable("+ tableauID +")");}});
	}

	function move(indexOfCard, spaceID, delayUnits, shift) {
		// move specified card to a new location.  Doesn't do any cleanup.
		if (typeof delayUnits == 'undefined') delayUnits = 1;
		var delay = delayUnits * speed;
		var spaceIndex = context.data.getIndexOfTableau(spaceID);
		var noUpdate = false;
		if (typeof shift == 'undefined')
			shift = context.data.getShiftOfTableau(spaceIndex);
		else
			noUpdate = true;
		
		var card = deck[indexOfCard];

		context.debug.log("moving " + card.divID + " from " + card.Location + " to " + spaceIndex + ": " + spaceID,-2);
		
		if (shift < 0) {
			//Case for spaceIndex < 0 or shift < 0:  moving to unoccupied spaces.
			$("#" + spaceID).append($(card.selector));
			$(card.selector).animex("fadeIn",delay);//delay(delay).fadeIn();
			$(card.selector).css({"top":0,"left":0});
			$(".magnify " + card.selector).css({"top":0,"left":0});
		} else {
			//Case for moving to an occupied tableau space.  Needs transitions.
			var prevCard = deck[tablArray[spaceIndex][shift]];
			$(prevCard.selector).append($(card.selector));
			$(card.selector).animex("fadeIn",delay);//delay(delay).fadeIn();
			if (!prevCard.FaceUp) {
 				$(card.selector).css({"top":11,"left":0});
 				$(".magnify " + card.selector).css({"top":11,"left":0});
 			} else {
 				$(card.selector).css({"top":22,"left":0,"z-index":"auto"});
 				$(".magnify " + card.selector).css({"top":44,"left":0,"z-index":"auto"});
 			}

			//stackCard(card,prevCard);
		}

		var removed;
		if (!noUpdate) {
			//Add to array, cleaning up any old version.
			var oldColumn = context.data.getIndexOfTableau(card.Location);
			removed = pusher(indexOfCard, oldColumn, spaceIndex);
		} else {
			removed = [];
		}
		
		// reset card locations, including fellow-travellers'
		card.Location = spaceID;
		for (var r=0;r<removed.length;r++)
			deck[removed[r]].Location = spaceID;
		
		//The removed array is returned for use in foundation moves.
		return removed;
	}

	function pusher(cardIndex, oldIndex, newIndex) {
		//private
		var removed = [];
		var card = deck[cardIndex];
		if (oldIndex >= 0) {
			//If the card already existed, pop it and any children from its previous array location and push onto new location.
			var pops = $(card.selector).find('.card').length + 1;
			removed = tablArray[oldIndex].splice(tablArray[oldIndex].length - pops,pops);
				if (newIndex > -1) {
					//Push; new space is a tableau space.
					tablArray[newIndex] = tablArray[newIndex].concat(removed);
					context.debug.log("removed " + removed + " (" + card.divID + ") from " + oldIndex + ": " + tablArray[oldIndex] + " to " + newIndex + ": " + tablArray[newIndex],-2);
				} else {
					//No push; new space is not a tableau space.
					context.debug.log("removed " + removed + " (" + card.divID + ") from " + oldIndex + ": " + tablArray[oldIndex] + " to " + newIndex,-2);
				}
			} else if (newIndex < 0) {
				//No push from oblivion to weird spaces.  (Not clear that this case ever occurs.)
				context.debug.log("didn't push to " + newIndex,3);
			} else {
				//It didn't exist but it does now so it's a single card that needs some CSS and a push.
				tablArray[newIndex].push(cardIndex);
			}
		return removed;
	}

	function moveToFoundation(tablIndex,crownRow,aceRow) {
		//Move a completed set to the next available chamber.
		var spaceID = context.data.nextChamber();
		var suit = deck[tablArray[tablIndex][aceRow]].Suit1;
		var pawn, court;

		//Put the ace suit on the foundation.
		$("#" + spaceID).addClass(suit);

		if (aceRow - crownRow > 10) {
			pawn = deck[tablArray[tablIndex][aceRow-9]].Name;
			court = deck[tablArray[tablIndex][aceRow-10]].Name;
		} else if (aceRow - crownRow == 10) {
			pawn = deck[tablArray[tablIndex][aceRow-9]].Name;
		}
		context.data.nextChamber(suit,pawn,court);
		
		//Don't actually move, since that causes some problems, just kill them all!
		for (var c=aceRow;c>=crownRow;c--) {
			var cardIndex = tablArray[tablIndex][c];
			$(deck[cardIndex].selector).remove();
			tablArray[tablIndex].pop();
		}
		
		//Re-refresh the source column or win.
		if (spaceID == "chamber5") {
			context.ui.win(1);
		} else {
			context.debug.log("post-chamber refreshing tableau column " + tablIndex,-2);
			refresh(tablIndex);
		}
	}
	
	function refresh(tablIndex) {
		//Refresh dragging and dropping bindings for a single tableau stack.
		//Also check for a pile to put on the foundation.
		//context.debug.log("refreshing: " + tablIndex);

		//Turn off all undos here.
		unundo();

		var length = tablArray[tablIndex].length;
		var tableauID = "tableau" + tablIndex;
		if (length == 0) {
			//The special case of an empty tableau column.
			context.debug.log("Turning on drop on  " + tableauID,1); 
			makeTableauDroppable(tableauID);
			return;
		} else {
			context.debug.log("Turning off drop on " + tableauID,1);
			makeTableauDroppable(tableauID,true);
		}
		var cardIndex = tablArray[tablIndex][length-1];
		var card = deck[cardIndex];
		//Store the row of the ace here; it serves as a boolean since it can't be at row zero AND a foundation stack.
		var hasAce = ((card.Rank == "Ace" && length - 1 > 0) ? length-1 : 0);
		
		//Flip if appropriate.
		if (!card.FaceUp || $(card.selector + " img.realBack").is(":visible")) {
			card.FaceUp = true;
			$(card.selector + " img.realBack").hide();
		}
		
		//We always know what happens with the top card.  Note: Stack not working.
		context.debug.log("Making " + card.divID + " draggable.",1);
		makeCardDraggable(card);
		makeCardDroppable(card);
		$(card.selector).addClass("topmost");
		
		//To check the other cards for suit going upwards/inwards from the top/uppermost card, we cheat with classes.
		$(card.selector).addClass(card.Suit1 + " " + card.Suit2 + " " + card.Suit3);
		var prevCard = card;
		var nuking = false;
		for (var c=length-2;c>=0;c--) {
			card = deck[tablArray[tablIndex][c]];
			if (!card.FaceUp) break;
			cleanUp(card);
			
			if (nuking) continue;
			//Check values...
			if (card.Value != prevCard.Value + 1) {
				nuking = true;
				continue;
			}
			//Check suits...
			if ($(prevCard.selector).hasClass(card.Suit1)) {
				$(card.selector).addClass(card.Suit1);
				//Because a Crown has only one suit, this is the only place where we need to test for it.
				if (hasAce && card.Rank == "CROWN") {
					moveToFoundation(tablIndex,c,hasAce);
					//Will have to call the whole function again from there, so...
					return;
				}
			}
			if (card.Suit2 && $(prevCard.selector).hasClass(card.Suit2)) {
				$(card.selector).addClass(card.Suit2);
			}
			if (card.Suit3 && $(prevCard.selector).hasClass(card.Suit3)) {
				$(card.selector).addClass(card.Suit3);
			}
			if ($(card.selector).hasClass(card.Suit1) || $(card.selector).hasClass(card.Suit2) || $(card.selector).hasClass(card.Suit3)) {
				context.debug.log("Making " + card.divID + " draggable for shared suit.",1);
				makeCardDraggable(card);
			}				
			prevCard = card;
		}
		context.debug.check();
	}

	function cleanUp(card) {
		//private
		//Card is no longer topmost, if it ever was.
		$(card.selector).removeClass("topmost");
		//Can only drop on the top card, so all these are disabled.
		makeCardDroppable(card,true);
		//Remove all suit classes and draggability before re-adding.
		$(card.selector).removeClass("Knots Leaves Moons Suns Waves Wyrms");
		makeCardDraggable(card,true);
	}

	function refreshAll() {
		//Refresh all dragging and dropping bindings in the tableau.
		//This only happens on init and dealing.
		for (var f=0;f<8;f++)
			refresh(f);
	}

	function stackCard(card,prevCard) {
		//Stack or correct stacking based on whether the previous card was face up or down.
		if (prevCard && !prevCard.FaceUp) {
			$(card.selector).css({"top":11,"left":0});
			$(".magnify " + card.selector).css({"top":11,"left":0});
		} else if ($(card.selector).parent(".cardspace").length == 1) {
			//Could also check the tableau length here.
			$(card.selector).css({"top":0,"left":0});
			$(".magnify " + card.selector).css({"top":0,"left":0});
		} else {
			$(card.selector).css({"top":22,"left":0});
			$(".magnify " + card.selector).css({"top":44,"left":0});
		}
	}

	function stackDeck() {
		//No longer a z-index adjustment; instead adjust top margins.
		for (var t=0;t<8;t++)
			stackTableau(t);
	}

	function stackTableau(tablIndex) {
		// adjust the top margins
		var card, prevCard;
		for (var c = 0; c < tablArray[tablIndex].length; c++) {
			card = deck[tablArray[tablIndex][c]];
			stackCard(card, prevCard);
			prevCard = card;
		}
	}

	function undoable(cardIndex, newCardLocation, oldCardLocation) {
		//A convenient point to autosave.
		context.settings.saveGame();

		if (!undoAllowed) return;
		//Allow undo using a droppable for the oldCardLocation, which must be a tableau.
		//The card should already have a draggable, if it's still in the tableau at all.
		if ($(deck[cardIndex].selector).length == 0) {
			//This means the card was moved to a chamber, so the previous drag is not undoable.
			context.debug.log("chamber move of " + cardIndex + " is not undoable",1);
			return;
		}
		//Set up the Undo button.
		context.debug.log("Making move of " + deck[cardIndex].divID + " from " + oldCardLocation + " to " + newCardLocation + " undoable.",2);
		$("#undoButton").prop('disabled',false).off();
		$("#undoButton").on("click",function(){drop(null,deck[cardIndex].divID,oldCardLocation,"undoable(" + cardIndex + "," + newCardLocation + "," + oldCardLocation + ")");});
	}

	function unundo() {
		context.debug.log("turning off undos",-2);
		$("#undoButton").prop('disabled',true).off();
	}
	
})();


context.settings = (function () {

	return {
		init: init,
		checkForChanges: checkForChanges,
		checkForDeckChanges: checkForDeckChanges,
		get: get,
		set: set,
		getVariant: getVariant,
		isBeetle: isBeetle,
		loadGame: loadGame,
		saveGame: saveGame
	};

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
			//Need to adjust all card placements (different function?).
			context.cards.stackDeck();
		});
		
		//Fill in the rest of the settings form
		$("input[name=level]").val([get('level')]);
		$("input#emblacken").prop("checked",get('blackmoons'));
		$("input#unsnooker").prop("checked",get('unsnooker'));
		$("input#checkEmpties").prop("checked",get('checkEmpties'));

		emclassen();
	}

	function checkForChanges() {
		//We don't set the level here, but we do turn off the replay button in some cases.
		var currentVariant = getVariant(get('level'));
		var newVariant = getVariant($("input[name=level]:checked").val());
		//Turn off replay.
		if (currentVariant != newVariant)
			$("#replayButton").prop('disabled',true);
		else
			$("#replayButton").prop('disabled',false);

		//We do set and use all other settings.
		if (get('blackmoons') != $("input#emblacken").is(":checked") || get('unsnooker') != $("input#unsnooker").is(":checked")  || get('checkEmpties') != $("input#checkEmpties").is(":checked")) {
			set('blackmoons', $("input#emblacken").is(":checked").toString());
			set('unsnooker', $("input#unsnooker").is(":checked").toString());
			set('checkEmpties', $("input#checkEmpties").is(":checked").toString());
			emclassen();
			return true;
		} else {
			return false;
		}
	}

	function checkForDeckChanges() {
		//We don't abort the game on a level change; level doesn't change until New is pressed,
		//so we don't actually set the setting until then.
		if (get('level') != $("input[name=level]:checked").val()) {
			set('level', $("input[name=level]:checked").val());
			//May need to turn on replay.
			$("#replayButton").prop('disabled',false);
			return true;
		} else {
			return false;
		}
	}

	function emclassen() {
		//Blackening is usually done per card, but there's one exception that needs to be set onblackchange.
		if (get('blackmoons'))
			$("#deckrow").addClass("blackmoo");
		else
			$("#deckrow").removeClass("blackmoo");
		if (get('unsnooker'))
			$("#deckrow").addClass("unsnoo");
		else
			$("#deckrow").removeClass("unsnoo");
	}

	function get(setting) {
		if (window.localStorage && typeof window.localStorage.getItem(setting) !== 'undefined' && window.localStorage.getItem(setting) !== null) {
			var value;
			try {
				value = window.localStorage.getItem(setting);
			} catch (e) {
				value = defaultSettings[setting];
			}
			if (setting == 'blackmoons' || setting == 'magnification' || setting == 'unsnooker' || setting == 'checkEmpties')  
				value = (value.toLowerCase() === "true");
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
	
	function getVariant(level) {
		//Get a simpler version of the level.
		if (!level)
			level = get('level');

		if (level == 'major' || level == 'blindMajor') return 'major';
		if (level == 'queen' || level == 'blindQueen') return 'queen';
		if (level == 'double') return 'double';
		return 'minor';
	}
	
	function isBeetle() {
		var level = get('level');
		if (level == "minor" || level == "blindMajor" || level == "blindQueen" || level == "double")
			return true;
		else
			return false;
	}

	function loadGame() {
		if (!get('savedTime')) {
			return;
		} else {
			context.debug.log("Loading saved game",0);
		}
		//Some cleanup.
		context.ui.reinit();

		//Loading.
		deck = JSON.parse(get('savedDeck'));
		tablArray = JSON.parse(get('savedTableau'));
		chamberArray = fixChambers(JSON.parse(get('savedChambers')));
		set('level',get('savedLevel')); //also update ui?
		//Restart timer at saved value.
		context.ui.initTimer(get('savedTime'));
		
		//TODO: Update UI from new tablArray:
		//Recreate cards.
		context.cards.create(true,true);
		//Position cards.
		context.deal.restore();
		//Set draggables:
		context.cards.refreshAll();
		//Restore the dealer.
		context.ui.pushDealer();
		//Restore any completed chambers.
		var won = context.ui.restoreChambers();
		if (won)
			context.ui.win(1);
	}

	function fixChambers(currentArray) {
		//Convert an old-style chamberArray to the new style.
		if (currentArray && currentArray.length > 0 && typeof currentArray[0] == "string") {
			var updatedArray = [];
			for (var c=0; c<currentArray.length; c++) {
				updatedArray[c] = {suit: currentArray[c]};
			}
			return updatedArray;
		} else
			return currentArray;
	}

	function saveGame() {
		context.debug.log("Saving current game",0);
		set('savedDeck',JSON.stringify(deck));
		set('savedTableau',JSON.stringify(tablArray));
		set('savedChambers',JSON.stringify(chamberArray));
		//The stored setting is correct because a level change isn't checked until a new game.
		set('savedLevel',get('level'));
		set('savedTime',$("#timer").text());
	}

})();
	

context.ui = (function () {

	return {
		alerter: alerter,
		init: init,
		initDealer: initDealer,
		initTimer: initTimer,
		popDealer: popDealer,
		pushDealer: pushDealer,
		reinit: reinit,
		restoreChambers: restoreChambers,
		setChamber: setChamber,
		shifter: shifter,
		show: show,
		win: win
	};

	var timer;

	function alerter(msg) {
		alert(msg);
	}

	function clearChambers() {
		chamberArray = [];
		$(".chamber").removeClass("Knots Leaves Moons Suns Waves Wyrms").empty();
	}

	function displayTimer(total_seconds) {
		//Code from http://stackoverflow.com/a/2605236/4965965
		function pretty_time_string(num) {
			return ( num < 10 ? "0" : "" ) + num;
		}

		var hours = Math.floor(total_seconds / 3600);
		total_seconds = total_seconds % 3600;
		
		var minutes = Math.floor(total_seconds / 60);
		total_seconds = total_seconds % 60;
		
		var seconds = Math.floor(total_seconds);
		
		// Pad the minutes and seconds with leading zeros, if required
		hours = pretty_time_string(hours);
		minutes = pretty_time_string(minutes);
		seconds = pretty_time_string(seconds);
		
		// Compose the string for display
		var currentTimeString = (hours != "00" ? hours + ":" : "") + minutes + ":" + seconds;
		
		return currentTimeString;
	}

	function init() {
		//Init interact.js.
		//interact.dynamicDrop(true); //totally broken

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
			$('html,body').animate({scrollTop:0},speed);
		});
		
		// events for the start/replay/save buttons
		$('#startButton').click(function () {
			context.init.newGame();
		});
		$('#replayButton').click(function () {
			context.init.newGame(true);
		});

		$('div#settingsPanel button.close').on("click",context.settings.checkForChanges);

		//Init dealer.
		$("#drawDeckLocation").click(function () {
			//Add back in later as an option.
			if (context.settings.get('checkEmpties') && context.data.areEmptyTableauSpaces()) {
				alerter("You must fill all empty tableau spaces before dealing.");
			} else {
				context.ui.popDealer();
				if (context.deal.row(false)) {
					//If anything got dealt, we refresh.
					context.cards.refreshAll();
				}
			}
		});	
	}

	function initDealer() {
		//Place one fake card on the fake deal stack, to be replaced with the spread cards later.
		$("#drawDeckLocation").html("").append("<div class='back'></div>");
	}

	function initTimer(atTime) {
		//Code from http://stackoverflow.com/a/2605236/4965965
		if (timer)
			clearInterval(timer);
		var elapsed_seconds = 0;
		//atTime is a string in the pretty-printed format produced by the timer.
		if (atTime) {
			var atTimes = atTime.split(":");
			if (atTimes.length == 3) 
				elapsed_seconds = parseInt(atTimes[0],10) * 3600 + parseInt(atTimes[1],10) * 60 + parseInt(atTimes[2],10);
			else
				elapsed_seconds = parseInt(atTimes[0],10) * 60 + parseInt(atTimes[1],10);
			//Set timer to get accurate win time when opening a won game.
			$('#timer').text(displayTimer(elapsed_seconds));
		}
		timer = setInterval(function() {
			elapsed_seconds = elapsed_seconds + 1;
			$('#timer').text(displayTimer(elapsed_seconds));
		}, 1000);
	}

	function pushDealer() {
		//Place the fake cards on the fake deal stack.
		var top = context.deal.getIndexOfTopCardOnDrawDeck();
		if (top < 0) return;
		var count = Math.ceil((deck.length - top)/8);
		var divString1 = "<div class='back'>";
		var divString2 = "</div>";
		var divString = "";
		for (var d=0;d<count;d++) {
			divString = divString1 + divString + divString2;
		}
		$("#drawDeckLocation").html("").append(divString);
	}

	function popDealer() {
		//Remove a fake card from the fake deal stack.
		$("#drawDeckLocation").find(".back:empty").remove();
	}

	function reinit() {
		//Clean up the UI for a new game.
		clearChambers();
		show('');
		//Note unundo happens on the refresh.
	}

	function restoreChambers() {
		//The UI was previously cleared.
		//$(".chamber").removeClass("Knots Leaves Moons Suns Waves Wyrms");
		for (var c = 0; c < chamberArray.length; c++) {
			setChamber(c);
		}
		if (chamberArray.length == 6) 
			return true;
		else
			return false;
	}

	function setChamber(c) {
		var jqChamber = $("#chamber" + c);
		var chamberObj = chamberArray[c];
		var appendix;
		jqChamber.addClass(chamberObj.suit);

		//Don't need to context.settings.get('unsnooker') here because classes.
		if (chamberObj.pawn)
			appendix = "<div class='subchamber " + chamberObj.pawn + "'><div class='subchamber " + chamberObj.suit + "'></div></div>";
		if (chamberObj.court)
			appendix = "<div class='subchamber " + chamberObj.court + "'>" + appendix + "</div>";

		//Safe to append undefined.
		jqChamber.append(appendix);
	}

	function shifter(event) {
		//Not using this anymore.
		//event.stopPropagation();
		//Shift cards for visibility on hover or click
		if (!$(this).hasClass("card") || $(this).find("img.realBack").is(":visible")) return;
		var cardID = this.id;
		var tableau = deck[context.data.getIndexOfCardFromID(cardID)].Location;
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
		$(".panel:visible").animex("fadeOut");
		//Show requested panel.
		if (panelID)
			$("#" + panelID).animex("fadeIn");
	}
	
	function unshifter(tableau) {
		//Undo the shift.
		if (tableau)
			$("#" + tableau + " .card").removeClass("shifted");
		else
			$(".card").removeClass("shifted");
	}
	
	function win(delayUnits) {
		clearInterval(timer);
		//Add time and meaning.
		var yourTime = $("#timer").text().split(":");
		if (yourTime.length == 3) //[hrs,mins,secs]
			yourTime = parseInt(yourTime[0]) * 60 + parseInt(yourTime[1]);
		else //[mins,secs]
			yourTime = parseInt(yourTime[0]);
		var yourSpeed;
		if (yourTime < 15) yourSpeed = "an easy win";
		else if (yourTime < 25) yourSpeed = "a sweaty victory";
		else yourSpeed = "a brain buster";
		$("#minutes").html(yourTime);
		$("#meaning").html(yourSpeed);
		$("#gameOver").fadeIn(delayUnits*speed);
	}

})();

context.debug = (function () {

	return {
		check: check,
		init: init,
		log: log
	};

	function check() {
		if (!debugging) return;
		log("checking tableaux",-1);
		for (var t=0;t<8;t++)
			checkColumn(t);
	}
	
	function checkColumn(column) {
		//private
		if (!debugging) return;
		log("checking tableau " + column,-2);
		//Validate the tableau against the data structure.
		var dataCount = tablArray[column].length;
		var cardCount = $("#tableau" + column + " .card").length;
		if (dataCount != cardCount) {
			log("column " + column + " count: "  + cardCount + "; expected: " + dataCount,3);
		}
		$("#tableau" + column + " .card").each(function(index) {
			if (deck[tablArray[column][index]].divID != $(this).attr('id'))
				log("Error: Card " + index + " (" + $(this).attr('id') + ") should be " + deck[tablArray[column][index]].divID,3);
			if (deck[tablArray[column][index]].Location != "tableau" + column)
				log("Error: Card " + index + " (" + $(this).attr('id') + ") has wrong location " + deck[tablArray[column][index]].Location,3);
		});
	}

	function init() {
		//Write the version number somewhere semi-visible to fight with the appcache.
		$("#versionP").append(" <span id='version'>" + version + ".</span>");
		if (!debugging) return;
		log("Initializing...",0);
	}
	
	function log(message,level) {
		/* Log levels 
		-2: obsolete
		-1: chatty
		 0: basic code path
		 1: current details
		 2: current concerns
		 3: real errors
		*/
		if (!debugging || !level || level < debugLevel) return;
		var timestamp = new Date();
		console.log(timestamp.toLocaleTimeString() + ": " + message);
	}

})();

})(myrmex);


//TODO:
//add the one known losing state.
//replace context.ui.alerter with something nicer

/* eof */
