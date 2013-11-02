
var container, stats;
var camera, scene, renderer;
var clock = new THREE.Clock();
var composer;
var controls;

var INTERSECTED;
var projector;
var raycaster;
var mouse = new THREE.Vector3();

var objects = [];

var ray;

var cubes = [];
var tweens = [];
//var timeline = new TimelineLite({ onComplete:function() { console.log('done'); } });


init();
animate();

function init() {
  container = document.createElement( 'div' );
  document.body.appendChild( container );

  // camera
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

  /*
  controls = new THREE.FlyControls( camera );

  controls.movementSpeed = 2;
  controls.domElement = container;
  controls.rollSpeed = Math.PI / 6;
  controls.autoForward = false;
  controls.dragToLook = false
  */


  ray = new THREE.Raycaster();
  ray.ray.direction.set( 0, -1, 0 );


  // scene
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog( 0x000000, 1, 500 );
  //scene.fog.color.setHSL( 0.51, 0.4, 0.01 );
  scene.fog.color.setRGB( 1.0, 1.0, 1.0 );

  controls = new THREE.PointerLockControls( camera );
  scene.add( controls.getObject() );

  lockPointer(controls);

  projector = new THREE.Projector();
  raycaster = new THREE.Raycaster();

  // world
  // floor

  var planeMesh = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
  planeMesh.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
  var planeMaterial = new THREE.MeshBasicMaterial( { ambient: 0xdddddd, color: 0xdddddd, specular: 0xdddddd, shininess: 50 } );
  mesh = new THREE.Mesh(planeMesh, planeMaterial);
  scene.add( mesh );

  // cubes
  var s = 20;
  var cube = new THREE.CubeGeometry( s, s, s );
  // var material = new THREE.MeshPhongMaterial( { ambient: 0x333333, color: 0xffffff, specular: 0xffffff, shininess: 50 } );
  var material = new THREE.MeshPhongMaterial( { ambient: 0xffffff, color: 0xffffff, specular: 0xffffff, shininess: 50 } );

  for (var i = 0; i < 300; i ++ ) {
      var cubeMaterial = material.clone(); // HACK to be able to highlight a single cube
      var mesh = new THREE.Mesh( cube, cubeMaterial );
      mesh.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
      mesh.position.y = Math.floor( Math.random() * 20 ) * 20 + 10;
      mesh.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;
      /*
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.rotation.z = Math.random() * Math.PI;
      */
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();

      scene.add(mesh);
      cubes.push(mesh);

      var outlineMaterial2 = new THREE.MeshBasicMaterial( { color: 0x000000, side: THREE.BackSide } );
      var outlineMesh2 = new THREE.Mesh( cube, outlineMaterial2 );
      outlineMesh2.scale.multiplyScalar(1.05);

      mesh.add(outlineMesh2);

      /*
      tweens.push(TweenLite.from(mesh.position, 10, { 
        y: 100,
        ease: Elastic.easeOut
      }));
*/
  }

  // lights
  var ambient = new THREE.AmbientLight( 0xffffff );
  ambient.color.setHSL( 0.1, 0.3, 0.2 );
  scene.add( ambient );

  var dirLight = new THREE.DirectionalLight( 0xffffff, 0.125 );
  dirLight.position.set( 0, -1, 0 ).normalize();
  scene.add( dirLight );

  dirLight.color.setHSL( 0.1, 0.7, 0.5 );

  // lens flares
  var textureFlare0 = THREE.ImageUtils.loadTexture( "textures/lensflare/lensflare0.png" );
  var textureFlare2 = THREE.ImageUtils.loadTexture( "textures/lensflare/lensflare2.png" );
  var textureFlare3 = THREE.ImageUtils.loadTexture( "textures/lensflare/lensflare3.png" );

  // addLight( 0.55, 0.9, 0.5, 100, 0, 100 );
  // addLight( 0.08, 0.8, 0.5,    0, 0, 100 );
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

  // renderer
  renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( scene.fog.color, 1 );

  container.appendChild( renderer.domElement );

  //

  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.physicallyBasedShading = true;

  // stats
  stats = new Stats();
  container.appendChild( stats.domElement );


  var lineGeometry = new THREE.Geometry();
  var vertArray = lineGeometry.vertices;
  vertArray.push(new THREE.Vector3(0,10,0), new THREE.Vector3(100,10,0));
  lineGeometry.computeLineDistances();
  var lineMaterial = new THREE.LineBasicMaterial( { color: 0xcc0000 } );
  var line = new THREE.Line( lineGeometry, lineMaterial );
  scene.add(line);

  var lineGeometry = new THREE.Geometry();
  var vertArray = lineGeometry.vertices;
  vertArray.push(new THREE.Vector3(0,10,0), new THREE.Vector3(0,110,0));
  lineGeometry.computeLineDistances();
  var lineMaterial = new THREE.LineBasicMaterial( { color: 0x00cc00 } );
  var line = new THREE.Line( lineGeometry, lineMaterial );
  scene.add(line);

  var lineGeometry = new THREE.Geometry();
  var vertArray = lineGeometry.vertices;
  vertArray.push(new THREE.Vector3(0,10,0), new THREE.Vector3(0,10,100));
  lineGeometry.computeLineDistances();
  var lineMaterial = new THREE.LineBasicMaterial( { color: 0x0000cc } );
  var line = new THREE.Line( lineGeometry, lineMaterial );
  scene.add(line);


  // events
  window.addEventListener( 'resize', onWindowResize, false );
  window.addEventListener( 'mousemove', onDocumentMouseMove, false );
  window.addEventListener('click', onDocumentClick, false);

  //TweenLite.ticker.addEventListener("tick", animate);
  //timeline.insertMultiple(tweens, 0, 'start', 0.01);
}

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

function onWindowResize( event ) {
  renderer.setSize( window.innerWidth, window.innerHeight );

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function onDocumentMouseMove( event ) {
  event.preventDefault();

  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  mouse.z = 1.0;
}

function onDocumentClick(event) {
  var vector = new THREE.Vector3( mouse.x, mouse.y, mouse.z );
  projector.unprojectVector(vector, camera);

  var lineGeometry = new THREE.Geometry();
  var vertArray = lineGeometry.vertices;
  vertArray.push(controls.getObject().position, vector.sub(controls.getObject().position));
  lineGeometry.computeLineDistances();
  var lineMaterial = new THREE.LineBasicMaterial( { color: 0xcc0000 } );
  var line = new THREE.Line( lineGeometry, lineMaterial );
  scene.add(line);
}

function animate() {
  requestAnimationFrame( animate );

  render();
  stats.update();
}

function render() {
  var delta = clock.getDelta();

  //controls.update( delta );

  /*
  cubes.forEach(function(cube) {
    cube.updateMatrix();
  });
  */

  controls.isOnObject( false );

  ray.ray.origin.copy( controls.getObject().position );
  ray.ray.origin.y -= 10;

  var intersections = ray.intersectObjects( cubes );
  if ( intersections.length > 0 ) {
    var distance = intersections[ 0 ].distance;
    if ( distance > 0 && distance < 10 ) {
      controls.isOnObject( true );
    }
  }

  controls.update(clock.getElapsedTime());

  // === FIND INTERSECTIONS ===

  /*
  var pLocal = new THREE.Vector3( 0, 0, -1 );
  var pWorld = pLocal.applyMatrix4( camera.matrixWorld );
  var dir = pWorld.sub( camera.position ).normalize();
  */

  // find intersections
  var vector = new THREE.Vector3( mouse.x, mouse.y, mouse.z );
  projector.unprojectVector( vector, camera );

  raycaster.set( controls.getObject().position, vector.sub(controls.getObject().position).normalize() );

  var intersects = raycaster.intersectObjects(cubes);

  if ( intersects.length > 0 ) {
    if (INTERSECTED != intersects[0].object) {
      if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
      INTERSECTED = intersects[0].object;
      INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
      INTERSECTED.material.emissive.setHex( 0xff0000);
    }
  } else {
    if (INTERSECTED ) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex );
    INTERSECTED = null;
  }

  // === FIND INTERSECTIONS ===

  renderer.render( scene, camera );
}
