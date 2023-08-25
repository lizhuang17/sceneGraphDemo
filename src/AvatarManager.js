import {GLTFLoader} from '../lib/three/examples/jsm/loaders/GLTFLoader'
// import { Crowd } from '../lib/crowd/Crowd.js'
import { Instanced5Object } from '../lib/crowd/Instanced5Object'//let Crowd=Pack// 
import * as THREE from "three"
export class AvatarManager {
    constructor(scene, camera, map, count=200) {
        this.scene = scene
        this.camera = camera
        this.count = count// 人物数量
        this.persent = [0.5,0.25,0.25]
        this.assets = {}//为了防止资源重复加载，相同路径的资源只加载一次
        this.maps = map// 疏散网格
        this.map_edges=[[1321,-1322,786,-751,481]]// 每层地图的边缘及高度
        this.crowd = []
        this.poslist=[]
        this.ground=[]
        this.es = []
        this.phs = []
        this.ids = []
        this.dp = []
        this.times = []
        this.seted = true
        this.camerapos = []
    }
    setPos(){// 随机设置人物位置 
        this.seted = false
        for(var i=0;i<this.count;i++){
            var x=0, y=0;
            do{
                x = Math.floor(Math.random()*(this.map_edges[0][0]-this.map_edges[0][1]-1)/4)
                y = Math.floor(Math.random()*(this.map_edges[0][2]-this.map_edges[0][3]-1)/4)
            }while(this.maps.grids[x][y].ph0 <= 0)
            this.maps.grids[x][y].setpeople(i)
            this.poslist.push([x,y,this.map_edges[0][4]-1])
            this.phs.push(this.maps.grids[x][y].ph0)
            this.ids.push(i)
            this.times.push(0)
            this.dp.push([0,0,0])
            this.es.push((Math.random()*0.5 + 0.5))
            this.ground.push(481)
        }
        let self = this
        this.ids.sort((a,b)=>{
            let ida = self.ids.indexOf(a)
            let idb = self.ids.indexOf(b)
            return self.phs[ida]-self.phs[idb]})
        this.camerapos.push(this.poslist[this.ids[this.count-1]][0],this.poslist[this.ids[this.count-1]][1], 510)
        let count_i = 0
        const interv = setInterval(function(){
            self.init(count_i)
            count_i++
            console.log(count_i)
            if(count_i == 2) clearInterval(interv)
        },500)
    }
    getConfig(i){
        const c0={ 
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
                "CloW_A_shangyi_geo",
                "CloW_A_waitao_geo1",
                "CloW_A_xiezi_geo"
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
        const c1={ 
            "path": [
                "assets/sim/man01/"
            ],
    
            "pathTexture":[
                "./assets/textures_sim1/man01/"
            ],
            "meshType":[
                {
                    "CloM_A_hair_geo":"hair",
                    "CloM_A_body_geo":"body",
                    "CloM_A_chengyi_geo":"coat",
                    "CloM_A_lingdai_geo":"coat",
                    "CloM_A_xiezi_geo":"shoes",
                    "CloM_A_xiukou_geo":"coat",
                    "CloM_A_xizhuang_geo":"coat",
                    "CloM_A_xizhuangku_geo":"coat",
                    "CloM_B_eyeLeft_geo2":"eye",
                    "CloM_B_eyeRight_geo2":"eye",
                    "head":"head",
                    "eyelash":"eyelash",
                    "teeth":null
    
                }
            ],
            "lod_visible": [
                {
                    
                    "CloM_A_xizhuang_geo":5,
                    "CloM_A_xizhuangku_geo":4,
                    "head":4,
                    
                    "CloM_A_hair_geo":3,
                    "CloM_A_body_geo":3,
                    "CloM_A_chengyi_geo":3,
                    "CloM_A_lingdai_geo":3,
                    "CloM_A_xiezi_geo":3,
                    "CloM_A_xiukou_geo":3,
                    
                    "CloM_B_eyeLeft_geo2":2,
                    "CloM_B_eyeRight_geo2":2,
                    "eyelash":2
                }
            ],
            "useColorTag": [
                "CloW_A_xifu_geo",
                "CloW_A_kuzi_geo",
                "CloW_E_shangyi_geo",
                "CloW_E_kuzi_geo"
            ],
            "walkAnimationList": [
                5,8
            ],
            "sitAnimationList": [  
            ],
            "standAnimationList": [
                0,1,2,3,4,6,7,9,10
            ],
            "pathAnima":  "assets/animation_man0.bin" ,

            "lod_distance":[ 5000, 15000, 30000, 60000, 100000 ],
            "lod_geometry":    [ 20,  15,   1,    0,   0  ],
            "lod_avatarCount": [ 200, 900, 3240, 8800, 12600]
        }
        // const c2={ 
        //     "path": [
        //         "assets/sim/man02/"
        //     ],
        //     "pathTexture":[
        //         "./assets/textures_sim1/man02/"
        //     ],
        //     "meshType":[
        //         {
        //             "CloM_B_eyeLeft_geo1": "eye",
        //             "CloM_B_eyeRight_geo1": "eye",
        //             "eyelash": "eyelash",
        //             "teeth": null,
        //             "hair": "hair",
        //             "head": "head",
        //             "CloM_B_body_geo": "body",
        //             "CloM_B_chenshan_geo":"coat",
        //             "CloM_B_kuzi_geo": "coat",
        //             "CloM_B_waitao_geo": "coat",
        //             "CloM_B_xie_geo": "shoes"
    
        //         }
        //     ],
        //     "lod_visible": [
        //         {
        //             "CloM_B_eyeLeft_geo1": 2,
        //             "CloM_B_eyeRight_geo1": 2,
        //             "eyelash": 2,
        //             "hair": 3,
        //             "head": 4,
        //             "CloM_B_body_geo": 3,
        //             "CloM_B_chenshan_geo":3,
        //             "CloM_B_kuzi_geo": 4,
        //             "CloM_B_waitao_geo": 5,
        //             "CloM_B_xie_geo": 3
        //         }
        //     ],
        //     "useColorTag": [
        //         "CloM_B_kuzi_geo",
        //         "CloM_B_waitao_geo"
        //     ],
            
    
        //     "walkAnimationList": [
        //         21,12
        //     ],
        //     "sitAnimationList": [
                
        //     ],
        //     "standAnimationList": [
        //         0,1,2,3,4,5,6,7,8,9,10,11,13,14,15,16,17,18,19,20,22,23,24,25,26,27
        //     ],
        //     "pathAnima":  "assets/animation_man02.bin" ,

        //     "lod_distance":[ 5000, 15000, 30000, 60000, 100000 ],
        //     "lod_geometry":    [ 20,  15,   1,    0,   0  ],
        //     "lod_avatarCount": [ 200, 900, 3240, 8800, 12600]
        // }
        switch(i){
            case 0:
                return c0
            case 1:
                return c1
            case 2:
                return c2
            default:
                return c0
        }
    }
    init(i) {
        const c=this.getConfig(i)
        const self = this
        new GLTFLoader().load(c.path+"sim.glb", async (glb0) => {
            process([glb0.scene],0)
        })
        function process(scenes){
            self.crowd.push(new Instanced5Object({//new Crowd({//
                camera: self.camera,
                assets: {},
                animPathPre: c.pathAnima,
                count: self.count*self.persent[i],
                lod_avatarCount:  c.lod_avatarCount,
                lod_distance:  c.lod_distance,
                lod_geometry:  c.lod_geometry,
                lod_visible: c.lod_visible,
                meshType: c.meshType,
                pathLodGeo: [c.path+"LOD/"],
                pathTexture: c.pathTexture,
                pathTextureConfig: [c.path+"texture_names.json"],
                useColorTag:  c.useColorTag
            })) 
            for (var i00 = 0; i00 < self.crowd[i].count; i00++) {
                if(i == 1)
                    var p = self.poslist[i00+self.count*self.persent[0]]
                else if(i == 2)
                    var p = self.poslist[i00+self.count*self.persent[0]+self.count*self.persent[1]]
                else
                    var p = self.poslist[i00]
                self.crowd[i].setPosition(i00,[p[0]*4+self.map_edges[0][1]+Math.random()*4,p[1]*4+self.map_edges[0][3]+Math.random()*4,p[2]])
                self.crowd[i].setRotation(i00,[Math.PI/2,Math.PI,0])
                if(i==2)
                    self.crowd[i].setAnimation(
                        i00,
                        12,
                        Math.random()*10000
                        )
                else
                    self.crowd[i].setAnimation(
                        i00,
                        5,
                        Math.random()*10000
                        )  
                self.crowd[i].setSpeed(i00, 5)
                self.crowd[i].setScale(i00, [
                    18,
                    18*(1-0.2+0.2*Math.random()),
                    18])
                self.crowd[i].setObesity(i00, 0.8+0.4*Math.random())
                const j=10
                self.crowd[i].setColor(i00,[j*Math.random()*2,j*Math.random(),j*Math.random()],"CloW_A_kuzi_geo")
                self.crowd[i].setColor(i00,[j*Math.random()*2,j*Math.random(),j*Math.random()],"CloW_A_waitao_geo1")
            }
            self.crowd[i].init(scenes)
            self.scene.add(self.crowd[i])
        }
    }
    update(){
        for(var j=0;j<this.count;j++){
            let i = this.ids[j]
            let n = 0
            let de = 0
            if(i >= this.count*this.persent[0]){
                if(i >= this.count*(1-this.persent[2])){
                    n = 2
                    de = this.count*(1-this.persent[2])
                }
                else{
                    n = 1
                    de = this.count*this.persent[0]
                }
            }
            if(this.poslist[i]){
                let old = this.poslist[i]
                let pos = this.maps.nextstep(this.poslist[i],this.es[i])
                this.es[i] = pos.splice(-1,1)[0]
                let index = 9-pos.splice(0,1)
                this.phs[i] = pos.splice(0,1)
                this.poslist[i] = pos
                this.dp[i] = [(pos[0]-old[0])*4, (pos[1]-old[1])*4, 0]
                this.crowd[n].move(i-de, [this.dp[i][0], this.dp[i][1], 0])
                if(index <= 9)
                    this.crowd[n].setRotation(i-de, [Math.PI/2, index/4*Math.PI, 0])
                if(this.maps.grids[this.poslist[i][0]][this.poslist[i][1]].ph0==0){
                    this.poslist[i]=null
                    this.crowd[n].setRotation(i-de, [Math.PI/2,-Math.PI/2,0])
                }
            }
            else{
                if(this.ground[i] >= 311){
                    if((this.ground[i] <= 444 && this.ground[i] > 443) || (this.ground[i] <= 400 && this.ground[i] > 399 ) || (this.ground[i] <= 356 && this.ground[i] > 355)){
                        // console.log(1)
                        this.crowd[n].move(i-de, [2, 0, 0])
                        this.ground[i]-=0.1
                    }else{
                        this.crowd[n].move(i-de, [2, 0, -1])
                        this.ground[i]-=1
                    }
                }else if(this.ground[i] < 311){
                    this.crowd[n].move(i-de, [10000, 10000, 10000])
                    this.crowd[n].setScale(i-de, [0,0,0])
                }
            }
        }
        this.crowd[0].update()
        this.crowd[1].update()
        this.crowd[2].update()
    }
    follow(camera){
        let pos = this.poslist[this.ids[this.count-1]]
        if(pos){
            if(pos[0] != this.camerapos[0] || pos[1] != this.camerapos[1]){
                camera.position.copy(new THREE.Vector3(this.camerapos[0]*4+this.map_edges[0][1], this.camerapos[1]*4+this.map_edges[0][3], 510))
                camera.lookAt(new THREE.Vector3(pos[0]*4+this.map_edges[0][1], pos[1]*4+this.map_edges[0][3], pos[2]+30))
                this.camerapos[0] = pos[0]
                this.camerapos[1] = pos[1]
            }
        }
    }
}