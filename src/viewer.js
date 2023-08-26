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
Matrix4=THREE.Matrix4

import {GUI} from 'dat.gui'
import {MyUI} from "../lib/MyUI.js"
import Stats from '../lib/three/examples/jsm/libs/stats.module.js'
import {OrbitControls} from '../lib/three/examples/jsm/controls/OrbitControls.js'
import {WanderControl} from "../lib/WanderControl"
import { smokemap } from './map_smoke.js'
import { AvatarManager } from './AvatarManager.js'

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

        this.sceneEx = this.scene
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

        this.renderer.clippingPlanes = []
        this.renderer.localClippingEnabled = false;

        this.vc = this.update_matrix(new Vector3(-467.5,31.3,74.5))
        window.orbitControl = this.orbitControl = new OrbitControls(this.defaultCamera, this.renderer.domElement)

        this.el.appendChild(this.renderer.domElement)

        this.addGUI()
        let route = [new THREE.Vector3(652,758,345),
            new THREE.Vector3(182,753,520),
            new THREE.Vector3(61,346,502),
            new THREE.Vector3(-481,242,502),
            new THREE.Vector3(411,304,506),
            new THREE.Vector3(103,90,502),
            new THREE.Vector3(91,-513,506),
            new THREE.Vector3(-428,-543,502),
            new THREE.Vector3(46, 428, 520),
            new THREE.Vector3(478, 232, 520)
            ]
        this.wanderControl = new WanderControl(this.defaultCamera, route, 200)

        this.animate = this.animate.bind(this)
        requestAnimationFrame(this.animate)

        window.addEventListener('resize', this.resize.bind(this), false)

        this.setupScene()
        this.groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(10000,10000), new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide, color:0xffffff}))
        this.groundMesh.position.set(0,0,550)
        this.sceneEx.add(this.groundMesh)
        this.ray = new THREE.Raycaster()
        var _self = this
        this.map = new smokemap(this.sceneEx)
        this.map.maps.init()
        this.people = new AvatarManager(this.sceneEx, this.defaultCamera, this.map.maps)
        this.fire_alarm = new THREE.Mesh(new THREE.SphereGeometry(3), new THREE.MeshStandardMaterial({color: 0xff0000, emissive: 0xff0000, clippingPlanes: this.renderer.clippingPlanes}))
        this.globalPlane = new THREE.Plane( new THREE.Vector3( 0, 0, -1 ), 0.1 );
        this.globalPlane.constant =10000;//剖切的位置
        this.renderer.clippingPlanes.push(this.globalPlane);
        this.renderer.localClippingEnabled = true;
        this.cp_o = null
        this.cr_o = null
        this.ifsmoke = 1
        this.ifpeople = 1
        this.vis = false
        this.set_fire = false
        this.follow_p = false
        let listener1 = new THREE.AudioListener();
        this.sirenSound = new THREE.Audio( listener1 )
        let listener2 = new THREE.AudioListener();
        this.noiseSound = new THREE.Audio( listener2 )
        const slider_fire = document.getElementById('slider_fire')
		const slider_people = document.getElementById('slider_people')
		const crowd = document.getElementById('crowd')
		const fire = document.getElementById('fire')
		slider_people.addEventListener('input', event=>{
			let value = event.target.value
			crowd.textContent = value
            _self.people.count = value
		})
		slider_fire.addEventListener('input', event=>{
			let value = event.target.value
			fire.textContent = value
            _self.map.smoke_plane.speed = value
		})
        const c_button = document.getElementById("crowd_b");
        c_button.addEventListener("click", function() {
            document.getElementById("crowd_line").style.display="none"
            _self.people.seted = true
        });
        this.start_button = document.getElementById("start_b");
        this.start_button.addEventListener("click", function() {
            if(!_self.map.finish_load)
                _self.map.init(_self.renderer)
            var audioLoader = new THREE.AudioLoader();
            audioLoader.load( 'noisy.wav', function( buffer ) {
                _self.noiseSound.setBuffer( buffer );
                _self.noiseSound.setLoop(true);
                _self.noiseSound.setVolume(0.5);
                _self.noiseSound.play();
            });
            var audioLoader2 = new THREE.AudioLoader();
            audioLoader2.load( 'siren.wav', function( buffer ) {
                _self.sirenSound.setBuffer( buffer );
                _self.sirenSound.setLoop(true);
                _self.sirenSound.setVolume(0.5);
                _self.sirenSound.play();
            });
            _self.ifpeople++
            _self.ifsmoke++
            _self.start_button.style.display="none"
        });
        //ground 311
        var tex_g = new THREE.TextureLoader().load( 'ground.jpeg' )// 地面贴图
        tex_g.wrapS=tex_g.wrapT=THREE.RepeatWrapping
        tex_g.repeat.set(50,50)
        const material=new THREE.MeshStandardMaterial({map: tex_g})
        material.side=2
        material.metalness=1
        material.roughness=0.5
        // material.opacity=0.7
        // material.transparent=true
        this.ground_t = new THREE.Mesh(new THREE.PlaneGeometry(5000,5000), material)
        this.ground_t.position.set(0,0,311)
        this.sceneEx.add(this.ground_t)
        this.onKeyDown = function (event){
            if(event.key==="P"||event.key==="p"){
                _self.ifpeople++
                _self.ifsmoke++
            }else if(event.key==="m" || event.key==="M"){
                _self.vis = !_self.vis
            }else if(event.key === "c" || event.key === "C"){
                console.log(_self.defaultCamera)
            }
        }


        this.onKeyUp = function (event){
            if(event.key==="m" || event.key==="M"){
                _self.vis = !_self.vis
            }
        }

        this.onMouseDown = function(event){
            let point = new THREE.Vector2(( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1)
            _self.ray.setFromCamera( point, _self.defaultCamera );
            let ins = _self.ray.intersectObjects( [_self.groundMesh], false );
            if(ins.length > 0 && _self.vis && _self.map.finish_load){
                _self.map.smoke_plane.fire_alarm(ins[0].point)
                _self.fire_alarm.position.set(ins[0].point.x, ins[0].point.y, ins[0].point.z+3)
            }else if(ins.length > 0 && _self.set_fire){
                console.log(ins[0].point)
                _self.map.add_fire([ins[0].point.x, ins[0].point.y])
            }  
        }

        document.addEventListener( 'keydown', this.onKeyDown, true)
        document.addEventListener( 'keyup', this.onKeyUp, true)
        document.addEventListener( 'mousemove', this.onMouseMove, true );
        document.addEventListener( 'mousedown', this.onMouseDown, true );
        document.addEventListener( 'mouseup', this.onMouseUp, true );
        this.getCubeMapTexture('assets/environment/skybox.jpg').then(
            ({ envMap }) => {
                // alert(envMap)
                window.scene=_self.scene
                // console.log(_self.scene)
                _self.scene.background = envMap
                //   _self.scene.backgroundIntensity=0.8
                //   _self.scene.backgroundIntensity=0.4
                //   self.unrealBloom.bloomPass.strength=0.55
                _self.scene.environment = envMap
            }
        )
    }
    getCubeMapTexture(path) {
        var scope = this
        return new Promise((resolve, reject) => {//'.exr'
            new THREE.TextureLoader()
            //.setDataType(THREE.FloatType)
            .load(
                path,
                texture => {
                const pmremGenerator = new THREE.PMREMGenerator(scope.renderer)
                pmremGenerator.compileEquirectangularShader()

                const envMap =//texture
                    pmremGenerator.fromEquirectangular(texture).texture
                pmremGenerator.dispose()

                resolve({ envMap })
                },
                undefined,
                reject
            )
        })
    }
    animate(){
        requestAnimationFrame(this.animate)

        this.stats.update()
        if(this.map.maps.finish_load && this.people.seted){
            this.people.setPos()
            this.start_button.style.display="block"
        }
        if(this.ifpeople != 0 && this.ifpeople % 2 == 0)
            this.people.update()
        if(this.ifsmoke != 0 && this.ifsmoke % 2 == 0)
            this.map.update()
        if(this.follow_p)
            this.people.follow(this.defaultCamera)
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

        let ui = new MyUI()
        var width=window.innerWidth
        var height=window.innerHeight
        new ui.Button("Wander", "#F4A460", '#F4A430', '#FFD700',
            height/40, 10,
            width/8, height/20,
            width/50,13.5*height/15,()=>{
            if(!this.wanderControl.wander){
                console.log("start wander")
                this.wanderControl.init()
                this.wanderControl.startWander()
            } else {
                console.log("stop wander")
                this.wanderControl.wander = false
            }
        });
        new ui.Button("Set Fire", "#F4A460", '#F4A430', '#FFD700',
            height/40, 10,
            width/8, height/20,
            1.5*width/10,13.5*height/15,()=>{
            this.set_fire = !this.set_fire
            this.wanderControl.wander = false
            if(this.set_fire){
                this.groundMesh.position.set(0,0,550)
                document.getElementById("setfire").style.display="block"
                document.getElementById("start_b").style.display="none"
                document.getElementById("fire_line").style.display="block"
                this.globalPlane.constant =549
                this.cp_o = [this.defaultCamera.position.x,this.defaultCamera.position.y,this.defaultCamera.position.z]
                this.cr_o = [this.defaultCamera.rotation.x,this.defaultCamera.rotation.y,this.defaultCamera.rotation.z]
                this.defaultCamera.position.set(127,56,1543)
                this.defaultCamera.lookAt(127,56,480)
            }
            else{
                document.getElementById("start_b").style.display="block"
                document.getElementById("setfire").style.display="none"
                document.getElementById("fire_line").style.display="none"
                this.defaultCamera.position.copy(new THREE.Vector3(this.cp_o[0], this.cp_o[1], this.cp_o[2]))
                this.defaultCamera.rotation.set(this.cr_o[0], this.cr_o[1], this.cr_o[2])
                this.globalPlane.constant = 10000
                this.ifsmoke++
            }
        });
        new ui.Button("Smoke simulation", "#F4A460", '#F4A430', '#FFD700',
            height/40, 10,
            width/6, height/20,
            2.8*width/10,13.5*height/15,()=>{
            this.wanderControl.wander = false
            if(!this.map.finish_load)
                this.map.init(this.renderer)
            this.vis = !this.vis
            if(this.ifsmoke==1)
                this.ifsmoke++
            if(this.vis){
                this.set_fire = false
                this.groundMesh.position.set(0,0,550)
                this.sceneEx.add(this.fire_alarm)
                document.getElementById("abstract").style.display="block"
                document.getElementById("start_b").style.display="none"
                document.getElementById("setfire").style.display="none"
                document.getElementById("fire_line").style.display="none"
                this.globalPlane.constant =549
                this.cp_o = [this.defaultCamera.position.x,this.defaultCamera.position.y,this.defaultCamera.position.z]
                this.cr_o = [this.defaultCamera.rotation.x,this.defaultCamera.rotation.y,this.defaultCamera.rotation.z]
                this.defaultCamera.position.set(127,56,1543)
                this.defaultCamera.lookAt(127,56,480)
            }
            else{
                document.getElementById("start_b").style.display="block"
                document.getElementById("abstract").style.display="none"
                this.defaultCamera.position.copy(new THREE.Vector3(this.cp_o[0], this.cp_o[1], this.cp_o[2]))
                this.defaultCamera.rotation.set(this.cr_o[0], this.cr_o[1], this.cr_o[2])
                this.globalPlane.constant = 10000
                this.sceneEx.remove(this.fire_alarm)
                this.ifsmoke++
                this.map.rebuild()
            }
        });
        // new ui.Button("Follow evacuee", "#F4A460", '#F4A430', '#FFD700',
        //     height/40, 10,
        //     width/6, height/20,
        //     4.05*width/10,13.5*height/15,()=>{
        //     if(!this.follow_p){
        //         console.log("start wander")
        //         this.follow_p = true
        //     } else {
        //         console.log("stop wander")
        //         this.follow_p = false
        //     }
        // });
        
        window.content = this.content
    }

    setCamera(){
        window.orbitControl.target.set(478, 232, 520)
        this.defaultCamera.position.set(906.4026407251268,  2040.6948402673988,  545.409892018307)
        this.defaultCamera.lookAt(163.7,107.0,102.8)
        this.activeCamera = this.defaultCamera
        window.camera=this.activeCamera
    }

    update_matrix(pos){
        var scale = 55.7848934508535
        var tran = [-19.2,2.97,0.8]
        var m = [2498.2609999999995,0,0,0,0,5.547253767446135e-13,2498.2609999999995,0,0,-2498.2609999999995,5.547253767446135e-13,0,-60839.49374999999,60839.52499999998,-60839.52500000001,1]
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
}
