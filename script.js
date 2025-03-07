import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import GUI from "lil-gui"

const canvas = document.querySelector("canvas.webgl")
const width = window.innerWidth, height = window.innerHeight

export default class Moon {
    constructor(options) {
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x00000)

        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
        this.camera.position.z = 15
        this.camera.position.y = 0
        this.scene.add(this.camera)

        this.textureLoader = new THREE.TextureLoader()
        this.textures = this.loadTextures()
        
        this.ambientLight = new THREE.AmbientLight(0xffffff, 2)
        this.pointLight = new THREE.PointLight(0xffffff, 4)
        this.pointLight.position.z = 5
        this.scene.add(this.ambientLight, this.pointLight)
        
        this.gui = this.setUpGui()
        
        this.stars = this.addStars()
        console.log("stars", this.stars)
        this.scene.add(...this.stars)
        this.moon = this.addMoon()
        this.scene.add(this.moon)
        
        this.controls = new OrbitControls(this.camera, canvas)
        this.controls.maxPolarAngle = Math.PI /2
        this.controls.minPolarAngle = Math.PI /2
        this.controls.maxDistance = 22
        this.controls.minDistance = 4

        this.renderer = new THREE.WebGLRenderer({canvas: options.canvas})
        this.renderer.setSize(width, height)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.setAnimationLoop(this.animate.bind(this))

        this.resize()
    }

    animate(time) {

        this.moon.rotation.y = time/10000

        this.renderer.render(this.scene, this.camera)
    }

    addMoon() {
        this.moonParams = {
            metalness: 0.1,
            roughness: 2,
            displacementScale: 0.05,
        }
        
        this.geometry = new THREE.SphereGeometry(2, 512, 512 )
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
        this.gui.add(this.material, "displacementScale").min(0).max(0.1).step(0.001)

        return this.mesh
    }

    addStars() {

        const stars = []

        const yellowStars = createYellowStars(100)
        const redStars = createRedStars(70)
        const whiteStars = createWhiteStars(100)

        stars.push(...yellowStars, ...redStars, ...whiteStars)

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
    }

    setUpGui() {
        const gui = new GUI()


        return gui
    }

    resize() {
        window.addEventListener("resize", (event) => {
            this.renderer.setSize(window.innerWidth, window.innerWidth)
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            this.camera.aspect = window.innerWidth / window.innerHeight
            this.camera.updateProjectionMatrix()
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

    const stars = []

    const starParams = {
        emissiveIntensity: 4,
        scalar: 18,
    }

    const vectors = []
    const points = 5
    const extrudeSettings = {
        depth: 0.005, 
        bevelEnabled: false,
    }

    for (let i = 0; i < points * 2; i++) {
        const length = i % 2 == 1 ? 0.1 : 0.05
        const a = i / points * Math.PI;

		vectors.push( new THREE.Vector2( Math.cos( a ) * length, Math.sin( a ) * length ) );
    }

    const shape = new THREE.Shape(vectors)
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    const material = new THREE.MeshStandardMaterial()
    const star = new THREE.Mesh(geometry, material)
    material.wireframe = true


    material.emissive = new THREE.Color("red")
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

function createWhiteStars(quantity) {

    const stars = []

    const starParams = {
        emissiveIntensity: 4,
        scalar: 18,
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