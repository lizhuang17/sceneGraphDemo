import * as THREE from "three"
const AmbientLight=THREE.AmbientLight,
DirectionalLight=THREE.DirectionalLight,
PerspectiveCamera=THREE.PerspectiveCamera,
Scene=THREE.Scene,
sRGBEncoding=THREE.sRGBEncoding,
Vector3=THREE.Vector3,
WebGLRenderer=THREE.WebGLRenderer,
// PlaneGeometry=THREE.PlaneGeometry,
// Mesh=THREE.Mesh,
// MeshBasicMaterial=THREE.MeshBasicMaterial,
Matrix4=THREE.Matrix4

import {GUI} from 'dat.gui'
import {MyUI} from "../lib/MyUI.js"
import Stats from '../lib/three/examples/jsm/libs/stats.module.js'
import {OrbitControls} from '../lib/three/examples/jsm/controls/OrbitControls.js'
import {WanderControl} from "../lib/WanderControl"
// import { PlayerControl } from '../lib/PlayerControl'
import { smokemap } from './map_smoke.js'
import { AvatarManager } from './AvatarManager.js'
import { _SRGBAFormat } from "three"
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

        this.sceneEx = this.scene//new Scene()
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
        if(window.projectName==='KaiLiNan'){
            speed = 200
            this.vc = this.update_matrix(new Vector3(-467.5,31.3,74.5))
        }

        // window.playerControl = this.playerControl = new PlayerControl(this.defaultCamera, speed/5)
        window.orbitControl = this.orbitControl = new OrbitControls(this.defaultCamera, this.renderer.domElement)
        // this.orbitControl.autoRotate = false
        //this.orbitControl.autoRotateSpeed = -speed
        // this.orbitControl.screenSpacePanning = true

        this.el.appendChild(this.renderer.domElement)

        this.addGUI()
        // this.addMyUI()
        this.addWanderControl(speed*2)

        this.animate = this.animate.bind(this)
        requestAnimationFrame(this.animate)

        window.addEventListener('resize', this.resize.bind(this), false)

        this.setupScene()
        if(false){
            this.groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(10000,10000), new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide, color:0xffffff}))
            this.groundMesh.position.set(0,0,550)
            this.sceneEx.add(this.groundMesh)
            this.ray = new THREE.Raycaster()
        }
            
        //     this.pressed = false 
        // }
        var _self = this
        this.map = new smokemap(this.sceneEx)
        this.people = new AvatarManager(this.sceneEx, this.defaultCamera, this.map.maps)
        this.globalPlane = new THREE.Plane( new THREE.Vector3( 0, 0, -1 ), 0.1 );
        this.globalPlane.constant =10000;//剖切的位置
        this.renderer.clippingPlanes.push(this.globalPlane);
        this.renderer.localClippingEnabled = true;
        this.cp_o = null
        this.cr_o = null
        this.ifsmoke = 1
        this.ifpeople = 1
        this.vis = false
        this.follow_p = false
        this.start_button = document.getElementById("start_b");
        this.start_button.addEventListener("click", function() {
            console.log("按钮被点击了！");
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
        material.opacity=0.7
        material.transparent=true
        
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
            if(_self.ray){
                let point = new THREE.Vector2(( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1)
                _self.ray.setFromCamera( point, _self.defaultCamera );
                let ins = _self.ray.intersectObjects( [_self.groundMesh], false );
                if(ins.length > 0 && _self.vis) _self.map.smoke_plane.fire_alarm(ins[0].point)
            }
        }

        // this.onMouseUp = function(event){
        // }

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
        if(this.map.map.length != 0 && !this.map.finish_load)
            this.map.init(this.renderer)
        if(this.map.maps.finish_load && this.map.finish_load && this.people.seted){
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
        new ui.Button("Smoke alarm simulation", "#F4A460", '#F4A430', '#FFD700',
            height/40, 10,
            width/4, height/20,
            width/50,13.5*height/15,()=>{
            this.vis = !this.vis
            if(this.vis){
                this.globalPlane.constant =549
                this.cp_o = [this.defaultCamera.position.x,this.defaultCamera.position.y,this.defaultCamera.position.z]
                this.cr_o = [this.defaultCamera.rotation.x,this.defaultCamera.rotation.y,this.defaultCamera.rotation.z]
                this.defaultCamera.position.set(127,56,1543)
                this.defaultCamera.lookAt(127,56,480)
                this.ifpeople+=1
                this.ifsmoke+=1
            }
            else{
                this.defaultCamera.position.copy(new THREE.Vector3(this.cp_o[0], this.cp_o[1], this.cp_o[2]))
                this.defaultCamera.rotation.set(this.cr_o[0], this.cr_o[1], this.cr_o[2])
                this.globalPlane.constant = 10000
                this.ifpeople+=1
                this.ifsmoke+=1
            }
        });
        new ui.Button("Follow escapee", "#F4A460", '#F4A430', '#FFD700',
        height/40, 10,
        width/6, height/20,
        2.8*width/10,13.5*height/15,()=>{
        if(!this.follow_p){
            console.log("start wander")
            this.follow_p = true
        } else {
            console.log("stop wander")
            this.follow_p = false
        }
    });
        window.content = this.content
    }

    setCamera(){
        window.orbitControl.target.set(478, 232, 520)
        this.defaultCamera.position.copy(new THREE.Vector3(46, 428, 520))
        this.defaultCamera.rotation.set(-1.4224373930666911,-0.6568369064643255,-3.050584019382628)
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
