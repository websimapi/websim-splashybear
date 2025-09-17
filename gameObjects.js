
```javascript
import * as THREE from 'three';
import { gameState } from './gameManager.js';

// --- MATERIALS ---
const brownMat = new THREE.MeshLambertMaterial({ color: 0x8d5524 });
const darkBrownMat = new THREE.MeshLambertMaterial({ color: 0x4a2d1e });
const fishMat = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
const fishTailMat = new THREE.MeshLambertMaterial({ color: 0xff4500 });
const rockMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
const waterMat = new THREE.MeshLambertMaterial({ color: 0x1e90ff, transparent: true, opacity: 0.8 });
const foamMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
const treeTrunkMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
const treeLeavesMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });

// --- HELPER ---
function createVoxel(x, y, z, w, h, d, mat) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
}

// --- CREATION FUNCTIONS ---
export function createBear() {
    const group = new THREE.Group();
    group.add(createVoxel(0, 0, 0, 1.5, 1.5, 1, brownMat));
    group.add(createVoxel(0, 1.25, 0, 1, 1, 1, brownMat));
    group.add(createVoxel(-0.4, 1.9, 0, 0.3, 0.3, 0.3, darkBrownMat));
    group.add(createVoxel(0.4, 1.9, 0, 0.3, 0.3, 0.3, darkBrownMat));
    group.add(createVoxel(0, 1.1, 0.5, 0.5, 0.4, 0.3, darkBrownMat));
    group.add(createVoxel(-0.5, -1, 0, 0.5, 0.5, 0.5, brownMat));
    group.add(createVoxel(0.5, -1, 0, 0.5, 0.5, 0.5, brownMat));
    group.position.set(0, 4, 4);
    group.rotation.y = Math.PI;
    group.userData = {
        targetX: 0,
        wobbleTimer: 0,
        wobbleAmount: 0.2, // radians
        moveSpeed: 0.08, // max speed per frame
    };
    return group;
}

function createMountainSide(isLeft) {
    const group = new THREE.Group();
    const sign = isLeft ? -1 : 1;
    const baseWidth = 8, baseDepth = 20, startY = 2, endY = -20, riverEdge = 4;
    let currentY = startY, layerCount = 0;
    while (currentY > endY) {
        layerCount++;
        const layerHeight = 3 + Math.random() * 3;
        const widthIncrease = Math.random() * 2;
        const depthIncrease = Math.random() * 2;
        const layerWidth = baseWidth + (layerCount * widthIncrease);
        const layerDepth = baseDepth + (layerCount * depthIncrease);
        const layerX = sign * (riverEdge + layerWidth / 2 + (Math.random() - 0.5));
        const layerZ = -5 + (Math.random() - 0.5) * 2;
        const layerY = currentY - layerHeight / 2;
        group.add(createVoxel(layerX, layerY, layerZ, layerWidth, layerHeight, layerDepth, rockMat));
        const detailRocks = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < detailRocks; i++) {
            const size = 1 + Math.random() * 2;
            const detailX = sign * (riverEdge + Math.random() * layerWidth - (layerWidth / 2)) + layerX;
            const detailY = currentY + size / 2;
            const detailZ = layerZ + (Math.random() - 0.5) * layerDepth;
            group.add(createVoxel(detailX, detailY, detailZ, size, size, size, rockMat));
        }
        currentY -= layerHeight;
    }
    return group;
}

export function createScenery() {
    const group = new THREE.Group();
    const logGeo = new THREE.CylinderGeometry(0.7, 0.7, 9, 8);
    const log = new THREE.Mesh(logGeo, darkBrownMat);
    log.name = "log";
    log.rotation.z = Math.PI / 2;
    log.position.set(0, 2.7, 4);
    group.add(log);
    group.add(createMountainSide(true));
    group.add(createMountainSide(false));
    group.add(createTree(-7, 2, 0));
    group.add(createTree(-8, 2, -5));
    group.add(createTree(-6, 2, -10));
    group.add(createTree(7, 2, -2));
    group.add(createTree(9, 2, 2));
    group.add(createTree(8, 2, -8));
    return group;
}

function createTree(x, y, z) {
    const group = new THREE.Group();
    const trunkHeight = 1 + Math.random();
    const leavesHeight = 2 + Math.random() * 2;
    group.add(createVoxel(0, trunkHeight / 2, 0, 0.5, trunkHeight, 0.5, treeTrunkMat));
    group.add(createVoxel(0, trunkHeight + leavesHeight / 2 - 0.5, 0, 1.5, leavesHeight, 1.5, treeLeavesMat));
    group.position.set(x, y, z);
    return group;
}

export function createWaterfall() {
    const group = new THREE.Group();
    group.name = "waterfall";
    const waterWidth = 8, cliffEdgeZ = 2.5, cliffTopY = 2;
    const riverGeo = new THREE.PlaneGeometry(waterWidth, 15);
    const river = new THREE.Mesh(riverGeo, waterMat);
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, cliffTopY, cliffEdgeZ - 7.5);
    group.add(river);
    const fallGeo = new THREE.PlaneGeometry(waterWidth, 20);
    const fall = new THREE.Mesh(fallGeo, waterMat);
    fall.position.set(0, cliffTopY - 10, cliffEdgeZ);
    group.add(fall);
    for (let i = 0; i < 50; i++) {
        const foam = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), foamMat);
        const onRiver = Math.random() > 0.4;
        foam.userData.onRiver = onRiver;
        if (onRiver) {
            foam.position.set((Math.random() - 0.5) * (waterWidth - 1), cliffTopY + 0.1, cliffEdgeZ - (Math.random() * 15));
            foam.userData.velocity = new THREE.Vector3(0, 0, Math.random() * 0.05 + 0.05);
        } else {
            foam.position.set((Math.random() - 0.5) * (waterWidth - 1), cliffTopY - (Math.random() * 20), cliffEdgeZ);
            foam.userData.velocity = new THREE.Vector3(0, -(Math.random() * 0.1 + 0.1), 0);
        }
        group.add(foam);
    }
    return group;
}

export function createFish() {
    const group = new THREE.Group();
    group.name = 'fish';
    group.add(createVoxel(0, 0, 0, 1, 0.5, 0.5, fishMat));
    group.add(createVoxel(0, 0.1, -0.6, 0.2, 0.8, 0.2, fishTailMat));
    const riverWidth = 7;
    const xPos = (Math.random() - 0.5) * riverWidth;
    group.position.set(xPos, 2.1, -12);
    const speedMultiplier = 1 + (gameState.score / 500);
    const swimSpeed = (0.05 + Math.random() * 0.05) * speedMultiplier;
    group.userData = {
        velocity: new THREE.Vector3(0, 0, swimSpeed),
        initialX: xPos,
        swimFrequency: Math.random() * 5 + 2,
        swimAmplitude: Math.random() * 0.5 + 0.2,
        swimTimer: Math.random() * Math.PI * 2,
    };
    return group;
}

// --- EXPORTED INSTANCES ---
export const bear = createBear();
export const waterfall = createWaterfall();