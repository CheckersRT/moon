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

        this.dummyStars = []
        for (let i = 0; i < this.numStars; i++) {
            const dummy = new THREE.Object3D()
            const direction = new THREE.Vector3().randomDirection().multiplyScalar(this.starParams.scalar)
            console.log(direction, "direction")
            dummy.position.set(
                direction.x,
                direction.y,
                direction.z
            )
            dummy.lookAt(new THREE.Vector3(0, 0, 0));
            dummy.updateMatrix()
            this.stars.setMatrixAt(i, dummy.matrix)
            this.dummyStars.push(dummy)
        }

        this.stars.instanceMatrix.needsUpdate = true
        this.stars.layers.enable(1)
        this.stars.lookAt(new THREE.Vector3(0, 0, 0))
        this.add(this.stars)

        return this
    }

    triggerShootingStar() {
        const index = Math.floor(Math.random() * this.numStars)

        const maxDistance = 6;
        const destVector = new THREE.Vector3().randomDirection().multiplyScalar(maxDistance);
        const startPosition = this.dummyStars[index].position.clone()
        const duration = 700; 
        
        this.shootingStar = this.dummyStars[index]
        this.shootingParams = {
            destVector,
            startPosition,
            startTime: performance.now(),
            duration,
            index,
        }
    }
}