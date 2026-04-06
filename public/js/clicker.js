// public/js/clicker.js
let playerData = {};
let playerId = 'player-' + Math.random().toString(36).slice(2);

function launchClicker() {
  document.getElementById('carousel-screen').classList.add('hidden');
  
  fetch(`/api/clicker/${playerId}`)
    .then(res => res.json())
    .then(data => {
      playerData = data;
      renderClicker();
    });
}

function renderClicker() {
  const html = `
    <div class="fixed inset-0 bg-gradient-to-b from-black to-yellow-950 flex flex-col items-center justify-center z-50">
      <h1 class="text-7xl font-black mb-8 text-yellow-300">AETHER CLICKER</h1>
      
      <div onclick="clickCrystal()" class="cursor-pointer text-[180px] mb-8 hover:scale-110 transition-transform">💎</div>
      
      <div class="text-5xl mb-2">Clicks: <span id="click-count">${playerData.clicks}</span></div>
      <div class="text-3xl mb-8">Level ${playerData.level} • Prestige ${playerData.prestige}</div>
      
      <div class="flex gap-6">
        <button onclick="buyUpgrade()" class="play-btn">Buy Multiplier (${playerData.upgrades.multiplier}x)</button>
        <button onclick="prestigeReset()" class="play-btn bg-purple-600">Prestige</button>
        <button onclick="exitClicker()" class="play-btn bg-red-600">Exit</button>
      </div>
    </div>`;
  
  const container = document.createElement('div');
  container.id = 'clicker-game';
  container.innerHTML = html;
  document.body.appendChild(container);
}

function clickCrystal() {
  playerData.clicks += Math.floor(1 * playerData.upgrades.multiplier);
  document.getElementById('click-count').textContent = playerData.clicks;
  
  // Save every 5 clicks
  if (playerData.clicks % 5 === 0) saveProgress();
}

function buyUpgrade() {
  if (playerData.clicks >= 50) {
    playerData.clicks -= 50;
    playerData.upgrades.multiplier += 0.5;
    renderClicker();
    saveProgress();
  }
}

function prestigeReset() {
  if (playerData.clicks < 1000) return alert("Need 1000+ clicks to prestige!");
  playerData.prestige++;
  playerData.clicks = 0;
  playerData.upgrades.multiplier = 1 + playerData.prestige * 0.3;
  renderClicker();
  saveProgress();
}

function saveProgress() {
  fetch(`/api/clicker/${playerId}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(playerData)
  });
}

function exitClicker() {
  saveProgress();
  const game = document.getElementById('clicker-game');
  if (game) game.remove();
  document.getElementById('carousel-screen').classList.remove('hidden');
}