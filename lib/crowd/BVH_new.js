import * as THREE from "three";
export class BVHTree{
    constructor(model,radius){
        //仅获得每个人物的aabbbox，不进行包围盒计算
        this.AABBArray = [];
        this.count = model.count;
        this.change = [];
        for(let i = 0; i < model.count; i++){
            let position = model.getPosition(i)
            let aabbBox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(position[0],position[1],position[2]),new THREE.Vector3(radius*2,radius*2,radius*2))
            this.AABBArray.push(aabbBox);
        }
    }
    TraverseBVH(frustum){
        this.frustum = frustum
        let arrayList=[]
        for(var i=0;i<this.count;i++){
            if(this.AABBDect(frustum, this.AABBArray[i]))
                arrayList.push(i)
        }
        return arrayList
    }
    AABBDect(frustum, aabbBox) {
        for (let i = 0; i < frustum.planes.length; i++) {
            let p = new THREE.Vector3(aabbBox.min.x,aabbBox.min.y,aabbBox.min.z);
            if (frustum.planes[i].normal.x >= 0) p.x = aabbBox.max.x;
            if (frustum.planes[i].normal.y >= 0) p.y = aabbBox.max.y;
            if (frustum.planes[i].normal.z >= 0) p.z = aabbBox.max.z;

            let nt = (frustum.planes[i].normal.x * p.x) + (frustum.planes[i].normal.y * p.y) + (frustum.planes[i].normal.z * p.z);
            if (nt < -frustum.planes[i].constant) {
                return false
            }
        }
        return true;
    }

}
