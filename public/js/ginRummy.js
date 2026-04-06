// public/js/ginRummy.js
let socket;

function launchGinRummy() {
  document.getElementById('carousel-screen').classList.add('hidden');
  
  const html = `
    <div class="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
      <div class="bg-zinc-900 border-4 border-purple-500 p-10 rounded-3xl max-w-lg w-full text-center">
        <h1 class="text-6xl font-black mb-8 text-purple-300">GIN RUMMY</h1>
        <button onclick="createGinRoom()" class="play-btn mb-6 block w-full">CREATE ROOM</button>
        <input id="room-id" placeholder="Enter Room ID" class="bg-zinc-800 text-white p-4 rounded-xl w-full mb-6 text-center text-xl">
        <button onclick="joinGinRoom()" class="play-btn block w-full">JOIN ROOM</button>
        <button onclick="exitGinRummy()" class="mt-8 text-red-400">Back to Hub</button>
      </div>
    </div>`;
  
  const container = document.createElement('div');
  container.id = 'gin-lobby';
  container.innerHTML = html;
  document.body.appendChild(container);

  socket = io();
}

function createGinRoom() {
  socket.emit('gin-create-room', 'points'); // or 'no-points', 'jokers'
}

function joinGinRoom() {
  const roomId = document.getElementById('room-id').value.trim();
  if (roomId) socket.emit('gin-join-room', roomId);
}

function exitGinRummy() {
  const lobby = document.getElementById('gin-lobby');
  if (lobby) lobby.remove();
  document.getElementById('carousel-screen').classList.remove('hidden');
  if (socket) socket.disconnect();
}