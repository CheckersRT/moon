import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"

const canvas = document.querySelector("canvas.webgl")
const width = window.innerWidth, height = window.innerHeight

export default class Moon {
    constructor(options) {
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x33333)

        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
        this.camera.position.z = 30
        this.camera.position.y = 1
        this.scene.add(this.camera)

        this.textureLoader = new THREE.TextureLoader()
        this.textures = this.loadTextures()

        this.ambientLight = new THREE.AmbientLight(0xffffff, 2)
        this.scene.add(this.ambientLight)

        this.controls = new OrbitControls(this.camera, canvas)

        this.moon = this.addMoon()

        this.renderer = new THREE.WebGLRenderer({canvas: options.canvas})
        this.renderer.setSize(width, height)
        this.renderer.setPixelRatio(1)
        this.renderer.setAnimationLoop(this.animate.bind(this))
    }

    animate(time) {

        this.moon.rotation.y = time/3000

        this.renderer.render(this.scene, this.camera)
    }

    addMoon() {
        
        this.geometry = new THREE.TorusGeometry(10, 3, 16, 100 )
        this.material = new THREE.MeshStandardMaterial()
        this.material.map = this.moonColorTexture
        this.material.aoMap = this.moonAoTexture
        this.material.displacementMap = this.moonDisplacementTexture
        this.material.normalMap = this.moonNormalTexture
        this.material.roughnesslMap = this.moonRoughnessTexture
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.scene.add(this.mesh)
        return this.mesh
    }

    loadTextures() {
       this.moonColorTexture = this.textureLoader.load("/Moon_002_SD/Moon_002_basecolor.png")
       this.moonAoTexture = this.textureLoader.load("/Moon_002_SD/Moon_002_ambientOcclusion.png")
       this.moonDisplacementTexture = this.textureLoader.load("/Moon_002_SD/Moon_002_height.png")
       this.moonNormalTexture = this.textureLoader.load("/Moon_002_SD/Moon_002_normal.png")
       this.moonRoughnessTexture = this.textureLoader.load("/Moon_002_SD/Moon_002_roughness.png")
    }
}

new Moon({canvas})