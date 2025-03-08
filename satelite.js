import * as THREE from "three"
import GUI from "lil-gui"
import { clearcoatRoughness, sheenRoughness } from "three/tsl"

export default class Satelite extends THREE.Object3D {

    constructor(gui) {
        super()
        this.gui = gui
        this.solarCells = new SolarCells(this.gui)
        this.satBody = new SatBody(this.gui)
        this.fakeSun = new FakeSun()
        this.add(this.solarCells, this.satBody, this.fakeSun)
        this.position.z = 12
        this.position.x = 3
        this.scale.set(0.6, 0.6, 0.6)
        return this
    }
}

class SolarCells extends THREE.Object3D {
    constructor(gui) {
        super()
        this.textureLoader = new THREE.TextureLoader()
        this.textures = this.loadTextures()

        this.params = {
            metalness: 0.865,
            roughness: 0.21,
            sheen: 0.5,
            sheenRoughness: 0.5,
            clearcoat: 0.5,
            clearcoatRoughness: 0.5,
        }
        this.geometry = new THREE.PlaneGeometry(3, 0.5, 16, 4)
        this.material = new THREE.MeshPhysicalMaterial({map: this.textures.albedo, side: THREE.DoubleSide, metalnessMap: this.textures.metallic})
        this.material.metalness = this.params.metalness
        this.material.roughness = this.params.roughness
        this.material.sheen = this.params.sheen
        this.material.sheenRoughness = this.params.sheenRoughness
        this.material.sheenColor.set(1, 1, 1)
        this.material.clearcoat = this.params.clearcoat

        this.material.needsUpdate = true

        gui.add(this.params, "metalness", 0.0, 1.0).step(0.001).name("metalness").onChange((value) => {
            this.material.metalness = value
        })
        gui.add(this.params, "roughness", 0.0, 1.0).step(0.001).name("roughness").onChange((value) => {
            this.material.roughness = value
        })

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.add(this.mesh)
        return this
    }
    
    loadTextures() {
        const textures = {}
        const textureNames = ["albedo", "ao", "height", "normal", "metallic", "roughness"];
        textureNames.forEach((name) => {
            const texture = this.textureLoader.load(`solar_cells/small/SolarCells_512_${name}.png`)
            texture.repeat.set(3, 0.6)
            texture.wrapS = THREE.RepeatWrapping
            textures[name] = texture
        })
        textures.albedo.colorSpace = THREE.SRGBColorSpace
        return textures
    }
}

class SatBody extends THREE.Object3D {
    constructor(gui) {
        super()
        this.textureLoader = new THREE.TextureLoader()
        this.params = {
            displacementScale: 0.0001,
            normalScale: 0.5,
            aoIntensity: 1.25,
            metalness: 1.25,
            roughness: 0.5,
            repeat: {x: 0.6, y: 0.7}
        }

        this.colorTexture = this.textureLoader.load("scifi_panel/small/Scifi_Panel_512_albedo.png")
        this.colorTexture.colorSpace = THREE.SRGBColorSpace
        this.colorTexture.repeat.set(this.params.repeat.x, this.params.repeat.y)
        this.colorTexture.wrapS = THREE.RepeatWrapping

        this.aoTexture = this.textureLoader.load("scifi_panel/small/Scifi_Panel_512_ao.png")
        this.aoTexture.repeat.set(this.params.repeat.x, this.params.repeat.y)

        this.heightTexture = this.textureLoader.load("scifi_panel/small/Scifi_Panel_512_height.png")
        this.heightTexture.repeat.set(this.params.repeat.x, this.params.repeat.y)

        this.normalTexture = this.textureLoader.load("scifi_panel/small/Scifi_Panel_512_normal.png")
        this.normalTexture.repeat.set(this.params.repeat.x, this.params.repeat.y)

        this.metallicTexture = this.textureLoader.load("scifi_panel/small/Scifi_Panel_512_metallic.png")
        this.metallicTexture.repeat.set(this.params.repeat.x, this.params.repeat.y)

        this.roughnessTexture = this.textureLoader.load("scifi_panel/small/Scifi_Panel_512_roughness.png")
        this.roughnessTexture.repeat.set(this.params.repeat.x, this.params.repeat.y)

        this.geometry = new THREE.BoxGeometry(0.7, 0.6, 0.5, 16, 16)
        this.material = new THREE.MeshStandardMaterial({map: this.colorTexture, aoMap: this.aoTexture, displacementMap: this.heightTexture, normalMap: this.normalTexture, metalnessMap: this.metallicTexture, roughnessMap: this.roughnessTexture })
        this.material.displacementScale = this.params.displacementScale
        this.material.normalScale.set(0.5, 0.5)
        this.material.aoMapIntensity = this.params.aoIntensity
        this.material.metalness = this.params.metalness
        this.material.roughness = this.params.roughness
        

        this.mesh = new THREE.Mesh(this.geometry, this.material)

        const satBodyDir = gui.addFolder("Satelite body")

        satBodyDir.add(this.material, "aoMapIntensity").min(0.1).max(2).step(0.001)
        satBodyDir.add(this.material, "metalness").min(0.1).max(2).step(0.001)
        satBodyDir.add(this.material, "roughness").min(0.1).max(2).step(0.001)

        this.add(this.mesh)
        this.position.z = -0.3
        return this
    } 
}

class FakeSun extends THREE.Object3D {
    constructor() {
        super()
        this.position.set(20, 5, 30)
        this.name = "fakeSun"

        return this
    }
}