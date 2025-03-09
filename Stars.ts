import * as THREE from "three"

interface StarParams {
    geometry: THREE.BufferGeometry
    material: THREE.Material
    numStars: number
    scalar: number

}

export default class Stars extends THREE.Object3D {
    mesh: THREE.InstancedMesh
    dummyStars: THREE.Object3D[]


    constructor(params: StarParams) {
        super()
        this.mesh = new THREE.InstancedMesh(params.geometry, params.material, params.numStars)
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

        this.dummyStars = []
        for (let i = 0; i < params.numStars; i++) {
            const dummy: THREE.Object3D = new THREE.Object3D()
            const direction = new THREE.Vector3().randomDirection().multiplyScalar(params.scalar)
            dummy.position.set(
                direction.x,
                direction.y,
                direction.z
            )
            dummy.lookAt(new THREE.Vector3(0, 0, 0));
            dummy.updateMatrix()
            this.mesh.setMatrixAt(i, dummy.matrix)
            this.dummyStars.push(dummy)
        }
        this.mesh.instanceMatrix.needsUpdate = true
        this.mesh.layers.enable(1)
        this.add(this.mesh)
    }
}