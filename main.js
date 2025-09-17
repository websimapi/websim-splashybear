import * as THREE from 'three';
import { scene, camera, renderer } from './sceneSetup.js';
import { bear, createScenery, waterfall, createFish } from './gameObjects.js';
import { gameState, startGame, gameOver } from './gameManager.js';
import { initControls } from './controls.js';
import { initAudio } from './audio.js';

// --- GLOBAL VARIABLES ---
let activeFish = null;
const gravity = new THREE.Vector3(0, -0.05, 0);

// --- INITIALIZATION ---
function init() {
    // Add initial objects to scene
    scene.add(bear);
    scene.add(createScenery());
    scene.add(waterfall);

    // Set up controls
    initControls(camera, scene, bear, () => activeFish, handleCatch, handleMiss);

    // UI Buttons
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');

    const handleStart = () => {
        // Must be called after user interaction for audio to work
        initAudio().then(() => {
            startGame(bear, handleMiss);
            if (activeFish) scene.remove(activeFish);
            activeFish = createFish();
            scene.add(activeFish);
        });
    };

    startButton.addEventListener('click', handleStart);
    restartButton.addEventListener('click', handleStart);
}

// --- GAME LOGIC HANDLERS ---
function handleCatch() {
    scene.remove(activeFish);
    activeFish = createFish();
    scene.add(activeFish);
}

function handleMiss() {
    gameOver();
}

// --- GAME LOOP ---
function animate() {
    requestAnimationFrame(animate);

    // Animate Waterfall
    const cliffEdgeZ = 2.5;
    const cliffTopY = 2;

    waterfall.children.forEach(child => {
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

    if (gameState.current === 'PLAYING') {
        // Bear movement logic
        const oldX = bear.position.x;
        const distanceToTarget = bear.userData.targetX - bear.position.x;
        const moveThisFrame = Math.sign(distanceToTarget) * Math.min(Math.abs(distanceToTarget), bear.userData.moveSpeed);

        if (Math.abs(distanceToTarget) > 0.01) { // A small threshold to prevent jittering
            bear.position.x += moveThisFrame;
        }

        const velocityX = bear.position.x - oldX;

        // Wobble animation based on movement
        if (Math.abs(velocityX) > 0.001) { // If moving
            bear.userData.wobbleTimer += 0.2; // This controls wobble speed
            const wobbleAngle = Math.sin(bear.userData.wobbleTimer) * bear.userData.wobbleAmount;
            bear.rotation.z = wobbleAngle;
        } else { // If not moving
            bear.rotation.z = THREE.MathUtils.lerp(bear.rotation.z, 0, 0.1);
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
                handleMiss();
                scene.remove(activeFish);
                activeFish = null;
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

// --- START ---
init();
animate();