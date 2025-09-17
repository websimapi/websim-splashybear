
```javascript
import * as THREE from 'three';

// --- SCENE ---
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// --- CAMERA ---
export const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 12, 9);
camera.lookAt(0, 2, 0);

// --- RENDERER ---
export const renderer = new THREE.WebGLRenderer({ antialias: true });
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