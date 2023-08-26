import {GLTFLoader} from '../lib/three/examples/jsm/loaders/GLTFLoader'
import { Instanced5Object } from '../lib/crowd/Instanced5Object'//let Crowd=Pack// 
import config_woman   from '../config/sceneConifg_woman0.json'
import config_man from '../config/sceneConifg_man01.json'
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
    getConfig(flag){
        let config=flag==0?config_woman:config_man
        for(let i=0;i<config.length;i++){
            let c1=config[i]
            c1.scale=2
            
            // c1.lod_distance=[ 5000, 15000, 30000, 60000, 100000 ]
            // c1.lod_geometry=[ 20,  15,   1,    0,   0  ]
            // c1.lod_avatarCount=[ 200, 900, 3240, 8800, 12600]

            c1.lod_distance=[ 10, 20, 40, 80, 160, 320 ]
            c1.lod_geometry=[ 20, 15,  7,  2,   1,   0 ]
            c1.lod_avatarCount=[ 500, 500, 500, 500, 500, 500]
            
            const lodConut=3//10//21
            const countAll=250//2500*2*10
            const distanceAll=200//*0.8*0.25//300
            c1.lod_distance=[ ]
            c1.lod_geometry=[ ]
            c1.lod_avatarCount=[ ]
            let r_pre=0
            for(let j=0;j<lodConut;j++){
                const r=Math.pow((j+1)/lodConut,1.2)*distanceAll
                c1.lod_distance.push(r)
                if(j==0)c1.lod_geometry.push(15)
                // else if(j==1)c1.lod_geometry.push(0)
                else c1.lod_geometry.push(7*(lodConut-j-1)+1)

                const n=countAll*[Math.pow(r,2)-Math.pow(r_pre,2)]/Math.pow(distanceAll,2)
                r_pre=r
                c1.lod_avatarCount.push(Math.ceil(n))
            }
            for(let i=0;i<c1.lod_distance.length;i++){
                c1.lod_distance[i]*=c1.scale
            }
            // console.log(c1)
            for(let j=0;j<c1.lod_visible.length;j++){
                for(let tag in c1.lod_visible[j]){
                    c1.lod_visible[j][tag]=lodConut
                }
            }
            c1.lod_distance[c1.lod_distance.length-2]*=2
            c1.lod_distance[c1.lod_distance.length-1]*=4//*2
        }
        return config[0]
    }
    async loadMaterial_json(path,pathTexture){
        const self=this
        function json2obj(j,o){
            for(let t in j.base){
                o[t]=j.base[t]
            }
            return o
        }
        return new Promise((resolve, reject) => {
            window.loadJson(path,data=>{
                console.log(data)
                const group=new THREE.Group()
                for(let t in data){
                    const v=data[t]

                    const mesh=new THREE.Mesh()
                    mesh.geometry=new THREE.BufferGeometry()
                    for(let tag of ["position","skinIndex","skinWeight","uv","normal"])
                        mesh.geometry.attributes[tag]=new THREE.BufferAttribute(new Float32Array([]),3)         
                    mesh.name=t
                    mesh.skeleton={bones:{
                        length:v.lenb
                    }}
                    mesh.material=new THREE[v.type]()
    
                    json2obj(v,mesh.material)
                    for(let i in v.text){
                        // console.log(pathTexture["rootPath"]+pathTexture[mesh.name][i])
                        const textureUrl=pathTexture["rootPath"]+pathTexture[mesh.name][i]
                        mesh.material[i]=//i为map
                            textureUrl?self.textureLoader.load ( textureUrl ):new THREE.Texture()    
                        //new THREE.TextureLoader().load ( "favicon.f070609c.ico")//new THREE.Texture()//{}
                        // console.log(mesh.name,i,)
                        json2obj(v.text[i],mesh.material[i])
                    }
                    // console.log(mesh.material,v.text)
                    group.add(mesh)
                }
                // self.adjustParam(group)
                setTimeout(()=>{
                   resolve(group)//cb(group)//return group 
                },1000)
                
            })
        })
    }
    async loadMaterial_glb(path){//c.path+"sim.glb"
        return new Promise((resolve, reject) => {
            new GLTFLoader().load(path, (glb0) => {
                // alert(glb0)
                // glb0.scene.traverse(mesh=>{
                //     if(mesh instanceof THREE.Mesh){
                //         // mesh.material
                //         mesh.castShadow = false
                //         mesh.receiveShadow = false//true
                //     }
                // })
                resolve(glb0.scene)// process([glb0.scene],0)
            })
        })
    }
    async init(i) {
        const c=this.getConfig(i)
        const self = this
        // new GLTFLoader().load(c.path+"sim.glb", async (glb0) => {
        //     process([glb0.scene],0)
        // })
        self.materialLoaderType="glb_material"
        Promise.all(
            Array.from(Array(c.path.length)).map((_, i) => 
                self.materialLoaderType=="json_material"?
                self.loadMaterial_json(c.path[i]+"material.json",c.pathTexture[i]):
                self.loadMaterial_glb(c.path[i]+"sim.glb")
            )
        ).then(res => {
            process(res) // 10
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
                pathLodGeo: 
                    Array.from(Array(c.path.length)).map((_, i) => 
                        c.path[i]+"LOD/"
                    ),//[c.path+"LOD/"],
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
                self.crowd[i].setRotation(i00,[Math.PI/2,Math.PI+Math.random()*99,0])
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
            ////////////
            const crowd=self.crowd[i]
            function r(arr){
                const randomIndex = Math.floor(Math.random() * arr.length)
                return arr[randomIndex]
            }
            
            for (var i00 = 0; i00 < crowd.count; i00++) {
                // const p=self.poslist[i00]
                // crowd.setPosition(i00,[
                //     p[0],//+(2*Math.random()-1)*5,
                //     p[1],
                //     p[2]//+(2*Math.random()-1)*5
                // ])
                if(true){//if(Math.random()>0.3){//
                    crowd.setAnimation(
                        i00,
                        r(c.standAnimationList),
                        Math.random()*10000
                    )
                }else{
                    crowd.setAnimation(
                        i00,
                        r(c.walkAnimationList),
                        Math.random()*10000
                    )
                    crowd.setMoveMaxLength(
                        i00,
                        (0.5+Math.random())*10
                    )
                    // crowd.setRotation(
                    //     i00,[0,0,0]
                    // )
                }
                crowd.setSpeed(i00, 1+8*Math.random())
                crowd.setBodyScale(i00,[
                    (Math.random()-0.5)/1.5,
                    (Math.random()-0.5)/1.5,
                    (Math.random()-0.5)/1.5,
                    (Math.random()-0.5)/1.5,
                ])
                // crowd.setScale(i00, [
                //     -900,
                //     -900*(1-0.2+0.2*Math.random()),
                //     900])
                // crowd.setScale(i00, [
                //     c.scale,
                //     c.scale*(1-0.2+0.2*Math.random()),
                //     c.scale])
                // crowd.setObesity(i00, 0.8+0.4*Math.random())
                let flag=true
                if(c.constraint){
                    const i000 = Math.floor(Math.random() * c.constraint.length)
                    const constraint0=c.constraint[i000]
                    for(let partName in constraint0)
                        crowd.setPartType(i00,partName,constraint0[partName])
                    if(i000>=3)flag=false
                }
                if(flag){
                    let j=10
                    crowd.setColor(i00,[j*Math.random()*2,j*Math.random(),j*Math.random()],"CloW_A_kuzi_geo")
                    // crowd.setColor(i00,[j*Math.random()*2,j*Math.random(),j*Math.random()],"CloW_A_shangyi_geo")
                    crowd.setColor(i00,[j*Math.random()*2,j*Math.random(),j*Math.random()],"CloW_A_waitao_geo1")
                    crowd.setColor(i00,[j*Math.random()*2,j*Math.random(),j*Math.random()],"CloW_A_xiezi_geo")

                    j=-0.3
                    crowd.setColor(i00,[j*Math.random(),j*Math.random(),j*Math.random()],"qipao22")
                    crowd.setColor(i00,[j*Math.random(),j*Math.random(),j*Math.random()],"waitao1")

                    j=0.1
                    crowd.setColor(i00,[j*Math.random(),j*Math.random(),j*Math.random()],"CloW_C_qunzi_geo3456")
                    crowd.setColor(i00,[j*Math.random(),j*Math.random(),j*Math.random()],"CloW_C_shangyi_geo")

                }
                
            }
            for(let i=0;i<scenes.length;i++){
                scenes[i].traverse(node=>{
                    if(node instanceof THREE.SkinnedMesh){
                        node.material=node.material.clone()
                        let material=node.material
                        let name=node.name
                        let meshType=c['meshType'][i][name]
                        if(meshType=='body'||meshType=='head'){
                            material.color.r-=0.6
                            material.color.g-=0.6
                            material.color.b-=0.6
                            // material.roughness=0//-=0.6
                            // material.metalness=0//+=0.2
                            // material.envMapIntensity=0
                            // material.emissiveIntensity=0
                            // material.lightMapIntensity=0
                        }else if(meshType=='hair'){
                            material.side=2
                            // material.color.r=1000;
                            material.metalness=0.5
                            material.roughness=0.5
                        }else if(meshType=="eye"){
                            material.metalness=1
                            material.roughness=0.5
                        }else if(meshType=="trousers"||meshType=="coat"){
                            material.metalness=1
                            // material.roughness-=0.5
                            material.color.r=material.color.g=material.color.b=1

                            material.envMapIntensity=1
                            material.emissiveIntensity=1
                            material.lightMapIntensity=1
                        }else if(meshType=="shoes"){
                            material.metalness=1
                            material.roughness=0.5
                        }
                    }
                })
            }
            ////////////
            self.crowd[i].init(scenes)
            
            self.scene.add(self.crowd[i])
            self.scene.add(self.crowd[i].CrowdPoints)
        }
    }
    update(){
        for(var j=0;j<this.count;j++){
            let i = this.ids[j]
            let n = 0
            let de = 0
            if(i >= this.count*this.persent[0]){
                // if(i >= this.count*(1-this.persent[2])){
                //     n = 2
                //     de = this.count*(1-this.persent[2])
                //     // continue
                // }
                // else{
                //     n = 1
                //     de = this.count*this.persent[0]
                // }
                n = 1
                de = this.count*this.persent[0]
            }
            if(this.poslist[i]){
                let old = this.poslist[i]
                let pos = this.maps.nextstep(this.poslist[i],this.es[i])
                this.es[i] = pos.splice(-1,1)[0]
                let index = 9-pos.splice(0,1)
                this.phs[i] = pos.splice(0,1)
                this.poslist[i] = pos
                this.dp[i] = [(pos[0]-old[0])*4, (pos[1]-old[1])*4, 0]
                // console.log(n,i-de,this.crowd[n])
                this.crowd[n].move(i-de, [this.dp[i][0], this.dp[i][1], 0])
                if(index <= 9)
                    this.crowd[n].setRotation(i-de, [Math.PI/2, index/4*Math.PI, 0])
                if(this.maps.grids[this.poslist[i][0]][this.poslist[i][1]].ph0==0){
                    this.poslist[i]=null
                    this.crowd[n].setRotation(i-de, [Math.PI/2,-Math.PI/2,0])
                }
            }else{
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
        for(let i of this.crowd)i.update()
        // this.crowd[0].update()
        // this.crowd[1].update()
        // this.crowd[2].update()
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