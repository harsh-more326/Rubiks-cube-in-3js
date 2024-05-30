import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import TWEEN from "@tweenjs/tween.js";
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
    (color) =>
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 }),
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

// Handle window resize
window.addEventListener('resize', () => 
{
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Background - image
const loader = new THREE.TextureLoader();
loader.load("/back2.png", (texture) => {
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  scene.background = texture;
});

// Variable to store the selected cube
let selectedCube = null;

// Variable to track if animation is in progress
let isAnimating = false;

function rotateRow(fixedCoordinate, axis, clockwise) {
  if (isAnimating) return;
  isAnimating = true;

  const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
  const cubesToRotate = allCubes.filter(
    (cube) => Math.abs(cube.position[axis] - fixedCoordinate) < 0.01,
  );
  let completedTweens = 0;

  cubesToRotate.forEach((cube) => {
    const startRotation = cube.rotation.clone();
    const endRotation = new THREE.Euler().copy(cube.rotation);

    switch (axis) {
      case "x":
        endRotation.x += angle;
        break;
      case "y":
        endRotation.y += angle;
        break;
      case "z":
        endRotation.z += angle;
        break;
    }

    new TWEEN.Tween(cube.rotation)
      .to(
        {
          x: endRotation.x,
          y: endRotation.y,
          z: endRotation.z,
        },
        500,
      )
      .easing(TWEEN.Easing.Quadratic.InOut) // Use quadratic easing for smoother animation
      .onComplete(() => {
        completedTweens++;
        if (completedTweens === cubesToRotate.length) {
          updatePositions(cubesToRotate, axis, angle);
          isAnimating = false;
        }
      })
      .start(); // Start the tween animation
  });
}

function updatePositions(cubes, axis, angle) {
  // Calculate the center cube's position
  const centerCubePosition = new THREE.Vector3(1, 1, 1);

  cubes.forEach((cube) => {
    // Calculate the vector from the center cube to the current cube
    const relativePosition = cube.position.clone().sub(centerCubePosition);

    // Apply rotation to the relative position
    relativePosition.applyAxisAngle(
      axis === "x"
        ? new THREE.Vector3(1, 0, 0)
        : axis === "y"
          ? new THREE.Vector3(0, 1, 0)
          : new THREE.Vector3(0, 0, 1),
      angle,
    );

    // Set the new position of the cube relative to the center cube
    cube.position.copy(centerCubePosition.clone().add(relativePosition));

    // Round the positions after applying the rotation
    cube.position.set(
      Math.round(cube.position.x / INCREMENT) * INCREMENT,
      Math.round(cube.position.y / INCREMENT) * INCREMENT,
      Math.round(cube.position.z / INCREMENT) * INCREMENT,
    );
  });
}

document.addEventListener("keydown", (event) => {
  if (isAnimating || !selectedCube) return;

  const keyCode = event.code;
  switch (keyCode) {
    case "KeyW":
    case "KeyS":
      rotateRow(selectedCube.position.x, "x", keyCode === "KeyS");
      break;

    case "KeyA":
    case "KeyD":
      rotateRow(selectedCube.position.y, "y", keyCode === "KeyD");
      break;

    case "KeyQ":
    case "KeyE":
      rotateRow(selectedCube.position.z, "z", keyCode === "KeyQ");
      break;
  }
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(event) {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(allCubes);

  if (intersects.length > 0) {
    allCubes.forEach((cube) => {
      cube.material.forEach((material) => {
        material.opacity = 1;
      });
    });

    selectedCube = intersects[0].object;
    selectedCube.material.forEach((material) => {
      material.opacity = 0.7; // Adjust the opacity as needed
    });
  }
}

canvas.addEventListener("dblclick", onClick);

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  selectedCube = null;

  allCubes.forEach((cube) => {
    cube.material.forEach((material) => (material.opacity = 1));
  });
});

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
}

function tick() {
  light.position.copy(camera.position);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

// Start the animation loop
animate();
tick();

// GUI for reset function
const obj = { Reset: resetcubes };
gui.add(obj, "Reset");

function resetcubes() {
  allCubes.forEach((cube) => scene.remove(cube));
  allCubes = [];
  addcubes();
}
