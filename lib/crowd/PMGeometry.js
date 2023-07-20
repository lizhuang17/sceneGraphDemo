export class PMGeometry {
    constructor(data){
        // console.log(type(data["vId"]),data["vId"])
        // console.log(type(data["fId"]),data["fId"])
        // console.log(type(data["index"]),data["index"])
        for(let tag in data)//这句命令没啥作用
            if(data[tag]._ArrayData_)data[tag]=data[tag]._ArrayData_

        this.v={}
        this.f={}
        
        const l=data["vId"]
        if (typeof(data["fId"])=="number"){
            data["fId"]=[data["fId"]]
        }
        for (let i =0;i< data["fId"].length;i++){
            const fid0=data["fId"][i]
            const face0=[
                l[data["index"][3*i]],
                l[data["index"][3*i+1]],
                l[data["index"][3*i+2]]
            ]
            this.f[fid0]=face0
        }
        for(let i=0;i<data["vId"].length;i++){
            const vid0=data["vId"][i]
            const vertex0=[
                data["position"][3*i],
                data["position"][3*i+1],
                data["position"][3*i+2],

                data["uv"][2*i],
                data["uv"][2*i+1],

                data["skinIndex"][4*i],
                data["skinIndex"][4*i+1],
                data["skinIndex"][4*i+2],
                data["skinIndex"][4*i+3],

                data["skinWeight"][4*i],
                data["skinWeight"][4*i+1],
                data["skinWeight"][4*i+2],
                data["skinWeight"][4*i+3],
            ]
            this.v[vid0]=vertex0
        }
    }
    getJson2(){
        let data=this.getJson()
        let data2={}
        for (let tag in data){
            data2[tag]=
                {
                    "array":data[tag]
                }
        }//attributes.position
        data2.position.count=data2.position.array.length/3
        return {
            "attributes":data2,
            "index":data.index
        }
    }
    getJson(){
        var data={
            "position":[],
            "uv":[],
            "skinWeight":[],
            "skinIndex":[],
            "index":[]
        }
        const v_id=Object.keys(this.v)
        const v=Object.values(this.v)
        const f=Object.values(this.f)
        let l={}
        for(let i=0;i<v.length;i++){
            let v0=v[i]
            l[v_id[i]]=i
            data.position.push(v0[0])
            data.position.push(v0[1])
            data.position.push(v0[2])

            data.uv.push(v0[3])
            data.uv.push(v0[4])

            data.skinIndex.push(v0[5])
            data.skinIndex.push(v0[6])
            data.skinIndex.push(v0[7])
            data.skinIndex.push(v0[8])

            data.skinWeight.push(v0[9])
            data.skinWeight.push(v0[10])
            data.skinWeight.push(v0[11])
            data.skinWeight.push(v0[12])
        }
        for(let i=0;i<f.length;i++){
            for(let j=0;j<3;j++){
                const elem=l[f[i][j]]
                data.index.push(elem)
            }
        }
        return data
    }
    addIncrement(increment){

        const aI=     increment["aI"]
        // console.log(aI)
        const aPos=   increment["aPos"]
        const aUV=    increment["aUV"]
        const aSkinWeight=increment["aSkinWeight"]
        const aSkinIndex= increment["aSkinIndex"]

        const bI=     increment["bI"]
        const bPos=   increment["bPos"]
        const bUV=    increment["bUV"]
        const bSkinWeight=increment["bSkinWeight"]
        const bSkinIndex= increment["bSkinIndex"]
    
        this.v[aI]=[
            aPos[0],
            aPos[1],
            aPos[2],

            aUV[0],
            aUV[1],

            aSkinIndex[0],
            aSkinIndex[1],
            aSkinIndex[2],
            aSkinIndex[3],

            aSkinWeight[0],
            aSkinWeight[1],
            aSkinWeight[2],
            aSkinWeight[3]
        ]
        this.v[bI]=[
            bPos[0],
            bPos[1],
            bPos[2],
        
            bUV[0],
            bUV[1],

            bSkinIndex[0],
            bSkinIndex[1],
            bSkinIndex[2],
            bSkinIndex[3],

            bSkinWeight[0],
            bSkinWeight[1],
            bSkinWeight[2],
            bSkinWeight[3]
        ]

        let faceRe=increment["faceRe"]
        if (typeof(faceRe)=="number"){
            faceRe=[faceRe]
        }
        // console.log(faceRe.length)
        for(let i=0;i<faceRe.length;i++){
            let face0=this.f[faceRe[i]]
            // console.log(this.name,faceRe[i],"face0",face0)
            if(face0)
            for(let j=0;j<3;j++){
                if(face0[j]==aI){
                    face0[j]=bI
                }
            }
        }
    
        let x=increment["face"]["x"]
        let y=increment["face"]["y"]
        let z=increment["face"]["z"]
        let d=increment["face"]["d"]
        if(typeof(x)=="number"){//if(!x instanceof(Array)){
            x=[x]
            y=[y]
            z=[z]
            d=[d]
        }
        // console.log("d",d)
        for(let i=0;i<d.length;i++){
            this.f[d[i]]=[
                x[i],
                y[i],
                z[i]
            ]
        }
    }

}