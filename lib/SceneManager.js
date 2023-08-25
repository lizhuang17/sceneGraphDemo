import {
    FileLoader,
    Group,
    InstancedMesh,
    LoadingManager,
    Matrix4,
    Vector3
} from "./three/build/three";
import {ZipLoader} from "./ziploader";
import {GLTFLoader} from "./three/examples/jsm/loaders/GLTFLoader";
import $ from "jquery"
import {DynamicLoading}from "./DynamicLoading"
export class SceneManager{
    constructor(viewer){
    	this.viewer = viewer
        this.projectName = window.projectName
        this.scene = window.scene
        this.camera = window.camera
        this.instanceGroup = new Group()
        this.scene.add(this.instanceGroup)
        this.matrixWorld = null

        this.visibleModelList = []

        
        this.loadingModelList = []
        this.toLoadModelList = []
        this.loadedModelList = []

        this.loaded_mesh = {}

        this.loadlimit = 20
        this.loading = false
        this.httping = false
        this.pre_camera_position = new Vector3()

        this.mesText1 = document.createElement("p")
        document.body.appendChild(this.mesText1)
        this.mesText1.style.position = "fixed"
        this.mesText1.style.left = 20+"px"
        this.mesText1.style.top = 0+"px"
        this.mesText1.style.fontSize = window.innerHeight/60+"px"
        // this.op = 1
        window.server_ip = "http://47.103.21.207"
        if(window.projectName==="HaiNing"){
            window.server_ip += ":4010"
            this.id = 1
        }else if(window.projectName==="KaiLiNan"){
            window.server_ip += ":4011"
            this.id = 2
        }else if(window.projectName==="LanQiao"){
            window.server_ip += ":4012"
            this.id = 3
        }else if(window.projectName==="QinLaiLi"){
            window.server_ip += ":4013"
            this.id = 4
        }else if(window.projectName==="RenFuYiYuan"){
            window.server_ip += ":4014"
            this.id = 5
        }else if(window.projectName==="XinYu"){
            window.server_ip += ":4015"
            this.id = 6
        }else if(window.projectName==="YunXi"){
            window.server_ip += ":4016"
            this.id = 7
        }
       

        $.get(window.server_ip+"/matrixWorld",(data,status)=>{
            let m = JSON.parse(data)
            this.matrixWorld = new Matrix4().set(
                m[0],m[4],m[8],m[12],
                m[1],m[5],m[9],m[13],
                m[2],m[6],m[10],m[14],
                m[3],m[7],m[11],m[15])
            this.instanceGroup.applyMatrix4(this.matrixWorld)
            console.log(this.instanceGroup)
        })
        const self=this
        new DynamicLoading({
            "loading":i=>{
                self.loadModelZip(i)
            },
            "camera":window.camera,
            "meshes":this.loaded_mesh
        })
    }

    processLoadList(load_list){
        if(this.loading){
	  // 若还在加载中，更新待加载列表
            let new_to_load_list = []
            for(let i=0; i<load_list.length; i++){
                let ind = load_list[i]
                if(!this.loadingModelList.includes(ind) && !this.loadedModelList.includes(ind)){
                    new_to_load_list.push(ind)
                }
            }
            this.toLoadModelList = new_to_load_list
        }else{              // 若加载结束，更新加载列表和待加载列表
            let new_to_load_list = []
            for(let i=0; i<load_list.length; i++){
                let ind = load_list[i]
                if(i<this.loadlimit){
                    this.loadingModelList.push(ind)
                }else{
                    new_to_load_list.push(ind)
                }
            }
            this.toLoadModelList = new_to_load_list
            this.loading = true
            for(let i=0; i<this.loadingModelList.length; i++){
                this.loadModelZip(this.loadingModelList[i])
            }
        }
    }
    loadModelZip(index){
        var self = this
        var url = "assets/models/"+self.projectName+"/"+index+".zip"
        var loader = new LoadingManager()
        new Promise(function(resolve,reject){
            new ZipLoader().load(url,()=>{
            },()=>{
                console.log("模型加载失败："+index)
                setTimeout(()=>{
                    self.loadModelZip(index)
                },1000*(0.5*Math.random()+1))
            }).then((zip)=>{
                // console.log(self.loadingModelList.indexOf(index))
                self.loadingModelList.splice(self.loadingModelList.indexOf(index),1)
                self.loadedModelList.push(index)
                if(self.loadingModelList.length===0){       // 若加载序列结束
                    self.loading = false                // 若待加载序列结束，则结束加载
                    if(self.toLoadModelList.length!==0){    // 若待加载序列未结束，继续加载
                        self.processLoadList(self.toLoadModelList)
                    }
                }
                loader.setURLModifier(zip.urlResolver)
                resolve(zip.find( /\.(gltf|glb)$/i ))
            })
        }).then(function(fileUrl){
            new FileLoader(loader).load("blob:assets/models/"+self.projectName+"/matrix"+index+".json",json=>{
                var matrix = JSON.parse(json)
            // const matrix=[]
                new GLTFLoader(loader).load(fileUrl[0], (gltf)=>{
                    var mesh = gltf.scene.children[0].children[0]
                    self.addInsModel(matrix,mesh)
                })
            })
        })
    }
    addInsModel(matrix,mesh){
        if(this.loaded_mesh[index])return
        let index = mesh.name
        matrix.push([1,0,0,0,0,1,0,0,0,0,1,0])
        let matrix4List = []
        for(let j=0; j<matrix.length; j++){
            let mat = matrix[j]
            matrix4List.push(new Matrix4().set(
                mat[0], mat[1], mat[2], mat[3],
                mat[4], mat[5], mat[6], mat[7],
                mat[8], mat[9], mat[10], mat[11],
                0, 0, 0, 1))
        }
        mesh.material.transparent = false//true
        // console.log(mesh.material.side)
        mesh.material.side = 0//2
        let instance_mesh = processMesh(mesh,matrix4List)
        window.instanceGroup=this.instanceGroup
        this.instanceGroup.add(instance_mesh)
        this.loaded_mesh[index] = instance_mesh
    }
}

function processMesh(mesh,matrixList){
    // return mesh
    var instancedMesh = new InstancedMesh(mesh.geometry, [mesh.material], 1, [matrixList.length], false)
    instancedMesh.geometry.clearGroups()
    instancedMesh.geometry.addGroup(0, mesh.geometry.index.array.length)
    instancedMesh.instanceMatrix.needsUpdate=true
    for(let i=0; i<matrixList.length; i++){
        var instanceMatrix = matrixList[i]
        instancedMesh.setMatrixAt(i, instanceMatrix)
    }
    return instancedMesh
}
