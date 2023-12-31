import * as THREE from 'three';

export class Room extends THREE.Group{
    constructor(width, height, depth) {
        super();
        this.halfWidth = width;
        this.halfHeight = height;
        this.halfDepth = depth;
        this.width = width * 2;
        this.height = height * 2;
        this.depth = depth * 2;
        this.bottom = 0;
        this.top = this.height;
        this.objects = [];
        

        this.colors = {
            ceiling: 0xaaaaaa,
            floor: 0x6f4b3e,
            wall: 0x444e45
        }
        // floor
        this.add(new THREE.Mesh(
            new THREE.PlaneGeometry(this.width, this.depth),
            new THREE.MeshLambertMaterial({ 
                color: this.colors.floor
            })
        ));
        // ceiling
        this.add(new THREE.Mesh(
            new THREE.PlaneGeometry(this.width, this.depth),
            new THREE.MeshLambertMaterial({ color: this.colors.ceiling})
        ));
        const wallGeometryX = new THREE.PlaneGeometry(this.width, this.height);
        const wallGeometryZ = new THREE.PlaneGeometry(this.depth, this.height);
        const wallMaterial = new THREE.MeshLambertMaterial({ 
            color: this.colors.wall
        });
        this.add(new THREE.Mesh(wallGeometryX, wallMaterial));
        this.add(new THREE.Mesh(wallGeometryZ, wallMaterial));
        this.add(new THREE.Mesh(wallGeometryX, wallMaterial));
        this.add(new THREE.Mesh(wallGeometryZ, wallMaterial));
        const borderSettings = [
            {
                position: {x: 0, y: 0, z: 0},
                rotation: {x: -Math.PI * 0.5, y: 0, z:0}
            },
            {
                position: {x: 0, y: this.top, z: 0},
                rotation: {x: Math.PI * 0.5, y: 0, z:0}
            },
            {
                position: {x: 0, y: this.halfHeight, z: -this.halfDepth},
                rotation: {x: 0, y: 0, z:0}
            },
            {
                position: {x: -this.halfWidth, y: this.halfHeight, z: 0},
                rotation: {x: 0, y: Math.PI * 0.5, z:0}
            },
            {
                position: {x: 0, y: this.halfHeight, z: this.halfDepth},
                rotation: {x: 0, y: Math.PI * -1, z:0}
            },
            {
                position: {x: this.halfWidth, y: this.halfHeight, z: 0},
                rotation: {x: 0, y: Math.PI * -0.5, z:0}
            }
        ];

        this.children.forEach((obj, i) => {
            const setting = borderSettings[i];
            obj.position.set(setting.position.x, setting.position.y, setting.position.z);
            obj.rotation.set(setting.rotation.x, setting.rotation.y, setting.rotation.z);
            obj.receiveShadow = true;
        });
    
    }

    getFloorHeight() {
        return this.bottom;
    }
}