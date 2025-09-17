
```javascript
import * as THREE from 'three';
import { gameState, catchFish } from './gameManager.js';

// --- CONSTANTS ---
const BEAR_X_LIMIT = 3.5;

// --- MODULE SCOPED VARS ---
let cameraRef, sceneRef, bearRef, getActiveFish, onCatch, onMiss;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const keysPressed = {};
let lastTouchX = null;
let isDragging = false;

// --- EVENT HANDLERS ---
function onPointerDown(event) {
    if (gameState.current !== 'PLAYING') return;
    if (event.target.tagName === 'BUTTON') return;

    isDragging = true;
    updatePointer(event);

    raycaster.setFromCamera(pointer, cameraRef);
    const intersects = raycaster.intersectObjects(sceneRef.children, true);

    for (const intersect of intersects) {
        let object = intersect.object;
        let isLog = false;

        // Traverse up to find the group name ('fish' or 'log')
        while (object.parent) {
             if (object.name === 'fish') break;
             if (object.name === 'log') { isLog = true; break; }
             object = object.parent;
        }

        if (object.name === 'fish' && object === getActiveFish()) {
            catchFish();
            onCatch();
            return; // Exit after catching a fish
        }

        if (isLog) {
            bearRef.userData.targetX = THREE.MathUtils.clamp(intersect.point.x, -BEAR_X_LIMIT, BEAR_X_LIMIT);
            return; // Prioritize log over other scenery
        }
    }
}

function onPointerMove(event) {
    if (!isDragging || gameState.current !== 'PLAYING') return;

    const currentX = event.touches ? event.touches[0].clientX : event.clientX;
    if (lastTouchX !== null) {
        const deltaX = (currentX - lastTouchX) * 0.05; // Sensitivity factor
        bearRef.userData.targetX = THREE.MathUtils.clamp(bearRef.position.x + deltaX, -BEAR_X_LIMIT, BEAR_X_LIMIT);
    }
    lastTouchX = currentX;
}

function onPointerUp(event) {
    isDragging = false;
    lastTouchX = null;
}

function updatePointer(event) {
    const x = event.touches ? event.touches[0].clientX : event.clientX;
    const y = event.touches ? event.touches[0].clientY : event.clientY;
    pointer.x = (x / window.innerWidth) * 2 - 1;
    pointer.y = - (y / window.innerHeight) * 2 + 1;
    if(event.touches) lastTouchX = x;
}

function handleKeyDown(event) {
    if (gameState.current !== 'PLAYING') return;
    keysPressed[event.key] = true;
}

function handleKeyUp(event) {
    keysPressed[event.key] = false;
}

function handleKeyboardMovement() {
    if (gameState.current !== 'PLAYING') return;

    let moveDirection = 0;
    if (keysPressed['a'] || keysPressed['ArrowLeft']) {
        moveDirection = -1;
    } else if (keysPressed['d'] || keysPressed['ArrowRight']) {
        moveDirection = 1;
    }

    if (moveDirection !== 0) {
        bearRef.userData.targetX = THREE.MathUtils.clamp(bearRef.position.x + moveDirection, -BEAR_X_LIMIT, BEAR_X_LIMIT);
    }
}

// --- INITIALIZATION ---
export function initControls(_camera, _scene, _bear, _getActiveFish, _onCatch, _onMiss) {
    cameraRef = _camera;
    sceneRef = _scene;
    bearRef = _bear;
    getActiveFish = _getActiveFish;
    onCatch = _onCatch;
    onMiss = _onMiss;

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Check for keyboard movement within the animation loop for smoother control
    function keyboardMoveLoop() {
        handleKeyboardMovement();
        requestAnimationFrame(keyboardMoveLoop);
    }
    keyboardMoveLoop();
}