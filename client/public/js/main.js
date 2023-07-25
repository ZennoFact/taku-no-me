import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

import { Room } from './room.js';
import { Desk } from './furniture.js';

// import { test } from "client/public/js/util.js";

let floorHeight = 0;

function init() {

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    let objects = [];
    
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    
    const orbitControls = new OrbitControls( camera, renderer.domElement );
    const dragControls = new DragControls(objects, camera, renderer.domElement);
    dragControls.addEventListener( 'dragstart', () => orbitControls.enabled = false, false);
    dragControls.addEventListener( 'drag', event => {
        // const target = event.target.getRaycaster().intersectObjects(scene.children)[0];
        // console.log(target, event.object)
        // if(target) {
        //     // console.log(event.target)
        //     const newPos = target.point;
        //     event.target.getObjects()[0].position.set(newPos.x, newPos.y, newPos.z);
        //     event.target.getObjects()[0].adjustPosition(event.object);
        // }
    }, false)
    dragControls.addEventListener( 'dragend', () => orbitControls.enabled = true, false );
    dragControls.addEventListener( 'hoveron', (event) => {
        console.log(event.object)
        event.object.opacity = 0.8;
    }, false );

    camera.position.set(35, 10, 35);
    camera.lookAt(0, 0, 0);
    setLight(scene);
    
    
    const room = new Room(15, 15, 15);
    floorHeight = room.getFloorHeight();
    scene.add(room);

    
    const desk = new Desk(room );
    scene.add( desk );
    objects.push(desk);
    

    
    function animate() {
        requestAnimationFrame( animate );

        if(camera.position.y < room.bottom) camera.position.y = room.bottom;

        objects.forEach(obj => {
            obj.adjustPosition();
        })

        renderer.render( scene, camera );
    }
    animate();
    
    
    function setLight(scene) {
        const ambientLight = new THREE.AmbientLight(0xFFeeee, 1.0);
        scene.add(ambientLight);
    }
    
    function test() {
        const axesHelper = new THREE.AxesHelper( 50 );
        scene.add( axesHelper );
    }
    test();
}

init();



