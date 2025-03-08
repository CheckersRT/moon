import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import GUI from "lil-gui"
import { EffectComposer } from "three/examples/jsm/Addons.js"
import { RenderPass } from "three/examples/jsm/Addons.js"
import { UnrealBloomPass } from "three/examples/jsm/Addons.js"
import { AfterimagePass } from "three/examples/jsm/Addons.js"
import { OutputPass } from "three/examples/jsm/Addons.js"
import { ShaderPass } from "three/examples/jsm/Addons.js"
import Satelite from "./satelite"
import RedStars from "./RedStar"

const canvas = document.querySelector("canvas.webgl")
const width = window.innerWidth, height = window.innerHeight

export default class Moon {
    constructor(options) {
        this.scene = new THREE.Scene()
        
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
        this.camera.position.z = 24
        this.camera.position.y = 0
        this.scene.add(this.camera)
        
        this.textureLoader = new THREE.TextureLoader()
        this.textures = this.loadTextures()
        this.scene.background = this.nightSky
        
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 2)
        this.directionalLight.position.set(20, 5, 30)
        this.scene.add(
            this.ambientLight, 
            this.directionalLight,
        )
        
        this.gui = this.setUpGui()


        this.controls = new OrbitControls(this.camera, canvas)
        this.controls.maxPolarAngle = Math.PI /2
        this.controls.minPolarAngle = Math.PI /2
        this.controls.maxDistance = 22
        this.controls.minDistance = 1

        this.renderer = new THREE.WebGLRenderer({canvas: options.canvas})
        this.renderer.setSize(width, height)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.toneMapping = THREE.CineonToneMapping
        this.renderer.toneMappingExposure = 1
        this.renderer.outputColorSpace = THREE.SRGBColorSpace
        this.renderer.setAnimationLoop(this.animate.bind(this))
        
        this.renderScene = new RenderPass(this.scene, this.camera)
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1, 0.5, 0.25)
        this.starTrailPass = new AfterimagePass()
        this.starTrailPass.uniforms["damp"].value = 0.8; 

        
        this.bloomComposer = new EffectComposer(this.renderer)
        this.bloomComposer.addPass(this.renderScene)
        this.bloomComposer.addPass(this.bloomPass)
        this.bloomComposer.addPass(this.starTrailPass)
        this.bloomComposer.renderToScreen = false
        this.bloomParams = {
            threshold: 1,
			strength: 0.2,
			radius: 0,
			exposure: 1
        }
        this.bloomPass.threshold = this.bloomParams.threshold
        this.bloomPass.strength = this.bloomParams.strength
        this.bloomPass.radius = this.bloomParams.radius

        const bloomDir = this.gui.addFolder("Bloom")
        bloomDir.add(this.bloomParams, "threshold", 0.0, 1.0).onChange((value) => {
            this.bloomPass.threshold = Number(value)
        })
        bloomDir.add(this.bloomParams, "strength", 0.0, 2.0).onChange((value) => {
            this.bloomPass.strength = Number(value)
        })
        bloomDir.add(this.bloomParams, "radius", 0.0, 2.0).onChange((value) => {
            this.bloomPass.radius = Number(value)
        })
        
        this.mixPass = new ShaderPass(
            new THREE.ShaderMaterial({
                uniforms: {
                    baseTexture: {value: null},
                    bloomTexture: {value: this.bloomComposer.renderTarget2.texture}
                }, 
                vertexShader: document.getElementById("vertexshader").textContent,
                fragmentShader: document.getElementById("fragmentshader").textContent
            }), "baseTexture"
        )
        
        this.finalComposer = new EffectComposer(this.renderer)
        this.finalComposer.addPass(this.renderScene)
        this.finalComposer.addPass(this.mixPass)
        
        this.outputPass = new OutputPass()
        this.finalComposer.addPass(this.outputPass)
        
        this.STAR_SCENE = 1
        this.bloomLayer = new THREE.Layers()
        this.bloomLayer.set(this.STAR_SCENE)

        this.nonBloomed = this.nonBloomed.bind(this)
        this.restoreMaterial = this.restoreMaterial.bind(this)

        this.darkMaterial = new THREE.MeshBasicMaterial({color: 0x000000})
        this.materials = []
        
        this.stars = this.addStars()
        this.scene.add(...this.stars)
        this.lastStarTriggertime = 0
        this.shootingStar = null

        this.moon = this.addMoon()
        this.scene.add(this.moon)
        this.satelite = new Satelite(this.gui)
        this.scene.add(this.satelite)
        this.resize()
    }

    nonBloomed(object) {
        if(object.isMesh && this.bloomLayer.test(object.layers) === false) {
            this.materials[object.uuid] = object.material
            object.material = this.darkMaterial
        }
    }

    restoreMaterial(object) {
        if(this.materials[object.uuid]) {
            object.material = this.materials[object.uuid]
            delete this.materials[object.uuid]
        }
    }

    animate(time) {
        this.moon.rotation.y = time/50000

        const orbitRadius = 10 // Adjust orbit distance
        const orbitSpeed = 0.0002 // Adjust speed of orbit
        const angle = time * orbitSpeed // Angle based on time
    
        // this.satelite.position.x = this.moon.position.x + orbitRadius * Math.cos(angle) * 2
        // this.satelite.position.z = this.moon.position.z + orbitRadius * Math.sin(angle)
        // this.satelite.position.y = this.moon.position.y + orbitRadius * Math.sin(angle) / 2

        this.satelite.lookAt(this.satelite.children.find((child) => child.name === "fakeSun").position)

        if (time - this.lastStarTriggertime > 2000) {
            this.lastStarTriggertime = time
            this.redStars.triggerShootingStar()
            this.shootingStar = this.redStars.shootingStar
        }

        if(this.shootingStar && this.redStars.shootingParams) {
            this.shootingStar.rotation.z = time/100

            const { index, destVector, startPosition, startTime, duration} = this.redStars.shootingParams
            const currentTime = performance.now();
            const elapsedTime = currentTime - startTime;
            const t = Math.min(elapsedTime / duration, 1); // Normalize to [0,1]
            
            const easeT = t * (2 - t); 
            
            this.shootingStar.position.lerpVectors(startPosition, startPosition.clone().add(destVector), easeT);
            this.shootingStar.quaternion.setFromEuler(this.shootingStar.rotation);

            this.shootingStar.updateMatrix()
            this.redStars.stars.setMatrixAt(index, this.shootingStar.matrix)
            this.redStars.stars.instanceMatrix.needsUpdate = true
        }

        this.camera.lookAt(this.satelite.position)

        this.scene.traverse(this.nonBloomed)

        this.bloomComposer.render()

        this.scene.traverse(this.restoreMaterial)

        this.finalComposer.render()
    }

    addMoon() {
        this.moonParams = {
            metalness: 0.5,
            roughness: 0.8,
            displacementScale: 0.05,
        }
        
        this.geometry = new THREE.SphereGeometry(2, 128, 128 )
        // this.geometry = new THREE.TorusGeometry(2, 1, 512, 512 )
        this.material = new THREE.MeshStandardMaterial()
        this.material.metalness = this.moonParams.metalness
        this.material.roughness = this.moonParams.roughness

        this.material.map = this.moonColorTexture
        this.material.aoMap = this.moonAoTexture
        this.material.displacementMap = this.moonDisplacementTexture
        this.material.displacementScale = this.moonParams.displacementScale
        this.material.normalMap = this.moonNormalTexture
        this.material.normalScale.set(5, 5)
        this.material.roughnesslMap = this.moonRoughnessTexture

        this.material.needsUpdate = true

        this.mesh = new THREE.Mesh(this.geometry, this.material)

        this.gui.add(this.material, "metalness").min(0.0001).max(1).step(0.0001)
        this.gui.add(this.material, "roughness").min(0.0001).max(1).step(0.0001)
        // this.gui.add(this.material, "displacementScale").min(0).max(0.1).step(0.001)

        return this.mesh
    }

    addStars() {

        const stars = []

        this.yellowStars = createYellowStars(80)
        this.redStars = createRedStars(70)
        this.whiteStars = createWhiteStars(80)

        console.log("red stars", this.redStars, "yellow stars", this.yellowStars)

        stars.push(...this.yellowStars, this.redStars, ...this.whiteStars)
        stars.forEach((star) => {
            star.layers.enable(this.STAR_SCENE)
        })

        return stars
    }

    loadTextures() {
       this.moonColorTexture = this.textureLoader.load("/Moon_002_SD/Moon_002_basecolor.png")
       this.moonColorTexture.repeat.x = 4
       this.moonColorTexture.repeat.y = 2
       this.moonColorTexture.wrapS = THREE.RepeatWrapping
       this.moonColorTexture.wrapT = THREE.RepeatWrapping
       this.moonAoTexture = this.textureLoader.load("/Moon_002_SD/Moon_002_ambientOcclusion.png")
       this.moonDisplacementTexture = this.textureLoader.load("/Moon_002_SD/Moon_002_height.png")
       this.moonNormalTexture = this.textureLoader.load("/Moon_002_SD/Moon_002_normal.png")
       this.moonRoughnessTexture = this.textureLoader.load("/Moon_002_SD/Moon_002_roughness.png")
       this.nightSky = this.textureLoader.load("/nightsky.jpg")
       this.nightSky.colorSpace = THREE.SRGBColorSpace



    }

    setUpGui() {
        const gui = new GUI()


        return gui
    }

    resize() {
        window.addEventListener("resize", (event) => {
            this.camera.aspect = window.innerWidth / window.innerHeight
            this.camera.updateProjectionMatrix()
            this.renderer.setSize(window.innerWidth, window.innerHeight)
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            this.bloomComposer.setSize(window.innerWidth, window.innerHeight)
            this.finalComposer.setSize(window.innerWidth, window.innerHeight)
        })
    }
}

new Moon({canvas})


function createYellowStars(quantity) {

    const stars = []

    const starParams = {
        emissiveIntensity: 4,
        scalar: 18,
    }
    const geometry = new THREE.SphereGeometry(0.05, 16, 16)
    const material = new THREE.MeshStandardMaterial()
    const star = new THREE.Mesh(geometry, material)
    material.emissive = new THREE.Color("yellow")
    material.emissiveIntensity = starParams.emissiveIntensity

    for(let i = 0; i < quantity; i++ ){
        const direction = new THREE.Vector3().randomDirection().multiplyScalar(starParams.scalar)
        const newStar = star.clone()
        newStar.position.copy(direction)
        stars.push(newStar)
    }

    return stars
}


function createRedStars(quantity) {

    const stars = new RedStars()

    const scalar = 17



    // for(let i = 0; i < quantity; i++ ){
    //     const direction = new THREE.Vector3().randomDirection().multiplyScalar(scalar)
    //     const newStar = new RedStars()
    //     newStar.position.copy(direction)
    //     newStar.lookAt(new THREE.Vector3(0, 0, 0));

    //     stars.push(newStar)
    // }

    return stars
}

function createWhiteStars(quantity) {

    const stars = []

    const starParams = {
        emissiveIntensity: 4,
        scalar: 19,
    }

    const vectors = []
    const points = 4
    const extrudeSettings = {
        depth: 0.005, 
        bevelEnabled: false,
    }

    for (let i = 0; i < points * 2; i++) {
        const length = i % 2 == 1 ? i % 4 == 1 ? 0.1 : 0.05 : 0.025
        const a = i / points * Math.PI;

		vectors.push( new THREE.Vector2( Math.cos( a ) * length, Math.sin( a ) * length ) );
    }

    const shape = new THREE.Shape(vectors)
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    const material = new THREE.MeshStandardMaterial()
    const star = new THREE.Mesh(geometry, material)
    // material.wireframe = true

    material.emissive = new THREE.Color("white")
    material.emissiveIntensity = starParams.emissiveIntensity

    for(let i = 0; i < quantity; i++ ){
        const direction = new THREE.Vector3().randomDirection().multiplyScalar(starParams.scalar)
        const newStar = star.clone()
        newStar.position.copy(direction)
        newStar.lookAt(new THREE.Vector3(0, 0, 0));

        stars.push(newStar)
    }

    return stars
}

