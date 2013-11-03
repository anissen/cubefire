
var container, stats;
var camera, scene, renderer;
var clock = new THREE.Clock();
var controls;

var projector;
var raycaster;

var ray;

var crossairSprite;

var map = {};
var cubes = [];
var tweens = [];
//var timeline = new TimelineLite({ onComplete:function() { console.log('done'); } });

var splatTexture = THREE.ImageUtils.loadTexture( 'textures/splat/splat1.png' );

init();
animate();

function init() {
  container = document.createElement( 'div' );
  container.className = 'blurred';
  document.body.appendChild( container );

  // camera
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

  ray = new THREE.Raycaster();
  ray.ray.direction.set( 0, -1, 0 );

  // scene
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog( 0x000000, 0, 300 );
  //scene.fog.color.setHSL( 0.51, 0.4, 0.01 );
  scene.fog.color.setRGB( 1.0, 1.0, 1.0 );

  controls = new THREE.PointerLockControls( camera );
  scene.add( controls.getObject() );

  lockPointer(controls, clock);

  projector = new THREE.Projector();
  raycaster = new THREE.Raycaster();

  // world
  setupFloor();
  setupCubes();
  setupLights();

  // renderer
  renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( scene.fog.color, 1 );
  renderer.shadowMapEnabled = true;
  renderer.shadowMapSoft = true;

  container.appendChild(renderer.domElement);

  //
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.physicallyBasedShading = true;

  // stats
  stats = new Stats();
  container.appendChild(stats.domElement);

  setupCrossair();

  // events
  window.addEventListener( 'resize', onWindowResize, false );
  window.addEventListener('click', onDocumentClick, false);

  //TweenLite.ticker.addEventListener("tick", animate);
  //timeline.insertMultiple(tweens, 0, 'start', 0.01);
}

function setupFloor() {
  var planeMesh = new THREE.PlaneGeometry( 200, 200, 10, 10 );
  planeMesh.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
  var planeMaterial = new THREE.MeshBasicMaterial();
  mesh = new THREE.Mesh(planeMesh, planeMaterial);
  mesh.receiveShadow = true;
  scene.add( mesh );
}

function setupCubes() {
  var cubeSize = 15; // 7
  var cube = new THREE.CubeGeometry( cubeSize, cubeSize, cubeSize );
  var material = new THREE.MeshPhongMaterial({ color: 0xffffff });

  var mapXSize = 30;
  var mapZSize = 30;
  for (var j = 0; j < 100; j++) {
    var randx = Math.floor( Math.random() * mapXSize - mapXSize / 2 );
    var randz = Math.floor( Math.random() * mapZSize - mapZSize / 2 );
    map[randx+':'+randz] = Math.floor(Math.random() * 5);
  }
  for (var i = 0; i < 300; i ++ ) {
    var cubeMaterial = material.clone(); // HACK to be able to highlight a single cube
    var mesh = new THREE.Mesh( cube, cubeMaterial );
    var randX = Math.floor( Math.random() * mapXSize - mapXSize / 2 );
    var randZ = Math.floor( Math.random() * mapZSize - mapZSize / 2 );
    mesh.position.x = randX * cubeSize;
    //mesh.position.y = Math.floor( Math.random() * 20 ) * 20 + 10;
    mesh.position.z = randZ * cubeSize;
    var height = map[randX+':'+randZ] || 0;
    map[randX+':'+randZ] = height + 1;
    mesh.position.y = height * cubeSize + cubeSize / 2;
    mesh.scale.multiplyScalar(0.99);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    cubes.push(mesh);

    var outlineMaterial2 = new THREE.MeshBasicMaterial( { color: 0x888888, side: THREE.BackSide } );
    var outlineMesh2 = new THREE.Mesh( cube, outlineMaterial2 );
    outlineMesh2.scale.multiplyScalar(1.02);

    mesh.add(outlineMesh2);

    scene.add(mesh);

    /*
    tweens.push(TweenLite.from(mesh.position, 10, { 
      y: 100,
      ease: Elastic.easeOut
    }));
    */
  }
}

function setupLights() {
  var ambient = new THREE.AmbientLight( 0xeeeeee );
  scene.add( ambient );

  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.position.set( -10, 100, 10 );
  directionalLight.castShadow = true;

  directionalLight.shadowCameraNear = 1;
  directionalLight.shadowCameraFar = 200;//camera.far;
  directionalLight.shadowCameraFov = 40;

  directionalLight.shadowMapBias = 0.1;
  directionalLight.shadowMapDarkness = 0.2;
  directionalLight.shadowMapWidth = 2*512;
  directionalLight.shadowMapHeight = 2*512;

  directionalLight.shadowCameraVisible = false;
  scene.add( directionalLight );


  /*
  // lens flares
  var textureFlare0 = THREE.ImageUtils.loadTexture( "textures/lensflare/lensflare0.png" );
  var textureFlare2 = THREE.ImageUtils.loadTexture( "textures/lensflare/lensflare2.png" );
  var textureFlare3 = THREE.ImageUtils.loadTexture( "textures/lensflare/lensflare3.png" );

  addLight( 0.55, 0.9, 0.5, 100, 0, 100 );
  addLight( 0.08, 0.8, 0.5,    0, 0, 100 );
  addLight( 0.995, 0.5, 0.9, 100, 100, 100 );

  function addLight( h, s, l, x, y, z ) {
    var light = new THREE.PointLight( 0xffffff, 1.5, 450 );
    light.color.setHSL( h, s, l );
    light.position.set( x, y, z );
    scene.add( light );

    var flareColor = new THREE.Color( 0xffffff );
    flareColor.setHSL( h, s, l + 0.5 );

    var lensFlare = new THREE.LensFlare( textureFlare0, 70, 0.0, THREE.AdditiveBlending, flareColor );

    lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
    lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
    lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );

    lensFlare.add( textureFlare3, 60, 0.6, THREE.AdditiveBlending );
    lensFlare.add( textureFlare3, 70, 0.7, THREE.AdditiveBlending );
    lensFlare.add( textureFlare3, 120, 0.9, THREE.AdditiveBlending );
    lensFlare.add( textureFlare3, 70, 1.0, THREE.AdditiveBlending );

    lensFlare.customUpdateCallback = lensFlareUpdateCallback;
    lensFlare.position = light.position;

    scene.add( lensFlare );
  }
  */
}

function setupCrossair() {
  var crossairTexture = THREE.ImageUtils.loadTexture( 'textures/disc.png' );
  
  // suggested- alignment: THREE.SpriteAlignment.center  for targeting-style icon
  //        alignment: THREE.SpriteAlignment.topLeft for cursor-pointer style icon
  var crossairMaterial = new THREE.SpriteMaterial( { map: crossairTexture, useScreenCoordinates: true, alignment: THREE.SpriteAlignment.center } );
  crossairSprite = new THREE.Sprite( crossairMaterial );
  crossairSprite.scale.set( 16, 16, 1 );
  crossairSprite.position.set(window.innerWidth / 2, window.innerHeight / 2, 0);
  scene.add(crossairSprite);
}

/*
function lensFlareUpdateCallback( object ) {
  var f, fl = object.lensFlares.length;
  var flare;
  var vecX = -object.positionScreen.x * 2;
  var vecY = -object.positionScreen.y * 2;

  for( f = 0; f < fl; f++ ) {
       flare = object.lensFlares[ f ];

       flare.x = object.positionScreen.x + vecX * flare.distance;
       flare.y = object.positionScreen.y + vecY * flare.distance;

       flare.rotation = 0;
  }

  object.lensFlares[ 2 ].y += 0.025;
  object.lensFlares[ 3 ].rotation = object.positionScreen.x * 0.5 + THREE.Math.degToRad( 45 );
}
*/

function onWindowResize( event ) {
  renderer.setSize( window.innerWidth, window.innerHeight );
  crossairSprite.position.set(window.innerWidth / 2, window.innerHeight / 2, 0);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function onDocumentClick(event) {
  if (!controls.enabled) return;

  shoot();
}

function shoot() {
  var cameraPos = controls.getObject().position.clone();
  cameraPos.y -= 0.5;
  var cameraDir = controls.getDirection();

  // find intersections
  var target = getShotObject(cameraPos, cameraDir);

  var targetPos = (target ? target.point : cameraPos.clone().add(cameraDir.multiplyScalar(1000)));
  var trailColor = (target ? 0x990000 : 0xaaaaff);
  addBulletTrail(cameraPos, targetPos, trailColor);

  if (target) {
    //target.object.material.ambient.setHex(0xff0000);
    addSplat(target);
    console.log(target);
  }
}

function addSplat(target) {
  var geo1 = new THREE.PlaneGeometry( 10, 10 );

  var material = new THREE.MeshBasicMaterial( { map: splatTexture, color: 0x00ff00 } );
  material.transparent = true;
  
  // material.blending = THREE.AdditiveBlending;
  // material.blendSrc = THREE.DstAlphaBlending;
  // material.blendDst = THREE.SrcColorBlending;
  // material.blendEquation = THREE.AddEquation;

  var mesh = new THREE.Mesh(geo1, material);
  mesh.position = target.point.clone().add(target.face.normal.clone().multiplyScalar(0.5 * Math.random()));
  mesh.lookAt(target.point.clone().add(target.face.normal.clone().multiplyScalar(10)));
  scene.add(mesh);
}

function getShotObject(pos, dir) {
  raycaster.set(pos, dir);

  var intersects = raycaster.intersectObjects(cubes);
  return intersects[0];
}

function addBulletTrail(startPos, endPos, color) {
  var lineGeometry = new THREE.Geometry();
  var vertArray = lineGeometry.vertices;
  vertArray.push(startPos, endPos);
  lineGeometry.computeLineDistances();
  var lineMaterial = new THREE.LineBasicMaterial( { color: color, linewidth: 5, fog: true } );
  // var lineMaterial2 = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 7, fog: true } );
  var line = new THREE.Line( lineGeometry, lineMaterial );
  // var line2 = new THREE.Line( lineGeometry, lineMaterial2 );
  scene.add(line);
  // scene.add(line2);
}

function updateControls() {
  controls.isOnObject(false);

  ray.ray.origin.copy( controls.getObject().position );
  ray.ray.origin.y -= 10;

  var intersections = ray.intersectObjects(cubes);
  if (intersections.length > 0) {
    var distance = intersections[0].distance;
    if (distance > 0 && distance < 10) {
      controls.isOnObject(true);
    }
  }

  controls.update(clock.getElapsedTime());
}

function animate() {
  requestAnimationFrame( animate );

  updateControls();
  render();
  stats.update();
}

function render() {
  renderer.render( scene, camera );
}
