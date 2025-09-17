
```
import * as THREE from 'three';

// --- CONTROLS ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let keysPressed = {};
let lastTouchX = null;
let isDragging = false;

export { keysPressed };

export function setupControls(onPointerDownCallback, onKeyDownCallback, onKeyUpCallback) {
    function onPointerDown(event) {
        isDragging = true;
        updatePointer(event);
        onPointerDownCallback(event, raycaster, pointer);
    }

    function onPointerMove(event) {
        if (!isDragging) return;
        
        const currentX = event.touches ? event.touches[0].clientX : event.clientX;
        if (lastTouchX !== null) {
            const deltaX = (currentX - lastTouchX) * 0.05; // Sensitivity factor
            onPointerMoveCallback?.(deltaX);
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
        if(event.touches) {
            lastTouchX = x;
        }
    }

    function handleKeyDown(event) {
        keysPressed[event.key] = true;
        onKeyDownCallback(event);
    }

    function handleKeyUp(event) {
        keysPressed[event.key] = false;
        onKeyUpCallback(event);
    }

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

let onPointerMoveCallback = null;

export function setPointerMoveCallback(callback) {
    onPointerMoveCallback = callback;
}