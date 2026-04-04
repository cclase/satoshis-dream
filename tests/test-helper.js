'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

/**
 * Creates a minimal browser-like environment and loads game.js,
 * returning the Game object for testing.
 */
function loadGame() {
  // Minimal browser globals needed by game.js
  const localStorage = new Map();
  const context = {
    window: {},
    localStorage: {
      getItem: (k) => localStorage.get(k) || null,
      setItem: (k, v) => localStorage.set(k, v),
      removeItem: (k) => localStorage.delete(k),
    },
    Date: Date,
    Math: Math,
    console: console,
    setTimeout: setTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    requestAnimationFrame: () => {},
    JSON: JSON,
    Object: Object,
    UI: null,
    Sound: null,
  };
  // game.js references `window` at top level via the IIFE
  context.window = context;

  const gameSource = fs.readFileSync(
    path.join(__dirname, '..', 'game.js'),
    'utf8'
  );

  vm.createContext(context);
  vm.runInContext(gameSource, context);

  return context.window.Game;
}

/**
 * Returns a fresh Game instance with a clean default state.
 * Each call gives an isolated copy so tests don't interfere.
 */
function freshGame() {
  const Game = loadGame();
  // Reset to default state without loading from localStorage
  return Game;
}

module.exports = { loadGame, freshGame };
