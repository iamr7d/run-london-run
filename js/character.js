
import * as THREE from 'three';

export class Character {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        // --- Physics Constants (MIT Standard) ---
        // Tweaked for "Super-Hero" feel but realistic weight
        this.accel = 80.0;           // Acceleration force
        this.friction = 10.0;        // Ground friction (high stopping power)
        this.airResistance = 1.0;    // Air drag (low)
        this.jumpForce = 35.0;       // Initial Jump Velocity
        this.gravity = 70.0;         // World Gravity
        this.maxSpeed = 25.0;        // Walk cap
        this.runSpeed = 50.0;        // Sprint cap

        // --- State Vectors ---
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.inputVector = new THREE.Vector3(0, 0, 0);
        
        // --- Status Flags ---
        this.onGround = false;
        this.isJumping = false;
        this.jumpCount = 0;

        // --- Raycasting (For Ground Detection) ---
        this.raycaster = new THREE.Raycaster();
        this.rayOrigin = new THREE.Vector3();
        this.groundTolerance = 0.5; // Distance to snap to ground

        this.score = 0;
        this.scoreEl = document.getElementById('score-val');

        this.keys = {
            w: false, a: false, s: false, d: false, 
            space: false, shift: false
        };

        this.init();
        this.initInput();
    }

    init() {
        this.mesh = new THREE.Group();
        this.mesh.position.y = 5; // Start in air

        // Materials (PBR for Realism)
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
        const limbMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
        const capeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, side: THREE.DoubleSide, roughness: 0.6 });
        
        // --- Mesh Construction (Same as your original) ---
        const torsoGeo = new THREE.CapsuleGeometry(0.5, 0.8, 4, 8);
        this.torso = new THREE.Mesh(torsoGeo, bodyMat);
        this.torso.position.y = 1; 
        this.torso.castShadow = true;
        this.mesh.add(this.torso);

        const headGeo = new THREE.SphereGeometry(0.35);
        this.head = new THREE.Mesh(headGeo, bodyMat);
        this.head.position.y = 1.8;
        this.mesh.add(this.head);

        const limbGeo = new THREE.CapsuleGeometry(0.15, 0.6);
        this.lArm = new THREE.Mesh(limbGeo, limbMat);
        this.lArm.position.set(-0.6, 1.3, 0);
        this.mesh.add(this.lArm);
        this.rArm = new THREE.Mesh(limbGeo, limbMat);
        this.rArm.position.set(0.6, 1.3, 0);
        this.mesh.add(this.rArm);

        this.lLeg = new THREE.Mesh(limbGeo, limbMat);
        this.lLeg.position.set(-0.25, 0.6, 0);
        this.mesh.add(this.lLeg);
        this.rLeg = new THREE.Mesh(limbGeo, limbMat);
        this.rLeg.position.set(0.25, 0.6, 0);
        this.mesh.add(this.rLeg);

        const capeGeo = new THREE.PlaneGeometry(0.8, 1.5, 3, 3); // More segments for wave
        this.cape = new THREE.Mesh(capeGeo, capeMat);
        this.cape.position.set(0, 1.4, -0.35);
        this.cape.rotation.x = 0.2;
        this.mesh.add(this.cape);

        this.scene.add(this.mesh);
        
        // Collider Box
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
        // Cap Delta to prevent physics explosions on lag
        const dt = Math.min(delta, 0.1);

        // 1. Calculate Input Direction relative to Camera
        this.inputVector.set(0, 0, 0);
        
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        camDir.y = 0;
        camDir.normalize();

        const camRight = new THREE.Vector3();
        camRight.crossVectors(camDir, new THREE.Vector3(0, 1, 0));

        if (this.keys.w) this.inputVector.add(camDir);
        if (this.keys.s) this.inputVector.sub(camDir);
        if (this.keys.a) this.inputVector.sub(camRight);
        if (this.keys.d) this.inputVector.add(camRight);
        
        if (this.inputVector.lengthSq() > 0) this.inputVector.normalize();

        // 2. Apply Acceleration
        const isSprinting = this.keys.shift;
        const targetLimit = isSprinting ? this.runSpeed : this.maxSpeed;
        
        // Air control is weaker than Ground control
        const controlFactor = this.onGround ? 1.0 : 0.3; 
        
        if (this.inputVector.lengthSq() > 0) {
            this.velocity.x += this.inputVector.x * this.accel * controlFactor * dt;
            this.velocity.z += this.inputVector.z * this.accel * controlFactor * dt;
        }

        // 3. Apply Friction / Drag
        // We only dampen horizontal velocity
        const horizontalVel = new THREE.Vector2(this.velocity.x, this.velocity.z);
        const currentSpeed = horizontalVel.length();

        let damping = this.onGround ? this.friction : this.airResistance;
        
        // Apply damping
        if (currentSpeed > 0) {
            const newSpeed = Math.max(0, currentSpeed - (damping * currentSpeed * dt));
            horizontalVel.normalize().multiplyScalar(newSpeed);
            this.velocity.x = horizontalVel.x;
            this.velocity.z = horizontalVel.y;
        }

        // Cap speed
        if (horizontalVel.length() > targetLimit) {
            horizontalVel.normalize().multiplyScalar(targetLimit);
            this.velocity.x = horizontalVel.x;
            this.velocity.z = horizontalVel.y;
        }

        // 4. Gravity
        this.velocity.y -= this.gravity * dt;

        // 5. Jump Physics
        if (this.keys.space) {
            if (this.onGround) {
                this.velocity.y = this.jumpForce;
                this.onGround = false;
                this.jumpCount = 1;
                this.keys.space = false;
                
                // Procedural Squash/Stretch could go here
            } else if (this.jumpCount === 1 && this.velocity.y < 5) {
                // Double Jump (Web Zip)
                this.velocity.y = this.jumpForce * 0.8;
                
                // Boost forward in looking direction
                const boost = this.inputVector.lengthSq() > 0 ? this.inputVector : camDir;
                this.velocity.x += boost.x * 30;
                this.velocity.z += boost.z * 30;
                
                this.jumpCount = 2;
                this.keys.space = false;
            }
        }

        // 6. Predictive Movement & Wall Collision
        const intendedPos = this.mesh.position.clone();
        intendedPos.x += this.velocity.x * dt;
        intendedPos.z += this.velocity.z * dt;
        // Note: Y is handled separately for Raycasting

        if (this.checkWallCollision(intendedPos, colliders)) {
            // Slide: Zero out velocity on impact axis (Simplified)
            this.velocity.x *= 0.5;
            this.velocity.z *= 0.5;
        } else {
            this.mesh.position.x = intendedPos.x;
            this.mesh.position.z = intendedPos.z;
        }

        // 7. Ground Physics (Raycasting)
        // Move Y first
        this.mesh.position.y += this.velocity.y * dt;
        this.handleGroundCollisions(colliders);

        // Lower Bound Safety
        if (this.mesh.position.y < -50) {
            this.mesh.position.set(0, 10, 0);
            this.velocity.set(0, 0, 0);
        }

        // 8. Visuals & Interaction
        this.updateRotation(dt);
        this.checkCollectibles(collectibles);
        this.animateLimbs(Date.now() * 0.005); // Pass slower time
        this.updateCamera(dt);
    }

    handleGroundCollisions(colliders) {
        // Raycast down from center of body
        this.rayOrigin.copy(this.mesh.position);
        this.rayOrigin.y += 0.8; // Start from chest height

        this.raycaster.set(this.rayOrigin, new THREE.Vector3(0, -1, 0));
        
        // Intersect
        const hits = this.raycaster.intersectObjects(colliders, false); // false = don't check children recursively if not needed, true if needed
        
        if (hits.length > 0) {
            // Find the closest hit that is FACING UP
            // (Basic logic: just take first hit for now)
            const hit = hits[0];
            const dist = hit.distance;
            
            // "0.8" is the ray origin offset. So distance 0.8 means feet are exactly on ground.
            const distToFeet = dist - 0.8;

            // If we are falling and close to ground
            if (this.velocity.y <= 0 && distToFeet < this.groundTolerance) {
                this.mesh.position.y = hit.point.y;
                this.velocity.y = 0;
                this.onGround = true;
                this.jumpCount = 0;
            } else {
                this.onGround = false;
            }
        } else {
            this.onGround = false;
        }
    }

    checkWallCollision(pos, colliders) {
        // Box collision for Walls
        // Create a box at the INTENDED position
        const min = new THREE.Vector3(pos.x - 0.4, pos.y + 0.5, pos.z - 0.4);
        const max = new THREE.Vector3(pos.x + 0.4, pos.y + 1.8, pos.z + 0.4);
        this.box.set(min, max);

        for(let obj of colliders) {
            // Broadphase
            if (obj.position.distanceToSquared(pos) > 100) continue;

            if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
            this.tempBox.copy(obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);

            if (this.box.intersectsBox(this.tempBox)) {
                // Determine if it's a wall or a floor we can step up
                // If the obstacle top is low enough, we handle it in Raycast (Step up)
                // But for now, treat everything overlapping this body box as a wall
                
                // Exclude the ground plane (usually very large or y=0)
                if (this.tempBox.max.y < pos.y + 0.5) continue; // It's below us
                
                return true;
            }
        }
        return false;
    }

    updateRotation(dt) {
        // Smoothly rotate character to face movement direction
        const flatVel = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
        if (flatVel.lengthSq() > 1) {
            const targetRot = Math.atan2(flatVel.x, flatVel.z);
            
            // Shortest angle interpolation
            let rotDiff = targetRot - this.mesh.rotation.y;
            while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
            while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;

            this.mesh.rotation.y += rotDiff * 10.0 * dt;
        }
        
        // BANKING: Tilt body into turn
        const turnTilt = -this.inputVector.x * 0.2; 
        this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, turnTilt, dt * 5);
    }

    checkCollectibles(collectibles) {
        if (!collectibles) return;
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const c = collectibles[i];
            if (c.position.distanceToSquared(this.mesh.position) < 4) {
                this.score += 100;
                if (this.scoreEl) this.scoreEl.innerText = this.score;
                this.scene.remove(c);
                collectibles.splice(i, 1);
            }
        }
    }

    animateLimbs(time) {
        const speed = new THREE.Vector2(this.velocity.x, this.velocity.z).length();
        const runFactor = Math.min(speed / this.runSpeed, 1.5);
        
        if (this.onGround && speed > 0.5) {
            // Running
            const angle = Math.sin(time * 20 * runFactor) * runFactor;
            this.lLeg.rotation.x = angle;
            this.rLeg.rotation.x = -angle;
            this.lArm.rotation.x = -angle;
            this.rArm.rotation.x = angle;
            
            // Bobbing
            this.mesh.position.y += Math.sin(time * 40 * runFactor) * 0.02;
        } else if (!this.onGround) {
            // Jumping Pose
            this.lLeg.rotation.x = THREE.MathUtils.lerp(this.lLeg.rotation.x, 0.5, 0.2);
            this.rLeg.rotation.x = THREE.MathUtils.lerp(this.rLeg.rotation.x, -0.5, 0.2);
            this.lArm.rotation.x = -2.5; // Hands up
            this.rArm.rotation.x = -2.5;
        } else {
            // Idle
            this.lLeg.rotation.x = THREE.MathUtils.lerp(this.lLeg.rotation.x, 0, 0.1);
            this.rLeg.rotation.x = THREE.MathUtils.lerp(this.rLeg.rotation.x, 0, 0.1);
            this.lArm.rotation.x = THREE.MathUtils.lerp(this.lArm.rotation.x, 0, 0.1);
            this.rArm.rotation.x = THREE.MathUtils.lerp(this.rArm.rotation.x, 0, 0.1);
        }

        // Dynamic Cape Physics approximation
        const speedZ = Math.max(speed, 5);
        this.cape.rotation.x = 0.2 + (speedZ * 0.02) + Math.sin(time * 10) * 0.1;
    }

    updateCamera(dt) {
        // Smooth Follow Camera
        const offset = new THREE.Vector3(0, 5, -12); 
        
        // Rotate offset to be behind player
        const rotY = this.mesh.rotation.y;
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY + Math.PI); 
        
        const targetPos = this.mesh.position.clone().add(offset);
        
        // Lerp camera position for "weight"
        this.camera.position.lerp(targetPos, dt * 5.0);
        
        // Look ahead
        const lookTarget = this.mesh.position.clone();
        lookTarget.y += 2.0;
        this.camera.lookAt(lookTarget);
    }
}
