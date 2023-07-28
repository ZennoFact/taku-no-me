import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { Room } from './room';

class RoomItem extends THREE.Group {
    constructor(scene, room, canStack = false) {
        super();
        this.scene = scene;
        this.room = room;
        this.createMeshFunction();

        this.boundingBox = new THREE.Box3();
        this.setBoudingBox();
        this.setBorder();
        
        this.setArea(this.border.bottom, this.border.left, this.border.right, this.border.far, this.border.near);
        this.canStcack = canStack;

        this.children.forEach(obj => {
            obj.material.transparent = true;
            obj.receiveShadow = true;
            obj.castShadow = true;
        });

        this.scene.add(this);
        this.update();
    }

        // 判定の仕方変更を検

    setArea(floor, left, right, far, near ) {
        this.floorHeight = floor;
        this.areaLeft = left;
        this.areaRight = right;
        this.areaFar = far;
        this.areaNear = near;
    }

    setBorder() {
        this.border = {
            left : -this.room.halfWidth + this.size.x / 2,
            right: this.room.halfWidth - this.size.x / 2,
            bottom: -this.room.halfHeight + (this.size.y / 2), // 照明などは継承して，rotationを180度回転（Math.PI * 0.5）させて天井の位置を指定
            far: -this.room.halfDepth + this.size.z / 2,
            near: this.room.halfDepth - this.size.z / 2
        }
    }

    update() {
        this.adjustPosition();
        this.setBoudingBox();
    }

    complete() {
        console.log("need override");
    }

    checkCollision(object) {
        return (
            this.boundingBox.min.x <= object.boundingBox.max.x &&
            this.boundingBox.max.x >= object.boundingBox.min.x &&
            this.boundingBox.min.y <= object.boundingBox.max.y &&
            this.boundingBox.max.y >= object.boundingBox.min.y &&
            this.boundingBox.min.z <= object.boundingBox.max.z &&
            this.boundingBox.max.z >= object.boundingBox.min.z
        )
    }

    // TODO:関数名変更
    setDefaultFloorHeight() {
        this.setArea(this.border.bottom, this.border.left, this.border.right, this.border.far, this.border.near);
    }

    // ドラッグ中の高さ指定に使用
    setFloorHeight(height) {
        this.floorHeight = height;
    }

    createMeshFunction() {
        // サンプル:継承時にオーバーライドして使用。
        const geometry = new THREE.BoxGeometry( 10, 5, 5 );
        const material = new THREE.MeshBasicMaterial( { color: 0x242424 } );
        const obj = new THREE.Mesh(geometry, material);
        this.add(obj)
    }

    setBoudingBox() {
        this.boundingBox.setFromObject( this );
        this.size = this.getBoundingBoxSize();
    }
    getBoundingBoxSize() {
        return this.boundingBox.getSize(new THREE.Vector3());
    }

    adjustPosition() {
        console.log("before:", this.floorHeight, this.position.y)
        if(this.position.x < this.areaLeft) this.position.x = this.areaLeft;
        else if(this.areaRight < this.position.x) this.position.x = this.areaRight;
        if(this.position.y !== this.floorHeight) this.position.y = this.floorHeight;
        if(this.position.z < this.areaFar) this.position.z = this.areaFar;
        else if(this.areaNear < this.position.z) this.position.z = this.areaNear;
        console.log("after: ", this.floorHeight, this.position.y)
    }
}

class Furniture extends RoomItem {
    constructor(scene, room, canStack = false) {
        super(scene, room, canStack)
    }   

    complete() { // ここ，良い形を検討
        // do not something
    }
}

export class StackableItem extends RoomItem {
    constructor(scene, room, canStack = true) {
        super(scene, room, canStack);
        // 床の位置はオブジェクトの作り方次第なんやろな。
        this.border.bottom = -room.halfHeight;

        this.base = null;
    }
 
    mounting(base) {
        this.dismount();
        // console.log("mounting:", base)
        this.base = base;
        this.rotation.y = this.base.rotation.y;
    }
    mount() {
        this.position.set(this.position.x - this.base.position.x, 0, this.position.z - this.base.position.z); // ずれを修正するために何とかしたい。
        this.base.add(this);

        this.position.y = 0;
        
        this.rotation.y -= this.base.rotation.y;

        const bb = this.base.boundingBox
        const baseSize = this.base.getBoundingBoxSize();
        // console.log(bb, baseSize, this.border.bottom, this.size)
        console.log("mount: ", this.border.bottom, baseSize.y, this.size.y)
        this.setArea(this.border.bottom + baseSize.y  + this.size.y + this.size.y / 2, bb.min.x, bb.max.x, bb.min.z, bb.max.z);
    }
    
    dismount() {
        if(this.base) {
            this.base.remove(this);
            this.base.setBoudingBox();
            this.rotation.y = this.base.rotation.y;
            this.base = null;
            
            this.scene.add(this);


            this.setArea(this.border.bottom, this.border.left, this.border.right, this.border.far, this.border.near);

        }
    }

    complete() {
        console.log(this.floorHeight, this.border.bottom)
        if (this.base) {
            if (this.floorHeight === this.border.bottom) {
                this.dismount();
            } else {
                this.mount();
            }
        }
    }
}

export class Desk extends Furniture {
    constructor(scene, room) {
        super(scene, room, false);
    }

    createMeshFunction() {
        const deskMaterial = new THREE.MeshToonMaterial( { color: 0x242424 } );

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

export class PC extends StackableItem {
    constructor(scene, room, canStack = true) {
        super(scene, room, canStack);
        
    } 

    createMeshFunction() {
        const monitorMaterial = new THREE.MeshLambertMaterial( { color: 0x000 } );
        const bodyMaterial = new THREE.MeshLambertMaterial( { color: 0xb2baba } );

        const display = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.8, 0.2), monitorMaterial)
        // const keyboard = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 1), bodyMaterial);
        // const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.7), bodyMaterial);

        display.position.set(0, 3, 0.1);
        // keyboard.position.set(0, 0, 1.3);
        // mouse.position.set(2, 0, 1.5);

        const parts = [];
        parts.push(
            new THREE.BoxGeometry(5, 4, 0.3).translate(0, 3, 0),
            new THREE.BoxGeometry(5, 0.2, 0.2).translate(0, 4.9, 0.15),
            new THREE.BoxGeometry(0.2, 4, 0.2).translate(2.4, 3, 0.15),
            new THREE.BoxGeometry(5, 0.2, 0.2).translate(0, 1, 0.15),
            new THREE.BoxGeometry(0.2, 4, 0.2).translate(-2.4, 3, 0.15),
            new THREE.BoxGeometry(1, 3, 0.3).translate(0, 1.5, -0.3),
            new THREE.BoxGeometry(3, 0.3, 1.5).translate(0, 0, -0.3),
            new THREE.BoxGeometry(3, 0.2, 1).translate(0, 0, 1.3),
            new THREE.BoxGeometry(0.5, 0.3, 0.7).translate(2, 0, 1.5)
        );
        // geometryの結合
        const geometry = BufferGeometryUtils.mergeBufferGeometries(parts);
        const pc = new THREE.Mesh(geometry, bodyMaterial);

        this.add(pc, display);
        
    }
}