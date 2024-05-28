import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Cursor
const cursor = {
  x: 0,
  y: 0,
};
window.addEventListener('mousemove', (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = -(event.clientY / sizes.height - 0.5);
});

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// Cube settings
const CUBE_SIZE = 0.8;
const INCREMENT = CUBE_SIZE + 0.02;
const GRID_AMOUNT = 3; // 3x3x3 grid
const allCubes = [];

// Create the materials for the faces of the cubes
const faceColors = [
  0xD61A3C, // red
  0xE27429, // orange
  0x3E8FED, // blue
  0x4FBF26, // green
  0xF9F9F3, // white
  0xFED000, // yellow
];

// Function to create a new cube with different colored faces
function newCube(x, y, z) {
  const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE,6,6,6);
  const materials = faceColors.map(color => new THREE.MeshStandardMaterial({ color }));
  const cube = new THREE.Mesh(geometry, materials);
  cube.position.set(x * INCREMENT, y * INCREMENT, z * INCREMENT);
  scene.add(cube);
  allCubes.push(cube); // Store the cube in the array
  return cube;
}

// Create a black cube for the center
const cubeblack = newCube(1, 1, 1);
cubeblack.material.forEach(material => material.color.setHex(0x000000));

// Fill the array with cubes and position them
for (let x = 0; x < GRID_AMOUNT; x++) {
  for (let y = 0; y < GRID_AMOUNT; y++) {
    for (let z = 0; z < GRID_AMOUNT; z++) {
      if (x !== 1 || y !== 1 || z !== 1) {
        newCube(x, y, z);
      }
    }
  }
}

// Camera
const camera = new THREE.PerspectiveCamera(70, sizes.width / sizes.height, 0.1, 100);
camera.position.set(3.44, 3.76, 3.71);
scene.add(camera);

// Lighting
const ambient = new THREE.AmbientLight(0x808080, 1);
const light = new THREE.PointLight(0xE0E0E0, 0.6, 100);
const light2 = new THREE.PointLight(0xE0E0E0, 1, 100);
light2.position.set(5, 5, -5);
scene.add(light, light2, ambient);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target = cubeblack.position;
controls.rotateSpeed = 1.8;
controls.zoomSpeed = 1.5;
controls.enableDamping = true;
controls.update();

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Background image
const loader = new THREE.TextureLoader();
loader.load('/background1.jpg', texture => {
  scene.background = texture;
});

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
function onClick(event) {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(allCubes);

  if (intersects.length > 0) {
    // Reset wireframe for all cubes
    allCubes.forEach(cube => {
      cube.material.forEach(material => material.wireframe = false);
    });

    // Set wireframe for the clicked cube
    const intersectedCube = intersects[0].object;
    intersectedCube.material.forEach(material => material.wireframe = true);
  }
}
canvas.addEventListener('dblclick', onClick);
// Right-click event to reset wireframe for all cubes
canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault(); // Prevent the default context menu from appearin
  // Reset wireframe for all cubes
  allCubes.forEach(cube => {
    cube.material.forEach(material => material.wireframe = false);
  });
});

// Handle window resize
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animation loop
const tick = () => {
  light.position.copy(camera.position);
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
