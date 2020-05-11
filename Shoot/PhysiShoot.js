function moveLaser (mouseCoords){
    avatarHead.set(avatar.position.x, avatar.position.y + 5, avatar.position.z);

    rayx = mouseCoords.x*100;
    rayy = mouseCoords.y*100;


    rayDirection.set(rayx,rayy, -100).normalize();

    let direction = new THREE.Vector3().subVectors(rayDirection, avatarHead);

    laser.position.copy(avatarHead);
    laser.setDirection(rayDirection);
    laser.setLength(direction.length()+10, 0, 0);
}

function onMouseMove(event){
    mouseCoords.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );


}

function onMouseDown(event) {

    let sound = document.getElementById("raygun");
    //sound.play();

    mouseCoords.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    let ballRadius = 3;

    let ball = new Physijs.SphereMesh(
        new THREE.SphereGeometry(ballRadius, 50, 50),
        new THREE.MeshStandardMaterial({
            map: new THREE.TextureLoader().load('../Resources/Textures/Dino/trippy2.jpeg'),
        }),
        1
    )

    scene.add(ball);

    avatarHead.set(avatar.position.x, avatar.position.y + 5, avatar.position.z);

    rayx = mouseCoords.x*100;
    rayy = mouseCoords.y*100;

    rayDirection.set(rayx,rayy, -100);

    raycaster.set(avatarHead, rayDirection);

    ball.castShadow = true;
    ball.receiveShadow = true;

    ball.position.copy(raycaster.ray.origin);
    ball.position.add(raycaster.ray.direction);

    pos.copy( raycaster.ray.direction );
    ball.setLinearVelocity(pos);


    ball.__dirtyPosition = true;
}


