# Myrmex

[Play!](http://mcdemarco.github.io/myrmex/myrmex.html)

## About

This is a JavaScript implementation of Myrmex, a solitaire game for the Decktet card system.  The Decktet was created by P.D. Magnus and released under a CC license.  Myrmex was created by Greg James; all of his variants are supported.

The JavaScript implementation is partly based on an implementation of Adaman by Felbrigg Herriot, who released it under a Creative Commons Attribution NonCommercial ShareAlike 3.0 License.  Myrmex can be played in any browser (desktop or mobile), and will work offline.

Games are automatically saved and restored; to start a new game press the New button.  To restart the same game without shuffling, press the Replay button.

## Why?

Myrmex is a Decktet version of Spider, which I wanted to be able to play even when there isn't room to spread out my double Decktet deck.

## Bugs

Undo only undoes one move; undoing again will re-do.  Undo will not undo a deal.  However, the autosave does not save after a deal until you make another move, so you can undo an accidental deal immediately by reloading the page.

## Links

* [The Decktet](http://decktet.com)
* [Myrmex at the Decktet Wiki](http://decktet.wikidot.com/game:myrmex)
* [Myrmex at BGG](https://www.boardgamegeek.com/boardgame/105292/myrmex)
* My implementation of [Adaman](https://mcdemarco.github.io/adaman/)
