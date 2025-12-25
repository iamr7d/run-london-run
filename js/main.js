import * as THREE from "three";
import { World } from "./world.js";
import { Character } from "./character.js";

class Game {
  constructor() {
    this.container = document.getElementById("game-container");

    // Setup Basic Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xff9966); // Spider-Verse Sunset
    this.scene.fog = new THREE.Fog(0xff9966, 20, 300);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 5, 10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true }); // Enable AA for crisp edges
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Brighter ambient
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0); // Brighter sun
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    this.scene.add(dirLight);

    // Modules
    this.world = new World(this.scene, this.renderer);
    this.character = new Character(this.scene, this.camera);
    // PostFX disabled for compatibility
    // this.postFX = new PostFX(this.scene, this.camera, this.renderer);

    // Event Listeners
    window.addEventListener("resize", this.onWindowResize.bind(this));

    // Loop
    this.clock = new THREE.Clock();

    // Remove Loader
    const loader = document.getElementById("loading-overlay");
    if (loader) loader.style.display = "none";

    this.animate();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // this.postFX.resize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();

    // Update Modules
    this.world.update(delta);
    this.character.update(delta, this.world.colliders, this.world.collectibles); // Pass colliders AND collectibles

    // Render (Bypass PostFX for debugging)
    // this.postFX.render();
    this.renderer.render(this.scene, this.camera);
  }
}

// Start Game
window.onload = () => {
  window.game = new Game();
};
