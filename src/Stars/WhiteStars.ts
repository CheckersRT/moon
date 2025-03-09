import * as THREE from "three"
import Stars from "./Stars"


export default class YellowStars extends THREE.Object3D {
    stars: Stars
    starParams: {}
    numStars: number
    vectors: THREE.Vector2[]
    shape: THREE.Shape
    geometry: THREE.BufferGeometry
    material: THREE.MeshStandardMaterial

    constructor(numStars: number) {
        super()
        this.starParams = {
            emissiveIntensity: 4,
            scalar: 19,
            points: 4,
            extrudeSettings: {
                depth: 0.005,
                bevelEnabled: false,
            }
        }
        this.numStars = numStars
        this.vectors = []

        for (let i = 0; i < this.starParams.points * 2; i++) {
            const length = i % 2 == 1 ? i % 4 == 1 ? 0.1 : 0.05 : 0.025
            const a = i / this.starParams.points * Math.PI;
    
            this.vectors.push( new THREE.Vector2( Math.cos( a ) * length, Math.sin( a ) * length ) );
        }

        this.shape = new THREE.Shape(this.vectors)
        this.geometry = new THREE.ExtrudeGeometry(this.shape, this.starParams.extrudeSettings)
        this.material = new THREE.MeshStandardMaterial()
        this.material.emissive = new THREE.Color("white")
        this.material.emissiveIntensity = this.starParams.emissiveIntensity

        this.stars = new Stars({geometry: this.geometry, material: this.material, numStars: this.numStars, scalar: this.starParams.scalar})
        this.add(this.stars)
        return this
    }

}