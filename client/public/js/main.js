import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

import { CustomDragControls } from './CustomDragControls.js';
// import { Room } from './util.js';
import { Room } from './room.js';
import * as Furniture from './furniture.js';
// import { Desk, PC, StackableItem } from './furniture.js';

let scene;
let room;
let objects = [];

const colorPicker1 = document.querySelector('#mainColor');
const colorPicker2 = document.querySelector('#subColor');
let edittingObject = null;

function init() {

    scene = new THREE.Scene();
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
    room = new Room(15, 10, 12);
    scene.add(room);
    
    // const desk = new Furniture.Desk(scene, room);
    // objects.push(desk);
    
    // const pc = new Furniture.PC(scene, room);
    // objects.push(pc);

    // const chair = new Furniture.Chair(scene, room);
    // objects.push(chair);

    // const obj = new Furniture.HighBed(scene, room);
    // objects.push(obj);
    
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

// TODO: ここ，綺麗に作りたい(evalを避けたいけども。。)
// function getClass(className){return Function('return (' + className + ')')();}
function getClass(className){return eval(className)}
function generate(className) {
    const name = `Furniture.${className}`;
    const c = getClass(name);
    const instance = new c(scene, room);
    objects.push(instance);

    // templateから生成
    const template = document.querySelector("#edit-console");
    const clone = template.content.cloneNode(true);
    clone.querySelector('li').id = "item" + instance.index;
    clone.querySelector('h3').innerHTML = className;
    const picker1 = clone.querySelector('.main-color');
    picker1.value = instance.color;
    const picker2 = clone.querySelector('.sub-color');
    if (instance.subColor) {
      picker2.value = instance.subColor;
    } else {
      picker2.disabled = true;
      picker2.parentNode.style.opacity = 0.3;
    }

    clone.querySelector('.save-button').addEventListener('click', event => {    
      instance.colorChange(picker1.value, picker2.value);
    });

    clone.querySelector('.delete-button').addEventListener('click', event => {    
      scene.remove(instance);
      instance.children.forEach(mesh => {
        mesh.material.dispose();
        mesh.geometry.dispose();
      });
      const index = objects.indexOf(instance);
      objects.splice(index, 1);
      console.log(document.querySelector('#item' + instance.index))
      document.querySelector('#item' + instance.index).remove();
    });
    
    if (instance instanceof Furniture.Furniture) {
      document.querySelector('.submenu.furniture').appendChild(clone);
    } else if (instance instanceof Furniture.StackableItem) {
      document.querySelector('.submenu.mounted').appendChild(clone);
    }
}

class Accordion {
    constructor(el, multiple) {
      this.el = el || {};
      this.multiple = multiple || false;
      this.menu = this.el.querySelectorAll('.link');
      this.items = this.el.querySelectorAll('ul.submenu li')
      
      // イベントリスナーを登録
      for (let i = 0; i < this.menu.length; i++) {
        this.menu[i].addEventListener('click', this.dropdown.bind(this));
      }
      for(let i = 0; i < this.items.length; i++) {
        this.items[i].addEventListener('click', this.click.bind(this));
      }
    }
  
    dropdown(e) {
      const link = e.currentTarget;
      const next = link.nextElementSibling;
  
      next.style.display = (next.style.display === 'block') ? 'none' : 'block';
      link.parentNode.classList.toggle('open');
  
      if (!this.multiple) {
        const submenus = this.el.querySelectorAll('.submenu');
        for (let i = 0; i < submenus.length; i++) {
          if (submenus[i] !== next) {
            submenus[i].style.display = 'none';
            submenus[i].parentNode.classList.remove('open');
          }
        }
      }
    } 
  
    click(e) {
      generate(e.target.dataset.type);
    }
  }

  class EditAccordion extends Accordion {
    constructor(el, multiple) {
      super(el, multiple);
    }

    // 
    click(e) {
      e.target.querySelector('button', e => {
        e.addEventListener('click', saveFurniture, false);
      });
    }
  }
  
  function saveFurniture() {
    
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    new Accordion(document.querySelector('.accordion-menu'), false);
    new EditAccordion(document.querySelector('.accordion-editor'), false);
  });