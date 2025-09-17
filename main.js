import * as THREE from 'three';

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 1, 1000);
camera.position.set(20, 20, 20);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
const gameContainer = document.getElementById('game-container');
gameContainer.appendChild(renderer.domElement);

function resizeRenderer() {
    const aspect = window.innerWidth / window.innerHeight;
    const zoom = 1.0; 
    camera.left = -8 * aspect * zoom;
    camera.right = 8 * aspect * zoom;
    camera.top = 8 * zoom;
    camera.bottom = -8 * zoom;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resizeRenderer);
resizeRenderer();


// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 5);
scene.add(directionalLight);

// --- MATERIALS and GEOMETRIES ---
const brownMat = new THREE.MeshLambertMaterial({ color: 0x8d5524 });
const darkBrownMat = new THREE.MeshLambertMaterial({ color: 0x4a2d1e });
const fishMat = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
const fishTailMat = new THREE.MeshLambertMaterial({ color: 0xff4500 });
const rockMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
const waterMat = new THREE.MeshLambertMaterial({ color: 0x1e90ff, transparent: true, opacity: 0.8 });
const foamMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });

// --- GAME OBJECTS ---
const lanes = [-2, 0, 2];
const bear = createBear();
scene.add(bear);

const platform = createPlatform();
scene.add(platform);

const waterfall = createWaterfall();
scene.add(waterfall);

let activeFish = null;

function createVoxel(x, y, z, w, h, d, mat) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
}

function createBear() {
    const group = new THREE.Group();
    // Body
    group.add(createVoxel(0, 0, 0, 1.5, 1.5, 1, brownMat));
    // Head
    group.add(createVoxel(0, 1.25, 0, 1, 1, 1, brownMat));
    // Ears
    group.add(createVoxel(-0.4, 1.9, 0, 0.3, 0.3, 0.3, darkBrownMat));
    group.add(createVoxel(0.4, 1.9, 0, 0.3, 0.3, 0.3, darkBrownMat));
    // Snout
    group.add(createVoxel(0, 1.1, 0.5, 0.5, 0.4, 0.3, darkBrownMat));
    // Legs
    group.add(createVoxel(-0.5, -1, 0, 0.5, 0.5, 0.5, brownMat));
    group.add(createVoxel(0.5, -1, 0, 0.5, 0.5, 0.5, brownMat));
    group.position.set(0, 3, 4);
    return group;
}

function createPlatform() {
    const group = new THREE.Group();
    for (let i = 0; i < 5; i++) {
        const x = (Math.random() - 0.5) * 10;
        const y = Math.random() * 2;
        const z = (Math.random() - 0.5) * 10;
        const size = 2 + Math.random() * 3;
        const rock = createVoxel(x, y, z, size, size, size, rockMat);
        group.add(rock);
    }
    const mainPlatform = createVoxel(0, 1, 4, 6, 2, 3, rockMat);
    group.add(mainPlatform);
    return group;
}

function createWaterfall() {
    const group = new THREE.Group();
    const waterfallPlane = new THREE.Mesh(new THREE.PlaneGeometry(10, 20), waterMat);
    waterfallPlane.rotation.x = -Math.PI / 2;
    waterfallPlane.position.set(0, 2, -4);
    group.add(waterfallPlane);

    // Foam particles
    for (let i = 0; i < 50; i++) {
        const foam = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), foamMat);
        foam.position.set(
            (Math.random() - 0.5) * 9,
            2,
            -14 + Math.random() * 10
        );
        foam.userData.velocity = Math.random() * 0.1 + 0.05;
        group.add(foam);
    }
    group.name = "waterfall";
    return group;
}

function createFish() {
    const group = new THREE.Group();
    group.add(createVoxel(0, 0, 0, 1, 0.5, 0.5, fishMat));
    group.add(createVoxel(0, 0.1, -0.6, 0.2, 0.8, 0.2, fishTailMat));
    
    group.userData.lane = lanes[Math.floor(Math.random() * lanes.length)];
    group.position.set(group.userData.lane, -2, -2);

    const speedMultiplier = 1 + (gameState.score / 500); // increase speed with score
    const forwardVelocity = (Math.random() * 0.5 + 1.5) * speedMultiplier;
    const upVelocity = (Math.random() * 0.3 + 0.8) * speedMultiplier;
    
    group.userData.velocity = new THREE.Vector3(0, upVelocity, forwardVelocity);
    group.userData.gravity = 0.02 * speedMultiplier;
    
    scene.add(group);
    return group;
}

// --- GAME STATE & UI ---
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreContainer = document.getElementById('score-container');
const streakContainer = document.getElementById('streak-container');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const finalScoreEl = document.getElementById('final-score');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

let gameState = {
    current: 'IDLE',
    score: 0,
    streak: 1,
    bearLane: 1,
};

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

function startGame() {
    gameState = {
        current: 'PLAYING',
        score: 0,
        streak: 1,
        bearLane: 1,
    };
    bear.position.x = lanes[gameState.bearLane];
    bear.position.y = 3;
    bear.rotation.set(0, 0, 0);

    updateUI();

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreContainer.classList.remove('hidden');
    streakContainer.classList.remove('hidden');
    
    if (activeFish) scene.remove(activeFish);
    activeFish = createFish();
}

function gameOver() {
    gameState.current = 'GAME_OVER';
    finalScoreEl.innerText = gameState.score;
    gameOverScreen.classList.remove('hidden');
    scoreContainer.classList.add('hidden');
    streakContainer.classList.add('hidden');
    playSFX(sounds.splash);
}

function updateUI() {
    scoreEl.innerText = gameState.score;
    streakEl.innerText = `x${gameState.streak}`;
}

// --- CONTROLS ---
function moveBear(direction) {
    if (gameState.current !== 'PLAYING') return;
    
    gameState.bearLane += direction;
    if (gameState.bearLane < 0) gameState.bearLane = 0;
    if (gameState.bearLane > lanes.length - 1) gameState.bearLane = lanes.length - 1;

    bear.position.x = lanes[gameState.bearLane];
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') moveBear(-1);
    if (e.key === 'ArrowRight') moveBear(1);
});

let touchStartX = 0;
let isSwiping = false;
window.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    isSwiping = false;
});
window.addEventListener('touchmove', (e) => {
    if (touchStartX === 0) return;
    const touchEndX = e.touches[0].clientX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 20) { // Swipe threshold
        isSwiping = true;
        if (diff > 0) moveBear(1);
        else moveBear(-1);
        touchStartX = 0; // Reset after one swipe
    }
});
window.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    if (e.clientX < window.innerWidth / 2) moveBear(-1);
    else moveBear(1);
});


// --- SOUNDS ---
let audioCtx;
const sounds = {};

async function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    sounds.catch = await loadSound('catch.mp3');
    sounds.splash = await loadSound('splash.mp3');
    sounds.whoosh = await loadSound('whoosh.mp3');
}
window.addEventListener('click', initAudio, { once: true });
window.addEventListener('touchstart', initAudio, { once: true });


async function loadSound(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
}

function playSFX(buffer) {
    if (!audioCtx || !buffer) return;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
}


// --- GAME LOOP ---
const gravity = new THREE.Vector3(0, -0.05, 0);

function animate() {
    requestAnimationFrame(animate);

    // Animate Waterfall
    const waterfallGroup = scene.getObjectByName("waterfall");
    if (waterfallGroup) {
        waterfallGroup.children.forEach(child => {
            if (child.userData.velocity) {
                child.position.z += child.userData.velocity;
                if (child.position.z > -4) {
                    child.position.z = -14 + Math.random() * 5;
                    child.position.x = (Math.random() - 0.5) * 9;
                }
            }
        });
    }

    if (gameState.current === 'PLAYING') {
        // Fish movement
        if (activeFish) {
            activeFish.position.z += activeFish.userData.velocity.z;
            activeFish.position.y += activeFish.userData.velocity.y;
            activeFish.userData.velocity.y -= activeFish.userData.gravity;
            activeFish.rotation.x += 0.1;

            // Collision check
            const fishPos = activeFish.position;
            const bearPos = bear.position;
            if (Math.abs(fishPos.z - bearPos.z) < 1 && Math.abs(fishPos.y - bearPos.y) < 2 && fishPos.x === bearPos.x) {
                playSFX(sounds.catch);
                gameState.score += 10 * gameState.streak;
                gameState.streak++;
                updateUI();
                
                scene.remove(activeFish);
                activeFish = createFish();
            }

            // Missed fish
            if (fishPos.z > bearPos.z + 2) {
                gameState.streak = 1;
                updateUI();
                gameOver();
            }
        }
    } else if (gameState.current === 'GAME_OVER') {
        // Bear fall animation
        if (bear.position.y > -10) {
            bear.position.add(gravity);
            bear.rotation.z += 0.05;
        }
    }
    
    renderer.render(scene, camera);
}

animate();

