/**
 * blackjackLogic.js
 * Full Blackjack game logic — works in Node.js (server) and browser (UMD).
 *
 * Node.js:  const bj = require('./game-logic/blackjackLogic');
 * Browser:  <script src="game-logic/blackjackLogic.js"></script>
 *           then use window.BlackjackLogic
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();          // Node.js
  } else {
    root.BlackjackLogic = factory();     // Browser global
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SUITS  = ['♥', '♦', '♣', '♠'];
  const VALUES = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

  /* ── Build & shuffle a standard 52-card deck ── */
  function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const value of VALUES) {
        deck.push({ value, suit });
      }
    }
    return shuffle(deck);
  }

  function shuffle(deck) {
    const d = [...deck];
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  }

  /* ── Hand value (Ace high/low) ─────────────── */
  function calculateHand(hand) {
    let total = 0;
    let aces  = 0;
    for (const card of hand) {
      if (['J','Q','K'].includes(card.value)) {
        total += 10;
      } else if (card.value === 'A') {
        aces++;
        total += 11;
      } else {
        total += parseInt(card.value, 10);
      }
    }
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return total;
  }

  /* ── Predicates ────────────────────────────── */
  function isBust(hand)      { return calculateHand(hand) > 21; }
  function isBlackjack(hand) { return hand.length === 2 && calculateHand(hand) === 21; }
  function isRed(card)       { return card.suit === '♥' || card.suit === '♦'; }

  /* ── Draw top card from deck ────────────────── */
  function hit(hand, deck) {
    if (deck.length === 0) throw new Error('Deck is empty');
    hand.push(deck.pop());
    return hand;
  }

  /* ── Dealer plays (stand on soft 17) ────────── */
  function dealerPlay(dealerHand, deck) {
    while (calculateHand(dealerHand) < 17) {
      hit(dealerHand, deck);
    }
    return dealerHand;
  }

  /* ── Create a fresh game state ──────────────── */
  function createNewGame() {
    const deck       = createDeck();
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];
    return {
      deck,
      playerHand,
      dealerHand,
      gameOver:    false,
      playerScore: calculateHand(playerHand),
      dealerScore: calculateHand(dealerHand),
    };
  }

  /* ── Process player action ───────────────────── */
  /**
   * action: 'hit' | 'stand' | 'double'
   * Returns updated game + result info:
   *   { game, outcome: null | 'win' | 'lose' | 'push' | 'blackjack', message }
   */
  function processAction(game, action) {
    if (game.gameOver) {
      return { game, outcome: null, message: 'Game is already over.' };
    }

    let outcome = null;
    let message = '';

    if (action === 'hit') {
      hit(game.playerHand, game.deck);
      game.playerScore = calculateHand(game.playerHand);

      if (isBust(game.playerHand)) {
        game.gameOver = true;
        outcome = 'lose';
        message = 'Bust! You went over 21.';
      } else if (game.playerScore === 21) {
        // Auto-stand at 21
        return processAction(game, 'stand');
      }

    } else if (action === 'stand' || action === 'double') {
      if (action === 'double') {
        hit(game.playerHand, game.deck);
        game.playerScore = calculateHand(game.playerHand);
        if (isBust(game.playerHand)) {
          game.gameOver = true;
          outcome = 'lose';
          message = 'Bust after Double Down!';
          return { game, outcome, message };
        }
      }

      // Dealer plays out
      dealerPlay(game.dealerHand, game.deck);
      game.dealerScore = calculateHand(game.dealerHand);
      game.gameOver    = true;

      const pv = game.playerScore;
      const dv = game.dealerScore;

      if (isBust(game.dealerHand)) {
        outcome = 'win';
        message = 'Dealer busts! You win! 🎉';
      } else if (pv > dv) {
        outcome = 'win';
        message = 'You win! 🎉';
      } else if (pv < dv) {
        outcome = 'lose';
        message = 'Dealer wins.';
      } else {
        outcome = 'push';
        message = "Push — it's a tie!";
      }
    }

    return { game, outcome, message };
  }

  /* ── Payout multiplier ───────────────────────── */
  function payout(outcome, isBlackjackWin) {
    if (outcome === 'win')   return isBlackjackWin ? 2.5 : 2; // 3:2 for BJ
    if (outcome === 'push')  return 1;
    return 0;
  }

  /* ── Public API ──────────────────────────────── */
  return {
    createDeck,
    createNewGame,
    calculateHand,
    isBust,
    isBlackjack,
    isRed,
    hit,
    dealerPlay,
    processAction,
    payout,
  };
}));