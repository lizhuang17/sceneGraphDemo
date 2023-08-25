import * as THREE from "three";
import { Instanced3Group } from './Instanced3Group.js'
import {PM}from"./PM.js";
export class Instanced4Model extends THREE.Object3D {
    constructor(opt,crowd0) {
        super()
        this.isInstancedMesh=typeof opt["animPathPre"]=='string'
        this.pathTexture=opt.pathTexture
        // alert(opt.pathTexture)

        this.meshType=opt.meshType
        this.meshTypeList=opt.meshTypeList
        this.meshTypeListElem=opt.meshTypeListElem

        this.assets=opt.assets  //{}//防止资源重复加载
        this.count=opt.count
        this.camera=opt.camera
        
        this.clock=crowd0.clock//new THREE.Clock()
        this.instanceMatrix=crowd0.instanceMatrix//new THREE.InstancedBufferAttribute(new Float32Array(this.count*16), 16);
        this.textureType =crowd0.textureType // new THREE.InstancedBufferAttribute(new Uint8Array(this.count * 4), 4);
        this.animationType = crowd0.animationType //new THREE.InstancedBufferAttribute(new Uint8Array(this.count), 1);
        this.speed = crowd0.speed //new THREE.InstancedBufferAttribute(new Float32Array(this.count), 1);
        this.obesity = crowd0.obesity //new THREE.InstancedBufferAttribute(new Float32Array(this.count), 1);
        this.moveMaxLength =crowd0.moveMaxLength // new THREE.InstancedBufferAttribute(new Float32Array(this.count), 1);
        this.animationStartTime = crowd0.animationStartTime //new THREE.InstancedBufferAttribute(new Float32Array(this.count), 1);
        this.bodyScale =crowd0.bodyScale // new THREE.InstancedBufferAttribute(new Float32Array(this.count * 4), 4);

        this.useColorTag=opt.useColorTag//["CloW_A_kuzi_geo","CloW_A_waitao_geo1","CloW_A_xiezi_geo","hair"]
        this.instanceColorIn_All=crowd0.instanceColorIn_All

        this.visibleList_needsUpdate0=false

        this.lodCount=crowd0.lodCount
        this.lodList=crowd0.lodList

        this.lod=[]//里面存放的元素为 仿照mesh类型 自定义的结构
        this.lod_distance=crowd0.lod_distance//[15,25,50,75,100]
        this.lod_geometry=crowd0.lod_geometry

        let scope=this
        let lod_visible=opt.lod_visible
        opt.lod_set=()=>{   
            for (let i = 0; i < scope.children.length; i++) {
                var instanced3Group0 = scope.children[i]
                for(let name in lod_visible){
                    let level=lod_visible[name]
                    if (i >= level){
                        var mesh=instanced3Group0.getMesh(name)
                        if (mesh) mesh.visible=false

                    }
                }
            }
        }
        this.myLodController=crowd0.myLodController//new CrowdLod(this)



        this.lod_set=opt.lod_set
        opt.crowd=crowd0
        opt.instanced4Model=this
        // let count=this.count
        for(let i=0;i<1+this.lod_distance.length;i++){//层级数量由lod_distance数组的长度确定
            let child=new Instanced3Group(opt)
            child.countMax=opt.lod_avatarCount[i]
            child.lodLevel=i
            this.add(child)
        }
        this.children[this.children.length-1].visible=false//最后一个层级使用点集的方式进行渲染
        // this.lod_set()

        
        
        this.usePM=true//window.id==0
        this.pathLodGeo=opt.pathLodGeo
        this.pathTextureConfig=opt.pathTextureConfig
        
    }
    createPre(){//生成LOD的前向索引
        let pre=null
        for(let i=0;i<this.children.length;i++){//层级数量由lod_distance数组的长度确定
            let group=this.children[i]
            group.pre=pre;
            for(let k=0; k<group.children.length;k++){
                let mesh=group.children[k]
                if(pre==null)mesh.pre=null
                else
                    for(let j=0; j<pre.children.length;j++){
                        let mesh_pre=pre.children[j]
                        if(mesh.name==mesh_pre.name){
                            mesh.pre=mesh_pre
                        }
                    }
            }
            pre=group;
        }
    }
    init(groupOld,cb_){
        var scope=this
        this.pm=new PM({
            "crowd":scope,
            "groupOld":groupOld,
            "usePM":scope.usePM,
            "isInstancedMesh":this.isInstancedMesh
        },()=>{
            initChild(0)
        })
        function initChild(i){
            scope.children[i].init(//初始化所有子节点，本来是要等待动画数据的加载，采用预加载后应该就不用等待了
                groupOld,
                scope.meshType,
                scope.meshTypeList,
                scope.meshTypeListElem,
                ()=>{
                    if(i+1<scope.children.length)initChild(i+1)
                    else {
                        for(let i0=0;i0<scope.children.length;i0++){
                            for(let j0=0;j0<scope.children[i0].children.length;j0++){
                                scope.children[i0].children[j0].meshTypeId=scope.meshTypeId
                            }
                        }
                        // window.timeTest.measure("update start")
                        scope.myLodController.cameraStatePre=""
                        scope.update()
                        scope.createPre()
                        // window.timeTest.measure("update end")
                        if(cb_)cb_()
                        scope.pm.init(()=>{
                            console.log("test")
                            loadTexture()
                        })
                    }
                }
            )
        }
        function loadTexture(){
            if(typeof(scope.pathTexture)=="string")
                scope.pm.loadJson(
                    scope.pathTextureConfig,
                    data=>{
                        data.rootPath=scope.pathTexture
                        scope.updateMap(data)
                    }
                )
            else scope.updateMap(scope.pathTexture)
            console.log(typeof(scope.pathTexture)=="string",scope.pathTexture)
        }
        
    }
    useLod(i){
        for(let c of this.children)c.useLod(i)
    }
    updateMap(data){
        // console.log("crowd updatemap")
        // for(var i=this.children.length-1;i>15;i--){
            // this.children[this.children.length-1].updateMap(data)
            const i0=this.children.length>7?7:this.children.length-1
            // alert(this.pathTexture+";"+"./assets/textures_sim1/")
            this.children[i0].updateMap(data.rootPath,data)//this.children[i0].updateMap(this.pathTexture,data)//this.children[i0].updateMap("./assets/textures_sim1/",data)
            // this.children[0].updateMap("./assets/textures/",data)
        // }
        // console.log(this.parent)
        // const scope=this
        // setTimeout(()=>{
        //     scope.parent.visible=true
        // },10000)
    }
    useLod(lod0){
        if(lod0.lodLevel)lod0=lod0.lodLevel
        // if(this.lodLevel==lod0)
        //     return
        // for(let i=1;i<this.children.length;i++){//0组对象不更新LOD
        for(let i=0;i<this.children.length;i++){
            var geometryLod=this.lod_geometry[i]
            lod0=Math.min(lod0,geometryLod)
            this.children[i].useLod(lod0)
            // this.lodLevel=lod0
        }
    }
    setColor(avatarIndex, color,meshName) { 
        let buffer=this.instanceColorIn_All[meshName]
        if(buffer)
        for(let j=0;j<3;j++)
            buffer.array[avatarIndex*3+j]=color[j]
    }
    update() {
        const self=this
        const update=(i)=>{
            for(let j=0;j<self.lodList.length;j++){
                self.children[i].visibleList[j]=self.lodList[j]==i?1:0
            }
            self.children[i].visibleList_needsUpdate0=true
            self.children[i].update()
            i++
            if(i<self.children.length)setTimeout(()=>{
                update(i);
            },1)
        }
        for(let i=0;i<self.children.length;i++){
            for(let j=0;j<self.lodList.length;j++){
                self.children[i].visibleList[j]=self.lodList[j]==i?1:0
            }
            self.children[i].visibleList_needsUpdate0=true
            self.children[i].update()
        }
    }
    getCrowdPoints(){
        const child=this.children[this.children.length-1]
        // console.log(child)
        return child.getCrowdPoints()
    }

}
