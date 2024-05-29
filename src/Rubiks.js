import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import TWEEN, { remove } from "@tweenjs/tween.js";
import * as dat from "lil-gui";

const gui = new dat.GUI();

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
window.addEventListener("mousemove", (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = -(event.clientY / sizes.height - 0.5);
});

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Cube settings
const CUBE_SIZE = 0.8;
const INCREMENT = CUBE_SIZE + 0.02;
const GRID_AMOUNT = 3; // 3x3x3 grid
var allCubes = [];

// Create the materials for the faces of the cubes
const faceColors = [
  0xd61a3c, // red
  0xe27429, // orange
  0x3e8fed, // blue
  0x4fbf26, // green
  0xf9f9f3, // white
  0xfed000, // yellow
];

// Function to create a new cube with different colored faces
function newCube(x, y, z) {
  const geometry = new THREE.BoxGeometry(
    CUBE_SIZE,
    CUBE_SIZE,
    CUBE_SIZE,
    12,
    12,
    12,
  );
  const materials = faceColors.map(
    (color) => new THREE.MeshStandardMaterial({ color }),
  );
  const cube = new THREE.Mesh(geometry, materials);
  cube.position.set(x * INCREMENT, y * INCREMENT, z * INCREMENT);
  allCubes.push(cube); // Store the cube in the array
  return cube;
}
// Create a black cube for the center
const cubeblack = newCube(1, 1, 1);
cubeblack.material.forEach((material) => material.color.setHex(0x000000));

function addcubes() {
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
  for (var i = 0; i < allCubes.length; i++) {
    scene.add(allCubes[i]);
  }
}

addcubes();

// Camera
const camera = new THREE.PerspectiveCamera(
  70,
  sizes.width / sizes.height,
  0.1,
  100,
);
camera.position.set(3.44, 3.76, 3.71);
scene.add(camera);

// Lighting
const ambient = new THREE.AmbientLight(0x808080, 1);
const light = new THREE.PointLight(0xe0e0e0, 0.6, 100);
const light2 = new THREE.PointLight(0xe0e0e0, 1, 100);
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

// Background - image
const loader = new THREE.TextureLoader();
loader.load("/background1.jpg", (texture) => {
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  scene.background = texture;
});

// Variable to store the selected cube
let selectedCube = null;

// Variable to track if animation is in progress
let isAnimating = false;

function onKeyDown(event) {
  // Check if animation is in progress
  if (isAnimating) return;

  const keyCode = event.code;
  if (selectedCube) {
    switch (keyCode) {
      case "KeyA":
      case "KeyD":
        rotateRow(selectedCube.position.y, "y", keyCode === "KeyA");
        break;
      case "KeyW":
      case "KeyS":
        rotateRow(selectedCube.position.x, "x", keyCode === "KeyW");
        break;
      case "KeyQ":
      case "KeyE":
        rotateRow(selectedCube.position.z, "z", keyCode === "KeyQ");
        break;
    }
  }
}

function rotateRow(fixedCoordinate, axis, clockwise) {
  // Set the animation flag to true
  isAnimating = true;

  const cubesToRotate = allCubes.filter((cube) => {
    return Math.abs(cube.position[axis] - fixedCoordinate) < 0.01;
  });

  // Use a counter to track the number of completed tweens
  let completedTweens = 0;

  cubesToRotate.forEach((cube) => {
    const rotationTween = new TWEEN.Tween(cube.rotation);
    const targetRotation = new THREE.Vector3();

    switch (axis) {
      case "x":
        targetRotation.x = clockwise
          ? cube.rotation.x + Math.PI / 2
          : cube.rotation.x - Math.PI / 2;
        break;
      case "y":
        targetRotation.y = clockwise
          ? cube.rotation.y + Math.PI / 2
          : cube.rotation.y - Math.PI / 2;
        break;
      case "z":
        targetRotation.z = clockwise
          ? cube.rotation.z + Math.PI / 2
          : cube.rotation.z - Math.PI / 2;
        break;
    }
    rotationTween
      .to(targetRotation, 250)
      .onComplete(() => {
        // Increment completed tweens counter
        completedTweens++;
        // If all tweens are completed, set animation flag to false
        if (completedTweens === cubesToRotate.length) {
          isAnimating = false;
        }
      })
      .start();
  });
}

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
}

// Event listeners for keydown and keyup events
document.addEventListener("keydown", onKeyDown);

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
    allCubes.forEach((cube) => {
      cube.material.forEach((material) => (material.wireframe = false));
    });

    // Set wireframe for the clicked cube
    const intersectedCube = intersects[0].object;
    selectedCube = intersectedCube;
    intersectedCube.material.forEach((material) => (material.wireframe = true));
    console.log("Matrix values of the intersected cube:");
    console.log(intersectedCube.matrix);
  }
}
canvas.addEventListener("dblclick", onClick);
// Right-click event to reset wireframe for all cubes
canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault(); // Prevent the default context menu from appearin
  // Reset wireframe for all cubes
  selectedCube = null;

  allCubes.forEach((cube) => {
    cube.material.forEach((material) => (material.wireframe = false));
  });
});

var obj = {
  Reset: function () {
    resetcubes();
  },
};
gui.add(obj, "Reset");
function resetcubes() {
  for (var i = 0; i < allCubes.length; i++) {
    scene.remove(allCubes[i]);
  }
  allCubes = [];
  addcubes();
}

// Handle window resize
window.addEventListener("resize", () => {
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
  requestAnimationFrame(tick); // Request the next frame
};

// Start the animation loop
animate();
tick();
