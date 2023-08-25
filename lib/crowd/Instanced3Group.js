import * as THREE from "three";
import { Instanced2Mesh } from './Instanced2Mesh.js'
export class Instanced3Group extends THREE.Group {
    constructor(opt) {
        super()
        this.visibleList_needsUpdate0=false
        const crowd=opt.instanced4Model
        // const crowdModel=opt.crowdModel
        this.crowd=opt.crowd
        this.crowdModel=opt.instanced4Model
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
                Instanced2Mesh.getInstanced2Mesh(
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
            this.updateMesh_all(this.children[i])
        }
    }
    updateMesh_all(mesh) {
        if(!mesh.visible)return//如果这个对象不可见就不用更新
        let index=0
        for(let i=0;i<this.visibleList.length;i++){//遍历可见度
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
    updateMesh_split(mesh){
        const scope=this
        let index=0
        const updateBuffer=(a,b)=>{
            for(let i=a;i<b;i++){//遍历可见度
                if(scope.visibleList[i]==1&&mesh.meshTypeList[i]==mesh.meshTypeId){
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
        }
        const last=()=>{
            
            if(scope.lodLevel<scope.lod.length-1){//0,1,2,..19
                for(let t=0;t<mesh.buffer_all.length;t++){
                    let buffer=mesh.buffer_all[t]
                    if(buffer.needsUpdate0){
                        buffer.needsUpdate =true
                        buffer.needsUpdate0=false
                    }
                }
                if(scope.visibleList_needsUpdate0){
                    mesh.count=index
                    mesh.visibleList_needsUpdate0=false
                }
                
            }
            // console.log(scope.lod.length,scope.lodLevel,scope.lodLevel==scope.lod.length)
            if(scope.lodLevel==scope.lod.length-1){//20
                scope.crowd.updatePoints() 
            }
                
        }

        const k=[]
        const step=3;//*Math.pow(scope.lodLevel+1,2);
        if(scope.lodLevel==scope.lod.length-1)return//step=2000;
        for(let i=0;i<=step;i++)k.push(
            Math.floor(scope.visibleList.length/step)*i,
        )

        // const timeAll=500
        // const update0=(i)=>{
        //     if(i<k.length-1){
        //        updateBuffer(k[i],k[i+1]) 
        //        setTimeout(()=>{
        //         update0(i+1)
        //        },timeAll/k.length)
        //     }else last()
        // }
        // update0(0)
        
        updateBuffer(k[0],k[1])
        const timeAll=step//100
        for(let i=1;i<k.length-1;i++){
            setTimeout(()=>{
                updateBuffer(k[i],k[i+1])
            },i*timeAll/k.length)
        }
        setTimeout(()=>{
            last()
        },timeAll)

        // setTimeout(()=>{
        //     updateBuffer(k[1],k[2])
        // },300)
        // setTimeout(()=>{
        //     updateBuffer(k[2],k[3])
        // },600)
        // setTimeout(()=>{
        //     updateBuffer(k[2],k[3])
        //     last()
        // },900)


    }
    updateMesh0(mesh) {
        if(!mesh.visible)return//如果这个对象不可见就不用更新
        let index=0
        let a=0
        let b=Math.floor(this.visibleList.length/2)
        for(let i=a;i<b;i++){//遍历可见度
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
        this.index0=index
    }
    updateMesh1(mesh) {
        if(!mesh.visible)return//如果这个对象不可见就不用更新
        let index=this.index0
        let a=Math.floor(this.visibleList.length/2)
        let b=this.visibleList.length
        for(let i=a;i<b;i++){//遍历可见度
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
            mesh.count=index
            mesh.visibleList_needsUpdate0=false
        }
    }

    updateMesh_split(mesh) {
        if(!mesh.visible)return//如果这个对象不可见就不用更新
        let index=0
        // if(mesh.buffer_all.length==9){
        //     console.log(mesh.name,mesh.buffer_all[8].name,mesh.buffer_all[8].array,mesh.buffer_all[8].origin.array)
        // }   
        
        // console.log(this.visibleList.length,mesh.buffer_all.length)
        for(let i=0;i<this.visibleList.length;i++){//遍历可见度
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