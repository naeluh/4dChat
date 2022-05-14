
  var userName = null;
  var userRoom = null;
  var socket = io.connect('http://yourimage.io:6969');

  $('#uploadForm').submit(function () {
      $(this).ajaxSubmit({
          error: function (xhr) {
              status('Error: ' + xhr.status);
          },
          success: function (response) {
              addDae('./files/' + response);
              socket.emit('updateFile', response, userRoom);
          }
      });
      return false;
  });

  socket.on('connect', function () {
      userName = prompt("What's your name?");
      userRoom = prompt("What is the name of your room?");
      socket.emit('adduser', userName);
      socket.emit('addroom', userRoom);
  });

  socket.on('updatechat', function (username, data) {
      $('#conversation').append('<b>' + username + ':</b> ' + data + '<br>');
      var objDiv = document.getElementById("convoBox");
      objDiv.scrollTop = objDiv.scrollHeight;
  });

  socket.on('updaterooms', function (rooms, current_room) {
      $('#rooms').empty();
      $.each(rooms, function (key, value) {
          if (value == current_room) {
              $('#rooms').append('<div>' + value + '</div>');
          } else {
              //$('#rooms').append('<div><a href="http://'+window.location.host+'/'+value+'>' + value + '</a></div>');
              $('#rooms').append('<div><a href="http://' + window.location.host + '/' + value + '" onclick="switchRoom(\'' + value + '\')">' + value + '</a></div>');
          }
      });
  });

  function switchRoom(room) {
      socket.emit('switchRoom', room);
  }

  $(function () {
      $('#addroom').on('click', function (e) {
          socket.emit('switchRoom', prompt("What is the name of your room?"));
      });
      $('#datasend').on('click', function () {
          var message = $('#data').val();
          $('#data').val('');
          socket.emit('sendchat', message);
      });
      $('#data').on('keypress', function (e) {
          if (e.which == 13) {
              $(this).blur();
              $('#datasend').focus().click();
          }
      });
  });

  socket.on('addFile', function (userSent, roomName, newFile) {
      addDae('./files/' + newFile);
  });

  if (!Detector.webgl) Detector.addGetWebGLMessage();
  var keyboard = new KeyboardState();
  var container, stats;
  var camera, scene, renderer, controls, objects;
  var particleLight, pointLight, hemiLight, directionalLight;
  var envCube;
  var dae, skin;
  var emitting = false;
  var mouse = new THREE.Vector2();
  var offset = new THREE.Vector3(10, 10, 10);

  var setMaterial = function (node, material) {
      node.material = material;
      if (node.children) {
          for (var i = 0; i < node.children.length; i++) {
              setMaterial(node.children[i], material);
          }
      }
  };

  var envPath = "./enviro/";
  var envFormat = '.png';
  var envUrls = [
  envPath + 'px' + envFormat, envPath + 'nx' + envFormat,
  envPath + 'py' + envFormat, envPath + 'ny' + envFormat,
  envPath + 'pz' + envFormat, envPath + 'nz' + envFormat];

  var textureCube = THREE.ImageUtils.loadTextureCube(envUrls);

  function addDae(path) {
      var loader = new THREE.ColladaLoader();
      loader.options.convertUpAxis = true;
      loader.load(path, function (collada) {
          dae = collada.scene;
          skin = collada.skins[0];
          dae.scale.x = dae.scale.y = dae.scale.z = 2;
          dae.updateMatrix();
          setMaterial(dae, new THREE.MeshPhongMaterial({
              ambient: 0x7d7da7,
              color: 0xff0000,
              metal: false,
              specular: 0xefefef,
              shininess: 100,
              reflectivity: 0.5,
              envMap: textureCube,
              combine: THREE.MultiplyOperation,
              side: THREE.DoubleSide
          }));
          scene.add(dae);
          setTimeout(function () {
              render();
          }, 10);
      });
  }

  var init = function () {
      container = document.createElement('div');
      document.body.appendChild(container);
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 50);
      camera.position.x = 5;
      camera.position.y = 5;
      camera.position.z = 5;
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x6a6a8d, 0.04);
      var size = 50,
          step = 1;
      var geometry = new THREE.Geometry();
      var gridMat = new THREE.LineBasicMaterial({
          color: 0xb1b1e5
      });
      for (var i = -size; i <= size; i += step) {
          geometry.vertices.push(new THREE.Vector3(-size, -0.04, i));
          geometry.vertices.push(new THREE.Vector3(size, -0.04, i));
          geometry.vertices.push(new THREE.Vector3(i, -0.04, -size));
          geometry.vertices.push(new THREE.Vector3(i, -0.04, size));
      }
      var line = new THREE.Line(geometry, gridMat, THREE.LinePieces);
      scene.add(line);
      //var size = 50,
      step = 0.1;
      var geometry2 = new THREE.Geometry();
      var grid2Mat = new THREE.LineBasicMaterial({
          color: 0x7d7da7
      });
      for (var i = -size; i <= size; i += step) {
          geometry2.vertices.push(new THREE.Vector3(-size, -0.04, i));
          geometry2.vertices.push(new THREE.Vector3(size, -0.04, i));
          geometry2.vertices.push(new THREE.Vector3(i, -0.04, -size));
          geometry2.vertices.push(new THREE.Vector3(i, -0.04, size));
      }
      var line2 = new THREE.Line(geometry2, grid2Mat, THREE.LinePieces);
      scene.add(line2);
      //  Skybox Map add//
      var shader = THREE.ShaderLib.cube;
      shader.uniforms.tCube.value = textureCube;
      var envMat = new THREE.ShaderMaterial({
          fragmentShader: shader.fragmentShader,
          vertexShader: shader.vertexShader,
          uniforms: shader.uniforms,
          side: THREE.BackSide
      });
      light1 = new THREE.PointLight({
          color: 0xffffff
      });
      scene.add(light1);
      light2 = new THREE.PointLight({
          color: 0xffffff
      });
      scene.add(light2);
      hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
      hemiLight.color.setHSL(0.6, 1, 0.6);
      hemiLight.groundColor.setHSL(0.095, 1, 0.75);
      hemiLight.position.set(0, 1, 0);
      scene.add(hemiLight);
      renderer = new THREE.WebGLRenderer({
          antialias: true
      });
      renderer.setClearColor(0x6a6a8d, 1);
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);
      stats = new Stats();
      stats.domElement.style.position = 'absolute';
      stats.domElement.style.top = '0px';
      container.appendChild(stats.domElement);
      controls = new THREE.TrackballControls(camera, renderer.domElement);
      controls.rotateSpeed = 1.0;
      controls.zoomSpeed = 1.2;
      controls.panSpeed = 0.8;
      controls.noZoom = false;
      controls.noPan = false;
      controls.staticMoving = true;
      controls.dynamicDampingFactor = 1;
      controls.noRoll = true;
      controls.addEventListener('change', function () {
          if (emitting) {
            emitPos(userName, camera.position.x, camera.position.y, camera.position.z, camera.rotation.x, camera.rotation.y, camera.rotation.z, camera.quaternion.w, camera.quaternion.x, camera.quaternion.y, camera.quaternion.z);
              console.log(camera);
          }
      });
  };

  var onWindowResize = function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
  };

  var animate = function () {
      requestAnimationFrame(animate);
      render();
      update();
  };

  var update = function () {
      keyboard.update();
      var moveDistance = 0.25;
      if (keyboard.pressed("W")) camera.translateZ(-moveDistance);
      if (keyboard.pressed("A")) camera.translateX(-moveDistance);
      if (keyboard.pressed("S")) camera.translateZ(moveDistance);
      if (keyboard.pressed("D")) camera.translateX(moveDistance);
      if (keyboard.pressed("1")) camera.position.set(5, 5, 5);
      camera.rotation.set(0, 0, 0);
      if (keyboard.pressed("2")) camera.position.set(5, 5, -5);
      camera.rotation.set(0, 0, 0);
      if (keyboard.pressed("3")) camera.position.set(-5, 5, -5);
      camera.rotation.set(0, 0, 0);
      if (keyboard.pressed("4")) camera.position.set(-5, 5, 5);
      camera.rotation.set(0, 0, 0);
      if (keyboard.pressed("right")) camera.translateX(-1);
      if (keyboard.pressed("X")) controls.reset();
      controls.update();
      stats.update();
  };

  var render = function () {
      var time = Date.now() * 0.0025;
      light1.position.x = Math.sin(time * 0.7) * 2;
      light1.position.z = Math.cos(time * 0.3) * 2;
      light1.position.y = Math.cos(time * 0.3) * 2;
      light2.position.x = Math.sin(time * 0.3) * 1;
      light2.position.z = Math.cos(time * 0.7) * 1;
      light2.position.y = Math.cos(time * 0.7) * 1;
      camera.lookAt(scene.position);
      camera.rotation.z = 0;
      controls.update();
      renderer.render(scene, camera);
  };

  var emitPos = function (u, x, y, z, rx, ry, rz, qw, qx, qy, qz) {
      var sessionId = socket.socket.sessionid;
      var dataControls = {
          u: userName,
          x: x,
          y: y,
          z: z,
          rx: rx,
          ry: ry,
          rz: rz,
          qw: qw,
          qx: qx,
          qy: qy,
          qz: qz
      };
      socket.emit('draw', dataControls);
      socket.emit('session', sessionId);
  };

  socket.on('updateControls', function (user, rm, dataControls) {
      if (user === userName) {
          emitting = true;
      } else {
          if (user === null) {
              emitting = true;
          } else {
              emitting = false;
              camera.position.x = dataControls.x;
              camera.position.y = dataControls.y;
              camera.position.z = dataControls.z;
              camera.rotation.x = dataControls.rx;
              camera.rotation.y = dataControls.ry;
              camera.rotation.z = dataControls.rz;
              camera.quaternion.w = dataControls.qw;
              camera.quaternion.x = dataControls.qx;
              camera.quaternion.y = dataControls.qy;
              camera.quaternion.z = dataControls.qz;
          }
      }
  });

  init();
  animate();
  render();

  document.addEventListener('mouseup', function (e) {emitting = true;}, false);
  document.addEventListener('resize', onWindowResize, false);