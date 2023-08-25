import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { Instanced5Object } from './Instanced5Object'//let Crowd=Pack// 
import * as THREE from "three"
export class CrowdManager {
    constructor(scene, camera,poslist,config,materialLoaderType,cb) {
        this.textureLoader=new THREE.TextureLoader()
        this.cb=cb
        this.poslist=poslist
        this.scene = scene
        this.camera = camera
        this.materialLoaderType=materialLoaderType//"json_material"
        this.assets = {}//为了防止资源重复加载，相同路径的资源只加载一次
        this.init(config)
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
    async init(config) {
        const r=arr=>{
            return arr[Math.floor(Math.random() * arr.length)]
        }
        const c=config//this.getConfig_tree()
        const self = this
        
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

            const crowd = new Instanced5Object({
                camera: self.camera,
                assets: {},
                animPathPre: c.pathAnima,

                count: self.poslist.length,
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
                pathTextureConfig: //scope.pathTextureConfig
                    Array.from(Array(c.path.length)).map((_, i) => 
                        c.path[i]+"texture_names.json"
                    ),//[c.path+"texture_names.json"],
                useColorTag:  c.useColorTag
            })
            for (var i00 = 0; i00 < crowd.count; i00++) {
                const p=self.poslist[i00]
                crowd.setPosition(i00,[
                    p[0],//+(2*Math.random()-1)*5,
                    p[1],
                    p[2]//+(2*Math.random()-1)*5
                ])
                crowd.setRotation(i00,[0,Math.random()*30,0])
                crowd.setAnimation(
                    i00,
                    r(c.standAnimationList),
                    Math.random()*10000
                    )
                crowd.setSpeed(i00, 1+4*Math.random())
                // crowd.setScale(i00, [
                //     -900,
                //     -900*(1-0.2+0.2*Math.random()),
                //     900])
                crowd.setScale(i00, [
                    c.scale,
                    c.scale*(1-0.2+0.2*Math.random()),
                    c.scale])
                crowd.setObesity(i00, 0.8+0.4*Math.random())
                let j=100
                // crowd.setColor(i00,[j*Math.random()*2,j*Math.random(),j*Math.random()],"CloW_A_kuzi_geo")
                // crowd.setColor(i00,[j*Math.random()*2,j*Math.random(),j*Math.random()],"CloW_A_waitao_geo1")
                crowd.setColor(i00,[j*Math.random()*2,j*Math.random(),j*Math.random()],"CloW_C_qunzi_geo3456")
                j=-0.5
                crowd.setColor(i00,[j*Math.random()*2,j*Math.random(),j*Math.random()],"CloW_C_shangyi_geo")

                if(c.constraint){
                    const constraint0=r(c.constraint)
                    for(let partName in constraint0)
                        crowd.setPartType(i00,partName,constraint0[partName])
                }
            }
            if(self.cb)self.cb(crowd,c,scenes)
            crowd.init(scenes)
            self.crowd=crowd
            self.scene.add(crowd)
            setTimeout(()=>{
               self.scene.add(crowd.CrowdPoints) 
            },1000)
            
            
        }
    }
}