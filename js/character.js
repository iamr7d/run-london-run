import * as THREE from 'three';

export class Character {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        this.moveSpeed = 15;
        this.runSpeed = 30;
        this.currSpeed = 0;
        
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.onGround = false;
        this.canJump = false;
        this.jumpCount = 0; // For double jump

        this.score = 0;
        this.scoreEl = document.getElementById('score-val');

        this.keys = {
            w: false, a: false, s: false, d: false, 
            space: false, shift: false
        };

        this.playerHeight = 2; // Total height approx
        this.init();
        this.initInput();
    }

    init() {
        // Group for all character parts
        this.mesh = new THREE.Group();
        this.mesh.position.y = 5;

        // Miles Morales Colors
        const bodyMat = new THREE.MeshToonMaterial({ color: 0x111111 }); // Black Suit
        const limbMat = new THREE.MeshToonMaterial({ color: 0x111111 }); // Black Suit
        const accentMat = new THREE.MeshToonMaterial({ color: 0xff0000 }); // Red Spider
        
        // Torso (Capsule-ish)
        const torsoGeo = new THREE.CapsuleGeometry(0.5, 0.8, 4, 8);
        this.torso = new THREE.Mesh(torsoGeo, bodyMat);
        this.torso.position.y = 1; // Center of torso
        this.torso.castShadow = true;
        this.mesh.add(this.torso);

        // Head
        const headGeo = new THREE.SphereGeometry(0.35);
        this.head = new THREE.Mesh(headGeo, bodyMat);
        this.head.position.y = 1.8;
        this.mesh.add(this.head);

        // Limbs (Pivots at top)
        const limbGeo = new THREE.CapsuleGeometry(0.15, 0.6);
        
        // Arms
        this.lArm = new THREE.Mesh(limbGeo, limbMat);
        this.lArm.position.set(-0.6, 1.3, 0);
        this.mesh.add(this.lArm);
        
        this.rArm = new THREE.Mesh(limbGeo, limbMat);
        this.rArm.position.set(0.6, 1.3, 0);
        this.mesh.add(this.rArm);

        // Legs
        this.lLeg = new THREE.Mesh(limbGeo, limbMat);
        this.lLeg.position.set(-0.25, 0.6, 0);
        this.mesh.add(this.lLeg);

        this.rLeg = new THREE.Mesh(limbGeo, limbMat);
        this.rLeg.position.set(0.25, 0.6, 0);
        this.mesh.add(this.rLeg);

        // Cape (Spider Emblem ish)
        const capeGeo = new THREE.PlaneGeometry(0.8, 1.5, 2, 2);
        const capeMat = new THREE.MeshToonMaterial({ color: 0xff0000, side: THREE.DoubleSide });
        this.cape = new THREE.Mesh(capeGeo, capeMat);
        this.cape.position.set(0, 1.4, -0.35);
        this.cape.rotation.x = 0.2;
        this.mesh.add(this.cape);

        // Outline (Simplified box for group) - Optional/Skipped for complex group performance
        
        this.scene.add(this.mesh);
        
        // Player Box for collision
        this.box = new THREE.Box3();
        this.tempBox = new THREE.Box3();
    }

    initInput() {
        document.addEventListener('keydown', (e) => this.onKeyChange(e, true));
        document.addEventListener('keyup', (e) => this.onKeyChange(e, false));
    }

    onKeyChange(event, isDown) {
        switch(event.code) {
            case 'KeyW': this.keys.w = isDown; break;
            case 'KeyA': this.keys.a = isDown; break;
            case 'KeyS': this.keys.s = isDown; break;
            case 'KeyD': this.keys.d = isDown; break;
            case 'Space': this.keys.space = isDown; break;
            case 'ShiftLeft': this.keys.shift = isDown; break;
        }
    }

    update(delta, colliders, collectibles) {
        // Movement Logic
        this.direction.set(0, 0, 0);
        
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        camDir.y = 0;
        camDir.normalize();

        const camRight = new THREE.Vector3();
        camRight.crossVectors(camDir, new THREE.Vector3(0, 1, 0));

        if (this.keys.w) this.direction.add(camDir);
        if (this.keys.s) this.direction.sub(camDir);
        if (this.keys.a) this.direction.sub(camRight);
        if (this.keys.d) this.direction.add(camRight);

        this.direction.normalize();

        // Acceleration
        const targetSpeed = this.keys.shift ? this.runSpeed : this.moveSpeed;
        if (this.direction.lengthSq() > 0) {
            this.mesh.rotation.y = Math.atan2(this.direction.x, this.direction.z);
            this.currSpeed = THREE.MathUtils.lerp(this.currSpeed, targetSpeed, delta * 5);
        } else {
            this.currSpeed = THREE.MathUtils.lerp(this.currSpeed, 0, delta * 5);
        }

        // Potential Movement
        const dx = this.direction.x * this.currSpeed * delta;
        const dz = this.direction.z * this.currSpeed * delta;

        // Collision Detection (Naive Axis Check)
        const oldPos = this.mesh.position.clone();
        
        // Try X Move
        this.mesh.position.x += dx;
        if (this.checkCollision(colliders)) {
            this.mesh.position.x = oldPos.x; // Revert
        }

        // Try Z Move
        this.mesh.position.z += dz;
        if (this.checkCollision(colliders)) {
            this.mesh.position.z = oldPos.z; // Revert
        }

        // Gravity
        this.velocity.y -= 50 * delta; 

        // Jump & Web Zip
        if (this.keys.space) {
            if (this.onGround) {
                this.velocity.y = 20; 
                this.onGround = false;
                this.jumpCount = 1;
                this.keys.space = false; // Consume Input
            } else if (this.jumpCount === 1 && this.velocity.y < 10) {
                // Web Zip (Double Jump)
                this.velocity.y = 25; // Boost up
                
                // Boost forward
                const boost = this.direction.clone().multiplyScalar(40);
                this.velocity.x += boost.x;
                this.velocity.z += boost.z;
                
                this.jumpCount = 2;
                this.keys.space = false; // Consume Input
            }
        }

        this.mesh.position.y += this.velocity.y * delta;

        // Ground Collision
        if (this.mesh.position.y < 0) { 
            if (this.mesh.position.y < 0) {
                this.mesh.position.y = 0;
                this.velocity.y = 0;
                this.onGround = true;
                this.jumpCount = 0; // Reset jumps
            }
        }
        
        // Collectibles
        this.checkCollectibles(collectibles);

        // Animation
        this.animateLimbs(Date.now() * 0.01);

        // Camera Follow
        this.updateCamera();
    }

    checkCollision(colliders) {
        // Update character box
        // Bounding box of character is approx 1 wide, 2 high
        const boxSize = 0.8;
        const min = new THREE.Vector3(this.mesh.position.x - boxSize/2, this.mesh.position.y, this.mesh.position.z - boxSize/2);
        const max = new THREE.Vector3(this.mesh.position.x + boxSize/2, this.mesh.position.y + 2, this.mesh.position.z + boxSize/2);
        this.box.set(min, max);

        for(let obj of colliders) {
            // Optimization: Broad Phase Distance Check
            // Player moves fast, but 5 units radius is safe enough for 1 frame
            if (obj.position.distanceToSquared(this.mesh.position) > 25) continue; 

            if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
            
            this.tempBox.copy(obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);
            
            if (this.box.intersectsBox(this.tempBox)) {
                // Ignore Ground (Large plane) logic handled separately usually, but here it is in colliders list?
                // World.js adds ground to colliders.
                // Box collision with ground (y=0) will be always true if player is on ground.
                // We need to exclude flat ground planes from wall blocking.
                if (this.tempBox.max.y < 0.5) continue; // It's ground
                return true;
            }
        }
        return false;
    }

    checkCollectibles(collectibles) {
        if (!collectibles) return;
        
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const c = collectibles[i];
            if (c.position.distanceToSquared(this.mesh.position) < 4) { // 2 unit radius
                // Collected!
                this.score += 100;
                if (this.scoreEl) this.scoreEl.innerText = this.score;
                
                // Remove visual
                this.scene.remove(c);
                collectibles.splice(i, 1);
            }
        }
    }

    animateLimbs(time) {
        const speed = this.currSpeed / this.runSpeed;
        const angle = Math.sin(time) * speed * 1.5;

        this.lLeg.rotation.x = angle;
        this.rLeg.rotation.x = -angle;
        
        this.lArm.rotation.x = -angle;
        this.rArm.rotation.x = angle;

        this.cape.rotation.x = 0.2 + speed * 1.0 + Math.sin(time * 2) * 0.1;
    }

    updateCamera() {
        const offset = new THREE.Vector3(0, 5, -10); 
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y + Math.PI); 
        
        const targetPos = this.mesh.position.clone().add(offset);
        this.camera.position.lerp(targetPos, 0.1);
        this.camera.lookAt(this.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)));
    }
}
