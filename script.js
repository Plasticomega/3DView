const darkmode = document.querySelector('#darkmode');
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const selectFileBtn = document.getElementById('select-file');

const modelwhite = 0xc0c0c0;
const blue = 0x0077ff;
const blackbg = 0x282828;
const whitebg = 0xf0f0f0;

let white = true;
let currentMesh = null;

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(whitebg);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.AmbientLight(0x404040, 1));
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight1.position.set(5, 5, 5);
dirLight1.castShadow = true;
scene.add(dirLight1);

const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight2.position.set(-5, -5, 5);
scene.add(dirLight2);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.rotateSpeed = 0.7;
controls.zoomSpeed = 1.2;

// Load model from file or drag
function handleFileList(files) {
  const fileMap = {};
  for (const file of files) {
    fileMap[file.name.toLowerCase()] = file;
  }

  // First, try to load OBJ + MTL
  const objFile = Array.from(files).find(f => f.name.toLowerCase().endsWith(".obj"));
  if (objFile) {
    const baseName = objFile.name.toLowerCase().replace(".obj", "");
    const mtlFile = fileMap[baseName + ".mtl"];

    if (mtlFile) {
      const mtlReader = new FileReader();
      mtlReader.onload = function (e) {
        const mtlLoader = new THREE.MTLLoader();
        const materials = mtlLoader.parse(e.target.result);
        materials.preload();

        // Load associated textures if present
        for (const matName in materials.materials) {
          const material = materials.materials[matName];
          if (material.map_Kd) {
            const textureFileName = material.map_Kd.trim().toLowerCase();
            const texFile = fileMap[textureFileName];
            if (texFile) {
              const blobURL = URL.createObjectURL(texFile);
              material.map = new THREE.TextureLoader().load(blobURL);
              material.map.flipY = false;
              material.needsUpdate = true;
            }
          }
        }

        const objReader = new FileReader();
        objReader.onload = function (ev) {
          const objLoader = new THREE.OBJLoader();
          objLoader.setMaterials(materials);
          const object = objLoader.parse(ev.target.result);
          addObjectToScene(object);
          dropArea.style.display = 'none';
        };
        objReader.readAsText(objFile);
      };
      mtlReader.readAsText(mtlFile);
      return;
    } else {
      // Load .obj without .mtl
      const reader = new FileReader();
      reader.onload = function (e) {
        const objLoader = new THREE.OBJLoader();
        const object = objLoader.parse(e.target.result);
        addObjectToScene(object);
        dropArea.style.display = 'none';
      };
      reader.readAsText(objFile);
      return;
    }
  }

  // ✅ Try STL if no OBJ found
  const stlFile = Array.from(files).find(f => f.name.toLowerCase().endsWith(".stl"));
  if (stlFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const geometry = new THREE.STLLoader().parse(e.target.result);
      displayModel(geometry);
      dropArea.style.display = 'none';
    };
    reader.readAsArrayBuffer(stlFile);
    return;
  }

  alert("No supported file found. Please upload .obj or .stl.");
}

  
  
  
  
  

// Display the mesh in the scene
function displayModel(geometry, color = white ? blue : modelwhite) {
  if (currentMesh) {
    scene.remove(currentMesh);
    currentMesh.geometry.dispose();
    currentMesh.material.dispose();
  }
function addObjectToScene(object) {
    scene.add(object);
    currentMesh = object;
  
    // Compute bounding box
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
  
    object.position.x += (object.position.x - center.x);
    object.position.y += (object.position.y - center.y);
    object.position.z += (object.position.z - center.z);
  
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.set(0, 0, maxDim * 2);
    controls.target.set(0, 0, 0);
    controls.update();
}
  

  const material = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.5 });
  currentMesh = new THREE.Mesh(geometry, material);
  scene.add(currentMesh);

  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  const center = bbox.getCenter(new THREE.Vector3());
  const size = bbox.getSize(new THREE.Vector3());

  currentMesh.position.set(-center.x, -center.y, -center.z);
  const maxDim = Math.max(size.x, size.y, size.z);
  camera.position.set(0, 0, maxDim * 2);
  controls.target.set(0, 0, 0);
  controls.update();
}

// File select button
selectFileBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileList(e.target.files);
    }
  });
  

// Drag-and-drop
['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, e => {
    e.preventDefault();
    dropArea.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, e => {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
  });
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      handleFileList(e.dataTransfer.files);
    }
  });
  

// Dark mode toggle
darkmode.onclick = function () {
  white = !white;
  const bg = white ? whitebg : blackbg;
  const meshColor = white ? blue : modelwhite;
  scene.background = new THREE.Color(bg);
  document.body.style.backgroundColor = `#${bg.toString(16)}`;
  if (currentMesh) {
    currentMesh.material.color.setHex(meshColor);
  }
};
function addObjectToScene(object) {
    scene.add(object);
    currentMesh = object;
  
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
  
    // Center the object in the scene
    object.position.set(-center.x, -center.y, -center.z);
  
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.set(0, 0, maxDim * 2);
    controls.target.set(0, 0, 0);
    controls.update();
  }
  

// Animate loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});








