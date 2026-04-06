/**
 * ginRummyLogic.js
 * Full Gin Rummy logic — UMD for Node.js (socket.io server) + browser.
 *
 * Node.js:  const gin = require('./game-logic/ginRummyLogic');
 * Browser:  <script src="game-logic/ginRummyLogic.js"></script>
 *           then use window.GinRummyLogic
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.GinRummyLogic = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ── Card definitions ───────────────────────── */
  const SUITS = ['♥','♦','♣','♠'];
  const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

  function rankIndex(r)   { return RANKS.indexOf(r); }
  function cardValue(card) {
    if (card.rank === 'A')                          return 1;
    if (['J','Q','K'].includes(card.rank))          return 10;
    return parseInt(card.rank, 10);
  }
  function isRed(card) { return card.suit === '♥' || card.suit === '♦'; }
  function cardId(card) { return card.rank + card.suit; }

  /* ── Deck operations ────────────────────────── */
  function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ rank, suit, id: rank + suit });
      }
    }
    return shuffle(deck);
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ── Meld detection ─────────────────────────── */

  /** Find all valid sets (3-4 cards same rank) */
  function findSets(hand) {
    const byRank = {};
    for (const c of hand) {
      (byRank[c.rank] = byRank[c.rank] || []).push(c);
    }
    const sets = [];
    for (const r in byRank) {
      if (byRank[r].length >= 3) {
        sets.push([...byRank[r]]);
        // Also enumerate 3-card subsets if 4 cards
        if (byRank[r].length === 4) {
          for (let i = 0; i < 4; i++) {
            sets.push(byRank[r].filter((_, j) => j !== i));
          }
        }
      }
    }
    return sets;
  }

  /** Find all valid runs (3+ consecutive same suit) */
  function findRuns(hand) {
    const bySuit = {};
    for (const c of hand) {
      (bySuit[c.suit] = bySuit[c.suit] || []).push(c);
    }
    const runs = [];
    for (const suit in bySuit) {
      const sorted = bySuit[suit].sort((a, b) => rankIndex(a.rank) - rankIndex(b.rank));
      let run = [sorted[0]];
      for (let i = 1; i < sorted.length; i++) {
        if (rankIndex(sorted[i].rank) === rankIndex(sorted[i - 1].rank) + 1) {
          run.push(sorted[i]);
        } else {
          if (run.length >= 3) runs.push([...run]);
          run = [sorted[i]];
        }
      }
      if (run.length >= 3) {
        runs.push([...run]);
        // Also emit sub-runs of length 3+ from longer runs
        if (run.length > 3) {
          for (let len = 3; len < run.length; len++) {
            for (let start = 0; start + len <= run.length; start++) {
              runs.push(run.slice(start, start + len));
            }
          }
        }
      }
    }
    return runs;
  }

  /** All melds in a hand (sets + runs) */
  function findAllMelds(hand) {
    return [...findSets(hand), ...findRuns(hand)];
  }

  /**
   * Minimum deadwood calculation using greedy meld selection.
   * Returns { deadwood: number, meldedIds: Set }
   */
  function calcDeadwood(hand) {
    const allMelds = findAllMelds(hand);

    // Sort melds by descending length (greedy: maximise melded cards)
    const sorted = allMelds.sort((a, b) => b.length - a.length);

    const usedIds = new Set();
    const chosenMelds = [];

    for (const meld of sorted) {
      if (meld.every(c => !usedIds.has(c.id))) {
        meld.forEach(c => usedIds.add(c.id));
        chosenMelds.push(meld);
      }
    }

    const deadwood = hand
      .filter(c => !usedIds.has(c.id))
      .reduce((sum, c) => sum + cardValue(c), 0);

    return { deadwood, meldedIds: usedIds, melds: chosenMelds };
  }

  /* ── Game state factory ─────────────────────── */
  function createNewGame(mode, creatorId) {
    const deck   = createDeck();
    const hands  = {};

    // Deal 10 cards to creator (second player joins later)
    hands[creatorId] = [];
    for (let i = 0; i < 10; i++) hands[creatorId].push(deck.pop());

    const topDiscard = deck.pop();

    return {
      players:      [creatorId],
      deck,
      hands,
      discardPile:  [topDiscard],
      scores:       { [creatorId]: 0 },
      currentTurn:  0,             // index into players array
      phase:        'waiting',     // waiting | draw | discard | over
      mode:         mode || 'classic',
      round:        1,
      knocker:      null,

      // publicState is what gets sent to clients (no hidden deck)
      get publicState() {
        return {
          mode:         this.mode,
          round:        this.round,
          currentTurn:  this.currentTurn,
          phase:        this.phase,
          discardTop:   this.discardPile[this.discardPile.length - 1] || null,
          deckCount:    this.deck.length,
          scores:       this.scores,
          players:      this.players,
          knocker:      this.knocker,
        };
      },
    };
  }

  /* ── Join a room ────────────────────────────── */
  function joinGame(game, playerId) {
    if (game.players.length >= 2) {
      return { valid: false, message: 'Room is full' };
    }
    game.players.push(playerId);
    game.scores[playerId] = 0;
    game.hands[playerId]  = [];
    for (let i = 0; i < 10; i++) game.hands[playerId].push(game.deck.pop());
    game.phase = 'draw';
    return { valid: true };
  }

  /* ── Process an action ──────────────────────── */
  /**
   * action: {
   *   type: 'draw-deck' | 'draw-discard' | 'discard' | 'knock' | 'gin'
   *   card?: { rank, suit, id }   // for 'discard'
   * }
   */
  function processAction(game, playerId, action) {
    if (game.phase === 'waiting') {
      return { valid: false, message: 'Waiting for a second player' };
    }
    if (game.phase === 'over') {
      return { valid: false, message: 'Game is over' };
    }

    const playerIndex = game.players.indexOf(playerId);
    if (playerIndex === -1) {
      return { valid: false, message: 'Player not in this game' };
    }
    if (playerIndex !== game.currentTurn) {
      return { valid: false, message: 'Not your turn' };
    }

    const hand = game.hands[playerId];

    /* ── draw-deck ───────────────────────────── */
    if (action.type === 'draw-deck') {
      if (game.phase !== 'draw') return { valid: false, message: 'Not a draw phase' };
      if (game.deck.length === 0) return { valid: false, message: 'Deck is empty' };

      hand.push(game.deck.pop());
      game.phase = 'discard';
      return { valid: true };
    }

    /* ── draw-discard ────────────────────────── */
    if (action.type === 'draw-discard') {
      if (game.phase !== 'draw')        return { valid: false, message: 'Not a draw phase' };
      if (game.discardPile.length === 0) return { valid: false, message: 'Discard pile empty' };

      hand.push(game.discardPile.pop());
      game.phase = 'discard';
      return { valid: true };
    }

    /* ── discard ──────────────────────────────── */
    if (action.type === 'discard') {
      if (game.phase !== 'discard') return { valid: false, message: 'Not a discard phase' };
      if (!action.card)             return { valid: false, message: 'No card specified' };

      const idx = hand.findIndex(c => c.id === action.card.id);
      if (idx === -1) return { valid: false, message: 'Card not in hand' };

      game.discardPile.push(hand.splice(idx, 1)[0]);

      // Advance turn
      game.currentTurn = (game.currentTurn + 1) % game.players.length;
      game.phase       = 'draw';
      return { valid: true };
    }

    /* ── knock ────────────────────────────────── */
    if (action.type === 'knock') {
      if (game.phase !== 'discard') return { valid: false, message: 'Not a discard phase' };

      const { deadwood } = calcDeadwood(hand);
      if (deadwood > 10) return { valid: false, message: `Deadwood is ${deadwood} — need ≤ 10 to knock` };

      return resolveKnock(game, playerId, false);
    }

    /* ── gin ──────────────────────────────────── */
    if (action.type === 'gin') {
      if (game.phase !== 'discard') return { valid: false, message: 'Not a discard phase' };

      const { deadwood } = calcDeadwood(hand);
      if (deadwood !== 0) return { valid: false, message: `Deadwood is ${deadwood} — need 0 for Gin` };

      return resolveKnock(game, playerId, true);
    }

    return { valid: false, message: `Unknown action type: ${action.type}` };
  }

  /* ── Resolve a knock or gin ─────────────────── */
  function resolveKnock(game, knockerId, isGin) {
    game.phase  = 'over';
    game.knocker = knockerId;

    const opponentId   = game.players.find(p => p !== knockerId);
    const knockerHand  = game.hands[knockerId];
    const opponentHand = game.hands[opponentId];

    const { deadwood: kDW } = calcDeadwood(knockerHand);
    const { deadwood: oDW } = calcDeadwood(opponentHand);

    let winner, points, resultType;

    if (isGin) {
      // Gin: knocker wins, bonus 25 + opponent deadwood
      winner     = knockerId;
      points     = oDW + 25;
      resultType = 'gin';
    } else if (kDW < oDW) {
      // Normal knock win
      winner     = knockerId;
      points     = oDW - kDW;
      resultType = 'knock';
    } else if (oDW <= kDW) {
      // Undercut: opponent wins, bonus 10 + difference
      winner     = opponentId;
      points     = (kDW - oDW) + 10;
      resultType = 'undercut';
    } else {
      // Tie
      winner     = null;
      points     = 0;
      resultType = 'tie';
    }

    if (winner) game.scores[winner] = (game.scores[winner] || 0) + points;

    const gameOver = winner && game.scores[winner] >= 100;

    return {
      valid:      true,
      gameOver:   true,
      matchOver:  gameOver,
      winner,
      points,
      resultType,
      isGin,
      knockerDeadwood:  kDW,
      opponentDeadwood: oDW,
      message: buildResultMessage(resultType, winner, points, kDW, oDW),
    };
  }

  function buildResultMessage(type, winner, points, kDW, oDW) {
    switch (type) {
      case 'gin':      return `GIN! ${winner} scores ${points} pts (${oDW} deadwood + 25 bonus)`;
      case 'knock':    return `Knock! ${winner} scores ${points} pts (${oDW} − ${kDW})`;
      case 'undercut': return `Undercut! ${winner} scores ${points} pts (${kDW} − ${oDW} + 10 bonus)`;
      case 'tie':      return 'Tie — no points awarded';
      default:         return '';
    }
  }

  /* ── AI helper: choose best card to discard ─── */
  function aiChooseDiscard(hand) {
    // Discard the highest-value unmelded card
    const { meldedIds } = calcDeadwood(hand);
    const unmelded = hand.filter(c => !meldedIds.has(c.id));
    if (unmelded.length === 0) return hand[hand.length - 1]; // fallback

    return unmelded.sort((a, b) => cardValue(b) - cardValue(a))[0];
  }

  /** Returns true if taking the discard improves the AI hand */
  function aiWantsDiscard(hand, discardCard) {
    const { deadwood: before } = calcDeadwood(hand);
    const { deadwood: after }  = calcDeadwood([...hand, discardCard]);
    return after < before;
  }

  /* ── Public API ──────────────────────────────── */
  return {
    createDeck,
    createNewGame,
    joinGame,
    processAction,
    calcDeadwood,
    findAllMelds,
    findSets,
    findRuns,
    cardValue,
    isRed,
    cardId,
    rankIndex,
    aiChooseDiscard,
    aiWantsDiscard,
  };
}));