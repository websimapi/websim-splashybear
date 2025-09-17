import * as THREE from 'three';
import { createBear, createScenery, createWaterfall, createFish } from './gameObjects.js';
import { gameState, updateGameState, showStartScreen, showGameScreen, showGameOverScreen, updateUI, getStartButton, getRestartButton } from './gameState.js';
import { setupControls, setPointerMoveCallback, keysPressed } from './controls.js';
import { initAudio, playSFX, sounds } from './audio.js';

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 12, 9);
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
const gameContainer = document.getElementById('game-container');
gameContainer.appendChild(renderer.domElement);

function resizeRenderer() {
    camera.aspect = window.innerWidth / window.innerHeight;
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

// --- GAME CONSTANTS ---
const BEAR_X_LIMIT = 3.5;
const BEAR_MOVE_SPEED = 0.08; // This will be the max speed per frame
const BEAR_WOBBLE_AMOUNT = 0.2; // radians

// --- GAME OBJECTS ---
const bear = createBear();
scene.add(bear);

const scenery = createScenery();
scene.add(scenery);

const waterfall = createWaterfall();
scene.add(waterfall);

let activeFish = null;

// --- CONTROLS ---
const startButton = getStartButton();
const restartButton = getRestartButton();

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

function startGame() {
    updateGameState({
        current: 'PLAYING',
        score: 0,
        streak: 1,
    });
    bear.position.set(0, 4, 4);
    bear.rotation.set(0, Math.PI, 0);

    updateUI();
    showGameScreen();
    
    if (activeFish) {
        // Clear any other fish that might be lingering
        scene.children.forEach(child => {
            if (child.name === 'fish') {
                scene.remove(child);
            }
        });
    }
    activeFish = createFish(gameState);
    scene.add(activeFish);
}

function gameOver() {
    updateGameState({ current: 'GAME_OVER' });
    showGameOverScreen();
    playSFX('splash');
}

// --- CONTROLS ---
function onPointerDown(event, raycaster, pointer) {
    if (gameState.current !== 'PLAYING') return;

    // Allow clicking UI buttons
    if (event.target.tagName === 'BUTTON') return;
    
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    let fishClicked = false;
    for (const intersect of intersects) {
        let object = intersect.object;
        let isLog = false;

        // Traverse up to find the group name ('fish' or 'log')
        while (object.parent) {
             if (object.name === 'fish') {
                break;
            }
             if (object.name === 'log') {
                isLog = true;
                break;
            }
            object = object.parent;
        }

        if (object.name === 'fish' && object === activeFish) {
            playSFX('catch');
            updateGameState({
                score: gameState.score + 10 * gameState.streak,
                streak: gameState.streak + 1
            });
            updateUI();
            
            scene.remove(activeFish);
            activeFish = createFish(gameState);
            scene.add(activeFish);
            fishClicked = true;
            break; // Stop after catching one
        }

        if (isLog) {
            // If we didn't click a fish, and we did click the log, move the bear
            bear.userData.targetX = THREE.MathUtils.clamp(intersect.point.x, -BEAR_X_LIMIT, BEAR_X_LIMIT);
            bear.userData.isMovingWithKeys = false; // Stop key movement on click
            break; // Prioritize log over other scenery
        }
    }
}

function onKeyDown(event) {
    if (gameState.current !== 'PLAYING') return;

    if (event.key === 'a' || event.key === 'ArrowLeft' || event.key === 'd' || event.key === 'ArrowRight') {
        bear.userData.isMovingWithKeys = true;
    }
}

function onKeyUp(event) {
    // Key up handling if needed
}

setPointerMoveCallback((deltaX) => {
    if (gameState.current !== 'PLAYING') return;
    bear.userData.targetX = THREE.MathUtils.clamp(bear.position.x + deltaX, -BEAR_X_LIMIT, BEAR_X_LIMIT);
});

setupControls(onPointerDown, onKeyDown, onKeyUp);

// --- GAME LOOP ---
const gravity = new THREE.Vector3(0, -0.05, 0);

function animate() {
    requestAnimationFrame(animate);

    // Animate Waterfall
    const waterfallGroup = scene.getObjectByName("waterfall");
    const cliffEdgeZ = 2.5;
    const cliffTopY = 2;

    if (waterfallGroup) {
        waterfallGroup.children.forEach(child => {
            if (child.userData.velocity) {
                child.position.add(child.userData.velocity);

                if (child.userData.onRiver && child.position.z > cliffEdgeZ) {
                    // Reset to back of river
                    child.position.z = cliffEdgeZ - 15;
                } else if (!child.userData.onRiver && child.position.y < cliffTopY - 20) {
                    // Reset to top of fall
                    child.position.y = cliffTopY;
                }
            }
        });
    }

    if (gameState.current === 'PLAYING') {
        // Bear movement
        let moveDirection = 0;
        if (keysPressed['a'] || keysPressed['ArrowLeft']) {
            moveDirection = -1;
        } else if (keysPressed['d'] || keysPressed['ArrowRight']) {
            moveDirection = 1;
        }

        if (moveDirection !== 0 && bear.userData.isMovingWithKeys) {
            bear.userData.targetX = THREE.MathUtils.clamp(bear.position.x + moveDirection, -BEAR_X_LIMIT, BEAR_X_LIMIT);
        }

        const oldX = bear.position.x;
        
        // Move towards targetX at a constant speed
        const distanceToTarget = bear.userData.targetX - bear.position.x;
        const moveThisFrame = Math.sign(distanceToTarget) * Math.min(Math.abs(distanceToTarget), BEAR_MOVE_SPEED);
        
        if (Math.abs(distanceToTarget) > 0.01) { // A small threshold to prevent jittering
             bear.position.x += moveThisFrame;
        }

        const velocityX = bear.position.x - oldX;

        // Wobble animation based on movement
        if (Math.abs(velocityX) > 0.001) { // If moving
            bear.userData.wobbleTimer += 0.2; // This controls wobble speed
            const wobbleAngle = Math.sin(bear.userData.wobbleTimer) * BEAR_WOBBLE_AMOUNT;
            bear.rotation.z = wobbleAngle;
        } else { // If not moving
             // Smoothly return to upright position
            bear.rotation.z = THREE.MathUtils.lerp(bear.rotation.z, 0, 0.1);
            bear.userData.isMovingWithKeys = false; // Allow key movement again after click-move is done
        }

        // Fish movement
        if (activeFish) {
            activeFish.position.add(activeFish.userData.velocity);
            
            // Add swimming wiggle
            const ud = activeFish.userData;
            ud.swimTimer += 0.1;
            activeFish.position.x = ud.initialX + Math.sin(ud.swimTimer * ud.swimFrequency) * ud.swimAmplitude;
            
            activeFish.rotation.y = Math.sin(ud.swimTimer * ud.swimFrequency) * 0.2;

            // Missed fish
            if (activeFish.position.z > 3.5) { // Past the log
                updateGameState({ streak: 1 });
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