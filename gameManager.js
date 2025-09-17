
```javascript
import { playSFX } from './audio.js';

// --- UI ELEMENTS ---
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreContainer = document.getElementById('score-container');
const streakContainer = document.getElementById('streak-container');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const finalScoreEl = document.getElementById('final-score');

// --- GAME STATE ---
export const gameState = {
    current: 'IDLE',
    score: 0,
    streak: 1,
};

// --- GAME FLOW FUNCTIONS ---
export function startGame(bearRef, onMissCallback) {
    gameState.current = 'PLAYING';
    gameState.score = 0;
    gameState.streak = 1;

    bearRef.position.set(0, 4, 4);
    bearRef.rotation.set(0, Math.PI, 0);

    updateUI();

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreContainer.classList.remove('hidden');
    streakContainer.classList.remove('hidden');
}

export function gameOver() {
    gameState.current = 'GAME_OVER';
    finalScoreEl.innerText = gameState.score;
    gameOverScreen.classList.remove('hidden');
    scoreContainer.classList.add('hidden');
    streakContainer.classList.add('hidden');
    playSFX('splash');
}

export function catchFish() {
    playSFX('catch');
    gameState.score += 10 * gameState.streak;
    gameState.streak++;
    updateUI();
}

export function missFish() {
    gameState.streak = 1;
    updateUI();
}

// --- UI UPDATE ---
export function updateUI() {
    scoreEl.innerText = gameState.score;
    streakEl.innerText = `x${gameState.streak}`;
}