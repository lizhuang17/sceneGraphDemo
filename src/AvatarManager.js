import {GLTFLoader} from '../lib/three/examples/jsm/loaders/GLTFLoader'
import { Crowd } from '../lib/crowd/Crowd.js'
import {escapmap} from './map.js'
import { GridHelperX } from '../lib/GridHelperX'
import * as THREE from "three"

export class AvatarManager {
    constructor(scene, camera, count=1000, floors=1) {
        this.scene = scene
        this.camera = camera
        this.floors = floors
        this.count = count// 人物数量
        this.assets = {}//为了防止资源重复加载，相同路径的资源只加载一次
        this.maps = new escapmap()// 疏散网格
        this.map_edges=[]// 每层地图的边缘及高度

        this.poslist=[]
        this.phs = []
        this.ids = []
        this.dp = []
        this.times = []
        this.editing = -1
        this.planes = []
        this.gridHelper = []
        this.areas = []
        this.area_default = []
        this.area_size = []
        this.balls = []
        
        this.initMap(floors)// 可以放到其他地方

        // this.initPos()// 测试使用
        // this.init()// 可以放到其他地方
        // this.start()
    }
    initMap(floors){// 根据地图网格生成疏散网格
        var self=this
        for(var i = 0; i < floors; i++){
            var map = []
            // console.log("maps/"+window.projectName+"_map"+(i+2).toString()+"-1.csv")
            // var data = this.loadcsv("maps/"+window.projectName+"_map"+(i+2).toString()+"-1.csv")
            var data = this.loadcsv("KaiLiNan4-1.csv")
            data.then((value)=>{
                value.split('\n').forEach(function(v){
                    var line = []
                    v.split(',').forEach(function(w){
                        line.push(parseInt(w))
                    });
                    if(line.length == 5){
                        self.map_edges.push(line)
                        self.maps.map_edges.push(line)
                    }else if(line.length > 1){
                        map.push(line)
                    }
                });
                self.maps.init(map)
            }) 
        }
    }
    draw(){
        this.scene.add(this.smoke.meshs)
        // this.scene.add(this.maps.ext_mesh)
    }
    loadcsv(path){
        const loader = new THREE.FileLoader()
        return new Promise((resolve,reject)=>{
            loader.load(path, object=>{
                resolve(object)
            })
        })
        
    }
    enter_edit(floor){
        if(this.gridHelper.length==0){
            for(var i = 0; i < this.map_edges.length; i++){
                let line = this.map_edges[i]
                let help = new GridHelperX(line,1)
                help.position.set((line[0]+line[1])/2,(line[2]+line[3])/2,line[4])
                help.rotation.set(Math.PI/2,0,0)
                this.gridHelper.push(help)

                // 辅助平面，用作鼠标点击事件的位置获取
                let geo = new THREE.PlaneGeometry(10000, 10000)
                let plane = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({visible: false}))
                plane.position.set(0,0,this.map_edges[i][4])
                this.planes.push(plane)
                this.areas.push([])
                this.area_default.push([])
                this.area_size.push([])
                this.balls.push([])
            }
        }
        if(this.editing >= 0 || floor < 0){
            let self = this
            this.scene.remove(this.gridHelper[this.editing])
            this.scene.remove(this.planes[this.editing])
            this.balls[this.editing].forEach(function(e){self.scene.remove(e)})
            this.areas[this.editing].forEach(function(e){self.scene.remove(e)})
        }
        this.editing = floor
        if(floor >= 0){
            this.scene.add(this.gridHelper[floor])
            this.scene.add(this.planes[floor])
            for(var i=0; i<this.balls[floor].length;i++)this.scene.add(this.balls[floor][i])
            for(var i=0; i<this.areas[floor].length;i++)this.scene.add(this.areas[floor][i])
        }
    }
    add_editer(pos=[0,0,0],size=[100,100]){
        //一个plane 四个ball
        if(this.editing >= 0){
            let geop = new THREE.PlaneGeometry(size[0],size[1])
            let plane = new THREE.Mesh(geop, new THREE.MeshBasicMaterial({color: 0x0000ff, side: THREE.DoubleSide, transparent: true, opacity: 0.1}))
            plane.position.set(pos[0],pos[1],pos[2])

            this.scene.add(plane)
            this.areas[this.editing].push(plane)
            
            let geob = new THREE.SphereGeometry(2)
            let ball = new THREE.Mesh(geob, new THREE.MeshBasicMaterial({color: 0x00ff00, transparent: true, opacity: 0.6}))
            this.scene.add(ball)
            this.balls[this.editing].push(ball)
            ball.position.set(pos[0]-size[0]/2,pos[1]-size[1]/2,pos[2])
    
            let ball1 = new THREE.Mesh(geob, new THREE.MeshBasicMaterial({color: 0x00ff00, transparent: true, opacity: 0.6}))
            this.scene.add(ball1)
            this.balls[this.editing].push(ball1)
            ball1.position.set(pos[0]+size[0]/2,pos[1]-size[1]/2,pos[2])
    
            let ball2 = new THREE.Mesh(geob, new THREE.MeshBasicMaterial({color: 0x00ff00, transparent: true, opacity: 0.6}))
            this.scene.add(ball2)
            this.balls[this.editing].push(ball2)
            ball2.position.set(pos[0]+size[0]/2,pos[1]+size[1]/2,pos[2])
    
            let ball3 = new THREE.Mesh(geob, new THREE.MeshBasicMaterial({color: 0x00ff00, transparent: true, opacity: 0.6}))
            this.scene.add(ball3)
            this.balls[this.editing].push(ball3)
            ball3.position.set(pos[0]-size[0]/2,pos[1]+size[1]/2,pos[2])

            this.area_default[this.editing].push(size)
            this.area_size[this.editing].push(size)
        }
    }
    moveTogether(mr, mb){
        if(mr){
            let index = this.areas[this.editing].indexOf(mr)
            let size = this.area_size[this.editing][index]
            let pos = [mr.position.x, mr.position.y, mr.position.z]
            this.balls[this.editing][index*4].position.set(pos[0]-size[0]/2,pos[1]-size[1]/2,pos[2])
            this.balls[this.editing][index*4+1].position.set(pos[0]+size[0]/2,pos[1]-size[1]/2,pos[2])
            this.balls[this.editing][index*4+2].position.set(pos[0]+size[0]/2,pos[1]+size[1]/2,pos[2])
            this.balls[this.editing][index*4+3].position.set(pos[0]-size[0]/2,pos[1]+size[1]/2,pos[2])
        }else if(mb){
            let index = this.balls[this.editing].indexOf(mb)
            let index_a = Math.floor(index/4)
            let index_b = index-index_a*4
            let x = mb.position.x
            let y = mb.position.y
            switch(index_b){
                case 0:
                    var ball1 = this.balls[this.editing][index+1].position
                    this.balls[this.editing][index+1].position.set(ball1.x,y,ball1.z)
                    var ball3 = this.balls[this.editing][index+3].position
                    this.balls[this.editing][index+3].position.set(x,ball3.y,ball3.z)
                    this.resize_a(index_a)
                    break
                case 1:
                    var ball0 = this.balls[this.editing][index-1].position
                    this.balls[this.editing][index-1].position.set(ball0.x,y,ball0.z)
                    var ball2 = this.balls[this.editing][index+1].position
                    this.balls[this.editing][index+1].position.set(x,ball2.y,ball2.z)
                    this.resize_a(index_a)
                    break
                case 2:
                    var ball1 = this.balls[this.editing][index-1].position
                    this.balls[this.editing][index-1].position.set(x,ball1.y,ball1.z)
                    var ball3 = this.balls[this.editing][index+1].position
                    this.balls[this.editing][index+1].position.set(ball3.x,y,ball3.z)
                    this.resize_a(index_a)
                    break
                case 3:
                        var ball0 = this.balls[this.editing][index-3].position
                        this.balls[this.editing][index-3].position.set(x,ball0.y,ball0.z)
                        var ball2 = this.balls[this.editing][index-1].position
                        this.balls[this.editing][index-1].position.set(ball2.x,y,ball2.z)
                        this.resize_a(index_a)
                        break 
            }
        }
    }
    resize_a(index){
        let pos0 = this.balls[this.editing][index*4].position
        let pos2 = this.balls[this.editing][index*4+2].position
        this.areas[this.editing][index].position.set((pos0.x+pos2.x)/2, (pos0.y+pos2.y)/2, (pos0.z+pos2.z)/2)
        let scale = [pos2.x-pos0.x, pos2.y-pos0.y]
        this.areas[this.editing][index].scale.set(scale[0]/this.area_default[this.editing][index][0],scale[1]/this.area_default[this.editing][index][1])
        this.area_size[this.editing][index]=[pos2.x-pos0.x, pos2.y-pos0.y]
    }
    initPos(){// 位置信息

        for(var x=-5000;x<5000;x+=100){
            for(var y=-5000;y<5000;y+=100){
                this.poslist.push([x,y,1])
            }
        }
        console.log(this.poslist)
    }
    getConfig(){
        const c1={ 
            "path": [
                "assets/sim/woman01/"
            ],
            "pathTexture":[
                "./assets/textures_sim1/woman01/"
            ],
            "meshType":[
                {
    
                    "CloW_A_body_geo": "coat",
                    "CloW_A_kuzi_geo": "trousers",
                    "CloW_A_shangyi_geo": "coat",
                    "CloW_A_waitao_geo1": "coat",
                    "CloW_A_xiezi_geo": "xiezi",
                    "CloW_E_eyeLeft_geo02": "eye",
                    "CloW_E_eyeRight_geo01": "eye",
                    "eyelash": "eyelash",
                    "hair": "hair",
                    "head": "head",
                    "teeth": null
                }
            ],
            "lod_visible": [
                {
                    "CloW_A_kuzi_geo": 5,
                    "CloW_A_shangyi_geo": 4,
                    "head":4,
                    "CloW_A_body_geo": 3,
                    "CloW_A_waitao_geo1": 3,
                    "CloW_A_xiezi_geo": 3,
                    "CloW_E_eyeLeft_geo02": 2,
                    "CloW_E_eyeRight_geo01": 2,
                    "eyelash": 2,
                    "hair": 3
                }
            ],
            "useColorTag": [
                "CloW_A_kuzi_geo",
                "CloW_A_waitao_geo1",
            ],
            "walkAnimationList": [
                5,8
            ],
            "sitAnimationList": [
            ],
            "standAnimationList": [
                0,1,2,3,4,6,7,9,10,11,12
            ],
            "pathAnima":  "assets/animation_woman0.bin" ,

            "lod_distance":[ 5000, 15000, 30000, 60000, 100000 ],
            "lod_geometry":    [ 20,  15,   1,    0,   0  ],
            "lod_avatarCount": [ 200, 900, 3240, 8800, 12600]
        }
        const c0={
            "path": [
                "assets/sim/man02/"
            ],
            "pathTexture":["./assets/textures_sim1/man02/"],
            "meshType":[{
                CloM_B_body_geo: "body",
                CloM_B_chenshan_geo: "coat",
                CloM_B_eyeLeft_geo1: "eye",
                CloM_B_eyeRight_geo1: "eye",
                CloM_B_kuzi_geo: "coat",
                CloM_B_waitao_geo: "coat",
                CloM_B_xie_geo: "shoes",
                eyelash: "eyelash",
                hair: "hair",
                head: "head",
                teeth: null
            }],
            "lod_visible": [{
                CloM_B_body_geo: 3,
                CloM_B_chenshan_geo: 3,
                CloM_B_eyeLeft_geo1: 2,
                CloM_B_eyeRight_geo1: 2,
                CloM_B_kuzi_geo: 4,
                CloM_B_waitao_geo: 5,
                CloM_B_xie_geo: 3,
                eyelash: 2,
                hair: 3,
                head: 4,
            }],
            "useColorTag": ["CloM_B_kuzi_geo", "CloM_B_waitao_geo"],
            "walkAnimationList": [
                5,8
            ],
            "sitAnimationList": [
            ],
            "standAnimationList": [
                0,1,2,3,4,6,7,9,10,11,12
            ],
            "pathAnima":  "assets/animation_man02.bin",

            "lod_distance":[ 100000 ],
            "lod_geometry":    [ 20 ],
            "lod_avatarCount": [ 200 ]
        }
        return c1
    }
    start(){
        let def = true
        for(var i=0;i<this.areas.length;i++)
            if(this.areas[i].length!=0)
                def = false
        this.setPos(def)
        this.init()
    }
    setPos(def = false){// 随机设置人物位置 
        if(!def){
            for(var i=0;i<this.count;i++){
                var x=0, y=0;
                do{
                    x = Math.round(this.areas[0][0].position.x - (Math.random()-0.5) * this.area_size[0][0][0])
                    y = Math.round(this.areas[0][0].position.y - (Math.random()-0.5) * this.area_size[0][0][1])
                }while(this.maps.grids[0][Math.floor((x-this.map_edges[0][1])/4)][Math.floor((y-this.map_edges[0][3])/4)].ph <= 0)
                this.maps.grids[0][Math.floor((x-this.map_edges[0][1])/4)][Math.floor((y-this.map_edges[0][3])/4)].setpeople(i)
                this.poslist.push([Math.floor((x-this.map_edges[0][1])/4),Math.floor((y-this.map_edges[0][3])/4),this.map_edges[0][4]])
                this.phs.push(this.maps.grids[0][Math.floor((x-this.map_edges[0][1])/4)][Math.floor((y-this.map_edges[0][3])/4)].ph0)
                this.ids.push(i)
                this.times.push(0)
                this.dp.push([0,0,0])
            }
        }else{
            for(var i=0;i<this.count;i++){
                var x=0, y=0;
                do{
                    x = Math.floor(Math.random()*(this.map_edges[0][0]-this.map_edges[0][1]-1)/4)
                    y = Math.floor(Math.random()*(this.map_edges[0][2]-this.map_edges[0][3]-1)/4)
                }while(this.maps.grids[0][x][y].ph <= 0)
                this.maps.grids[0][x][y].setpeople(i)
                this.poslist.push([x,y,this.map_edges[0][4]])
                this.phs.push(this.maps.grids[0][x][y].ph0)
                this.ids.push(i)
                this.times.push(0)
                this.dp.push([0,0,0])
            }
        }
        let self = this
        this.ids.sort((a,b)=>{
            let ida = self.ids.indexOf(a)
            let idb = self.ids.indexOf(b)
            return self.phs[ida]-self.phs[idb]})
        // for(var i=0;i<1000;i++){
        //     for(var j=0;j<1000;j++){
        //         this.poslist.push([i*4,j*4,0])
        //     }
        // }
        // console.log(this.poslist)
    }
    init() {
        const c=this.getConfig()
        const self = this
        new GLTFLoader().load(c.path+"sim.glb", async (glb0) => {
            process([glb0.scene],0)
        })
        function process(scenes){
            self.crowd = new Crowd({
                camera: self.camera,
                assets: {},
                animPathPre: c.pathAnima,
                count: self.count,
                lod_avatarCount:  c.lod_avatarCount,
                lod_distance:  c.lod_distance,
                lod_geometry:  c.lod_geometry,
                lod_visible: c.lod_visible,
                meshType: c.meshType,
                pathLodGeo: [c.path+"LOD/"],
                pathTexture: c.pathTexture,
                pathTextureConfig: [c.path+"texture_names.json"],
                useColorTag:  c.useColorTag
            })
            for (var i00 = 0; i00 < self.crowd.count; i00++) {
                const p=self.poslist[i00]
                self.crowd.setPosition(i00,[p[0]*4+self.map_edges[0][1]+Math.random()*4,p[1]*4+self.map_edges[0][3]+Math.random()*4,p[2]])
                self.crowd.setRotation(i00,[Math.PI/2,Math.PI,0])
                self.crowd.setAnimation(
                    i00,
                    5,
                    Math.random()*10000
                    )
                self.crowd.setSpeed(i00, 1+4*Math.random())
                self.crowd.setScale(i00, [
                    10,
                    10*(1-0.2+0.2*Math.random()),
                    10])
                self.crowd.setObesity(i00, 0.8+0.4*Math.random())
                const j=10
                self.crowd.setColor(i00,[j*Math.random()*2,j*Math.random(),j*Math.random()],"CloW_A_kuzi_geo")
                self.crowd.setColor(i00,[j*Math.random()*2,j*Math.random(),j*Math.random()],"CloW_A_waitao_geo1")
            }
            self.crowd.init(scenes)
            self.scene.add(self.crowd)
        }
    }
    update(_this, delta){
        let count=0
        let time = delta*10
        for(var j=0;j<this.count;j++){
            let i = this.ids[j]
            if(this.poslist[i] ){
                let old = this.poslist[i]
                let pos = this.maps.grids[0][this.poslist[i][0]][this.poslist[i][1]].nextstep()
                let index = 9-pos.splice(0,1)
                this.phs[i] = pos.splice(0,1)
                this.times[i] = 1-time
                this.poslist[i]=pos
                if(this.maps.grids[0][this.poslist[i][0]][this.poslist[i][1]].ph0==0){
                    this.poslist[i]=null
                    this.crowd.setScale(i, [0,0,0])
                }
                this.dp[i] = [(pos[0]-old[0])*4, (pos[1]-old[1])*4, 0]
                //this.crowd.setPosition(i, [pos[0]*4+this.map_edges[0][1]+2, pos[1]*4+this.map_edges[0][3]+2,this.map_edges[0][4]])  
                this.crowd.move(i, [this.dp[i][0], this.dp[i][1], 0])
                this.crowd.setRotation(i, [Math.PI/2, index/4*Math.PI, 0])
                count++
            }
            // else if(this.poslist[i] && this.times[i] > 0){
            //     // console.log(i, this.times[i])
            //     this.crowd.move(i, [this.dp[i][0]*time, this.dp[i][1]*time, 0])
            //     this.times[i]-=time
            //     count++
            // }
        }
        this.ids.sort((a,b)=>{
            let ida = this.ids.indexOf(a)
            let idb = this.ids.indexOf(b)
            return this.phs[ida]-this.phs[idb]})
        if(count == 0)
        _this.ispeople=1

        this.crowd.update()
    }
}