/**
 * socket.js — Socket.IO client wrapper for multiplayer Gin Rummy
 * Loaded only on pages that need live multiplayer.
 */
(function () {
  'use strict';

  window.AetherSocket = {
    socket: null,

    connect() {
      if (typeof io === 'undefined') {
        console.warn('[AetherSocket] socket.io not loaded');
        return;
      }
      this.socket = io();

      this.socket.on('gin-room-created', (roomId) => {
        document.dispatchEvent(new CustomEvent('gin:room-created', { detail: { roomId } }));
      });
      this.socket.on('gin-state-update', (state) => {
        document.dispatchEvent(new CustomEvent('gin:state-update', { detail: { state } }));
      });
      this.socket.on('gin-game-over', (winner) => {
        document.dispatchEvent(new CustomEvent('gin:game-over', { detail: { winner } }));
      });
      this.socket.on('gin-invalid-action', (message) => {
        document.dispatchEvent(new CustomEvent('gin:invalid-action', { detail: { message } }));
      });
    },

    createRoom(mode)   { if (!this.socket) this.connect(); this.socket.emit('gin-create-room', mode || 'classic'); },
    joinRoom(roomId)   { if (!this.socket) this.connect(); this.socket.emit('gin-join-room', roomId); },
    sendAction(roomId, action) {
      if (!this.socket) return;
      this.socket.emit('gin-player-action', { roomId, action });
    },
  };
}());