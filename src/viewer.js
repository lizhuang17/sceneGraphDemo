import * as THREE from "three"
const AmbientLight=THREE.AmbientLight,
DirectionalLight=THREE.DirectionalLight,
PerspectiveCamera=THREE.PerspectiveCamera,
Scene=THREE.Scene,
sRGBEncoding=THREE.sRGBEncoding,
Vector3=THREE.Vector3,
WebGLRenderer=THREE.WebGLRenderer,
PlaneGeometry=THREE.PlaneGeometry,
Mesh=THREE.Mesh,
MeshBasicMaterial=THREE.MeshBasicMaterial,
Matrix4=THREE.Matrix4,
DoubleSide=THREE.DoubleSide
import {Water} from "../lib/three/examples/jsm/objects/Water.js"
import {AvatarManager} from "./AvatarManager"
import {GUI} from 'dat.gui'
import {MyUI} from "../lib/MyUI.js"
import Stats from '../lib/three/examples/jsm/libs/stats.module.js'
import {OrbitControls} from '../lib/three/examples/jsm/controls/OrbitControls.js'
import {WanderControl} from "../lib/WanderControl"
import { PlayerControl } from '../lib/PlayerControl'
import {TextureAnimator} from '../lib/TextureAnimator'
import { Fire, Smoke } from "./Fire_Smoke.js"

import { smokemap } from "./map_smoke.js"
export class Viewer
{
    constructor (el, options){
        this.el = el
        this.options = options
        this.clock = new THREE.Clock()
        this.lights = []
        this.content = null

        this.gui = null

        this.prevTime = 0

        this.stats = new Stats()
        this.stats.dom.height = '48px';
        [].forEach.call(this.stats.dom.children, (child) => (child.style.display = ''))

        this.scene = new Scene()

        const fov = 60
        this.defaultCamera = new PerspectiveCamera(fov, el.clientWidth / el.clientHeight, 1, 5000)
        this.activeCamera = this.defaultCamera
        this.activeCamera.layers.enableAll()
        this.defaultCamera.up.set(0,0,1)

        this.sceneEx = new Scene()
        window.scene=this.sceneEx
        this.sceneEx.add(this.defaultCamera)

        this.renderer = window.renderer = new WebGLRenderer({antialias: true})
        this.renderer.physicallyCorrectLights = true
        this.renderer.outputEncoding = sRGBEncoding
        this.renderer.setClearColor(0x66ccff);
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize(el.clientWidth, el.clientHeight)
        this.renderer.autoClear = false
        this.renderer.toneMappingExposure = 1.25		//色调映射曝光度
        // this.renderer.shadowMap.enabled = true
        this.renderer.clippingPlanes = []
        this.renderer.localClippingEnabled = false;

        var speed = 10
        this.vc = new Vector3(0,0,0)
        if(window.projectName==='HaiNing'){
            speed = 300
            this.vc = this.update_matrix(new Vector3(-127.6,101.3,58.6))
        }else if(window.projectName==='KaiLiNan'){
            speed = 200
            this.vc = this.update_matrix(new Vector3(-467.5,31.3,74.5))
        }else if(window.projectName==='LanQiao'){
            speed = 200
            this.vc = this.update_matrix(new Vector3(228.1,277.9,117.7))
        }else if(window.projectName==='QinLaiLi'){
            speed = 200
            this.vc = this.update_matrix(new Vector3(10.8,46.8,-3.6))
        }else if(window.projectName==='RenFuYiYuan'){
            speed = 1000
            this.vc = this.update_matrix(new Vector3(364.0,452.1,-1232.9))
        }else if(window.projectName==='XinYu'){
            speed = 100
            this.vc = this.update_matrix(new Vector3(318.6,-12.4,-87.6))
        }else if(window.projectName==='YunXi'){
            speed = 200
            this.vc = this.update_matrix(new Vector3(-5.7,35.5,-79.5))
        }

        window.playerControl = this.playerControl = new PlayerControl(this.defaultCamera, speed/5)
        window.orbitControl = this.orbitControl = new OrbitControls(this.defaultCamera, this.renderer.domElement)
        this.orbitControl.autoRotate = false
        //this.orbitControl.autoRotateSpeed = -speed
        // this.orbitControl.screenSpacePanning = true

        this.el.appendChild(this.renderer.domElement)

        this.addGUI()
        this.addMyUI()
        this.addWanderControl(speed*2)

        this.animate = this.animate.bind(this)
        requestAnimationFrame(this.animate)

        window.addEventListener('resize', this.resize.bind(this), false)

        this.setupScene()


        this.plane=false
        this.fire_init=false
        this.is_smoke=false
        this.iswater=false
        this.nssmoke = 0
        this.smoke_new=new smokemap(this.sceneEx)
        this.smoke_new.init(this.renderer)
        // this.fire = new Fire([0,0,0], this.sceneEx)
        this.smoke = new Smoke(this.sceneEx, this.renderer)
        this.people = new AvatarManager(this.sceneEx,this.defaultCamera)
        this.ray = new THREE.Raycaster()
        this.ispeople = 0
        this.waterMesh = null
        this.is_edit = -1
        this.mr = null
        this.mb = null
        this.pressed = false
        var _self = this
        this.onKeyDown = function (event){
            if(event.key==="U"||event.key==="u"){
                _self.groundMesh.position.z += 1
                console.log(_self.groundMesh.position.z)
            }else if(event.key==="J"||event.key==="j"){
                _self.groundMesh.position.z -= 1
                console.log(_self.groundMesh.position.z)
            }else if(event.key==="H"||event.key==="h"){
                if(_self.plane){
                    if(_self.groundMesh.visible)
                        _self.groundMesh.visible = false
                    else
                        _self.groundMesh.visible=true
                }else{
                    _self.sceneEx.add(_self.groundMesh)
                    _self.plane=true
                }
            }else if(event.key==="P"||event.key==="p"){
                // self.people = new AvatarManager(_self.sceneEx,_self.defaultCamera)
                if(_self.ispeople == 0){
                    const firemap = new THREE.TextureLoader().load('textures/fire1.png')
                    _self.fire = new TextureAnimator( firemap, 3, 2, 6, 55 ); // texture, #horiz, #vert, #total, duration.
                    _self.fire_init = true
                    let material=new THREE.SpriteMaterial({transparent:true,map:firemap,color:0xffffff});
                    let mesh = new THREE.Sprite(material);
                    mesh.scale.set(15,15,30)
                    mesh.position.set(-60,-160,5)
                    _self.sceneEx.add( mesh );
                    // _self.smoke.init([-60,-160,15])
                    // _self.is_smoke=true
                    _self.people.start()
                }   
                _self.ispeople += 1
                if(_self.ispeople>2){
                    console.log(12)
                    _self.is_smoke=true
                    _self.ispeople=1
                }
                    
            }else if(event.key==="F"||event.key==="f"){
                const vertexShader = `
                    uniform float time;
                    uniform float opacityData[10000]; // 假设一维数组大小为100x100
                    varying vec2 vUv;
                    varying float vOpacity;
                    attribute float vertexIndex;

                    void main() {
                        vUv = uv;

                        int index = int(vertexIndex);
                        int x = index % 100; // 计算点在数组中的x坐标
                        int y = index / 100; // 计算点在数组中的y坐标

                        vec3 newPosition = position;
                        newPosition.z += sin(position.x + time) * sin(position.y + time);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

                        vOpacity = opacityData[index];
                    }
                `;

                const fragmentShader = `
                    uniform sampler2D maptexture;
                    varying vec2 vUv;
                    varying float vOpacity;

                    void main() {
                        vec4 texColor = texture2D(maptexture, vUv);
                        vec4 finalColor = texColor * vec4(1.0, 1.0, 1.0, vOpacity);
                        gl_FragColor = finalColor;
                    }
                `;

                const smokemap = new THREE.TextureLoader().load('textures/pur.png');
                const geom = new THREE.PlaneGeometry(100, 100, 99, 99);

                let opdata = new Float32Array(10000);
                for (let i = 0; i < 10000; i++) {
                    opdata[i] = Math.random() >= 0.5 ? 1.0 : 0.0;
                }

                geom.setAttribute('vertexIndex', new THREE.BufferAttribute(new Float32Array(opdata), 1));

                _self.trym = new THREE.ShaderMaterial({
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    uniforms: {
                        opacityData: { value: opdata },
                        time: { value: 0.0 },
                        maptexture: { value: smokemap }
                    },
                });

                _self.trymesh = new THREE.Mesh(geom, _self.trym);
                _self.sceneEx.add(_self.trymesh);
            }else if(event.key==="O"||event.key==="o"){
                _self.is_edit+=1
                // window.model.op=0.1
                _self.people.draw()
                if(_self.is_edit>=_self.people.floors){
                    _self.is_edit=-1
                    // window.model.op=1
                }
                _self.people.enter_edit(_self.is_edit)
            }else if(event.keyCode == 16){//shift
                _self.pressed = true
            }else if(event.key==="T"||event.key==="t"){
                // if(_self.nssmoke == 0)
                //     _self.smoke_new.init()
                // else if(_self.nssmoke == 1){
                //     // var mesh_test = new Mesh(new THREE.SphereGeometry(10), new THREE.MeshBasicMaterial({color: 0x00ff00}))
                //     // mesh_test.position.set(100,100,100)
                //     // _self.sceneEx.add(mesh_test)
                //     _self.smoke_new.randomstart()
                // }else if(_self.nssmoke>3) _self.nssmoke=2
                _self.nssmoke+=1
            }else if(event.key === "z"){
                var geometry = new THREE.PlaneGeometry(100, 100);
                var material = new THREE.ShaderMaterial({
                    transparent: true,
                    vertexShader: document.getElementById('vertexShader').textContent,
                    fragmentShader: document.getElementById('fragmentShader').textContent,
                    side: THREE.DoubleSide,
                    uniforms: {
                        maptexture: { value: new THREE.TextureLoader().load('textures/try.png') }
                    }
                });
            
                var mesh = new THREE.Mesh(geometry, material);
                _self.sceneEx.add(mesh);
            }else if(event.key === "v") {
                let tex = new THREE.TextureLoader().load('textures/waterdudv.jpg')
                let vertexShader = /* glsl */`
                    in vec3 position;
                    in vec3 resolution;
                    out vec3 mposition;

                    uniform mat4 modelMatrix;
                    uniform mat4 modelViewMatrix;
                    uniform mat4 projectionMatrix;

                    uniform vec3 res;
                    
                    void main() {
                        mposition = position / res + 0.5;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                
				`;

				let fragmentShader = /* glsl */`
					precision highp float;

					uniform mat4 modelViewMatrix;
					uniform mat4 projectionMatrix;

					out vec4 color;
                    in vec3 mposition;

					uniform sampler2D map;

					void main(){
                        vec2 vUV=vec2(mposition.x, mposition.y);
                        vec4 tex = texture(map, vUV);
                        color = tex;
					}
				`;
                let resolution = new THREE.Vector3(100, 100, 100)
                let geo = new THREE.BoxGeometry( 100, 100, 100 )
                let mat = new THREE.RawShaderMaterial( {
					glslVersion: THREE.GLSL3,
					uniforms: {
						map: { value: tex },
                        res: { value: resolution }
					},
					vertexShader,
					fragmentShader,
					transparent: true
				} );
                let mesh = new THREE.Mesh(geo, mat)
                let me = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color: 0x000000}))
                
                _self.sceneEx.add(mesh)
            }
        }

        this.onKeyUp = function (event){
            if(event.keyCode == 16){
                _self.pressed = false
            }
        }

        this.onMouseMove = function(event){
            if(_self.mr){
                let point = new THREE.Vector2(( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1)
                _self.ray.setFromCamera( point, _self.defaultCamera );
                let intersects = _self.ray.intersectObjects( [_self.people.planes[_self.people.editing]], false );
                if ( intersects.length > 0) {
                    var intersect = intersects[ 0 ];
                    _self.mr.position.copy(intersect.point)
                    _self.people.moveTogether(_self.mr, null)//todos
                }
            }else if(_self.mb){
                let point = new THREE.Vector2(( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1)
                _self.ray.setFromCamera( point, _self.defaultCamera );
                let intersects = _self.ray.intersectObjects( [_self.people.planes[_self.people.editing]], false );
                if ( intersects.length > 0) {
                    var intersect = intersects[ 0 ];
                    _self.mb.position.copy(intersect.point)
                    _self.people.moveTogether(null, _self.mb)
                }
            }
        }

        this.onMouseDown = function(event){
            let point = new THREE.Vector2(( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1)
            _self.ray.setFromCamera( point, _self.defaultCamera );
            let ins = _self.ray.intersectObjects( [_self.people.planes[_self.people.editing]], false );
            if(ins.length > 0) console.log(ins[0].point)
            if(_self.pressed){
                let intersects = _self.ray.intersectObjects( [_self.people.planes[_self.people.editing]], false );
                if ( intersects.length > 0 ) {
                    let intersect = intersects[ 0 ];
                    let pos = [intersect.point.x, intersect.point.y, intersect.point.z]
                    _self.people.add_editer(pos, [100,100])
                }
            }else{
                if(_self.mr){
                    _self.mr = null
                }else if(_self.mb){
                    _self.mb = null
                }else{
                    if(_self.people.balls[_self.people.editing].length != 0){
                        let intersects = _self.ray.intersectObjects( _self.people.balls[_self.people.editing], false );
                        if ( intersects.length > 0 ) {
                            let intersect = intersects[ 0 ]
                            _self.mb=intersect.object
                        }else{
                            intersects = _self.ray.intersectObjects( _self.people.areas[_self.people.editing], false );
                            if ( intersects.length > 0 ) {
                                let intersect = intersects[ 0 ]
                                _self.mr=intersect.object
                            }
                        }
                    }
                }
            }
        }

        this.onMouseUp = function(event){
        }

        document.addEventListener( 'keydown', this.onKeyDown, true)
        document.addEventListener( 'keyup', this.onKeyUp, true)
        document.addEventListener( 'mousemove', this.onMouseMove, true );
        document.addEventListener( 'mousedown', this.onMouseDown, true );
        document.addEventListener( 'mouseup', this.onMouseUp, true );
    }

    animate(){
        requestAnimationFrame(this.animate)

        this.stats.update()

        if(this.fire_init)
            this.fire.update(100)
        if(this.ispeople>1)
            this.people.update(this, 0.02)
        if(this.is_smoke)
            this.smoke.animate()
        if(this.nssmoke % 2 == 1){
            this.smoke_new.update(0.01, this.defaultCamera.position)
        }


        this.render()
    }

    render(){
        this.renderer.clear()
        this.renderer.render(this.sceneEx, this.activeCamera)
    }

    resize(){
        const {clientHeight, clientWidth} = this.el.parentElement

        this.defaultCamera.aspect = clientWidth / clientHeight
        this.defaultCamera.updateProjectionMatrix()
        this.renderer.setSize(clientWidth, clientHeight)
    }

    setupScene(){
        this.setCamera()

        this.addLights()

        window.content = this.content
    }

    setCamera(){
        var self = this
        setInterval(function(){
        var s = "new Vector3("
            s += self.defaultCamera.position.x.toFixed(1).toString()
            s += ","
            s += self.defaultCamera.position.y.toFixed(1).toString()
            s += ","
            s += self.defaultCamera.position.z.toFixed(1).toString()
            s += "),"
        }, 2000)

        this.defaultCamera.position.set(0,-1200,0)
        this.defaultCamera.lookAt(0,0,0)

        if(window.projectName==="HaiNing")
            var pos = [391.9,1094.1,1126.1]
        else if(window.projectName==="KaiLiNan")
            var pos = [-440.7,40.0,103.4]
        else if(window.projectName==="LanQiao")
            var pos = [181.1,512.9,913.8]
        else if(window.projectName==="QinLaiLi")
            var pos = [-182.4,251.1,-306.4]
        else if(window.projectName==="RenFuYiYuan")
            var pos = [320.0,5169.8,-7571.8]
        else if(window.projectName==="XinYu")
            var pos = [224.4,138.6,-221.4]
        else if(window.projectName==="YunXi")
            var pos = [103.2,389.4,287.9]
        
        var vp = this.update_matrix(pos)

        this.defaultCamera.position.copy(vp)
        this.defaultCamera.lookAt(this.vc)

        this.activeCamera = this.defaultCamera
        window.camera=this.activeCamera
    }

    update_matrix(pos){
        if(window.projectName==="HaiNing"){
            var scale = 101.86411327289396
            var tran = [-5.5,-13.3,6.5]
            var m = [66.37780078125,0,0,0,0,1.473883255026509e-14,66.37780078125,0,0,-66.37780078125,1.473883255026509e-14,0,-1009.4450195312501,1009.4450195312497,-1009.4450195312503,1]
        }else if(window.projectName==="KaiLiNan"){
            var scale = 55.7848934508535
            var tran = [-19.2,2.97,0.8]
            var m = [2498.2609999999995,0,0,0,0,5.547253767446135e-13,2498.2609999999995,0,0,-2498.2609999999995,5.547253767446135e-13,0,-60839.49374999999,60839.52499999998,-60839.52500000001,1]
        }else if(window.projectName==="LanQiao"){
            var scale = 42.24043254202923
            var tran = [44,22,18]
            var m = [85.42393359375001,0,0,0,0,1.896792358596633e-14,85.42393359375001,0,0,-85.42393359375001,1.896792358596633e-14,0,-588.5983398437501,588.5983398437498,-588.5983398437502,1]
        }else if(window.projectName==="QinLaiLi"){
            var scale = 84.11843876177659
            var tran = [0.7,-0.5,2.1]
            var m = [280.128171875,0,0,0,0,6.220094925235565e-14,280.128171875,0,0,-280.128171875,6.220094925235565e-14,0,-5175.257812500001,5175.4654296875,-5175.398046875002,1]
        }else if(window.projectName==="RenFuYiYuan"){
            var scale = 111.0370863868532
            var tran = [-2,93.5,-13.1]
            var m = [20.224380859375003,0,0,0,0,4.490714657773288e-15,20.224380859375003,0,0,-20.224380859375003,4.490714657773288e-15,0,505.609521484375,-505.6095214843749,505.6095214843752,1]
        }else if(window.projectName==="XinYu"){
            var scale = 95.15653249595586 
            var tran = [-12.5,3.4,0.4]
            var m = [536.189875,0,0,0,0,1.1905806895917693e-13,536.189875,0,0,-536.189875,1.1905806895917693e-13,0,13244.746875,-13244.746874999999,13244.746875000003,1]
        }else if(window.projectName==="YunXi"){
            var scale = 59.13310862752055
            var tran = [-2,-10,5]
            var m = [188.426875,0,0,0,0,4.183917101663326e-14,188.426875,0,0,-188.426875,4.183917101663326e-14,0,-2255.946875,2255.946875,-2255.9468750000005,1]
        }

        var new_m = new Matrix4().set(
            m[0]/scale,m[4]/scale,m[8]/scale,m[12]/scale*tran[0],
            m[1]/scale,m[5]/scale,m[9]/scale,m[13]/scale*tran[1],
            m[2]/scale,m[6]/scale,m[10]/scale,m[14]/scale*tran[2],
            m[3]/scale,m[7]/scale,m[11]/scale,m[15]
        )
        var vp = new Vector3(0,0,0)
        if(pos[0]){
            vp.x=pos[0]
            vp.y=pos[1]
            vp.z=pos[2]
        }
        else 
            vp.copy(pos)

        return vp.applyMatrix4(new_m)
    }

    addLights(){
        const directionalLight  = new DirectionalLight(0xFFFFFF, 3.5)
        directionalLight.position.set(0.5, 1.2, 0.5)
        this.sceneEx.add(directionalLight)
        var amb = new AmbientLight(0xffffff,1.5)
        this.sceneEx.add(amb)
    }

    addGUI(){
        const gui = this.gui = new GUI({autoPlace: false, width: 260, hideable: true})

        const perfFolder = gui.addFolder('Performance')
        const perfLi = document.createElement('li')
        this.stats.dom.style.position = 'static'
        perfLi.appendChild(this.stats.dom)
        perfLi.classList.add('gui-stats')
        perfFolder.__ul.appendChild( perfLi )

        const guiWrap = document.createElement('div')
        this.el.appendChild( guiWrap )
        guiWrap.classList.add('gui-wrap')
        guiWrap.appendChild(gui.domElement)
        gui.open()
    }

    addMyUI(){
        var ui=new MyUI()
        var width=window.innerWidth
        var height=window.innerHeight

        //开始添加视角切换
        var inf0={
            '海宁路':'HaiNing',
            '凯里南站':'KaiLiNan',
            '澜桥路':'LanQiao',
            '秦莱里':'QinLaiLi',
            '仁福医院':'RenFuYiYuan',
            '新余站':'XinYu',
            '云溪站':'YunXi',
        }
        var thisUrl=window.location.href;
        var thisIp=thisUrl.split('scene=')[0]+'scene='
        var urls=Object.values(inf0)
        var names=Object.keys(inf0)
        for(var i=0;i<urls.length;i++)
            urls[i]=thisIp+urls[i]

        for(var i=0;i<names.length;i++){
            new ui.Button(names[i], (thisUrl===urls[i])?'#01ACD7':"#4169E1", '#6495ED', '#01DFD7',
                height/30, 10,
                width/12, height/20,
                (i+1.1)*width/10,13.5*height/15,(b)=>{
                    if(thisUrl!==urls[b.myid])
                        window.location.href=urls[b.myid]
            }).element.myid=i
        }

        var inf1 = { }
        var config=[]
        var camera_pos = [
            new Vector3(-1442.8,30.5,156.5),
            new Vector3(-218.4,275.7,245.2),
            new Vector3(544.2,49.6,-59.0),
            new Vector3(218.4,116.4,-35.9),
            new Vector3(391.9,1094.1,1126.1),

            new Vector3(-465.4,31.0,76.5),
            new Vector3(-457.5,34.2,64.1),
            new Vector3(-464.1,31.5,65.6),
            new Vector3(-465.4,30.8,56.5),
            new Vector3(-467.2,30.7,85.7),
            new Vector3(-440.7,40.0,103.4),

            new Vector3(-491.7,14.7,449.3),
            new Vector3(154.7,23.5,422.7),
            new Vector3(-309.4,198.4,326.9),
            new Vector3(-278.7,271.8,9.1),
            new Vector3(-58.1,222.6,-96.0),
            new Vector3(181.1,512.9,913.8),

            new Vector3(-434.8,64.3,-6.7),
            new Vector3(331.4,45.3,-51.4),
            new Vector3(-68.7,46.4,24.2),
            new Vector3(183.0,22.8,22.4),
            new Vector3(-182.4,251.1,-306.4),

            new Vector3(-1044.5,849.4,-4691.9),
            new Vector3(903.4,326.2,106.9),
            new Vector3(1578.9,9.6,160.5),
            new Vector3(4971.0,316.4,-4785.9),
            new Vector3(3366.0,34.6,-257.7),
            new Vector3(320.0,5169.8,-7571.8),

            new Vector3(193.3,-12.7,-115.9),
            new Vector3(203.4,-13.0,-73.6),
            new Vector3(257.5,-11.4,-98.8),
            new Vector3(391.0,-19.4,-102.3),
            new Vector3(228.1,-11.6,-96.8),
            new Vector3(224.4,138.6,-221.4),

            new Vector3(118.7,54.5,104.9),
            new Vector3(-196.3,47.3,58.4),
            new Vector3(59.9,48.8,-33.3),
            new Vector3(79.3,24.6,-92.4),
            new Vector3(103.2,389.4,287.9)
        ]
        var camera_rot = [
            new Vector3(-1107.3,84.0,144.7),
            new Vector3(-654.1,129.2,264.2),
            new Vector3(312.4,73.6,56.3),
            new Vector3(-108.7,137.4,2.5),
            new Vector3(163.7,107.0,102.8),

            new Vector3(-464.4,31.6,60.5),
            new Vector3(-468.6,35.1,67.0),
            new Vector3(-452.4,29.1,65.2),
            new Vector3(-462.3,32.3,68.0),
            new Vector3(-460.2,30.6,85.8),
            new Vector3(-459.7,26.6,73.9),

            new Vector3(-195.0,57.7,459.8),
            new Vector3(90.7,30.5,243.9),
            new Vector3(-388.5,197.1,211.4),
            new Vector3(-86.1,276.3,62.7),
            new Vector3(153.5,226.2,-19.6),
            new Vector3(171.8,96.6,242.5),

            new Vector3(-352.4,60.9,-4.8),
            new Vector3(270.3,40.8,-46.0),
            new Vector3(1.2,42.1,-2.7),
            new Vector3(236.3,24.3,7.2),
            new Vector3(-103.7,40.9,-7.8),

            new Vector3(-106.2,382.0,-4752.2),
            new Vector3(1718.1,321.9,-135.5),
            new Vector3(2641.0,153.3,-87.3),
            new Vector3(5112.3,307.2,-3745.5),
            new Vector3(2626.9,95.1,42.5),
            new Vector3(320.0,435.9,-2944.2),

            new Vector3(196.2,-13.6,-61.0),
            new Vector3(129.4,-0.9,-74.5),
            new Vector3(322.9,-13.7,-73.8),
            new Vector3(276.4,-18.6,-110.6),
            new Vector3(173.5,-7.8,-102.4),
            new Vector3(257.9,-13.9,-88.5),

            new Vector3(120.0,42.6,-19.5),
            new Vector3(-199.9,49.4,-61.2),
            new Vector3(-98.0,61.7,-55.8),
            new Vector3(-73.9,31.8,-70.2),
            new Vector3(38.8,43.0,-30.6)
        ]
        for(var i = 0; i < camera_pos.length; i++){
            camera_pos[i] = this.update_matrix(camera_pos[i])
            camera_rot[i] = this.update_matrix(camera_rot[i])
        }
        if(window.projectName==='HaiNing'){
            inf1 = {
                '入口':0,
                '楼梯口':1,
                '一楼':2,
                '二楼':3,
                '外景':4,
            }
            config = [
                {boardPos:[-1442.8,110,156.5]},
                {boardPos:[-218.4,300,245.2]},
                {boardPos:[544.2,250,-59.0]},
                {boardPos:[218.4,270,-35.9]},
                {boardPos:[0,0,0]}
            ]
        }
        else if(window.projectName==='KaiLiNan'){
            inf1 = {
                '架桥':5,
                '等候室':6,
                '进站口':7,
                '地铁入口':8,
                '大楼':9,
                '外景':10
            }
            config = [
                {boardPos:[-465.4,33,76.5]},
                {boardPos:[-457.5,38,64.1]},
                {boardPos:[-464.1,38,65.6]},
                {boardPos:[-465.4,33,56.5]},
                {boardPos:[-467.2,35,85.7]},
                {boardPos:[0,0,0]}
            ]
        }
        else if(window.projectName==='LanQiao'){
            inf1 = {
                '入口':11,
                '走廊':12,
                '电梯口':13,
                '大厅':14,
                '机械设备':15,
                '外景':16
            }
            config = [
                {boardPos:[-491.7,60,449.3]},
                {boardPos:[154.7,120,422.7]},
                {boardPos:[-309.4,280,326.9]},
                {boardPos:[-278.7,350,9.1]},
                {boardPos:[-58.1,350,-96.0]},
                {boardPos:[0,0,0]}
            ]
        }
        else if(window.projectName==='QinLaiLi'){
            inf1 = {
                '入口':17,
                '走廊':18,
                '二楼':19,
                '一楼':20,
                '外景':21
            }
            config = [
                {boardPos:[-434.8,80,-6.7]},
                {boardPos:[331.4,80,-51.4]},
                {boardPos:[-68.7,110,24.2]},
                {boardPos:[183.0,100,22.4]},
                {boardPos:[0,0,0]}
            ]
        }
        else if(window.projectName==='RenFuYiYuan'){
            inf1 = {
                '楼梯口':22,
                '检票口':23,
                '安全通道':24,
                '走廊':25,
                '候车间':26,
                '外景':27
            }
            config = [
                {boardPos:[-1044.5,1000,-4691.9]},
                {boardPos:[903.4,900,106.9]},
                {boardPos:[1578.9,900,160.5]},
                {boardPos:[4971.0,750,-4785.9]},
                {boardPos:[3366.0,900,-257.7]},
                {boardPos:[0,0,0]}
            ]
        }
        else if(window.projectName==='XinYu'){
            inf1 = {
                '地铁入口':28,
                '楼梯':29,
                '大厅':30,
                '地铁轨道':31,
                '检票口':32,
                '外景':33
            }
            config = [
                {boardPos:[193.3,-8,-115.9]},
                {boardPos:[203.4,5,-73.6]},
                {boardPos:[257.5,3,-98.8]},
                {boardPos:[391.0,5,-102.3]},
                {boardPos:[228.1,5,-96.8]},
                {boardPos:[0,0,0]}
            ]
        }
        else if(window.projectName==='YunXi'){
            inf1 = {
                '入口':34,
                '走廊':35,
                '二楼':36,
                '一楼':37,
                '外景':38
            }
            config = [
                {boardPos:[118.7,75,104.9]},
                {boardPos:[-196.3,90,58.4]},
                {boardPos:[59.9,100,-33.3]},
                {boardPos:[79.3,90,-92.4]},
                {boardPos:[0,0,0]}
            ]
        }
        else{ }

        var self = this;
        var names1=Object.keys(inf1)
        for(let i=0; i<names1.length; i++){
            new ui.Button(names1[i], "#D4D80B", '#DAA520', '#FFFACD',
            height/30, 10,
            width/12, height/20,
            width/96,(13.5-i)*(height/15),()=>{
                var id = inf1[names1[i]]
                self.defaultCamera.position.copy(camera_pos[id])
                self.defaultCamera.lookAt(camera_rot[id])
                this.wanderControl.wander = false
            });
        }

        //inf1
        var strs=Object.keys(inf1)
        var nums=Object.values(inf1)
        for(var i=0;i<config.length;i++){
            var board = this.update_matrix(config[i].boardPos)
            config[i].boardPos[0]=board.x
            config[i].boardPos[1]=board.y
            config[i].boardPos[2]=board.z
            if(!config[i].boardPos[0]&&!config[i].boardPos[1]&&!config[i].boardPos[2])
                continue;
            config[i].boardName=strs[i]

            var camera_pos0=camera_pos[ nums[i] ]
            var camera_rot0=camera_rot[ nums[i] ]
            config[i].camera=[
                camera_pos0.x,
                camera_pos0.y,
                camera_pos0.z,
                camera_rot0.x,
                camera_rot0.y,
                camera_rot0.z
            ]
        }
        var config0 = []
        for(let i=0; i<config.length; i++){
            if(config[i].boardName)
                config0.push(config[i])
        }

        new ui.Button("自动漫游", "#F4A460", '#F4A430', '#FFD700',
        height/30, 10,
        width/12, height/20,
        width/96,13.5*height/15,(b)=>{
            if(!this.wanderControl.wander){
                console.log("start wander")
                this.wanderControl.init()
                this.wanderControl.startWander()
            } else {
                console.log("stop wander")
                this.wanderControl.wander = false
            }
        });
    }

    addWanderControl(speed){
        var route = []
        if(window.projectName==='HaiNing'){
            route = [
                new Vector3(-225.5,273.3,245.5),
                new Vector3(-589.9,123.2,246.0),
                new Vector3(-840.6,107.0,260.4),
                new Vector3(-848.9,105.5,165.4),
                new Vector3(219.0,105.8,139.9),
                new Vector3(82.4,114.4,38.4),
                new Vector3(-51.8,114.2,52.4),
                new Vector3(71.2,44.2,36.0),
                new Vector3(-9.3,35.5,-17.0),
                new Vector3(-952.8,46.7,-20.9),
                new Vector3(-1158.1,22.7,-81.7),
                new Vector3(-1566.8,53.7,-57.6),
                new Vector3(391.9,1094.1,1126.1),
                new Vector3(163.7,107.0,102.8)
            ]
        }else if(window.projectName==='KaiLiNan'){
            route = [
                new Vector3(-453.0,27.2,55.4),
                new Vector3(-463.5,31.1,55.5),
                new Vector3(-466.2,30.7,64.6),
                new Vector3(-474.9,30.8,65.0),
                new Vector3(-478.5,30.7,63.9),
                new Vector3(-486.5,33.7,63.2),
                new Vector3(-463.6,33.9,64.2),
                new Vector3(-463.8,33.4,75.2),
                new Vector3(-465.3,30.9,83.7),
                new Vector3(-466.6,30.8,85.5),
                new Vector3(-476.5,30.9,85.9),
                new Vector3(-472.5,27.7,83.8),
                new Vector3(-472.8,26.3,78.6),
                new Vector3(-440.7,40.0,103.4),
                new Vector3(-459.7,26.6,73.9)
            ]
        }else if(window.projectName==='LanQiao'){
            route = [
                new Vector3(-476.2,17.7,441.6),
                new Vector3(-241.3,21.4,413.3),
                new Vector3(146.6,23.5,408.6),
                new Vector3(140.0,26.7,318.9),
                new Vector3(-252.0,205.4,319.3),
                new Vector3(-340.9,200.9,306.1),
                new Vector3(-341.7,203.1,251.2),
                new Vector3(-339.8,274.6,109.6),
                new Vector3(-106.2,273.8,85.5),
                new Vector3(53.3,274.1,176.4),
                new Vector3(72.4,274.9,113.0),
                new Vector3(-42.9,273.0,65.0),
                new Vector3(-312.0,268.6,-124.1),
                new Vector3(-311.1,267.1,-178.9),
                new Vector3(-188.1,269.8,-199.4),
                new Vector3(100.1,367.7,-205.0),
                new Vector3(141.2,379.9,-77.2),
                new Vector3(181.1,512.9,913.8),
                new Vector3(171.8,96.6,242.5)
            ]
        }else if(window.projectName==='QinLaiLi'){
            route = [
                new Vector3(396.4,48.1,-58.5),
                new Vector3(273.9,42.8,-36.7),
                new Vector3(-100.7,44.9,-30.2),
                new Vector3(-55.7,40.9,-3.9),
                new Vector3(-3.5,24.5,-3.5),
                new Vector3(195.0,24.2,20.4),
                new Vector3(362.2,20.7,23.6),
                new Vector3(472.1,39.3,55.1),
                new Vector3(468.7,62.3,25.9),
                new Vector3(352.7,68.6,-4.8),
                new Vector3(-408.8,66.8,-3.5),
                new Vector3(-182.4,251.1,-306.4),
                new Vector3(-103.7,40.9,-7.8)
            ]
        }else if(window.projectName==='RenFuYiYuan'){
            route = [
                new Vector3(-1044.5,849.4,-4691.9),
                new Vector3(29.6,318.2,-4710.6),
                new Vector3(417.3,340.4,-4740.9),
                new Vector3(484.2,291.6,-490.9),
                new Vector3(3925.0,361.2,-314.9),
                new Vector3(3821.1,263.8,-205.3),
                new Vector3(4088.0,69.8,-209.3),
                new Vector3(3684.5,50.7,-316.4),
                new Vector3(60.2,31.2,-371.4),
                new Vector3(-2491.8,89.6,-433.4),
                new Vector3(-5433.6,79.8,-35.6),
                new Vector3(-8064.4,68.3,156.2),
                new Vector3(320.0,5169.8,-7571.8),
                new Vector3(320.0,435.9,-2944.2)
            ]
        }else if(window.projectName==='XinYu'){
            route = [
                new Vector3(193.6,-12.8,-110.9),
                new Vector3(194.2,-13.0,-98.9),
                new Vector3(282.1,-11.8,-98.7),
                new Vector3(304.0,-12.1,-87.2),
                new Vector3(332.3,-21.6,-86.1),
                new Vector3(334.5,-22.0,-92.7),
                new Vector3(324.7,-22.4,-94.3),
                new Vector3(178.8,-22.2,-96.2),
                new Vector3(151.3,-21.8,-100.3),
                new Vector3(164.2,-21.6,-103.3),
                new Vector3(381.9,-18.7,-102.1),
                new Vector3(574.8,-16.4,-99.1),
                new Vector3(224.4,138.6,-221.4),
                new Vector3(257.9,-13.9,-88.5)
            ]
        }else if(window.projectName==='YunXi'){
            route = [
                new Vector3(-363.0,99.2,70.0),
                new Vector3(-242.5,51.6,69.2),
                new Vector3(-197.9,47.2,66.7),
                new Vector3(-192.2,45.3,-32.7),
                new Vector3(-2.6,49.1,-42.0),
                new Vector3(56.6,23.1,-74.2),
                new Vector3(35.3,20.1,-86.8),
                new Vector3(-209.5,22.0,-86.0),
                new Vector3(-157.6,46.0,-77.0),
                new Vector3(-237.3,47.1,-97.5),
                new Vector3(-322.2,47.6,-98.4),
                new Vector3(-405.3,48.0,-116.7),
                new Vector3(103.2,389.4,287.9),
                new Vector3(38.8,43.0,-30.6)
            ]
        }else{ }

        for(var i = 0; i < route.length; i++)
            route[i] = this.update_matrix(route[i])
        
        this.wanderControl = new WanderControl(this.defaultCamera, route, speed, this.slmLoader)
    }
}
