        const btn = document.querySelector("#btn")
        const darkmode = document.querySelector('#darkmode')
        const modelwhite =   0xc0c0c0
        const blue = 0x0077ff
        const blackbg = 0x282828
        const whitebg = 0xf0f0f0
        let white = true;
        const models = ['./models/box.stl','./models/nut.stl','./models/stand.stl','./models/cable-gland-10mm.stl','./models/cable-gland-5mm.stl']
        let i = 0
        let bodycolor;
        let model = models[0];
        
            darkmode.onclick = function(){
                scene.children.forEach((object) => {
                    if (object.isMesh) {
                        scene.remove(object);
                        object.geometry.dispose();
                        object.material.dispose();
                    }
                });
                white = !white;
                bodycolor = white ? blue : modelwhite;
                loadmodel(model,bodycolor)
                scene.background = white ? new THREE.Color(whitebg) : new THREE.Color(blackbg)
                document.body.style.backgroundColor = white ? '#f0f0f0' : '#282828';
            }
        
        
        
        loadmodel(model)
        btn.onclick = function(){
            scene.children.forEach((object) => {
                if (object.isMesh) {
                    scene.remove(object);
                    object.geometry.dispose();
                    object.material.dispose();
                }
            });
            
            i = (i+1) % models.length
            model = models[i];
            loadmodel(model,bodycolor)
        }
        
        
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(whitebg);

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 10); 

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        scene.add(ambientLight);

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


        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; 
        controls.dampingFactor = 0.1;
        controls.rotateSpeed = 0.7;
        controls.zoomSpeed = 1.2; 
        controls.enableZoom = true; 
        controls.enablePan = true; 
        controls.screenSpacePanning = true; 

        function loadmodel(model,color=blue){
        const loader = new THREE.STLLoader();
        loader.load(model, function (geometry) {
            const material = new THREE.MeshStandardMaterial({ color: color, metalness: 0.5, roughness: 0.5 });
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);

            geometry.computeBoundingBox();
            const bbox = geometry.boundingBox;
            const center = bbox.getCenter(new THREE.Vector3());
            const size = bbox.getSize(new THREE.Vector3());

            mesh.position.set(-center.x, -center.y, -center.z);

            const maxDim = Math.max(size.x, size.y, size.z);
            camera.position.set(0, 0, maxDim * 2);
            controls.target.set(0, 0, 0);
            controls.update();
        })};

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