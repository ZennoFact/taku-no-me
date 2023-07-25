import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

class Furniture extends THREE.Group {
    constructor(room, canStack = false) {
        super();

        this.createMeshFunction();
        
        this.setBoundingBox();
        this.size = this.getBoundingBoxSize();
        this.border = {
            left : -room.halfWidth + this.size.x / 2,
            right: room.halfWidth - this.size.x / 2,
            bottom: -room.halfHeight + this.size.y / 2, // 照明などは継承して，rotationを180度回転（Math.PI * 0.5）させて天井の位置を指定
            far: -room.halfDepth + this.size.z / 2,
            near: room.halfDepth - this.size.z / 2
        }
        this.floorHeight = -room.halfHeight;

        this.canStcack = canStack;

        this.adjustPosition();
    }

    createMeshFunction() {
        // サンプル:継承時にオーバーライドして使用。
        const geometry = new THREE.BoxGeometry( 10, 5, 5 );
        const material = new THREE.MeshBasicMaterial( { color: 0x242424 } );
        const obj = new THREE.Mesh(geometry, material);
        this.add(obj)
    }

    setBoundingBox() {
        this.boundingBox = new THREE.Box3();
        this.boundingBox.setFromObject( this );   
    }
    getBoundingBoxSize() {
        return this.boundingBox.getSize(new THREE.Vector3());
    }

    // TODO: なぜかドラッグの制御ができん。
    adjustPosition() {
        // console.log(this.position)
        this.children.forEach(obj => {
            if(obj.x < this.border.left) obj.x = this.border.left;
            else if(this.border.right < obj.x) obj.x = this.border.right;
            if(obj.y !== this.border.bottom) obj.y = this.border.bottom;
            if(obj.z < this.border.far) obj.z = this.border.far;
            else if(this.border.near < obj.z) obj.z = this.border.near;
        })
        // if(this.position.x < this.border.left) this.position.x = this.border.left;
        // else if(this.border.right < this.position.x) this.position.x = this.border.right;
        // if(this.position.y !== this.border.bottom) this.position.y = this.border.bottom;
        // if(this.position.z < this.border.far) this.position.z = this.border.far;
        // else if(this.border.near < this.position.z) this.position.z = this.border.near;
    }
}

export class Desk extends Furniture {
    constructor(room, canStack = false) {
        super(room, canStack);
    }

    createMeshFunction() {
        const deskMaterial = new THREE.MeshBasicMaterial( { color: 0x242424 } );

        const tg = new THREE.BoxGeometry( 10, 0.5, 5 );
        const topBoard = new THREE.Mesh(tg, deskMaterial);
        topBoard.position.y = 2.5
        topBoard.castShadow = true;
        
        const fg = new THREE.BoxGeometry(0.5, 5, 0.5);
        const foot1 = new THREE.Mesh(fg, deskMaterial);
        foot1.position.set(4.5, 0, 1.5)
        foot1.castShadow = true;
        const foot2 = new THREE.Mesh(fg, deskMaterial);
        foot2.position.set(4.5, 0, -1.5)
        foot2.castShadow = true;
        const foot3 = new THREE.Mesh(fg, deskMaterial);
        foot3.position.set(-4.5, 0, 1.5)
        foot3.castShadow = true;
        const foot4 = new THREE.Mesh(fg, deskMaterial);
        foot4.position.set(-4.5, 0, -1.5)
        foot4.castShadow = true;

        const dg = new THREE.BoxGeometry( 8, 1, 4 );
        const drawer = new THREE.Mesh(dg, deskMaterial);
        drawer.position.set(0, 2, -0)
        drawer.castShadow = true;

        const parts = [];
        parts.push(
            new THREE.BoxGeometry(10, 0.5, 5).translate(0, 2.5, 0),
            new THREE.BoxGeometry(0.5, 5, 0.5).translate(4.5, 0, 1.5),
            new THREE.BoxGeometry(0.5, 5, 0.5).translate(4.5, 0, -1.5), 
            new THREE.BoxGeometry(0.5, 5, 0.5).translate(-4.5, 0, 1.5), 
            new THREE.BoxGeometry(0.5, 5, 0.5).translate(-4.5, 0, -1.5),
            new THREE.BoxGeometry( 8, 1, 4 ).translate(0, 2, 0));
        // geometryの結合
        const geometry = BufferGeometryUtils.mergeBufferGeometries(parts);
        const desk = new THREE.Mesh(geometry, deskMaterial);

        
        this.add(desk);
    }
}