import { Instanced1Geometry } from './Instanced1Geometry.js'
import { PMGroup } from './PMGroup.js'
import * as THREE from "three";
export class PM {
    constructor(opt,cb0){
        this.usePM=opt.usePM
        this.crowd=opt.crowd
        this.groupOld=opt.groupOld//groupOld 是glb.scene
        this.isInstancedMesh=opt.isInstancedMesh
        this.dataType="bin"//bin json

        if(this.usePM) this.getBase_PM(cb0)
        else this.getBase_noPM(cb0)
        
    }
    init(cb00){//需要整个lod体系
        this.crowd.lod_set()
        if(this.usePM) this.loadIncrement(1,cb00)
        else this.loadMesh_noPM(2,cb00)
    }
    getBase_PM(cb0){
        var scope=this;
        scope.loadJson(
            scope.crowd.pathLodGeo+"1.json",
            data=>{
                scope.pmGroup=new PMGroup(data)
                var lod0_=Instanced1Geometry.getLod2(scope.pmGroup.getJson2())
                lod0_.lodLevel=scope.crowd.lod.length
                scope.crowd.lod.push(lod0_)
                if(cb0)cb0(lod0_)
                // scope.crowd.useLod(lod0_)

                var lod0=Instanced1Geometry.getLod(data)
                lod0.lodLevel=scope.crowd.lod.length
                scope.crowd.lod.push(lod0)
                // scope.crowd.useLod(lod0)
                // scope.cb(lod0)
                // scope.loadIncrement(1)
            }
        )
    }
    getBase_noPM(cb0){
        var scope=this;
        var path=scope.crowd.pathLodGeo+"1.json"
        scope.loadJson(
            path,
            data=>{
                var lod0=Instanced1Geometry.getLod(data)
                var lod0_=Instanced1Geometry.getLod2(lod0)
                lod0_.lodLevel=scope.crowd.lod.length
                scope.crowd.lod.push(lod0_)
                if(cb0)cb0(lod0_)
                // scope.crowd.useLod(lod0_)

                lod0.lodLevel=scope.crowd.lod.length
                scope.crowd.lod.push(lod0)
                // scope.crowd.useLod(lod0)
                // scope.cb(lod0)
                

                // scope.loadMesh_noPM(2)
            }
        )

    }
    loadMesh_noPM(index,cb00) {//1,2,3...20
        var scope=this;
        var path=scope.crowd.pathLodGeo+index+".json"
        scope.loadJson(
            path,
            data=>{
                var lod0=Instanced1Geometry.getLod(data)
                lod0.lodLevel=scope.crowd.lod.length
                scope.crowd.lod.push(lod0)
                scope.crowd.useLod(lod0)
                scope.cb(lod0)
                if(index<scope.crowd.lodCount-1){
                    scope.loadMesh_noPM(index+1,cb00)
                }else{
                    if(cb00)cb00()
                    scope.cb_last(scope.crowd.lod)
                    
                } 
            }
        )
    }
    loadIncrement(index,cb00){//index=[1,3,..,19]
        var scope=this;
        function parsePack(data){
                scope.pmGroup.addPack(data)
                window.group3a=scope.pmGroup
                var data_new=scope.pmGroup.getJson()

                var lod0=Instanced1Geometry.getLod(data_new)
                lod0.lodLevel=scope.crowd.lod.length
                scope.crowd.lod.push(lod0)
                scope.crowd.useLod(lod0)

                // scope.cb(lod0)
                if(index<19){//if(index<scope.crowd.lodCount-2){//index=[2,3,..,19]
                    scope.loadIncrement(index+1,cb00)
                }else{
                    if(cb00)cb00()
                    scope.cb_last(scope.crowd.lod)
                    
                } 

        }
        if(this.dataType=="bin"){
            scope.loadBin(
                scope.crowd.pathLodGeo+index+".bin",
                parsePack
            )
        }else{
            scope.loadJson(
                scope.crowd.pathLodGeo+index+".json.pack.json",
                parsePack
            )
        }
    }
    cb_last(lod_last){
        var scope=this;
        if(scope.crowd.lod_set)scope.crowd.lod_set()
        scope.crowd.myLodController.cameraStatePre=""
        scope.crowd.update()
    }
    loadBin(path,cb_){
        // console.log(path)
        let scope=this
        let loader = new THREE.FileLoader();
		loader.setResponseType("arraybuffer");
		loader.load(
  			path,
  			buffer => {
                scope.bin2json(buffer,cb_)
            }
        )
    }
    bin2json(buffer,cb_){
        const isInstancedMesh=this.isInstancedMesh
        function process(buffer,cb_){
            let itemSize=4
            let headLength=new Uint32Array(buffer.slice(0, itemSize))[0]
            let head=new Uint32Array(buffer.slice(1*itemSize, (1+headLength)*itemSize))
            let index=1+headLength
            // console.log(head)
            let result={}
            for(let i=0;i<head.length;i++){
                let buffer0=buffer.slice(itemSize*index, itemSize*(index+head[i]) )
                let result0=getName(buffer0)
                let name=result0.name
                result[name]=[
                    isInstancedMesh?decompression(result0.buffer):decompression_noAnim(result0.buffer)
                ]//外面有多余的一层中括号
                index=index+head[i]
            }
            if(cb_)cb_(result)
            // buffer.slice(0, headSize * itemSize1)
        }
        function getName(buffer){
            let itemSize=4
            let nameLength=new Uint32Array(buffer.slice(0, itemSize))[0]
            let name=""
            let index=1
            for(let i=0;i<nameLength;i++){
                //String.fromCharCode(97)
                const code0=new Uint32Array(buffer.slice(index*itemSize, (1+index)*itemSize))[0]
                // console.log("code0",code0)
                const char0=String.fromCharCode( code0 )
                name=name+char0
                index++
            }
            // console.log(index*itemSize, buffer.byteLength)
            buffer=buffer.slice(index*itemSize, buffer.byteLength)
            return {name:name,buffer:buffer}
        }
        function decompression(buffer){
            var intData = new Uint32Array(buffer);
                var meshLength = intData[0];
                var array1Length = intData[1];
                var array2Length = intData[2];
                var array3Length = intData[3];
                // console.log(meshLength);
                // console.log(array1Length);
                // console.log(array2Length);
                // console.log(array3Length);
                var nodeList = []
                var data = new Float32Array(buffer);
                for (var i = 0; i < meshLength; i++) {
                    let node = {
                        aI: 0,
                        bI: 0,
                        aPos: [],
                        bPos: [],
                        cPos: [],
                        aUV: [],
                        aSkinWeight: [],
                        aSkinIndex: [],
                        bUV: [],
                        bSkinWeight: [],
                        bSkinIndex: [],
                        faceRe: [],
                        face: {
                            x: [],
                            y: [],
                            z: [],
                            d: [],
                        }
                    }
                    let start = i * 35 + 4;
                    node.aI = data[start];
                    node.bI = data[start + 1];
                    for (let j = 0; j < 3; j++) {
                        node.aPos.push(data[start + 2 + j])
                        node.bPos.push(data[start + 5 + j])
                        node.cPos.push(data[start + 8 + j])
                    }
                    for (let j = 0; j < 2; j++) {
                        node.aUV.push(data[start + 11 + j])
                        node.bUV.push(data[start + 21 + j])
                    }
                    for (let j = 0; j < 4; j++) {
                        node.aSkinWeight.push(data[start + 13 + j])
                        node.aSkinIndex.push(data[start + 17 + j])
                        node.bSkinWeight.push(data[start + 23 + j])
                        node.bSkinIndex.push(data[start + 27 + j])
                    }
                    let faceRestart = data[start + 31] + array1Length + 4
                    let facestart = data[start + 32] + array1Length + array2Length + 4
                    let faceReLength = data[start + 33]
                    let faceLength = data[start + 34]
                    for (let j = 0; j < faceReLength; j++) {
                        node.faceRe.push(data[faceRestart + j])
                    }
                    for (let j = 0; j < faceLength; j++) {
                        node.face.x.push(data[facestart + j * 4])
                        node.face.y.push(data[facestart + j * 4 + 1])
                        node.face.z.push(data[facestart + j * 4 + 2])
                        node.face.d.push(data[facestart + j * 4 + 3])
                    }
                    nodeList.push(node)
                }
                // console.log( nodeList )
            return nodeList
        }
        function decompression_noAnim(buffer){
            var intData = new Uint32Array(buffer);
                var meshLength = intData[0];
                var array1Length = intData[1];
                var array2Length = intData[2];
                var array3Length = intData[3];
                var nodeList = []
                var data = new Float32Array(buffer);
                for (var i = 0; i < meshLength; i++) {
                    let node = {
                        aI: 0,
                        bI: 0,
                        aPos: [],
                        bPos: [],
                        cPos: [],
                        aUV: [],
                        // aSkinWeight: [],
                        // aSkinIndex: [],
                        bUV: [],
                        // bSkinWeight: [],
                        // bSkinIndex: [],
                        faceRe: [],
                        face: {
                            x: [],
                            y: [],
                            z: [],
                            d: [],
                        }
                    }
                    let start = i * (35-16) + 4;//i * 35 + 4;
                    node.aI = data[start];
                    node.bI = data[start + 1];
                    for (let j = 0; j < 3; j++) {
                        node.aPos.push(data[start + 2 + j])
                        node.bPos.push(data[start + 5 + j])
                        node.cPos.push(data[start + 8 + j])
                    }
                    for (let j = 0; j < 2; j++) {
                        node.aUV.push(data[start + 11 + j])
                        node.bUV.push(data[start + 21 -8+ j])
                    }
                    // for (let j = 0; j < 4; j++) {
                    //     node.aSkinWeight.push(data[start + 13 + j])
                    //     node.aSkinIndex.push(data[start + 17 + j])
                    //     node.bSkinWeight.push(data[start + 23 + j])
                    //     node.bSkinIndex.push(data[start + 27 + j])
                    // }
                    let faceRestart = data[start + 31-16] + array1Length + 4
                    let facestart = data[start + 32-16] + array1Length + array2Length + 4
                    let faceReLength = data[start + 33-16]
                    let faceLength = data[start + 34-16]
                    for (let j = 0; j < faceReLength; j++) {
                        node.faceRe.push(data[faceRestart + j])
                    }
                    for (let j = 0; j < faceLength; j++) {
                        node.face.x.push(data[facestart + j * 4])
                        node.face.y.push(data[facestart + j * 4 + 1])
                        node.face.z.push(data[facestart + j * 4 + 2])
                        node.face.d.push(data[facestart + j * 4 + 3])
                    }
                    nodeList.push(node)
                }
                // console.log( nodeList )
            return nodeList
        }
        process(buffer,cb_)

    }
    loadJson(path,cb_) {
        var rawFile = new XMLHttpRequest();
        rawFile.overrideMimeType("application/json");
        rawFile.open("GET", path, true);
        rawFile.onreadystatechange = function() {
            if (rawFile.readyState === 4 && rawFile.status =="200") {
                var str=rawFile.responseText
                var data=JSON.parse(str)
                if(cb_)cb_(data)
            }
        }
        rawFile.send(null);
    }
}