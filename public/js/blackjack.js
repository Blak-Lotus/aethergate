// public/js/blackjack.js
let deck = [];
let playerHand = [];
let dealerHand = [];
let gameOver = false;

function launchBlackjack() {
  document.getElementById('carousel-screen').classList.add('hidden');
  const gameHTML = `
    <div class="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div class="bg-zinc-950 border-4 border-cyan-400 p-8 rounded-2xl max-w-4xl w-full">
        <h1 class="text-6xl font-black text-center mb-8 text-cyan-300">BLACKJACK</h1>
        
        <div class="flex justify-between mb-12">
          <div>
            <p class="text-xl mb-2 text-gray-400">Dealer</p>
            <div id="dealer-hand" class="flex gap-4"></div>
            <p id="dealer-total" class="text-2xl mt-2"></p>
          </div>
          <div>
            <p class="text-xl mb-2 text-gray-400">You</p>
            <div id="player-hand" class="flex gap-4"></div>
            <p id="player-total" class="text-2xl mt-2"></p>
          </div>
        </div>

        <div class="flex justify-center gap-6">
          <button onclick="hit()" class="play-btn px-12 py-4 text-2xl">HIT</button>
          <button onclick="stand()" class="play-btn px-12 py-4 text-2xl">STAND</button>
          <button onclick="exitGame()" class="play-btn px-12 py-4 text-2xl bg-red-600 border-red-500">EXIT</button>
        </div>
      </div>
    </div>`;
  
  const container = document.createElement('div');
  container.id = 'blackjack-game';
  container.innerHTML = gameHTML;
  document.body.appendChild(container);

  startBlackjackGame();
}

function startBlackjackGame() {
  deck = [];
  const suits = ['♥','♦','♣','♠'];
  const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  for (let suit of suits) for (let value of values) deck.push({value, suit});
  deck = deck.sort(() => Math.random() - 0.5);

  playerHand = [deck.pop(), deck.pop()];
  dealerHand = [deck.pop(), deck.pop()];

  gameOver = false;
  renderHands();
}

function calculateTotal(hand) {
  let total = 0, aces = 0;
  for (let card of hand) {
    if (['J','Q','K'].includes(card.value)) total += 10;
    else if (card.value === 'A') { aces++; total += 11; }
    else total += parseInt(card.value);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function renderHands() {
  document.getElementById('player-hand').innerHTML = playerHand.map(c => `<div class="text-6xl">${c.value}${c.suit}</div>`).join('');
  document.getElementById('dealer-hand').innerHTML = dealerHand.map(c => `<div class="text-6xl">${c.value}${c.suit}</div>`).join('');
  
  document.getElementById('player-total').textContent = `Total: ${calculateTotal(playerHand)}`;
  document.getElementById('dealer-total').textContent = `Total: ${calculateTotal(dealerHand)}`;
}

function hit() {
  if (gameOver) return;
  playerHand.push(deck.pop());
  renderHands();
  if (calculateTotal(playerHand) > 21) {
    gameOver = true;
    alert("Bust! You lose.");
    setTimeout(exitGame, 1500);
  }
}

function stand() {
  if (gameOver) return;
  gameOver = true;
  
  // Dealer draws until 17
  while (calculateTotal(dealerHand) < 17) {
    dealerHand.push(deck.pop());
  }
  renderHands();

  const playerTotal = calculateTotal(playerHand);
  const dealerTotal = calculateTotal(dealerHand);

  if (dealerTotal > 21 || playerTotal > dealerTotal) alert("You Win!");
  else if (playerTotal === dealerTotal) alert("Push!");
  else alert("Dealer Wins!");
  
  setTimeout(exitGame, 2000);
}

function exitGame() {
  const game = document.getElementById('blackjack-game');
  if (game) game.remove();
  document.getElementById('carousel-screen').classList.remove('hidden');
}