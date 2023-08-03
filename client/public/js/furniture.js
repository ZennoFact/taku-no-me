import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import * as Util from './util';
import { Room } from './room';


class RoomItem extends THREE.Group {
    constructor(scene, room, color = "#ffffff", subColor = "#ffffff", canStack = false) {
        super();
        this.scene = scene;
        this.room = room;
        this.color = color;
        this.subColor = subColor;
        
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

    colorChange(mainColor, subColor) {
        this.mainColor = mainColor;
        if(this.subMaterial) this.subColor = subColor;

        // TODO：これだとうまく色変わらない。
        this.mainMaterial.color = this.mainColor;
        this.geometry.colorsNeedUpdate = true;

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
    }

    update() {
        this.adjustPosition();
        this.setBoudingBox();
    }

    complete() {
        this.selectOff();
        this.update();
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
        const material = new THREE.MeshBasicMaterial( { color: "#242424" } );
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

    hoverOn() {
        this.children.forEach(o => {
            if (o.isGroup) {
                o.children.forEach(item => {
                    item.material.wireframe = true;
                });
            } else {
                o.material.wireframe = true;
            }
        });
    }

    hoverOff() {
        this.children.forEach(o => {
            if (o.isGroup) {
                o.children.forEach(item => {
                    item.material.wireframe = false;
                });
            } else {
                o.material.wireframe = false;
            }
        });
    }

    selectOn() { 
        this.children.forEach(o => { 
            if (o.isGroup) {
                o.children.forEach(item => {
                    item.material.wireframe = false;
                    item.material.opacity = 0.33;
                });
            } else {
                o.material.wireframe = false;
                o.material.opacity = 0.33;
            }
        });
    }

    selectOff() {
        this.children.forEach(o => { 
            if (o.isGroup) {
                o.children.forEach(item => {
                    item.material.opacity = 1;
                });
            } else {
                o.material.opacity = 1;
            }
        });
    }

}

class Furniture extends RoomItem {
    constructor(scene, room, color, subColor = "#ffffff", canStack = false) {
        super(scene, room, color, subColor,  canStack)
    }   

    complete() {
        super.complete();
    }
}

export class StackableItem extends RoomItem {
    constructor(scene, room, color, subColor = "#ffffff", canStack = true) {
        super(scene, room, color, subColor, canStack);
        this.base = null;
        this.isReplace = false;
        
        this.add(new THREE.AxesHelper(4));
    }

    selectOn() {
        super.selectOn();
        this.startReplace();
    }

    startReplace() {
        if(this.isReplace) {
            const base = this.base;
            const rotation = this.base.rotation;
            this.convertToWorldPosition();
            // this.unmount(); // TODO: いるのかいらんのかはっきりせん。多分いらん。

            // TODO: ここの回転を調整しないと，気持ちいい操作にならなさそう（現状ずれてる）①
            // const worldRotation = new THREE.Euler();
            // this.getWorldRotation(worldRotation);
            // this.rotation.copy(worldRotation);

            // this.rotation.y = rotation.y
            this.isReplace = false;
            
            this.base = base;
            this.base.setBoudingBox();
            this.floorHeight = this.base.size.y;
        } 
    }
 
    mounting(base) {
        console.log("mounting");
        // this.unmount();
        // console.log("mounting:", base)
        this.base = base;

        const targetHeight = base.floorHeight + base.size.y;
        this.setFloorHeight(targetHeight); 
    }
    mount() {
        const rotationY = this.rotation.y;
        this.convertToLocalPosition();
        
        const bb = this.base.boundingBox
        const baseSize = this.base.getBoundingBoxSize();
        this.floorHeight = baseSize.y
        this.isReplace = true;

        // console.log(this.position, this.localToWorld(new THREE.Vector3()))
    }
    
    unmount() {
        console.log('unmount');
        this.base = null;
        this.floorHeight = this.border.bottom;
    }

    convertToWorldPosition() {

        // TODO: どうも，移動開始してからずれているようにも思う
        const localPosition = this.localToWorld(new THREE.Vector3());
        this.base.remove(this);
        this.position.copy(localPosition.clone());

        // this.scene.add(this);
        this.scene.attach(this);
        
        console.log(localPosition, this.position)

        
        this.base.setBoudingBox();
        this.setBoudingBox()
    }

    convertToLocalPosition() {
        console.log('mount')
        console.log(this.position.y)
        // world position to local position
        const localPosition = this.base.worldToLocal(this.position.clone());
        // this.base.add(this);
        this.base.attach(this);
        // 位置を調整して重なりを解消
        this.position.copy(localPosition);
        console.log(this.position.y)
        
        // TODO: ここの回転を調整しないと，気持ちいい操作にならなさそう（現状ずれてる）②
        // this.rotation.y -= this.base.rotation.y;
    }

    
    complete() {
        super.complete();
        if (this.base) {
            if (this.floorHeight === this.border.bottom) {
                this.unmount();
            } else {
                this.mount();
            }
        }
    }

    update(objects) {
        if(objects) {
            this.setDefaultFloorHeight();
            objects.forEach((obj, i) => {
                if( !(obj instanceof StackableItem) && this.checkCollision(obj)) {
                    this.mounting(obj);
                    return true; 
                }
            })
        }

        super.update();
    }
}

export class Desk extends Furniture {
    constructor(scene, room, color = "#242424", subColor = "#ffffff") {
        super(scene, room, color, subColor, false);
    }

    createMeshFunction() {
        this.mainMaterial = new THREE.MeshToonMaterial( { color: this.color } );

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
        const object = new THREE.Mesh(geometry, this.mainMaterial);

        this.add(object);
    }
}

export class Chair extends Furniture {
    constructor(scene, room, color = "#242424", subColor = "#ffffff") {
        super(scene, room, color, subColor, false);
    }

    createMeshFunction() {
        this.mainMaterial = new THREE.MeshToonMaterial( { color: this.color } );

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
        const object = new THREE.Mesh(geometry, this.mainMaterial);
        geometry.translate(0, -1.5, 0); // TODO: 中心軸を動かすことで何とか対応したが，もうちょっといい解決策はないか思案中①

        this.add(object);
    }
}

export class Bed extends Furniture {
    constructor(scene, room, color = "#242424", subColor = "#ffffff") {
        super(scene, room, color, subColor, false);
    }

    createMeshFunction() {
        this.mainMaterial = new THREE.MeshToonMaterial( { color: this.color } );
        this.subMaterial = new THREE.MeshToonMaterial( { color: this.subColor } );

        const parts = [];
        parts.push(
            new THREE.BoxGeometry(15, 0.5, 7).translate(0, 1.25, 0),
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(7.5, 0, 3.5),
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(7.5, 0, -3.5), 
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(-7.5, 0, 3.5), 
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(-7.5, 0, -3.5),
            new THREE.BoxGeometry(0.3, 3.5, 7 ).translate(-7.5, 2.5, 0));
        // geometryの結合
        const geometry = BufferGeometryUtils.mergeBufferGeometries(parts);
        const object = new THREE.Mesh(geometry, this.mainMaterial);
        geometry.translate(0, -1.5, 0); // TODO: 中心軸を動かすことで何とか対応したが，もうちょっといい解決策はないか思案中①

        const parts2 = [];
        parts2.push(
            new THREE.BoxGeometry(14.8, 1, 6.8).translate(0, 1.75, 0),
        );
        const geometry2 = BufferGeometryUtils.mergeBufferGeometries(parts2);
        const object2 = new THREE.Mesh(geometry2, this.subMaterial);
        geometry2.translate(0, -1.5, 0); 

        this.add(object, object2);
    }
}

export class HighBed extends Furniture {
    constructor(scene, room, color = "#242424", subColor = "#ffffff") {
        super(scene, room, color, subColor, false);
    }

    createMeshFunction() {
        this.mainMaterial = new THREE.MeshToonMaterial( { color: this.color } );
        this.subMaterial = new THREE.MeshToonMaterial( { color: this.subColor } );

        const parts = [];
        parts.push(
            new THREE.BoxGeometry(15, 0.5, 7).translate(0, 6.25, 0),
            new THREE.BoxGeometry(0.3, 13, 0.3).translate(7.5, 0, 3.5),
            new THREE.BoxGeometry(0.3, 13, 0.3).translate(7.5, 0, -3.5), 
            new THREE.BoxGeometry(0.3, 13, 0.3).translate(-7.5, 0, 3.5), 
            new THREE.BoxGeometry(0.3, 13, 0.3).translate(-7.5, 0, -3.5),
            new THREE.BoxGeometry(0.3, 3.5, 7 ).translate(-7.5, 8, 0),
            new THREE.BoxGeometry(0.3, 13, 0.3).translate(4.5, 0, 3.5),
            new THREE.BoxGeometry(3, 0.3, 0.3).translate(6, 0, 3.5),
            new THREE.BoxGeometry(3, 0.3, 0.3).translate(6, 2, 3.5),
            new THREE.BoxGeometry(3, 0.3, 0.3).translate(6, 4, 3.5),
            new THREE.BoxGeometry(3, 0.3, 0.3).translate(6, -2, 3.5),
            new THREE.BoxGeometry(3, 0.3, 0.3).translate(6, -4, 3.5),
            new THREE.BoxGeometry(0.3, 13, 0.3).translate(4.5, 0, -3.5), 
            new THREE.BoxGeometry(3, 0.3, 0.3).translate(6, 0, -3.5),
            new THREE.BoxGeometry(3, 0.3, 0.3).translate(6, 2, -3.5),
            new THREE.BoxGeometry(3, 0.3, 0.3).translate(6, 4, -3.5),
            new THREE.BoxGeometry(3, 0.3, 0.3).translate(6, -2, -3.5),
            new THREE.BoxGeometry(3, 0.3, 0.3).translate(6, -4, -3.5),
            new THREE.BoxGeometry(0.3, 3.5, 7 ).translate(7.5, 8, 0),

            
            new THREE.BoxGeometry(10, 0.3, 0.3).translate(-1.5, 9, 3.5),
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(0.2, 7.5, 3.5),
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(1.9, 7.5, 3.5),
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(3.35, 7.5, 3.5),
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(-1.4, 7.5, 3.5),
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(-3.0, 7.5, 3.5),
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(-4.7, 7.5, 3.5),
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(-6.35, 7.5, 3.5),
            new THREE.BoxGeometry(10, 0.3, 0.3).translate(-1.5, 9, -3.5),
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(0.2, 7.5, -3.5),
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(1.9, 7.5, -3.5),
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(3.35, 7.5, -3.5),
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(-1.4, 7.5, -3.5),
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(-3.0, 7.5, -3.5),
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(-4.7, 7.5, -3.5),
            new THREE.BoxGeometry(0.3, 3, 0.3).translate(-6.35, 7.5, -3.5),
        );
        // geometryの結合
        const geometry = BufferGeometryUtils.mergeBufferGeometries(parts);
        const object = new THREE.Mesh(geometry, this.mainMaterial);
        geometry.translate(0, -1.75, 0); // TODO: 中心軸を動かすことで何とか対応したが，もうちょっといい解決策はないか思案中①

        const parts2 = [];
        parts2.push(
            new THREE.BoxGeometry(14.8, 1, 6.8).translate(0, 7, 0),
        );
        const geometry2 = BufferGeometryUtils.mergeBufferGeometries(parts2);
        const object2 = new THREE.Mesh(geometry2, this.subMaterial);
        geometry2.translate(0, -1.75, 0); 

        this.add(object, object2);
    }
}

export class PC extends StackableItem {
    constructor(scene, room, color = 0xb2baba, subColor = 0x000000, canStack = true) {
        super(scene, room, color, subColor, canStack);
    } 

    createMeshFunction() {

        this.subMaterial = new THREE.MeshLambertMaterial( { color: this.subColor } );
        this.mainMaterial = new THREE.MeshLambertMaterial( { color: this.color } );
        const displayGeometry = new THREE.BoxGeometry(4.8, 3.8, 0.2);
        const display = new THREE.Mesh(displayGeometry, this.subMaterial)
        // const keyboard = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 1), this.mainMaterial);
        // const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.7), this.mainMaterial);

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
        const object = new THREE.Mesh(geometry, this.mainMaterial);
        

        this.add(object, display);
        
    }
}