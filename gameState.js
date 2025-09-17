// --- GAME STATE & UI ---
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreContainer = document.getElementById('score-container');
const streakContainer = document.getElementById('streak-container');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const finalScoreEl = document.getElementById('final-score');

export let gameState = {
    current: 'IDLE',
    score: 0,
    streak: 1,
};

export function updateGameState(newState) {
    Object.assign(gameState, newState);
}

export function showStartScreen() {
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    scoreContainer.classList.add('hidden');
    streakContainer.classList.add('hidden');
}

export function showGameScreen() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreContainer.classList.remove('hidden');
    streakContainer.classList.remove('hidden');
}

export function showGameOverScreen() {
    finalScoreEl.innerText = gameState.score;
    gameOverScreen.classList.remove('hidden');
    scoreContainer.classList.add('hidden');
    streakContainer.classList.add('hidden');
}

export function updateUI() {
    scoreEl.innerText = gameState.score;
    streakEl.innerText = `x${gameState.streak}`;
}

export function getStartButton() {
    return document.getElementById('start-button');
}

export function getRestartButton() {
    return document.getElementById('restart-button');
}

