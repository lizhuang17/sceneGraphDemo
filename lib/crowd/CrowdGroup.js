import * as THREE from "three";
import { CrowdMesh } from './CrowdMesh.js'
export class CrowdGroup extends THREE.Group {
    constructor(opt) {
        super()
        this.visibleList_needsUpdate0=false
        const crowd=opt.crowdModel
        // const crowdModel=opt.crowdModel
        this.crowd=opt.crowd
        this.crowdModel=opt.crowdModel
        this.assets=crowd.assets
        this.camera=opt.camera
        this.count=opt.count
        this.animPathPre=opt.animPathPre
        this.dummy = crowd.dummy//new THREE.Object3D();
        this.clock=crowd.clock//new THREE.Clock()
        this.visibleList=new Int8Array(this.count)//元素为0或1,0表示对象不可见，1表示对象可见

        this.lod=crowd.lod

        this.instanceMatrix=crowd.instanceMatrix//new THREE.InstancedBufferAttribute(new Float32Array(this.count*16), 16);
        this.textureType = crowd.textureType//new THREE.InstancedBufferAttribute(new Uint8Array(this.count * 4), 4);
        this.animationType = crowd.animationType//new THREE.InstancedBufferAttribute(new Uint8Array(this.count), 1);
        this.speed = crowd.speed//new THREE.InstancedBufferAttribute(new Float32Array(this.count), 1);
        this.obesity=crowd.obesity
        this.moveMaxLength=crowd.moveMaxLength
        this.animationStartTime = crowd.animationStartTime//new THREE.InstancedBufferAttribute(new Float32Array(this.count), 1);
        this.bodyScale = crowd.bodyScale//new THREE.InstancedBufferAttribute(new Float32Array(this.count * 4), 4);
        this.instanceColorIn_All=crowd.instanceColorIn_All

    }
    updateMap(pathPre,data){
        // console.log("updateMap1")
        for(let meshName in data){
            var path=data[meshName].map
            for(let i=0;i<this.children.length;i++){
                if(this.children[i].name==meshName){
                    this.children[i].material.updateMap(pathPre,path)
                }
            }
        }
        // console.log("updateMap2")
    }
    init(groupOld,meshType,meshTypeList,meshTypeListElem,cb_){
        var arr=[]
        groupOld.traverse(obj=>{
            if(obj.type=="Mesh" || obj.type=="SkinnedMesh"){
                arr.push(obj)
            }
        })
        this.createMeshAll(arr,meshType,meshTypeList,meshTypeListElem,()=>{
            if(cb_)cb_()
        })

        // let pre=this.pre
        // for(let i=0;i<this.children.length;i++){
        //     for(let j=0;j<pre.children.length;j++){
        //         if(this.children[i].name==pre.children[j].name){
        //             this.children[i].pre=pre.children[j]
        //         }
        //     }
        // }
    }
    useLod(lod0){
        if(Number.isInteger(lod0)){
            if(lod0<this.lod.length){
                lod0=this.lod[lod0]
            }else{
                console.log("lod编号错误")
                return
            }
        }
        for(var i=0;i<this.children.length;i++){
            var name1=this.children[i].name
            var geometry1=this.children[i].geometry
            for(var name2 in lod0){
                if(name1==name2){
                    geometry1.bindGeometry(lod0[name2])
                }
            }
        }
    }
    createMeshAll(arr,meshType,meshTypeList,meshTypeListElem,cb){
        var scope=this
        let indexFlag=0
        function next(i){
            var mesh=arr[i]
            // console.log("meshType",meshType)
            // console.log(mesh,i,arr.length)
            // console.log(mesh.name)
            var meshType0=meshType[mesh.name]
            
            if(meshType0==null){
                indexFlag++
                if(indexFlag==arr.length){
                    cb()
                }else{
                    next(i+1)
                }
            }else{
                // alert()
                // console.log("scope.countMax",scope.countMax)
                // console.log( meshTypeListElem[meshType0])
                CrowdMesh.getCrowdMesh(
                mesh,//m,
                scope.animPathPre,//animPath,
                false,
                "",//this.filePath.male.superlowTexturePath,
                false,
                1,//this.manager.config.male.textureCount,
                scope.camera,//this.camera,
                scope.clock,//new THREE.Clock(),//this.clock
                scope.countMax,//scope.countMax,
                scope,
                meshTypeList[meshType0],
                meshTypeListElem[meshType0],
                meshType0,
                m2=>{
                    m2.meshType=meshType0
                    m2.meshTypeList=meshTypeList[meshType0]
                    m2.meshTypeListElem=meshTypeListElem[meshType0]
                    scope.add(m2)
                    indexFlag++
                    if(indexFlag==arr.length){
                    //if(scope.children.length==arr.length){
                        cb()
                    }else{
                        next(i+1)
                    }
                }
                )
            }
            
        }
        next(0)
    }
    getMesh(name){
        for(let i=0;i<this.children.length;i++){
            if(this.children[i].name==name)
                return this.children[i]
        }
    }
    getCrowdPoints(){
        const CrowdPoints=new THREE.Object3D()
        let i
        for(i=0;i<this.children.length;i++){
            const child=this.children[i]
            // alert(child.visible)
            // if(child.visible){

              const p=child.getCrowdPoints()
              CrowdPoints.add(p)
              break
            // }
        }
        if(i==this.children.length)return null
        else return CrowdPoints
    }
    getMeshByMeshType(meshType){
        for(let i=0;i<this.children.length;i++){
            if(this.children[i].meshType==meshType)
                return this.children[i]
        }
    }
    update(){
        if(!this.visible)return
        for(let i=0;i<this.children.length;i++){
            const mesh=this.children[i]
            for(let j=0;j<mesh.buffer_all.length;j++){
                mesh.buffer_all[j].needsUpdate0=true
            }
        }
        for(let i=0;i<this.children.length;i++){
            this.updateMesh(this.children[i])
        }
    }
    updateMesh(mesh) {
        if(!mesh.visible)return//如果这个对象不可见就不用更新
        let index=0
        // if(mesh.buffer_all.length==9){
        //     console.log(mesh.name,mesh.buffer_all[8].name,mesh.buffer_all[8].array,mesh.buffer_all[8].origin.array)
        // }
            
        for(let i=0;i<this.visibleList.length;i++){
            if(this.visibleList[i]==1&&mesh.meshTypeList[i]==mesh.meshTypeId){
                for(let t=0;t<mesh.buffer_all.length;t++){
                    let buffer=mesh.buffer_all[t]
                    if(buffer.needsUpdate0){
                        let itemSize=buffer.itemSize
                        for(let j=0;j<itemSize;j++){
                            buffer.array[itemSize*index+j]=
                            buffer.origin.array[itemSize*i+j]
                        }
                    }
                }
                index++
            }
        }
        for(let t=0;t<mesh.buffer_all.length;t++){
            let buffer=mesh.buffer_all[t]
            if(buffer.needsUpdate0){
                buffer.needsUpdate =true
                buffer.needsUpdate0=false
            }
        }
        if(this.visibleList_needsUpdate0){
            // this.count=index
            mesh.count=index
            mesh.visibleList_needsUpdate0=false
        }
    }
    getMatrixAt( index, matrix ) {
		matrix.fromArray( this.instanceMatrix.array, index * 16 );
	}
    getPosition(avatarIndex) {
        var mat4 = new THREE.Matrix4();
        this.getMatrixAt(avatarIndex,mat4)
        var e=mat4.elements
        return [e[12],e[13],e[14]];
    }
    getScale(avatarIndex) {
        var mat4 = new THREE.Matrix4();
        this.getMatrixAt(avatarIndex,mat4)

        let position = new THREE.Vector3();
        let quaternion = new THREE.Quaternion();
        let scale = new THREE.Vector3();
        mat4.decompose(position, quaternion, scale);
        return [scale.x, scale.y, scale.z];

    }
    
}