import * as THREE from "three"
import Stars from "./Stars"


export default class YellowStars extends THREE.Object3D {
    stars: Stars
    starParams: {}
    numStars: number
    geometry: THREE.BufferGeometry
    material: THREE.MeshStandardMaterial

    constructor(numStars: number) {
        super()
        this.starParams = {
            emissiveIntensity: 4,
            scalar: 18,
            radius: 0.05
        }
        this.numStars = numStars

        this.geometry = new THREE.SphereGeometry(this.starParams.radius, 8, 8)
        this.material = new THREE.MeshStandardMaterial()
        this.material.emissive = new THREE.Color("yellow")
        this.material.emissiveIntensity = this.starParams.emissiveIntensity

        this.stars = new Stars({geometry: this.geometry, material: this.material, numStars: this.numStars, scalar: this.starParams.scalar})
        this.add(this.stars)
        return this
    }

}