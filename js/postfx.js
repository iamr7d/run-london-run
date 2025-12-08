import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { DotScreenShader } from 'three/addons/shaders/DotScreenShader.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';

export class PostFX {
    constructor(scene, camera, renderer) {
        this.composer = new EffectComposer(renderer);
        this.composer.addPass(new RenderPass(scene, camera));

        // 1. Dot Screen (Halftone effect)
        const dotPass = new ShaderPass(DotScreenShader);
        dotPass.uniforms['scale'].value = 4;
        this.composer.addPass(dotPass);

        // 2. RGB Shift (For dynamic feeling / hit impact later)
        const rgbPass = new ShaderPass(RGBShiftShader);
        rgbPass.uniforms['amount'].value = 0.0015; // Subtle chromatic aberration
        this.composer.addPass(rgbPass);
    }

    resize(width, height) {
        this.composer.setSize(width, height);
    }

    render() {
        this.composer.render();
    }
}
