import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import * as Util from './util';
import { Room } from './room';


class RoomItem extends THREE.Group {
    constructor(scene, room, color = 0xffffff, canStack = false) {
        super();
        this.scene = scene;
        this.room = room;
        this.createMeshFunction();
        this.color = color;

        this.boundingBox = new THREE.Box3();
        this.setBoudingBox();
        this.setBorder();
        console.log(this.constructor.name, this.boundingBox, this.size)
        
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

    toJSON() { // TODO: このデータを保存に使う
        let data = {
            classNaem: this.constructor.name,
            position: this.position,
            rotation: this.rotation,
            color: this.color
        }
        return JSON.stringify(data);
    }
        // 判定の仕方変更を検

    setArea(floor, left, right, far, near ) {
        this.floorHeight = floor;
        this.top = this.size.y
        this.areaLeft = left;
        this.areaRight = right;
        this.areaFar = far;
        this.areaNear = near;
    }

    setBorder() {
        this.border = {
            left : -this.room.halfWidth + this.size.x / 2,
            right: this.room.halfWidth - this.size.x / 2,
            bottom: this.size.y / 2, // 照明などは継承して，rotationを180度回転（Math.PI * 0.5）させて天井の位置を指定
            far: -this.room.halfDepth + this.size.z / 2,
            near: this.room.halfDepth - this.size.z / 2
        }
        console.log(this.border)
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
        this.floorHeight = this.border.bottom;
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
        // console.log("before:", this.floorHeight, this.position.y)
        if(this.position.x < this.areaLeft) this.position.x = this.areaLeft;
        else if(this.areaRight < this.position.x) this.position.x = this.areaRight;
        if(this.position.y !== this.floorHeight) this.position.y = this.floorHeight;
        if(this.position.z < this.areaFar) this.position.z = this.areaFar;
        else if(this.areaNear < this.position.z) this.position.z = this.areaNear;
        // console.log("after: ", this.floorHeight, this.position.y)
    }
}

class Furniture extends RoomItem {
    constructor(scene, room, color, canStack = false) {
        super(scene, room, color, canStack)
    }   

    complete() { // ここ，良い形を検討
        // do not something
    }
}

export class StackableItem extends RoomItem {
    constructor(scene, room, color, canStack = true) {
        super(scene, room, color, canStack);
        this.base = null;
    }
 
    mounting(base) {
        console.log("mounting");
        // this.unmount();
        // console.log("mounting:", base)
        if(this.base) {
            this.floorHeight = this.base.border.bottom;
        } else {
            this.base = base;
            this.floorHeight = this.base.size.y;
        }

        
        console.log(this.floorHeight)
        // TODO: ここの回転を調整しないと，気持ちいい操作にならなさそう（現状ずれてる）①
        this.rotation.y = this.base.rotation.y;
    }
    mount() {
        console.log('mount')
        console.log(this.position.y)
        // world position to local position
        const localPosition = this.base.worldToLocal(this.position.clone());
        this.base.add(this);
        // 位置を調整して重なりを解消
        this.position.copy(localPosition);
        console.log(this.position.y)
        
        // TODO: ここの回転を調整しないと，気持ちいい操作にならなさそう（現状ずれてる）②
        this.rotation.y -= this.base.rotation.y;

        const bb = this.base.boundingBox
        const baseSize = this.base.getBoundingBoxSize();
        // console.log("mount: ", this.border.bottom, baseSize.y, this.size.y)

        this.floorHeight = baseSize.y

    }
    
    unmount() {
        console.log('unmount');
        // TODO: local to world がうまくできない。

        // const localPosition = this.localToWorld(this.position.clone());
        const localPosition = this.getWorldPosition(new THREE.Vector3() );

        this.base.remove(this);
        this.scene.attach(this);
        this.position.copy(localPosition);


        this.base.setBoudingBox();
        this.setBoudingBox()

        // TODO: 確認。これ，回転も反映される？
        // this.rotation.y = this.base.rotation.y;
        
        this.base = null;
        // this.setArea(this.border.bottom, this.border.left, this.border.right, this.border.far, this.border.near);

        this.floorHeight = this.border.bottom;

    }

    complete() {
        if (this.base) {
            if (this.floorHeight === this.border.bottom) {
                this.unmount();
            } else {
                this.mount();
            }
        }
    }
}

export class Desk extends Furniture {
    constructor(scene, room, color = 0x242424) {
        super(scene, room, color, false);
    }

    createMeshFunction() {
        const mainMaterial = new THREE.MeshToonMaterial( { color: 0x242424 } );

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
        const object = new THREE.Mesh(geometry, mainMaterial);

        this.add(object);
    }
}

export class Chair extends Furniture {
    constructor(scene, room, color = 0x242424) {
        super(scene, room, color, false);
    }

    createMeshFunction() {
        const mainMaterial = new THREE.MeshToonMaterial( { color: 0x242424 } );

        const parts = [];
        parts.push(
            new THREE.BoxGeometry(3, 0.5, 3).translate(0, 1.25, 0),
            new THREE.BoxGeometry(0.3, 6, 0.3).translate(1.5, 1.5, 1.5),
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(1.5, 0, -1.5), 
            new THREE.BoxGeometry(0.3, 6, 0.3).translate(-1.5, 1.5, 1.5), 
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(-1.5, 0, -1.5),
            new THREE.BoxGeometry(3, 3.5, 0.3 ).translate(0, 2.5, 1.5));
        // geometryの結合
        const geometry = BufferGeometryUtils.mergeBufferGeometries(parts);
        const object = new THREE.Mesh(geometry, mainMaterial);
        geometry.translate(0, -1.5, 0); // TODO: 中心軸を動かすことで何とか対応したが，もうちょっといい解決策はないか思案中①

        this.add(object);
    }
}

export class PC extends StackableItem {
    constructor(scene, room, color = 0xb2baba, canStack = true) {
        super(scene, room, color, canStack);
        
    } 

    createMeshFunction() {
        const monitorMaterial = new THREE.MeshLambertMaterial( { color: 0x000 } );
        const bodyMaterial = new THREE.MeshLambertMaterial( { color: this.color } );
        const displayGeometry = new THREE.BoxGeometry(4.8, 3.8, 0.2);
        const display = new THREE.Mesh(displayGeometry, monitorMaterial)
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
        // TODO: 中心軸を動かすことで何とか対応したが，もうちょっといい解決策はないか思案中②
        displayGeometry.translate(0, -2.5, 0)
        geometry.translate(0, -2.5, 0); 
        const object = new THREE.Mesh(geometry, bodyMaterial);
        

        this.add(object, display);
        
    }
}