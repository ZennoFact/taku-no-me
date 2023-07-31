import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
// import { TransformControls } from 'three/addons/controls/TransformControls.js';

import { CustomDragControls } from './CustomDragControls.js';
import { Room } from './room.js';
import * as Furniture from './furniture.js';
// import { Desk, PC, StackableItem } from './furniture.js';


let objects = [];

function init() {

    const scene = new THREE.Scene();
    const aspect = window.innerWidth / window.innerHeight; // aspectRatio
    let fov = 45; // camera frustum vertical field of view

    const camera = new THREE.PerspectiveCamera( fov, aspect, 0.1, 1000 );
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    document.body.appendChild( renderer.domElement );
    
    const orbitControls = new OrbitControls( camera, renderer.domElement );
    
    // const dragControls = new DragControls( objects, camera, renderer.domElement)
    const dragControls = new CustomDragControls( objects, camera, renderer.domElement);
    dragControls.transformGroup = true;


    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster(); // TPDP: Raycasterの使い道確認
    let selectedObject = null;
    const degree = 15;
    const radian = degree * (Math.PI / 180);

    dragControls.addEventListener('hoveron', event => event.object.parent.hoverOn());
    dragControls.addEventListener('hoveroff', event => event.object.parent.hoverOff());

    dragControls.addEventListener('dragstart', event => {
        orbitControls.enabled = false;
        selectedObject = event.object;
        event.object.selectOn();
    });
    dragControls.addEventListener('drag', event => event.object.update(objects) );
    dragControls.addEventListener('dragend', event => {
        event.object.complete();
        selectedObject = null;
        orbitControls.enabled = true;
    });

    
    window.addEventListener('keydown', event => {
        if(selectedObject) {
            switch(event.key) {
                case "ArrowLeft":
                    selectedObject.rotation.y -= radian;
                    break;
                case "ArrowRight":
                    selectedObject.rotation.y += radian;
                    break;
            }
        }
    }, false);

    renderer.domElement.addEventListener('mousemove', evnet => {
        const element = event.currentTarget;
        // canvas要素上のXY座標
        const x = event.clientX - element.offsetLeft;
        const y = event.clientY - element.offsetTop;
        // canvas要素の幅・高さ
        const w = element.offsetWidth;
        const h = element.offsetHeight;
        
        // -1〜+1の範囲(正規化)で現在のマウス座標を登録する
        mouse.x = ( x / w ) * 2 - 1;
        mouse.y = -( y / h ) * 2 + 1;
    }, false);

   
        
    // 部屋の設定
    const room = new Room(15, 10, 15);
    scene.add(room);
    
    const desk = new Furniture.Desk(scene, room);
    objects.push(desk);
    
    const pc = new Furniture.PC(scene, room);
    objects.push(pc);

    const chair = new Furniture.Chair(scene, room);
    objects.push(chair);
    
    camera.position.set(50, 50, 50);
    camera.lookAt(0, 0, 0);
    setLight(scene, room.top);

    objects.forEach(obj => {
        obj.update();
    })

    
    function animate() {
        requestAnimationFrame( animate );

        if(camera.position.y < room.bottom) camera.position.y = room.bottom;

        renderer.render( scene, camera );
    }
    animate();
    
    
    function setLight(scene, roomTop) {
        const ambientLight = new THREE.AmbientLight(0xFFeeee, 0.2);
        scene.add(ambientLight);

        // TODO: ライト(位置固定)のデザイン作らなきゃ
        const pointLight = new THREE.PointLight(0xffffff, 10)
        pointLight.position.set(0, roomTop - 0.5, 0)
        pointLight.castShadow = true;
        scene.add(pointLight);

    }
    
    function test() {
        const axesHelper = new THREE.AxesHelper( 50 );
        scene.add( axesHelper );
    }
    test();
}

init();



