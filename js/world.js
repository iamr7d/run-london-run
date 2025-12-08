import * as THREE from 'three';

export class World {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.colliders = []; // Array to store objects for collision detection
        this.collectibles = []; // Array to store collectible objects
        
        // Spider-Verse Materials
        this.materials = {
            building: new THREE.MeshToonMaterial({ color: 0x1a1a2e }), // Dark Blue/Black
            ground: new THREE.MeshToonMaterial({ color: 0x0f0f1a }), // Darker Ground
            highlight: new THREE.MeshToonMaterial({ color: 0xff0055 }), // Neon Pink
            orb: new THREE.MeshBasicMaterial({ color: 0x00fff2 }), // Cyan Orb
            neons: [
                new THREE.MeshBasicMaterial({ color: 0x00fff2 }), // Cyan
                new THREE.MeshBasicMaterial({ color: 0xff0055 }), // Pink
                new THREE.MeshBasicMaterial({ color: 0xffcc00 }), // Yellow
            ]
        };

        this.init();
    }

    init() {
        // Ground - Expanded
        const groundGeo = new THREE.PlaneGeometry(1000, 1000);
        const ground = new THREE.Mesh(groundGeo, this.materials.ground);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.colliders.push(ground);

        // River Thames
        const riverGeo = new THREE.PlaneGeometry(1000, 60);
        const riverMat = new THREE.MeshToonMaterial({ color: 0x330033 }); // Dark Purple
        const river = new THREE.Mesh(riverGeo, riverMat);
        river.rotation.x = -Math.PI / 2;
        river.position.y = 0.1; // Just above ground
        river.position.z = 50; // Offset slightly
        this.scene.add(river);

        // City Generation
        this.generateCity();
        this.generateCollectibles();
        this.createBigBen();
        this.createLondonEye();
        this.createTowerBridge(); // Added
    }

    generateCity() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const lightGeo = new THREE.CylinderGeometry(0.1, 0.1, 3);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
        
        // Extended Grid
        for(let x = -300; x <= 300; x += 20) {
            for(let z = -300; z <= 300; z += 20) {
                // Clear center area for spawn
                if (Math.abs(x) < 20 && Math.abs(z) < 20) continue; 
                
                // Clear River Area (Simple band for now)
                if (z > 20 && z < 80) continue;

                // Randomize Building
                const height = Math.random() * 40 + 10; // Taller buildings
                const width = Math.random() * 10 + 8;
                const depth = Math.random() * 10 + 8;

                const building = new THREE.Mesh(geometry, this.materials.building);
                building.position.set(x, height / 2, z);
                building.scale.set(width, height, depth);
                building.castShadow = true;
                building.receiveShadow = true;
                
                this.addOutline(building);

                this.scene.add(building);
                this.colliders.push(building);

                // Add Windows
                if (Math.random() > 0.3) this.addWindows(building, width, height, depth);

                // Add Street Lights (in gaps)
                if (Math.random() > 0.7) {
                    const post = new THREE.Mesh(lightGeo, this.materials.building);
                    post.position.set(x + width/2 + 2, 1.5, z + depth/2 + 2);
                    
                    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.5), lightMat);
                    bulb.position.y = 1.5;
                    post.add(bulb);
                    
                    this.scene.add(post);
                    this.colliders.push(post);
                }
            }
        }
    }

    generateCollectibles() {
        const geo = new THREE.OctahedronGeometry(1);
        
        for(let i=0; i<50; i++) {
            const mesh = new THREE.Mesh(geo, this.materials.orb);
            
            // Random Pos
            const x = (Math.random() - 0.5) * 400;
            const z = (Math.random() - 0.5) * 400;
            const y = Math.random() * 20 + 2; // In air

            mesh.position.set(x, y, z);
            
            // Comic Outline
            this.addOutline(mesh);

            this.scene.add(mesh);
            this.collectibles.push(mesh);
        }
    }

    addOutline(mesh) {
        // Very basic inverted hull method for outline (cheap)
        const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
        const outlineMesh = new THREE.Mesh(mesh.geometry, outlineMaterial);
        outlineMesh.scale.set(1.05, 1.05, 1.05); // Make slightly larger
        mesh.add(outlineMesh);
    }

    addWindows(building, w, h, d) {
        // Naive window placement
        const winGeo = new THREE.PlaneGeometry(0.5, 0.5);
        const winCount = Math.floor(h / 2);
        
        for(let i = 0; i < winCount; i++) {
            // Random Neon Color
            const mat = this.materials.neons[Math.floor(Math.random() * this.materials.neons.length)];
            const win = new THREE.Mesh(winGeo, mat);
            // Front face
            win.position.set(0, (i * 1.5) - h/2 + 2, d/2 + 0.05);
            building.add(win);
        }
    }

    createBigBen() {
        const towerGroup = new THREE.Group();
        towerGroup.position.set(-20, 0, -40);

        // Base
        const bodyGeo = new THREE.BoxGeometry(6, 40, 6);
        const body = new THREE.Mesh(bodyGeo, new THREE.MeshToonMaterial({ color: 0xC4A484 }));
        body.position.y = 20;
        body.castShadow = true;
        this.addOutline(body);
        towerGroup.add(body);

        // Clock Face
        const clockGeo = new THREE.CircleGeometry(2.5, 32);
        const clock = new THREE.Mesh(clockGeo, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
        clock.position.set(0, 35, 3.1);
        towerGroup.add(clock);

        // Roof
        const roofGeo = new THREE.ConeGeometry(4, 10, 4);
        const roof = new THREE.Mesh(roofGeo, new THREE.MeshToonMaterial({ color: 0x333333 }));
        roof.position.y = 45;
        this.addOutline(roof);
        towerGroup.add(roof);

        this.scene.add(towerGroup);
        this.colliders.push(body); // Simplified collider
    }

    createTowerBridge() {
        const bridgeGroup = new THREE.Group();
        bridgeGroup.position.set(0, 0, 50); // Over the river (which is at z=50)

        // Stone Material
        const stoneMat = new THREE.MeshToonMaterial({ color: 0xcccccc });
        // Road Material
        const roadMat = new THREE.MeshToonMaterial({ color: 0x333333 });
        // Detail Blue
        const detailMat = new THREE.MeshToonMaterial({ color: 0x0076bd });

        // -- Towers --
        const towerGeo = new THREE.BoxGeometry(8, 25, 8);
        
        // Left Tower
        const leftTower = new THREE.Mesh(towerGeo, stoneMat);
        leftTower.position.set(-20, 12.5, 0);
        leftTower.castShadow = true;
        this.addOutline(leftTower);
        bridgeGroup.add(leftTower);
        this.colliders.push(leftTower);

        // Right Tower
        const rightTower = new THREE.Mesh(towerGeo, stoneMat);
        rightTower.position.set(20, 12.5, 0);
        rightTower.castShadow = true;
        this.addOutline(rightTower);
        bridgeGroup.add(rightTower);
        this.colliders.push(rightTower);

        // -- Tops of Towers --
        const peakGeo = new THREE.ConeGeometry(6, 8, 4);
        const peak1 = new THREE.Mesh(peakGeo, detailMat);
        peak1.position.set(-20, 29, 0);
        peak1.rotation.y = Math.PI/4;
        this.addOutline(peak1);
        bridgeGroup.add(peak1);

        const peak2 = new THREE.Mesh(peakGeo, detailMat);
        peak2.position.set(20, 29, 0);
        peak2.rotation.y = Math.PI/4;
        this.addOutline(peak2);
        bridgeGroup.add(peak2);

        // -- Walkways (Upper & Lower) --
        
        // Upper Walkway (Decoration)
        const upperGeo = new THREE.BoxGeometry(32, 2, 4);
        const upper = new THREE.Mesh(upperGeo, detailMat);
        upper.position.set(0, 20, 0);
        this.addOutline(upper);
        bridgeGroup.add(upper);

        // Road / Lower Deck (Walkable!)
        const roadGeo = new THREE.BoxGeometry(60, 2, 10);
        const road = new THREE.Mesh(roadGeo, roadMat);
        road.position.set(0, 5, 0); // Elevation 5
        road.receiveShadow = true;
        this.addOutline(road);
        
        // Add to colliders so we can walk on it
        // Note: For collision to work with current simple Box3 logic, we need to transform it to world space or ensure logic handles groups. 
        // My collision logic uses world matrices, so adding child mesh to colliders list works!
        // BUT: current logic puts `road` in `bridgeGroup`. `bridgeGroup` is in `scene`. `road` needs to be in `colliders`.
        // The collision loop iterates `colliders`. `applyMatrix4(obj.matrixWorld)` works for children too.
        bridgeGroup.add(road);
        this.colliders.push(road); 

        // -- Suspension Cables (Simple Triangles) --
        const cableGeo = new THREE.PlaneGeometry(25, 10);
        const cableMat = new THREE.MeshBasicMaterial({ color: 0x0076bd, side: THREE.DoubleSide, wireframe: true }); // Wireframe look
        
        const cable1 = new THREE.Mesh(cableGeo, cableMat);
        cable1.position.set(-35, 8, 0);
        cable1.rotation.z = -0.5;
        bridgeGroup.add(cable1);

        const cable2 = new THREE.Mesh(cableGeo, cableMat);
        cable2.position.set(35, 8, 0);
        cable2.rotation.z = 0.5;
        bridgeGroup.add(cable2);

        this.scene.add(bridgeGroup);
    }

    createLondonEye() {
        const eyeGroup = new THREE.Group();
        eyeGroup.position.set(30, 0, 30);
        eyeGroup.rotation.y = Math.PI / 4;

        // Wheel
        const torusGeo = new THREE.TorusGeometry(15, 0.5, 16, 50);
        const wheel = new THREE.Mesh(torusGeo, this.materials.highlight);
        wheel.position.y = 18;
        this.addOutline(wheel);
        eyeGroup.add(wheel);

        // Legs
        const legGeo = new THREE.CylinderGeometry(0.5, 1, 25);
        const leg1 = new THREE.Mesh(legGeo, this.materials.building);
        leg1.position.z = -5;
        leg1.position.y = 10;
        leg1.rotation.x = 0.4;
        eyeGroup.add(leg1);

        const leg2 = new THREE.Mesh(legGeo, this.materials.building);
        leg2.position.z = 5;
        leg2.position.y = 10;
        leg2.rotation.x = -0.4;
        eyeGroup.add(leg2);

        this.scene.add(eyeGroup);
        this.eyeWheel = wheel;
    }

    update(delta) {
        // Rotate London Eye
        if (this.eyeWheel) {
            this.eyeWheel.rotation.z -= delta * 0.1;
        }

        // Rotate Collectibles
        this.collectibles.forEach(c => {
            c.rotation.y += delta;
            c.rotation.x += delta * 0.5;
        });
    }
}
