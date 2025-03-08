import * as THREE from "three"

export default class RedStars extends THREE.Object3D {
    constructor() {
        super()
        this.starParams = {
            emissiveIntensity: 6,
            scalar: 18,
            roughness: 1,
            metalness: 0,
        }
        this.numStars = 80
        this.points = 5
        this.extrudeSettings = {
            depth: 0.005, 
            bevelEnabled: false,
        }
        
        this.vectors = []
        for (let i = 0; i < this.points * 2; i++) {
            const length = i % 2 == 1 ? 0.1 : 0.05
            const a = i / this.points * Math.PI;
            this.vectors.push( new THREE.Vector2( Math.cos( a ) * length, Math.sin( a ) * length ) );
        }
    
        this.shape = new THREE.Shape(this.vectors)
        this.geometry = new THREE.ExtrudeGeometry(this.shape, this.extrudeSettings)
        this.material = new THREE.MeshStandardMaterial()
        this.material.wireframe = true
        this.material.emissive = new THREE.Color("red")
        this.material.emissiveIntensity = this.starParams.emissiveIntensity
        this.material.roughness = this.starParams.roughness
        this.material.metalness = this.starParams.metalness

        this.stars = new THREE.InstancedMesh(this.geometry, this.material, this.numStars)
        this.stars.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // Allow frequent updates

        for (let i = 0; i < this.numStars; i++) {
            const dummy = new THREE.Object3D()
            dummy.position.set(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            )
            dummy.updateMatrix()
            this.stars.setMatrixAt(i, dummy.matrix)
        }

        this.stars.InstanceMatrix.needsUpdate = true
        this.stars.layers.enable(1)
        this.add(this.stars)

        return this
    }
}