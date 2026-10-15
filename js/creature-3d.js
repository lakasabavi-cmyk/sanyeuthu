/* Three.js models for the 15 default creatures. */
var creature3DInstances = new Map();
var creature3DFrame = 0;
var creature3DObserver;
var creature3DVisibilityObserver;
var creature3DReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

var CREATURE_3D_PROFILES = {
  1:  {kind:'bird', wings:1, crest:2, body:[0.48,0.67,0.38], head:[0.39,0.39,0.34]},
  2:  {kind:'tiger', legs:4, ears:2, stripes:5, tail:1, body:[0.66,0.49,0.4], head:[0.43,0.4,0.36]},
  3:  {kind:'dragon', wings:1, horns:2, spines:5, tail:2, body:[0.58,0.65,0.4], head:[0.43,0.4,0.38]},
  4:  {kind:'snake', hood:1, tail:2, body:[0.42,0.64,0.36], head:[0.38,0.34,0.32]},
  5:  {kind:'lizard', legs:4, ears:2, spines:4, tail:1, body:[0.68,0.46,0.4], head:[0.42,0.34,0.35]},
  6:  {kind:'peacock', wings:1, fan:7, crest:3, tail:1, body:[0.45,0.63,0.35], head:[0.35,0.36,0.3]},
  7:  {kind:'turtle', legs:4, shell:1, flippers:1, body:[0.61,0.47,0.43], head:[0.38,0.34,0.34]},
  8:  {kind:'dragon', wings:1, horns:2, fins:1, spines:4, tail:2, body:[0.64,0.59,0.42], head:[0.43,0.37,0.37]},
  9:  {kind:'whale', flippers:2, tail:3, spots:5, body:[0.75,0.59,0.5], head:[0.32,0.3,0.28]},
  10: {kind:'fox', legs:4, ears:2, tail:3, body:[0.61,0.46,0.37], head:[0.4,0.38,0.33]},
  11: {kind:'phoenix', wings:2, crest:3, tail:3, body:[0.49,0.67,0.38], head:[0.37,0.38,0.33]},
  12: {kind:'phoenix', wings:2, crest:5, tail:5, body:[0.53,0.68,0.4], head:[0.4,0.4,0.35]},
  13: {kind:'boar', legs:4, tusks:2, ears:2, tail:1, body:[0.68,0.48,0.43], head:[0.46,0.37,0.4]},
  14: {kind:'armored', legs:4, shell:1, horns:2, spines:5, tail:1, body:[0.65,0.46,0.44], head:[0.42,0.36,0.37]},
  15: {kind:'unicorn', legs:4, horn:1, mane:4, tail:1, body:[0.63,0.53,0.36], head:[0.39,0.42,0.33]}
};

function renderCreature3D(creature, size) {
  var label = String(creature.name || 'Yêu thú').replace(/[&<>"']/g, '');
  return '<div class="creature-3d-stage" data-creature-3d="' + (Number(creature.id) || 0) + '"'
    + ' style="width:' + size + 'px;height:' + size + 'px"'
    + ' role="img" aria-label="' + label + ' mô hình 3D">'
    + '<canvas class="creature-3d-canvas" aria-hidden="true"></canvas>'
    + '<div class="creature-3d-fallback" aria-hidden="true">'
    + chibiSvg(creature, size)
    + '</div></div>';
}

function makeCreatureMaterial(color, roughness, metalness) {
  return new THREE.MeshStandardMaterial({
    color:color,
    roughness:roughness === undefined ? 0.5 : roughness,
    metalness:metalness === undefined ? 0.05 : metalness
  });
}

var creatureTextureCache = {};

// Vẽ texture theo hệ bằng canvas, dùng đúng màu của hệ; cache dùng chung giữa các sinh vật
function getElementTexture(element, baseHex, accentHex) {
  var key = element + baseHex + accentHex;
  if (creatureTextureCache[key]) return creatureTextureCache[key];
  var size = 256;
  var canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  var g = canvas.getContext('2d');
  var i, x, y, r, grad;
  g.fillStyle = baseHex;
  g.fillRect(0, 0, size, size);

  if (element === 'KIM') {
    grad = g.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, 'rgba(255,255,255,0.55)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.12)');
    grad.addColorStop(1, 'rgba(255,255,255,0.4)');
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    g.strokeStyle = accentHex;
    g.lineWidth = 3;
    for (y = 0; y < size; y += 32) {
      for (x = (y / 32) % 2 ? 16 : 0; x < size + 32; x += 32) {
        g.beginPath();
        g.arc(x, y, 16, 0, Math.PI);
        g.stroke();
      }
    }
  } else if (element === 'MOC') {
    g.strokeStyle = accentHex;
    g.lineWidth = 2;
    for (i = 0; i < 14; i++) {
      x = Math.random() * size; y = Math.random() * size;
      g.save();
      g.translate(x, y);
      g.rotate(Math.random() * Math.PI);
      g.fillStyle = 'rgba(255,255,255,0.14)';
      g.beginPath();
      g.ellipse(0, 0, 26, 11, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(-26, 0); g.lineTo(26, 0);
      g.stroke();
      g.restore();
    }
    g.strokeStyle = 'rgba(0,0,0,0.18)';
    for (i = 0; i < size; i += 24) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 8, size); g.stroke();
    }
  } else if (element === 'THUY') {
    g.strokeStyle = accentHex;
    g.lineWidth = 3;
    for (y = 8; y < size; y += 26) {
      g.beginPath();
      for (x = 0; x <= size; x += 8) {
        var wy = y + Math.sin(x / 256 * Math.PI * 4 + y) * 7;
        if (x === 0) g.moveTo(x, wy); else g.lineTo(x, wy);
      }
      g.stroke();
    }
    g.fillStyle = 'rgba(255,255,255,0.35)';
    for (i = 0; i < 16; i++) {
      g.beginPath();
      g.arc(Math.random() * size, Math.random() * size, 2 + Math.random() * 5, 0, Math.PI * 2);
      g.fill();
    }
  } else if (element === 'HOA') {
    grad = g.createLinearGradient(0, size, 0, 0);
    grad.addColorStop(0, 'rgba(120,10,0,0.55)');
    grad.addColorStop(0.55, 'rgba(255,90,0,0.25)');
    grad.addColorStop(1, 'rgba(255,220,60,0.6)');
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    for (i = 0; i < 9; i++) {
      x = (i + 0.5) * size / 9;
      g.fillStyle = i % 2 ? 'rgba(255,200,40,0.55)' : accentHex;
      g.beginPath();
      g.moveTo(x - 16, size);
      g.quadraticCurveTo(x - 4, size * 0.5, x + (i % 3 - 1) * 8, size * (0.12 + (i % 4) * 0.08));
      g.quadraticCurveTo(x + 6, size * 0.5, x + 16, size);
      g.fill();
    }
  } else {
    for (i = 0; i < 260; i++) {
      r = 1 + Math.random() * 4;
      g.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.22)' : 'rgba(255,230,180,0.2)';
      g.beginPath();
      g.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = 'rgba(40,20,5,0.55)';
    g.lineWidth = 2;
    for (i = 0; i < 7; i++) {
      x = Math.random() * size; y = Math.random() * size;
      g.beginPath();
      g.moveTo(x, y);
      for (var s = 0; s < 4; s++) {
        x += (Math.random() - 0.5) * 50; y += (Math.random() - 0.2) * 40;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  }

  var texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1.5);
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = 4;
  creatureTextureCache[key] = texture;
  return texture;
}

var ELEMENT_SURFACE = {
  KIM:{roughness:0.28, metalness:0.75, emissive:0.05},
  MOC:{roughness:0.72, metalness:0.0, emissive:0.04},
  THUY:{roughness:0.15, metalness:0.15, emissive:0.08},
  HOA:{roughness:0.5, metalness:0.0, emissive:0.45},
  THO:{roughness:0.95, metalness:0.0, emissive:0.0}
};

function makeElementMaterial(element, baseHex, accentHex) {
  var surface = ELEMENT_SURFACE[element] || ELEMENT_SURFACE.THO;
  var material = makeCreatureMaterial(new THREE.Color(0xffffff), surface.roughness, surface.metalness);
  material.map = getElementTexture(element, baseHex, accentHex);
  if (surface.emissive) {
    material.emissive = new THREE.Color(baseHex);
    material.emissiveMap = material.map;
    material.emissiveIntensity = surface.emissive;
  }
  return material;
}

function addCreaturePart(parent, geometry, material, position, scale, rotation) {
  var mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.scale.set(scale[0], scale[1], scale[2]);
  if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function buildCreature3DModel(creature) {
  var profile = CREATURE_3D_PROFILES[Number(creature.id)] || CREATURE_3D_PROFILES[1];
  var palette = getCreatureColors(creature.element, creature.rarity);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
  camera.position.set(0, 0.1, 5.5);
  camera.lookAt(0, -0.15, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x40314f, 1.6));
  var keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(-3, 4, 5);
  scene.add(keyLight);
  var rimLight = new THREE.DirectionalLight(new THREE.Color(palette.glow), 1.5);
  rimLight.position.set(3, 1, -3);
  scene.add(rimLight);

  var bodyMat = makeElementMaterial(creature.element, palette.body, palette.bodyDark);
  var lightMat = makeElementMaterial(creature.element, palette.bodyLight, palette.body);
  var darkMat = makeElementMaterial(creature.element, palette.bodyDark, palette.body);
  var bellyMat = makeElementMaterial(creature.element, palette.belly, palette.bodyLight);
  var accentMat = makeCreatureMaterial(new THREE.Color(palette.sparkle), 0.38, 0.12);
  var footMat = makeCreatureMaterial(new THREE.Color(palette.feet));
  var blackMat = new THREE.MeshBasicMaterial({color:0x211a22});
  var whiteMat = new THREE.MeshBasicMaterial({color:0xfffaf0});
  var sphere = new THREE.SphereGeometry(1, 22, 16);
  var root = new THREE.Group();
  scene.add(root);

  var shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.72, 28),
    new THREE.MeshBasicMaterial({color:0x120d21, transparent:true, opacity:0.22, depthWrite:false})
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -1.42, 0);
  shadow.scale.set(1, 0.28, 1);
  scene.add(shadow);

  var body = new THREE.Group();
  root.add(body);
  var bodyScale = profile.body;
  addCreaturePart(body, sphere, bodyMat, [0, -0.2, 0], bodyScale);
  addCreaturePart(body, sphere, bellyMat, [0, -0.35, bodyScale[2] * 0.83],
    [bodyScale[0] * 0.62, bodyScale[1] * 0.57, 0.13]);
  if (profile.stripes) {
    for (var stripe = 0; stripe < profile.stripes; stripe++) {
      var stripeX = -0.4 + stripe * 0.2;
      [-1, 1].forEach(function(side) {
        addCreaturePart(body, sphere, darkMat,
          [stripeX, -0.02 + (stripe % 2) * 0.11, 0.3],
          [0.045, 0.2, 0.035], [0, 0, side * 0.24]);
      });
    }
  }
  if (profile.kind === 'snake' || profile.kind === 'dragon') {
    for (var segment = 0; segment < 4; segment++) {
      var curve = (segment - 1.5) / 1.5;
      addCreaturePart(body, sphere, segment % 2 ? lightMat : bodyMat,
        [Math.sin(curve * 1.5) * 0.23, -0.34 - segment * 0.015, -0.25 - segment * 0.18],
        [0.24 - segment * 0.025, 0.24 - segment * 0.025, 0.25 - segment * 0.02],
        [0, curve * 0.1, curve * 0.3]);
    }
  }

  var head = new THREE.Group();
  var headY = profile.kind === 'snake' || profile.kind === 'whale' ? 0.43 : 0.48;
  head.position.set(0, headY, bodyScale[2] * 0.35);
  root.add(head);
  addCreaturePart(head, sphere, lightMat, [0, 0, 0], profile.head);

  var muzzleMat = profile.kind === 'phoenix' || profile.kind === 'bird'
    ? accentMat : bellyMat;
  addCreaturePart(head, sphere, muzzleMat, [0, -profile.head[1] * 0.4, profile.head[2] * 0.79],
    [profile.head[0] * 0.59, profile.head[1] * 0.34, 0.14]);

  var eyes = [];
  [-1, 1].forEach(function(side) {
    var eye = new THREE.Group();
    eye.position.set(side * profile.head[0] * 0.48, profile.head[1] * 0.12, profile.head[2] * 0.83);
    eye.scale.set(0.13, 0.13, 0.07);
    head.add(eye);
    addCreaturePart(eye, sphere, whiteMat, [0, 0, 0], [1, 1, 1]);
    addCreaturePart(eye, sphere, blackMat, [side * 0.08, -0.015, 0.79], [0.58, 0.66, 0.3]);
    addCreaturePart(eye, sphere, whiteMat, [-0.035, 0.04, 1.03], [0.17, 0.17, 0.12]);
    eyes.push(eye);
  });

  var appendages = [];
  if (profile.legs) {
    var legSpread = bodyScale[0] * 0.58;
    [-1, 1].forEach(function(side) {
      [0.28, -0.3].forEach(function(z) {
        var leg = new THREE.Group();
        leg.position.set(side * legSpread * 0.67, -0.58, z);
        root.add(leg);
        addCreaturePart(leg, sphere, bodyMat, [0, -0.12, 0], [0.15, 0.31, 0.15]);
        addCreaturePart(leg, sphere, footMat, [0, -0.36, 0.06], [0.18, 0.09, 0.2]);
        appendages.push(leg);
      });
    });
  }

  var wings = [];
  if (profile.wings) {
    [-1, 1].forEach(function(side) {
      var pivot = new THREE.Group();
      pivot.position.set(side * bodyScale[0] * 0.75, 0.02, -0.02);
      root.add(pivot);
      var wing = new THREE.Group();
      wing.scale.x = side;
      pivot.add(wing);
      addCreaturePart(wing, sphere, darkMat, [0.2, -0.1, -0.03], [0.43, 0.18, 0.13], [0, 0, -0.12]);
      var feathers = profile.kind === 'peacock' ? 5 : 4;
      for (var feather = 0; feather < feathers; feather++) {
        var fanSpread = (feather - (feathers - 1) / 2) * 0.12;
        var featherMesh = addCreaturePart(wing, sphere,
          feather % 2 ? lightMat : bodyMat,
          [0.28 + feather * 0.13, -0.22 + Math.abs(fanSpread) * 0.4, -0.025],
          [0.14, 0.3 - Math.abs(fanSpread) * 0.4, 0.075],
          [0, 0, -0.32 + fanSpread]);
        if (profile.kind === 'phoenix') featherMesh.material = accentMat;
      }
      wings.push(pivot);
    });
  }

  if (profile.flippers) {
    [-1, 1].forEach(function(side) {
      var fin = addCreaturePart(root, sphere, lightMat,
        [side * bodyScale[0] * 0.92, -0.22, 0.02],
        [0.3, 0.12, 0.22], [0, 0, side * -0.3]);
      appendages.push(fin);
    });
  }

  if (profile.shell) {
    addCreaturePart(root, new THREE.SphereGeometry(1, 24, 16), darkMat,
      [0, 0.03, -0.13], [bodyScale[0] * 0.9, bodyScale[1] * 0.68, bodyScale[2] * 0.6]);
    addCreaturePart(root, new THREE.SphereGeometry(1, 24, 16), accentMat,
      [0, 0.05, 0.015], [bodyScale[0] * 0.79, bodyScale[1] * 0.59, bodyScale[2] * 0.55]);
    for (var plate = -1; plate <= 1; plate++) {
      addCreaturePart(root, sphere, darkMat, [plate * 0.22, 0.19, 0.39],
        [0.15, 0.12, 0.035]);
    }
  }

  if (profile.ears) {
    [-1, 1].forEach(function(side) {
      var ear = addCreaturePart(head, new THREE.ConeGeometry(0.13, 0.35, 6), bodyMat,
        [side * profile.head[0] * 0.7, profile.head[1] * 0.76, 0], [1, 1, 0.8],
        [0, 0, side * -0.2]);
      if (profile.kind === 'fox' || profile.kind === 'tiger') {
        addCreaturePart(head, new THREE.ConeGeometry(0.067, 0.22, 6), bellyMat,
          [side * profile.head[0] * 0.7, profile.head[1] * 0.76, 0.055], [1, 1, 0.65],
          [0, 0, side * -0.2]);
      }
      ear.castShadow = true;
    });
  }

  var hornCount = profile.horns || profile.horn || 0;
  for (var horn = 0; horn < hornCount; horn++) {
    var hornX = hornCount === 1 ? 0 : (horn - (hornCount - 1) / 2) * 0.24;
    var hornMesh = addCreaturePart(head, new THREE.ConeGeometry(profile.kind === 'unicorn' ? 0.065 : 0.095, 0.35, 7),
      profile.kind === 'unicorn' ? accentMat : lightMat,
      [hornX, profile.head[1] * 0.87, 0], [1, 1, 1], [0, 0, hornX * -1.2]);
    if (profile.kind === 'unicorn') hornMesh.rotation.z = 0.22;
  }

  var crestCount = profile.crest || profile.mane || 0;
  for (var crest = 0; crest < crestCount; crest++) {
    var crestX = (crest - (crestCount - 1) / 2) * 0.16;
    addCreaturePart(head, new THREE.ConeGeometry(0.085, 0.29, 6), accentMat,
      [crestX, profile.head[1] * 0.82, -0.08], [1, 1, 1], [0.2, 0, -crestX]);
  }

  if (profile.tusks) {
    [-1, 1].forEach(function(side) {
      addCreaturePart(head, new THREE.ConeGeometry(0.09, 0.3, 7), bellyMat,
        [side * 0.27, -0.22, 0.34], [1, 1, 0.7], [0, 0, side * 0.38]);
    });
  }

  if (profile.hood) {
    [-1, 1].forEach(function(side) {
      addCreaturePart(head, sphere, accentMat, [side * 0.35, 0.08, -0.03],
        [0.16, 0.44, 0.1], [0, 0, side * 0.2]);
    });
  }

  var tail = new THREE.Group();
  tail.position.set(0, -0.62, -bodyScale[2] * 0.55);
  root.add(tail);
  var tailCount = profile.tail || 0;
  for (var t = 0; t < tailCount; t++) {
    var spread = tailCount === 1 ? 0 : (t - (tailCount - 1) / 2) * 0.34;
    var tailSegment = addCreaturePart(tail, sphere, t % 2 ? lightMat : bodyMat,
      [spread, -0.2 - Math.abs(spread) * 0.25, -0.14],
      [profile.kind === 'whale' ? 0.12 : 0.17, profile.kind === 'whale' ? 0.35 : 0.4, 0.09],
      [0, 0, -spread * 1.5]);
    if (profile.kind === 'whale') tailSegment.scale.x = 0.29;
  }

  if (profile.fan) {
    for (var f = 0; f < profile.fan; f++) {
      var angle = -0.8 + f * (1.6 / (profile.fan - 1));
      var plume = addCreaturePart(tail, sphere, f % 2 ? accentMat : lightMat,
        [Math.sin(angle) * 0.48, 0.2 + Math.cos(angle) * 0.14, -0.02],
        [0.13, 0.48, 0.09], [0, 0, -angle]);
      addCreaturePart(plume, sphere, darkMat, [0, 0.55, 0.9], [0.43, 0.3, 0.2]);
      addCreaturePart(plume, sphere, accentMat, [0, 0.55, 1.1], [0.22, 0.16, 0.12]);
    }
  }

  if (profile.spines) {
    for (var spine = 0; spine < profile.spines; spine++) {
      addCreaturePart(root, new THREE.ConeGeometry(0.085, 0.28, 6), accentMat,
        [-0.32 + spine * 0.16, bodyScale[1] * 0.38, -0.08],
        [1, 1, 1], [0, 0, 0]);
    }
  }

  if (profile.spots) {
    for (var spot = 0; spot < profile.spots; spot++) {
      var side = spot % 2 ? -1 : 1;
      addCreaturePart(root, sphere, accentMat,
        [side * (0.28 + (spot % 3) * 0.1), -0.02 + Math.floor(spot / 2) * 0.16, 0.36],
        [0.045, 0.045, 0.025]);
    }
  }

  root.position.y = 0.04;
  root.rotation.y = -0.16;
  return {
    scene:scene, camera:camera, root:root, body:body, head:head,
    wings:wings, tail:tail, eyes:eyes, appendages:appendages, profile:profile
  };
}

function mountCreature3D(stage) {
  if (!window.THREE || creature3DInstances.has(stage) || !stage.clientWidth || !stage.clientHeight) return;
  var canvas = stage.querySelector('.creature-3d-canvas');
  if (!canvas) return;

  try {
    var id = Number(stage.getAttribute('data-creature-3d'));
    var creature = CREATURE_DB.find(function(entry) { return entry.id === id; }) || CREATURE_DB[0];
    var model = buildCreature3DModel(creature);
    var renderer = new THREE.WebGLRenderer({
      canvas:canvas,
      alpha:true,
      antialias:true,
      powerPreference:'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    var width = Math.max(1, stage.clientWidth);
    var height = Math.max(1, stage.clientHeight);
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;

    var instance = {
      stage:stage, renderer:renderer, scene:model.scene, camera:model.camera,
      root:model.root, body:model.body, head:model.head, wings:model.wings,
      tail:model.tail, eyes:model.eyes, appendages:model.appendages,
      profile:model.profile, width:width, height:height, lastTime:0
    };
    creature3DInstances.set(stage, instance);
    stage.classList.add('is-ready');
    if (!creature3DFrame) creature3DFrame = requestAnimationFrame(animateCreatures3D);
  } catch (error) {
    console.warn('Không thể khởi tạo mô hình 3D; đang dùng hình SVG dự phòng.', error);
  }
}

function animateCreatures3D(now) {
  creature3DFrame = 0;
  if (document.visibilityState !== 'visible') {
    creature3DFrame = requestAnimationFrame(animateCreatures3D);
    return;
  }

  creature3DInstances.forEach(function(instance) {
    var rect = instance.stage.getBoundingClientRect();
    if (!instance.stage.isConnected || !rect.width || !rect.height
        || rect.bottom < 0 || rect.top > window.innerHeight
        || rect.right < 0 || rect.left > window.innerWidth) return;

    var width = instance.stage.clientWidth;
    var height = instance.stage.clientHeight;
    if (width !== instance.width || height !== instance.height) {
      instance.width = width;
      instance.height = height;
      instance.renderer.setSize(width, height, false);
      instance.camera.aspect = width / height;
      instance.camera.updateProjectionMatrix();
    }

    var time = now / 1000;
    var flap = Math.sin(time * 3.3);
    if (!creature3DReducedMotion.matches) {
      instance.root.position.y = 0.04 + Math.sin(time * 2.1) * 0.045;
      instance.root.rotation.y = -0.16 + Math.sin(time * 0.7) * 0.12;
      instance.body.scale.y = 1 + Math.sin(time * 2.1) * 0.018;
      instance.head.rotation.z = Math.sin(time * 1.1) * 0.04;
      instance.head.rotation.y = Math.sin(time * 0.8) * 0.06;
      instance.tail.rotation.x = Math.sin(time * 1.4) * 0.08;
    }

    for (var wing = 0; wing < instance.wings.length; wing++) {
      instance.wings[wing].rotation.z = creature3DReducedMotion.matches
        ? 0 : (wing === 0 ? -1 : 1) * flap * 0.28;
    }
    for (var limb = 0; limb < instance.appendages.length; limb++) {
      instance.appendages[limb].rotation.x = creature3DReducedMotion.matches
        ? 0 : Math.sin(time * 2.6 + limb) * 0.09;
    }

    var blinkPhase = time % 4.2;
    var blink = !creature3DReducedMotion.matches && blinkPhase > 3.9 && blinkPhase < 4.08
      ? Math.max(0.08, Math.abs(blinkPhase - 3.99) * 25)
      : 1;
    for (var eye = 0; eye < instance.eyes.length; eye++) {
      instance.eyes[eye].scale.y = 0.13 * blink;
    }

    instance.renderer.render(instance.scene, instance.camera);
  });

  if (creature3DInstances.size) creature3DFrame = requestAnimationFrame(animateCreatures3D);
}

function scanCreatures3D(node) {
  if (!node || node.nodeType !== 1) return;
  if (node.matches('.creature-3d-stage')) creature3DVisibilityObserver.observe(node);
  var stages = node.querySelectorAll('.creature-3d-stage');
  for (var i = 0; i < stages.length; i++) creature3DVisibilityObserver.observe(stages[i]);
}

function disposeCreature3D(stage, instance) {
  instance.scene.traverse(function(object) {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      var materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(function(material) { material.dispose(); });
    }
  });
  instance.renderer.dispose();
  stage.classList.remove('is-ready');
  creature3DInstances.delete(stage);
}

function cleanupCreatures3D() {
  creature3DInstances.forEach(function(instance, stage) {
    if (stage.isConnected) return;
    creature3DVisibilityObserver.unobserve(stage);
    disposeCreature3D(stage, instance);
  });
  if (!creature3DInstances.size && creature3DFrame) {
    cancelAnimationFrame(creature3DFrame);
    creature3DFrame = 0;
  }
}

function startCreatures3D() {
  creature3DVisibilityObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        mountCreature3D(entry.target);
      } else {
        var instance = creature3DInstances.get(entry.target);
        if (instance) disposeCreature3D(entry.target, instance);
      }
    });
  }, {rootMargin:'80px', threshold:0.01});
  scanCreatures3D(document.body);
  creature3DObserver = new MutationObserver(function(records) {
    for (var i = 0; i < records.length; i++) {
      for (var j = 0; j < records[i].addedNodes.length; j++) {
        scanCreatures3D(records[i].addedNodes[j]);
      }
    }
    cleanupCreatures3D();
  });
  creature3DObserver.observe(document.body, {childList:true, subtree:true});
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startCreatures3D, {once:true});
} else {
  startCreatures3D();
}
