//variable declaration section
let physicsWorld, scene, camera, renderer, rigidBodies = [], tmpTrans = null

let ballObject = null, moveDirection = { left: 0, right: 0, forward: 0, back: 0 }

let windMeter

let kObject = null,
    kMoveDirection = { left: 0, right: 0, forward: 0, back: 0 },
    tmpPos = new THREE.Vector3(), tmpQuat = new THREE.Quaternion();

let ammoTmpPos = null, ammoTmpQuat = null;
let mouseCoords = new THREE.Vector2(), raycaster = new THREE.Raycaster();

let xDir, xStrength;

const STATE = { DISABLE_DEACTIVATION : 4 }

const FLAGS = { CF_KINEMATIC_OBJECT: 2 }
//Ammojs Initialization

Ammo().then(start)
function start (){

    tmpTrans = new Ammo.btTransform();
    ammoTmpPos = new Ammo.btVector3();
    ammoTmpQuat = new Ammo.btQuaternion();

    setupPhysicsWorld();

    setupGraphics();

    createBlock();
    createBall();
    //createKinematicBox();

    setupEventHandlers();
    renderFrame();
}

function setupPhysicsWorld(){

    let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache    = new Ammo.btDbvtBroadphase(),
        solver                  = new Ammo.btSequentialImpulseConstraintSolver();

    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);

    let xGrav = Math.random()*40 - 20;
    physicsWorld.setGravity(new Ammo.btVector3(xGrav, -10, 0));

    if(xGrav>0){
        xDir = "right";
    }else if(xGrav<0){
        xDir = "left";
    }

    if(Math.abs(xGrav) >= 14){
        xStrength = "strong";
    }else if(Math.abs(xGrav) <= 6){
        xStrength = "weak";
    }else if(Math.abs(xGrav) > 6 && Math.abs(xGrav) < 14){
        xStrength = "average";
    }
    console.log(xGrav, xDir, xStrength);
}

function setupGraphics(){

    //create clock for timing
    clock = new THREE.Clock();

    //create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xbfd1e5 );

    //create camera
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 5000 );
    camera.position.set( 0, 30, 70 );
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    //Add hemisphere light
    let hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.1 );
    hemiLight.color.setHSL( 0.6, 0.6, 0.6 );
    hemiLight.groundColor.setHSL( 0.1, 1, 0.4 );
    hemiLight.position.set( 0, 50, 0 );
    scene.add( hemiLight );

    //Add directional light
    let dirLight = new THREE.DirectionalLight( 0xffffff , 1);
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( -1, 1.75, 1 );
    dirLight.position.multiplyScalar( 100 );
    scene.add( dirLight );

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    let d = 50;

    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;

    dirLight.shadow.camera.far = 13500;

    //Setup the renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setClearColor( 0xbfd1e5 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.shadowMap.enabled = true;

}


function renderFrame(){

    let deltaTime = clock.getDelta();

    moveBall();
    updatePhysics( deltaTime );

    renderer.render( scene, camera );

    requestAnimationFrame( renderFrame );

}


function setupEventHandlers(){

    window.addEventListener( 'keydown', handleKeyDown, false);
    window.addEventListener( 'keyup', handleKeyUp, false);
    window.addEventListener('mousedown', onMouseDown, false);

}


function handleKeyDown(event){

    let keyCode = event.keyCode;

    switch(keyCode){
        //Ball
        case 87: //W: FORWARD
            moveDirection.forward = 1
            break;

        case 83: //S: BACK
            moveDirection.back = 1
            break;

        case 65: //A: LEFT
            moveDirection.left = 1
            break;

        case 68: //D: RIGHT
            moveDirection.right = 1
            break;

    }
}


function handleKeyUp(event){
    let keyCode = event.keyCode;

    switch(keyCode){
        //Ball
        case 87: //FORWARD
            moveDirection.forward = 0
            break;

        case 83: //BACK
            moveDirection.back = 0
            break;

        case 65: //LEFT
            moveDirection.left = 0
            break;

        case 68: //RIGHT
            moveDirection.right = 0
            break;

    }

}

function onMouseDown(event){
    mouseCoords.set(
        (event.clientX/window.innerWidth)*2 -1,
        -(event.clientY/window.innerHeight)*2 +1
    );

    raycaster.setFromCamera(mouseCoords, camera);

    //Create ball and shoot it
    tmpPos.copy(raycaster.ray.direction);
    tmpPos.add(raycaster.ray.origin);

    let pos = {x: tmpPos.x, y: tmpPos.y, z: tmpPos.z};
    let radius = 1.5;
    let quat = {x: 0, y:0, z:0 , w: 1};
    let mass = 1;

    //threeJS section
    let ball = new THREE.Mesh(
        new THREE.SphereBufferGeometry(radius),
        new THREE.MeshStandardMaterial({
            map: new THREE.TextureLoader().load('resources/trippy3.jpg'),
        })
    )

    ball.position.set(pos.x, pos.y, pos.z);

    ball.castShadow = true;
    ball.receiveShadow = true;

    scene.add(ball);

    //ammoJS section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btSphereShape(radius);
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0,0,0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);

    physicsWorld.addRigidBody(body);

    tmpPos.copy(raycaster.ray.direction);
    tmpPos.multiplyScalar(100);

    body.setLinearVelocity(new Ammo.btVector3(tmpPos.x, tmpPos.y, tmpPos.z));

    ball.userData.physicsBody = body;
    rigidBodies.push(ball);

}

function createBlock(){

    let pos = {x: 0, y: 0, z: 0};
    let scale = {x: 100, y: 2, z: 100};
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 0;

    //threeJS Section
    let blockPlane = new THREE.Mesh(
        new THREE.BoxBufferGeometry(),
        new THREE.MeshStandardMaterial({
            map: new THREE.TextureLoader().load('resources/neontexture1.jpg'),
        })
    );

    blockPlane.position.set(pos.x, pos.y, pos.z);
    blockPlane.scale.set(scale.x, scale.y, scale.z);

    blockPlane.castShadow = true;
    blockPlane.receiveShadow = true;

    scene.add(blockPlane);


    //Ammojs Section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );

    let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
    colShape.setMargin( 0.05 );

    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );

    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let body = new Ammo.btRigidBody( rbInfo );

    body.setFriction(4);
    body.setRollingFriction(10);

    physicsWorld.addRigidBody( body );
}


function createBall(){

    let pos = {x: 0, y: 4, z: 0};
    let radius = 2;
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 1;

    //threeJS Section
    let ball = ballObject = new THREE.Mesh(new THREE.SphereBufferGeometry(radius), new THREE.MeshPhongMaterial({color: 0xff0505}));

    ball.position.set(pos.x, pos.y, pos.z);

    ball.castShadow = true;
    ball.receiveShadow = true;

    scene.add(ball);


    //Ammojs Section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );

    let colShape = new Ammo.btSphereShape( radius );
    colShape.setMargin( 0.05 );

    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );

    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let body = new Ammo.btRigidBody( rbInfo );

    body.setFriction(4);
    body.setRollingFriction(10);

    physicsWorld.addRigidBody( body );

    ball.userData.physicsBody = body;
    rigidBodies.push(ball);
}

//Change to rods which the ducks will sit on
// function createKinematicBox(){
//
//     let pos = {x: 40, y: 6, z: 5};
//     let scale = {x: 10, y: 10, z: 10};
//     let quat = {x: 0, y: 0, z: 0, w: 1};
//     let mass = 0;
//
//     //threeJS Section
//     kObject = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: 0x30ab78}));
//
//     kObject.position.set(pos.x, pos.y, pos.z);
//     kObject.scale.set(scale.x, scale.y, scale.z);
//
//     kObject.castShadow = true;
//     kObject.receiveShadow = true;
//
//     scene.add(kObject);
//
//
//     //Ammojs Section
//     let transform = new Ammo.btTransform();
//     transform.setIdentity();
//     transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
//     transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
//     let motionState = new Ammo.btDefaultMotionState( transform );
//
//     let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
//     colShape.setMargin( 0.05 );
//
//     let localInertia = new Ammo.btVector3( 0, 0, 0 );
//     colShape.calculateLocalInertia( mass, localInertia );
//
//     let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
//     let body = new Ammo.btRigidBody( rbInfo );
//
//     body.setFriction(4);
//     body.setRollingFriction(10);
//
//     body.setActivationState( STATE.DISABLE_DEACTIVATION );
//     body.setCollisionFlags( FLAGS.CF_KINEMATIC_OBJECT );
//
//
//     physicsWorld.addRigidBody( body );
//     kObject.userData.physicsBody = body;
//
// }

function moveBall(){

    let scalingFactor = 20;

    let moveX =  moveDirection.right - moveDirection.left;
    let moveZ =  moveDirection.back - moveDirection.forward;
    let moveY =  0;

    if( moveX == 0 && moveY == 0 && moveZ == 0) return;

    let resultantImpulse = new Ammo.btVector3( moveX, moveY, moveZ )
    resultantImpulse.op_mul(scalingFactor);

    let physicsBody = ballObject.userData.physicsBody;
    physicsBody.setLinearVelocity( resultantImpulse );

}

function updatePhysics( deltaTime ){

    // Step world
    physicsWorld.stepSimulation( deltaTime, 10 );

    // Update rigid bodies
    for ( let i = 0; i < rigidBodies.length; i++ ) {
        let objThree = rigidBodies[ i ];
        let objAmmo = objThree.userData.physicsBody;
        let ms = objAmmo.getMotionState();
        if ( ms ) {

            ms.getWorldTransform( tmpTrans );
            let p = tmpTrans.getOrigin();
            let q = tmpTrans.getRotation();
            objThree.position.set( p.x(), p.y(), p.z() );
            objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

        }
    }

}


