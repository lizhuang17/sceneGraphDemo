import { PMGeometry } from './PMGeometry.js'
export class PMGroup {
    constructor(data){
        console.log(data)
        this.children={}
        for(let meshName in data){
            this.children[meshName]=new PMGeometry(data[meshName])
            this.children[meshName].name=meshName;
        }
        console.log(this)
    }
    getJson(){
        let data={}
        for(let meshName in this.children){
            var geometry=this.children[meshName]
            data[meshName]=geometry.getJson()
        }
        return data
    }
    getJson2(){
        let data={}
        for(let meshName in this.children){
            var geometry=this.children[meshName]
            data[meshName]=geometry.getJson2()
        }
        return data
    }
    addPack(pack){
        // console.log(this)
        // console.log(pack)
        for(let meshName in this.children){
            // console.log(meshName)
            var geometry=this.children[meshName]
            if(!pack[meshName])pack[meshName]=[]
            // console.log(meshName,pack[meshName])
            var pack0=pack[meshName][0]//外面有一层冗余的中括号
            // if( pack0 instanceof Array )pack0=pack0[0]//判断外面是否有一层冗余的中括号
            // console.log("pack0",pack0)
            // if(pack0)
            // for(let i=0;i<pack0.length;i++){
            //     const j=pack0.length-1-i
            //     const increment0=pack0[j]
            //     geometry.addIncrement(increment0)
            // }
            if(pack0){
                // console.log("pack0.length",pack0.length)
                for(let i=pack0.length-1;i>=0;i--){
                    const increment0=pack0[i]
                    geometry.addIncrement(increment0)
                }
            }
            
        }
        // for(let i=0;i<this.children.length;i++){
        //     this.children[i].addIncrement(increment)
        // }
    }
}