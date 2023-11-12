import * as THREE from '../build/three.module.js'
import { OrbitControls } from "../examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "../examples/jsm/loaders/GLTFLoader.js"
import Stats from "../examples/jsm/libs/stats.module.js"

import { Octree } from "../examples/jsm/math/Octree.js"
import { Capsule } from '../examples/jsm/math/Capsule.js'

class App {
    constructor() {
        const divContainer = document.querySelector("#webgl-container");
        this._divContainer = divContainer;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true});
        renderer.setPixelRatio(window.devicePixelRatio);
        divContainer.appendChild(renderer.domElement);

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.VSMShadowMap;

        this._renderer = renderer;

        const scene = new THREE.Scene();
        this._scene = scene;

        //this._setupOctree();
        this._setupCamera();
        this._setupLight();
        this._setupModel();
        this._setupControls();

        window.onresize = this.resize.bind(this);
        this.resize();

        requestAnimationFrame(this.render.bind(this));
    }

    _setupOctree(model) { // 충돌 검사를 위한 메서드
        this._worldOctree = new Octree();
        this._worldOctree.fromGraphNode(model);
    }

    _setupControls() {
        // 카메라는 OrbitControls의 통제를 받음.
        this._controls = new OrbitControls(this._camera, this._divContainer); 
        this._controls.target.set(0, 100, 0);
        this._controls.enablePan = false;
        this._controls.enableDamping = true;

        // 현재 fps 표시
        const stats = new Stats();
        this._divContainer.appendChild(stats.dom);
        this._fps = stats;

        this._pressedKeys = {};

        document.addEventListener("keydown", (event) => { // 키보드가 눌렸을 때 반응
            this._pressedKeys[event.key.toLowerCase()] = true;
            this._processAnimation();
        });

        document.addEventListener("keyup", (event) => { //  키보드가 떼졌을 때 반응
            this._pressedKeys[event.key.toLowerCase()] = false;
            this._processAnimation();
        });
    }

    _processAnimation() {
        const previousAnimationAction = this._currentAnimationAction;

        if(this._pressedKeys['w'] || this._pressedKeys['a'] || this._pressedKeys['s'] || this._pressedKeys['d']) {
            if(this._pressedKeys['shift']) {    // Shift 누르면서 w, a, s, d 중 하나 누르면 Run
                this._currentAnimationAction = this._animationMap["Run"];
                //this._speed = 350;
                this._maxSpeed = 500;
                this._acceleraction = 3; 
            } else {
                this._currentAnimationAction = this._animationMap["Walk"];
                //this._speed = 80;
                this._maxSpeed = 80;
                this._acceleraction = 3;
            }
        } else {
            this._currentAnimationAction = this._animationMap["Idle"];
            this._speed = 0;
            this._maxSpeed = 0;
            this._acceleraction = 0;
        }

        // 현재 애니메이션과 이전 애니메이션이 다르다면
        if (previousAnimationAction !== this._currentAnimationAction) { 
            previousAnimationAction.fadeOut(0.5);  // 이전 애니메이션 0.5초에 걸쳐 페이드아웃
            this._currentAnimationAction.reset().fadeIn(0.5).play();    // 현재 애니메이션 0.5초에 걸쳐 페이드인
        }
    }

    _setupCamera() {
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;
        const camera = new THREE.PerspectiveCamera(
            75,
            width / height,
            1,
            50000
        );
        camera.position.set(0, 300, 800);
        this._camera = camera; 
    }

    _addPointLight(x, y, z, helperColor) {
        const color = 0xffffff;
        const intensity = 5;

        const pointLight = new THREE.PointLight(color, intensity, 1000);
        pointLight.position.set(x, y, z);

        this._scene.add(pointLight);

        // --------------> pointlight 헬퍼
        // const pointLightHelper = new THREE.PointLightHelper(pointLight, 10, helperColor);
        // this._scene.add(pointLightHelper);
    }

    _addDLight(x, y, z, tX, tY, tZ) {
        const color = 0xffffff;
        const intensity = 5;
        
        const shadowLight = new THREE.DirectionalLight(color, intensity);
        shadowLight.position.set(x, y, z);
        shadowLight.target.position.set(tX, tY, tZ);

        // --------------> directionalLight 헬퍼
        // const directionalLightHelper = new THREE.DirectionalLightHelper(shadowLight, 10);
        // this._scene.add(directionalLightHelper);
        this._scene.add(shadowLight);
        this._scene.add(shadowLight.target);

        shadowLight.castShadow = true;
        shadowLight.shadow.mapSize.width = 1024;
        shadowLight.shadow.mapSize.height = 1024;
        shadowLight.shadow.camera.top = shadowLight.shadow.camera.right = 700;
        shadowLight.shadow.camera.bottom = shadowLight.shadow.camera.left = -700;
        shadowLight.shadow.camera.near = 100;
        shadowLight.shadow.camera.far = 900;
        shadowLight.shadow.radius = 5;
        
        // ----------> cameraHelper
        // const shadowCameraHelper = new THREE.CameraHelper(shadowLight.shadow.camera);
        // this._scene.add(shadowCameraHelper);
    }
    _setupLight() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 5);
        this._scene.add(ambientLight);

        this._addPointLight(500, 150, 500, 0xff0000);
        this._addPointLight(-500, 150, 500, 0xffff00);
        this._addPointLight(-500, 150, -500, 0x00ff00);
        this._addPointLight(500, 150, -500, 0x0000ff);

        this._addDLight(200, 5000, 200, 0, 0, 0);


        // const shadowLight = new THREE.DirectionalLight(0xffffff, 4);
        // shadowLight.position.set(200, 500, 200);
        // shadowLight.target.position.set(0, 0, 0);
        
        // const directionalLightHelper = new THREE.DirectionalLightHelper(shadowLight, 10);
        // this._scene.add(directionalLightHelper);

        // this._scene.add(shadowLight);
        // this._scene.add(shadowLight.target);

        // 그림자 설정
        // shadowLight.castShadow = true;
        // shadowLight.shadow.mapSize.width = 1024;
        // shadowLight.shadow.mapSize.height = 1024;
        // shadowLight.shadow.camera.top = shadowLight.shadow.camera.right = 700;
        // shadowLight.shadow.camera.bottom = shadowLight.shadow.camera.left = -700;
        // shadowLight.shadow.camera.near = 100;
        // shadowLight.shadow.camera.far = 900;
        // shadowLight.shadow.radius = 5;
        // const shadowCameraHelper = new THREE.CameraHelper(shadowLight.shadow.camera);
        // this._scene.add(shadowCameraHelper);
        

    }

    _setupModel() {

        // plane
        // const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
        // const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x878787 });
        // const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        // plane.rotation.x = -Math.PI/2;
        // this._scene.add(plane);
        // plane.receiveShadow = true; // 평면이기 때문에 그림자를 그냥 그대로 받는다.
        //                             // 즉 그림자 생성이 안 된다.

        // this._worldOctree.fromGraphNode(plane); // worldOctree에 3D모델을 추가해야 충돌 검사가 이뤄짐

        const loader = new GLTFLoader();

        // character
        loader.load("./data/character.glb", (gltf) => {
            const model = gltf.scene;
            this._scene.add(model);
            
            model.traverse(child => {
                if(child instanceof THREE.Mesh) {
                    child.castShadow = true;
                }
            });     // 그림자를 생성만 한다.


            // 3D모델이 가지고 있는 animation을 출력.
            const animationClips = gltf.animations; // THREE.AnimationClip[]
            const mixer = new THREE.AnimationMixer(model); // frame마다 모델의 animation을 업데이트
            const animationsMap = {};
            animationClips.forEach( clip => {  
                const name = clip.name;
                console.log(name);  // 3D모델이 가지고 있는 animation을 출력.
                animationsMap[name] = mixer.clipAction(clip); // THREE.AnimationAction
            });

            this._mixer = mixer;
            this._animationMap = animationsMap;
            this._currentAnimationAction = this._animationMap['Idle']; // 모델의 animation을 가져옴.
            this._currentAnimationAction.play();    //  animation 재생.

            const box = (new THREE.Box3).setFromObject(model);  // character에 대한 바운딩 박스 구하기
            model.position.y = (box.max.y - box.min.y) * 2 + 4; 

            const height = 4.5*(box.max.y - box.min.y);
            const diameter = box.max.z - box.min.z;
            
            model._capsule = new Capsule(
                new THREE.Vector3(0, diameter/2, 0),    // capsule의 start
                new THREE.Vector3(0, height - diameter/2, 0),   // capsule의 end
                diameter/2  // capsule의 radius
            );

            const axisHelper = new THREE.AxesHelper(1000); //   월드 좌표계 축
            this._scene.add(axisHelper);        // x축: 빨강 y축: 초록 z축: 파랑.


            // model의 bounding box
            const boxHelper = new THREE.BoxHelper(model);
            this._scene.add(boxHelper);
            this._boxHelper = boxHelper;
            this._model = model;

            // const boxG = new THREE.BoxGeometry(100, diameter-5, 100);
            // const boxM = new THREE.Mesh(boxG, planeMaterial);
            // boxM.receiveShadow = true;
            // boxM.castShadow = true;
            // boxM.position.set(150, 0, 0);
            // this._scene.add(boxM);

            // this._worldOctree.fromGraphNode(boxM);  // worldOctree에 3D모델을 추가해야 충돌 검사가 이뤄짐
        });

        loader.load("./data/background.glb", (gltf)=> { // 블렌더 파일
            const model = gltf.scene;

            this._scene.add(model);

            model.traverse(child => {
                if(child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = false;
                }
            });

            this._setupOctree(model);
        });

    }

    resize() {
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;

        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();

        this._renderer.setSize(width, height);
    }

    render(time) {
        this._renderer.render(this._scene, this._camera);
        this.update(time);
        requestAnimationFrame(this.render.bind(this));
    }

    _previousDirectionOffset = 0;

    _directionOffset() {    //  키보드 입력 시 캐릭터 방향 전환 보정값
                        //  angleCameraDirectionAxisY에 더해줘서 카메라가 같이 이동할 수 있도록 함.
        const pressedKeys = this._pressedKeys;
        let directionOffset = 0 // w

        if(pressedKeys['w']) {
            if(pressedKeys['a']) {
                directionOffset = Math.PI / 4 // w + a (45도)
            }
            else if(pressedKeys['d']) {
                directionOffset = - Math.PI / 4 // w + d (-45도)
            }
        } else if(pressedKeys['s']) {
            if(pressedKeys['a']) {
                directionOffset = Math.PI / 4 + Math.PI / 2 // s + a (135도) 
            } else if(pressedKeys['d']) {
                directionOffset = -Math.PI / 4 - Math.PI / 2 // s + d (-135도)
            } else {
                directionOffset = Math.PI // s (180도)
            }
        } else if (pressedKeys['a']) {
            directionOffset = Math.PI / 2 // a (90도)
        } else if (pressedKeys['d']) {
            directionOffset = - Math.PI / 2 // d (-90도)
        } else { // 키보드 입력이 없을 시
            directionOffset = this._previousDirectionOffset;
        }

        this._previousDirectionOffset = directionOffset;

        return directionOffset;
    }
    
    _speed = 0;
    _maxSpeed = 0;  // 최고속도
    _acceleraction = 0; //  가속도

    _bOnTheGround = false; // true: on the ground | false: in the air
    _fallingAcceleration = 0; // 낙하 가속도
    _fallingSpeed = 0;  // 낙하 속도

    update(time) { // time에 따라 상태를 update 해줌.
        time *= 0.001; // second unit
        
        this._controls.update();

        if(this._boxHelper) {   // bounding box 업데이트
            this._boxHelper.update();   
        }

        this._fps.update(); // fps 업데이트

        if(this._mixer) {
            const deltaTime = time - this._previousTime; // 시간변화량(즉 이전 프레임과 현재 프레임의 차)
            this._mixer.update(deltaTime);

            // 카메라와 캐릭터가 바라보는 방향을 같은 선상에 두기 위한 각도.
            const angleCameraDirectionAxisY = Math.atan2(
                (this._camera.position.x - this._model.position.x),
                (this._camera.position.z - this._model.position.z) 
            ) + Math.PI; 

            const rotateQuaternion = new THREE.Quaternion();
            rotateQuaternion.setFromAxisAngle(
            // y축에 대해서 angleCameraDirectionAxisY만큼 회전시킴.
                new THREE.Vector3(0,1,0),
                angleCameraDirectionAxisY + this._directionOffset()
            );

            this._model.quaternion.rotateTowards(rotateQuaternion, THREE.MathUtils.degToRad(5));
                // rotateTowards는 호출될 때마다 캐릭터를 5도만큼 회전시킴.

            const walkDirection = new THREE.Vector3(); // walkdirection에 카메라가 바라보는 방향을 담는다.
            this._camera.getWorldDirection(walkDirection);

            // walkDirection.y = 0;
            walkDirection.y = this._bOnTheGround ? 0 : -1;
            walkDirection.normalize();

            walkDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this._directionOffset());

            // walk와 run사이의 부자연스러움 보정
            if(this._speed < this._maxSpeed) this._speed += this._acceleraction;
            else this._speed -= this._acceleraction*2;

            if(!this._bOnTheGround) {
                this._fallingAcceleration += 1;
                this._fallingSpeed += Math.pow(this._fallingAcceleration, 2);
            } else {
                this._fallingAcceleration = 0;
                this._fallingSpeed = 0;
            }

            const velocity = new THREE.Vector3(
                walkDirection.x * this._speed,
                walkDirection.y * this._fallingSpeed,
                walkDirection.z * this._speed
            );

            const deltaPosition = velocity.clone().multiplyScalar(deltaTime); // 이동 거리 계산

            // const moveX = walkDirection.x * (this._speed * deltaTime);
            // const moveZ = walkDirection.z * (this._speed * deltaTime);
            // // x방향 z방향으로 캐릭터가 이동
            // this._model.position.x += moveX;
            // this._model.position.z += moveZ;

            // capsule이 먼저 이동한 후 캐릭터가 따라 이동해야 한다.
            this._model._capsule.translate(deltaPosition);

            // 충돌 감지
            const result = this._worldOctree.capsuleIntersect(this._model._capsule);
            if(result) { // 충돌한 경우
                // result.depth는 캡슐이 장애물과 충돌해 침범(?)한 깊이.
                // result.normal은 장애물의 면과 맞닿은 캡슐의 방향으로 뻗은 단위벡터
                // 즉, 충돌 시 캡슐을 단위벡터와 깊이의 곱만큼 다시 이동시킴.
                this._model._capsule.translate(result.normal.multiplyScalar(result.depth)); 
                this._bOnTheGround = true;
            } else { // 충돌하지 않은 경우
                this._bOnTheGround = false;
            }

            const previousPosition = this._model.position.clone();
            const capsuleHeight = this._model._capsule.end.y - this._model._capsule.start.y
                + this._model._capsule.radius*2;
            this._model.position.set(
                this._model._capsule.start.x,
                this._model._capsule.start.y - this._model._capsule.radius + (capsuleHeight-this._model._capsule.radius)/2,
                this._model._capsule.start.z
            );

            // this._camera.position.x += moveX;
            // this._camera.position.z += moveZ;
            this._camera.position.x -= previousPosition.x - this._model.position.x;
            this._camera.position.z -= previousPosition.z - this._model.position.z;

            // 카메라가 캐릭터의 이동 방향을 추적
            this._controls.target.set(
                this._model.position.x,
                this._model.position.y,
                this._model.position.z,
            );

        }
        this._previousTime = time;
    }
}



window.onload = function() {
    new App;
}