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
    decktetShuffle(deck);
	stackDeck();
	//Deal to the foundation 4 times plus more for variants
	dealTheFoundation();
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
    // find target details.
    var targetOffset = $('#' + spaceID).offset();
	if (typeof delayUnits == 'undefined') delayUnits = 1;
	var delay = delayUnits * speed;
	if (spaceID == "drawDeckLocation") {
		$(deck[indexOfCard].selector).delay(delay).addClass("teeny");
	} else {
		var shift = getShift(spaceID);
		//Need to get the delay/transition onto removeClass.
		$(deck[indexOfCard].selector).css("z-index",shift).delay(delay).transition({left:targetOffset.left, top:targetOffset.top + 22*shift},speed,"snap").removeClass("teeny");
	}
    // reset cards location
    deck[indexOfCard].Location = spaceID;
	//$(deck[indexOfCard].selector + " img").delay(delay).transition({width:124, height:174});
	if (deck[indexOfCard].FaceUp && $(deck[indexOfCard].selector + " img").is(":visible"))
		$(deck[indexOfCard].selector + " img").delay(delay).hide();
	else if (!deck[indexOfCard].FaceUp && !$(deck[indexOfCard].selector + " img").is(":visible"))
		$(deck[indexOfCard].selector + " img").delay(delay).show();
}

function getShift(spaceID) {
	//Calculate the shift needed for the current space.
	if (spaceID.indexOf("foundation") != 0) return 0;
	else return foundArray[parseInt(spaceID.split("foundation")[1],10)-1].length - 1;
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
		dealToTheFoundation(false,(row-1)*8);
	} else {//major and double, for now
		for (var p=0;p<6;p++)
			dealCardToTheFoundation(p,isBlind(),(row-1)*8 + p);
		row = 5;
			dealToTheFoundation(false,(row-1)*8);
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
		foundArray[foundationNo].push(c);
		deck[c].Location = "foundation" + (foundationNo + 1);
		deck[c].FaceUp = !faceDown;
		moveCardToSpace(c, "foundation" + (foundationNo + 1), delayUnits);
	}
}


/* stuff we may not need */


//
// checks to see if it is posible to make a move, returns true if there is
//
function isThereAMove() {
    var returnValue = false; // assume can not go.

    // iterate through the Palace & capital spaces, and check each card
    for (var i = 0; i < deck.length; i++) {
        if (deck[i].Location.substring(0, 3) == 'pal' || deck[i].Location.substring(0, 3) == 'cap') {
            returnValue = canCardBeBeatenByResources(i,false);
            if (returnValue) {
                break;
            }
        }
    }

    return returnValue;
}

//
// check to see if there are available cards in the resources
// spaces to defeat the indicated card
//
function canCardBeBeatenByResources(targetCard, onlyCheckSelectedResourceCards) {
    var returnValue = false;
    var cardValue = deck[targetCard].Value;
    var matchingCardScores = 0;

    // loop through all cards on the resource line and get the total values of all suits
    for (var i = 0; i < deck.length; i++) {
        if (deck[i].Location.substring(0, 3) == 'res') {

            if ((onlyCheckSelectedResourceCards == false) || (onlyCheckSelectedResourceCards == true && deck[i].Selected == true)) {

                // does this resource card match the target at all?
                if (decktetDoCardsMatchOnAnySuit(targetCard, i)) {
                    // we have a match, so add the cards score
                    matchingCardScores += deck[i].Value;
                }
            }
        }
    }

    if (matchingCardScores >= cardValue) {
        returnValue = true;
    }

    return returnValue;
}



//
// deal cards to the resources
//
function dealToTheResources(delayUnits) {
	for (var r=1 ;r<6; r++)
		while (!dealToResourceSpace('resource' + r, (typeof delayUnits =='undefined' ? r + 5 : delayUnits + r/5)) && !gameOVER) { };

	//	
	/* Isn't this going to toss personalities into the Palace?
	for (var c=1 ;c<6; c++)
		while (!dealToResourceSpace('capital' + c, c) && !gameOVER) { };
	 */
}

//
// Attempt to deal a card into a resource space
// returns true if successful
//
function dealToResourceSpace(spaceName, delayUnits) {
    var returnValue = false;
    if (!isThereCardInSpace(spaceName)) {
        var c = getIndexOfTopCardOnDrawDeck();
        if (c != -1) {
            if (typeof (c) != 'undefined') {
                if (deck[c].Face) {
                    pushCardToPalace(c,delayUnits);
                    returnValue = false;
                } else {
                    moveCardToSpace(c, spaceName,delayUnits);
                    returnValue = true;
                }
            }
        } else {
            // no cards to deal
            returnValue = true;
        }

    } else {
        // there is a card in the space
        returnValue = true;
    }
	if (!isThereCardInSpace('drawDeckLocation')) {
		//We used the last card.
		$("#drawDeckLocation").removeClass("full");
	}
    return returnValue;
}

//
// Card was being dealt to resource but was a Face so is now being pushed to the Palace
// Returns true if able to place the card
function pushCardToPalace(indexOfCard, delayUnits) {
    var returnValue = false;
    var freeSpace = '';

    if (!isThereCardInSpace('palace1')) {
        freeSpace = 'palace1';
		delayUnits = delayUnits - 0.83;
    } else if (!isThereCardInSpace('palace2')) {
        freeSpace = 'palace2';
		delayUnits = delayUnits - 0.66;
    } else if (!isThereCardInSpace('palace3')) {
        freeSpace = 'palace3';
		delayUnits = delayUnits - 0.5;
    } else if (!isThereCardInSpace('palace4')) {
        freeSpace = 'palace4';
		delayUnits = delayUnits - 0.33;
    } else if (!isThereCardInSpace('palace5')) {
        freeSpace = 'palace5';
		delayUnits = delayUnits - 0.17;
    }

    if (freeSpace != '') {
        moveCardToSpace(indexOfCard, freeSpace, delayUnits);
        returnValue = true;
    } else {
        // no palace spaces available the game is over
        gameIsOver("palace",delayUnits);
    }

    return returnValue;
}

//
// Deal cards from the draw pile into the Capital Spaces
//
function dealToTheCapital(discardCount) {
	for (var c=1; c<=5; c++) {
		if (!isThereCardInSpace('capital' + c)) {
			var d = getIndexOfTopCardOnDrawDeck();
			if (d != -1) {
				moveCardToSpace(getIndexOfTopCardOnDrawDeck(), 'capital' + c, (discardCount ? discardCount : c));
			} else {
				// no cards to deal
			}
		}
	}
	if (!isThereCardInSpace('drawDeckLocation')) {
		//We used the last card.
		$("#drawDeckLocation").removeClass("full");
	}
}



//
// check if a card exists in selected space
//
function isThereCardInSpace(spaceName) {
    var returnValue = false;                    // 256 error line
    for (var i = 0; i < deck.length; i++) {
        if (deck[i].Location == spaceName) {
            returnValue = true;
            break;
        }
    }
    return returnValue;
}


//
// handle a card being clicked on
//
function cardClick(theImageID) {
    if (gameOVER) {
        return;
    }

    var cardIndex = getCardIndexByID(theImageID);

    if (deck[cardIndex].Selected) {
        // deselect card
        deck[cardIndex].Selected = false;
        $(deck[cardIndex].selector).removeClass('cardselected');
    } else {
        // select card

        // if this card is on the palace or capital line, deselect all other palace and capital cards
        if (deck[cardIndex].Location.substring(0, 3) == 'pal' || deck[cardIndex].Location.substring(0, 3) == 'cap') {
            deselectAllCardsOnRow('palace');
            deselectAllCardsOnRow('capital');
        }

        // mark the card as selected.
        deck[cardIndex].Selected = true;
        $(deck[cardIndex].selector).addClass('cardselected');

        if (checkIfTargetAndResourceCardsAreSelected()) {
            if (canTargetBeDefeatedBySelectedResources()) {
                // Get the index of target Card
                var targetCardIndex = getTargetCardIndex();
                
                // Remove resource cards that match target card suits.
				var discardCount = 1;
                for (var i = 0; i < deck.length; i++) {
                    if (deck[i].Selected == true) {
                        if (deck[i].Location.substring(0, 3) == 'res') {
                            if (decktetDoCardsMatchOnAnySuit(targetCardIndex, i)) {
								discardCount++;
                                discardCard(i,discardCount);
                            }
                        }
                    }
                }


                // increment score

                // If target card is not a face card is should be moved to the resource line.
                if (deck[targetCardIndex].Face == false) {
                    if (!isThereCardInSpace('resource1')) {
                        moveCardToSpace(targetCardIndex, 'resource1',discardCount);
                    } else if (!isThereCardInSpace('resource2')) {
                        moveCardToSpace(targetCardIndex, 'resource2',discardCount);
                    } else if (!isThereCardInSpace('resource3')) {
                        moveCardToSpace(targetCardIndex, 'resource3',discardCount);
                    } else if (!isThereCardInSpace('resource4')) {
                        moveCardToSpace(targetCardIndex, 'resource4',discardCount);
                    } else if (!isThereCardInSpace('resource5')) {
                        moveCardToSpace(targetCardIndex, 'resource5',discardCount);
                    }
                } else {
                    // the card is a face card, so simply discard it
                    discardCard(targetCardIndex,1);
                }

				// deselect target card.
                deck[targetCardIndex].Selected = false;
                $(deck[targetCardIndex].selector).delay(discardCount).removeClass('cardselected');

                // Deal to capital and resource lines.
                dealToTheCapital(discardCount);
				// +1 for any Capital cards, +1 for any Palace deals.
                dealToTheResources(discardCount + 2);

                // if there are no cards in the resource line, the game is over
                if (getResourceCount() == 0) {
					//This would fall through to (and hopefully fail) the move check, but stop anyway.
					gameIsOver('noMoves',discardCount + 2);
                }
            }
        }

        if (!isThereAMove()) {
            gameIsOver('noMoves',discardCount + 2);
        }
    }
}

//
// count the number of cards in the resource line
//
function getResourceCount() {
    var returnValue = 0;

    for (var i = 0; i < deck.length; i++) {
        if (deck[i].Location.substring(0, 3) == 'res') {
            returnValue++;
            if(returnValue == 5) { break; }
        }
    }
    return returnValue;
}

//
// get the total card value in the resource line for scoring
//
function getResourceScore() {
    var returnValue = 0;
	var resourceCount = getResourceCount();
	var resourceCounter = 0;

    for (var i = 0; i < deck.length; i++) {
        if (deck[i].Location.substring(0, 3) == 'res') {
            returnValue += deck[i].Value;
			resourceCounter++;
            if (resourceCounter == resourceCount) { break; }
        }
    }
    return returnValue;
}


//
// Discard a selected card
//
function discardCard(cardIndex,delayUnits) {
	discardCount++;
    deck[cardIndex].Selected = false; // deselect it card
    $(deck[cardIndex].selector).removeClass('cardselected');
	$(deck[cardIndex].selector).css("z-index",delayUnits);
    moveCardToSpace(cardIndex, 'discardDeckLocation',1);
}

//
// get the index of the Target Card
//
function getTargetCardIndex() {
    var returnValue = -1;
    for (var i = 0; i < deck.length; i++) {
        if (deck[i].Selected) {
            if (deck[i].Location.substring(0, 3) == 'pal' || deck[i].Location.substring(0, 3) == 'cap') {
                returnValue = i;
                break;        
            }
        }
    }
    return returnValue;
}


//
// can the selected targetCard be defeated by the selected resource cards
//
function canTargetBeDefeatedBySelectedResources() {
    var returnValue = false;

    // get index of selected target
    var selectedTargetIndex = getTargetCardIndex();
    returnValue = canCardBeBeatenByResources(selectedTargetIndex, true);

    return returnValue;
}

//
// check that both a target card and a resource card are selected
//
function checkIfTargetAndResourceCardsAreSelected() {
    var returnValue = false;
    var palaceOrCapitalCardSelected = false;
    var resourceCardSelected = false;

    for (var i = 0; i < deck.length; i++) {
        if (deck[i].Selected == true) {
            if (deck[i].Location.substring(0, 3) == 'pal' || deck[i].Location.substring(0, 3) == 'cap') {
                //alert('selected ' + deck[i].Name);
                palaceOrCapitalCardSelected = true;
            } else {
                //alert('selected ' + deck[i].Name);
                resourceCardSelected = true;
            }
        }
    }

    return (palaceOrCapitalCardSelected && resourceCardSelected);
}


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
function gameIsOver(endCondition,delayUnits) {
    gameOVER = true;
	endCondition = typeof endCondition !== 'undefined' ? endCondition : "noMoves";
	if (endCondition == "victory") {
		//We have some more scoring to do.
		score += getResourceScore();
		$('#runningScore').html(score.toString());
	}
    $('#finalScore').html(score.toString());
	switch(endCondition) {
		case "victory":
			$("#endCondition").html("Victory is yours!  You have control of everyone who matters and can safely seize the throne.");
			break;
		case "palace":
			$("#endCondition").html("The opposition in the Palace has become too great.");
			break;
		default:
			$("#endCondition").html("There are no more possible moves.");
	}
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
    var p = $('#drawDeckLocation').offset();
    for (var i = deck.length - 1; i >= 0; i--) {
        createOnScreenCard(deck[i],i);
        $(deck[i].selector).offset({ top: p.top, left: p.left });
        $(deck[i].selector).click(shifter);
        $(deck[i].selector).hover(shifter, unshifter);
    }
    pleaseWaitOff();
}

//
// create an on-screen card element
//
function createOnScreenCard(card,index) {
	var emblacken = getSetting('blackmoons');
	var cardImage = card.Image;
	if (emblacken && (card.Suit1 == "Moons" ||card.Suit2 == "Moons" ||card.Suit3 == "Moons"))
		cardImage = cardImage.split(".png")[0] + "_black.png";
    var imageLit = '<div id="' + card.divID + '" class="teeny card" style="background-image:url(cards/' + cardImage + ');" title="' + card.Name + '"><img class="card" src="cards/back.png" /></div>';
	$(imageLit).appendTo('#gamewrapper');
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


function shifter() {
	//Shift cards for visibility on hover or click
	unshifter();
	var cardID = this.id;
	var startCard = $("#" + cardID).css("z-index");
	var foundationNo = parseInt(deck[getCardIndexByID(cardID)].Location.split("foundation")[1],10) - 1;
	for (var s=startCard;s<foundArray[foundationNo].length; s++)
		$(deck[foundArray[foundationNo][s]].selector).css("margin-left",22 * (s - startCard));
}

function unshifter() {
	//Undo the shift.
	$(".card").css("margin-left",0);
}
