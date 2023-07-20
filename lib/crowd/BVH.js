import * as THREE from "three";
export function BVHTree(model,radius){
    //console.log("BVHTree");
    //let start_time = performance.now();
    let contentArray = [];
    let AABBArray = [];
    let MortonArray = [];

    //获取包围盒
    let rootBox = new THREE.Box3();
    rootBox.min = new THREE.Vector3(Infinity,Infinity,Infinity)
    rootBox.max = new THREE.Vector3(-Infinity,-Infinity,-Infinity)
    // console.log(rootBox);
    for (let i =0;i<model.count;i++) {
        let p = model.getPosition(i)
        // console.log(p)
        if (p[0]<rootBox.min.x) rootBox.min.x = p[0]
        if (p[1]<rootBox.min.y) rootBox.min.y = p[1]
        if (p[2]<rootBox.min.z) rootBox.min.z = p[2]
        if (p[0]>rootBox.max.x) rootBox.max.x = p[0]
        if (p[1]>rootBox.max.y) rootBox.max.y = p[1]
        if (p[2]>rootBox.max.z) rootBox.max.z = p[2]
    }
    //设置范围
    rootBox.min.x -= radius
    rootBox.min.y -= radius
    rootBox.min.z -= radius
    rootBox.max.x += radius
    rootBox.max.y += radius
    rootBox.max.z += radius
    // let rootBox = new THREE.Box3().setFromObject(model);
    // console.log(rootBox)
    //scene.add(new THREE.Box3Helper(rootBox));

    for(let i = 0; i < model.count; i++){
        let position = model.getPosition(i)
        let aabbBox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(position[0],position[1],position[2]),new THREE.Vector3(radius*2,radius*2,radius*2))
        // let aabbBox = new THREE.Box3().setFromObject(model.children[i]);
        //scene.add(new THREE.Box3Helper(aabbBox));
        AABBArray.push(aabbBox);
        contentArray.push(i);
        var vec3 = new THREE.Vector3(0, 0, 0);
        AABBArray[i].getCenter(vec3);
        var mortonCode = Morton(vec3.y + rootBox.max.y, vec3.x + rootBox.max.x, vec3.z + rootBox.max.z)
        MortonArray.push(mortonCode);
    }

    contentArray.sort(function (a, b) {
        return MortonArray[a] - MortonArray[b];
    });

    let rootNode = new BVHNode(rootBox, contentArray, 0, contentArray.length);
    Divide(rootNode, contentArray, 0, contentArray.length, model, contentArray,radius);

    //console.log(performance.now() - start_time);
    return rootNode;
}

function Morton(a, b, c) {
    //console.log("Morton");
    let a1 = a.toString();
    let b1 = b.toString();
    let c1 = c.toString();
    let res =[];
    let aIndex = a1.indexOf('.');
    let bIndex = b1.indexOf('.');
    let cIndex = c1.indexOf('.');
    for(let i = aIndex-1, j = bIndex-1, k = cIndex-1; i>-1 || j>-1 || k>-1 ; i --, j --, k--){
        if(k < 0)
            res.unshift('0');
        else
            res.unshift(c1[k]);
        if(j < 0)
            res.unshift('0');
        else
            res.unshift(b1[j]);
        if(i < 0)
            res.unshift('0');
        else
            res.unshift(a1[i]);
    }
    res.push('.');
    for(let i = aIndex+1, j = bIndex+1, k = cIndex+1; i<a1.length || j<b1.length || k<c1.length ; i ++, j ++, k++){
        if(i >= a1.length)
            res.push('0');
        else
            res.push(a1[i]);
        if(j >= b1.length)
            res.push('0');
        else
            res.push(b1[j]);
        if(k >= c1.length)
            res.push('0');
        else
            res.push(c1[k]);

    }
    let temp = res.join('');
    return parseFloat(temp).toFixed(9);
}

function BVHNode(aabbbox, contentArr, start, end){
    //console.log("BVHNode");
    //该节点的AABB包围盒
    this.aabbbox = aabbbox;
    //该节点的包围盒包含的构件的'索引',即AABBArray[contentArray[i]]才是构件
    this.contentArray = contentArr;
    // this.worldPosition = new Vector3();
    this.start = start;
    this.end = end;
    this.prev = null;
    this.next = null;
}

function Divide(rootNode, objArray, start, end, model, contentArray,radius) {
    //将节点作为根节点来二分BVH树
    //console.log("Divide");
    if(objArray.length <= 200){
        rootNode.start = start;
        rootNode.end = end;
        return rootNode;
    }

    rootNode.start = start;
    rootNode.end = end;
    let split = Math.ceil((start + end)/2);
    let preArray = [];
    let nextArray = [];
    let preAABB = new THREE.Box3().set(new THREE.Vector3(Infinity,Infinity,Infinity),new THREE.Vector3(-Infinity,-Infinity,-Infinity));
    let nextAABB = new THREE.Box3().set(new THREE.Vector3(Infinity,Infinity,Infinity),new THREE.Vector3(-Infinity,-Infinity,-Infinity));
    for(let i = start ; i < split; i ++){
        // preGroup.add(model.getPosition(contentArray[i]));
        preArray.push(contentArray[i]);
        let p = model.getPosition(contentArray[i])
        if (p[0]<preAABB.min.x) preAABB.min.x = p[0]
        if (p[1]<preAABB.min.y) preAABB.min.y = p[1]
        if (p[2]<preAABB.min.z) preAABB.min.z = p[2]
        if (p[0]>preAABB.max.x) preAABB.max.x = p[0]
        if (p[1]>preAABB.max.y) preAABB.max.y = p[1]
        if (p[2]>preAABB.max.z) preAABB.max.z = p[2]
    }
    preAABB.min.x -= radius
    preAABB.min.y -= radius
    preAABB.min.z -= radius
    preAABB.max.x += radius
    preAABB.max.y += radius
    preAABB.max.z += radius
    for(let i = split ; i < end; i ++){
        // nextGroup.add(model.children[contentArray[i]].clone());
        nextArray.push(contentArray[i]);
        let p = model.getPosition(contentArray[i])
        if (p[0]<nextAABB.min.x) nextAABB.min.x = p[0]
        if (p[1]<nextAABB.min.y) nextAABB.min.y = p[1]
        if (p[2]<nextAABB.min.z) nextAABB.min.z = p[2]
        if (p[0]>nextAABB.max.x) nextAABB.max.x = p[0]
        if (p[1]>nextAABB.max.y) nextAABB.max.y = p[1]
        if (p[2]>nextAABB.max.z) nextAABB.max.z = p[2]
    }
    nextAABB.min.x -= radius
    nextAABB.min.y -= radius
    nextAABB.min.z -= radius
    nextAABB.max.x += radius
    nextAABB.max.y += radius
    nextAABB.max.z += radius

    // let preAABB = new THREE.Box3().;
    // Scene.add(new Box3Helper(preAABB, Math.random()*0xffffff));
    // let nextAABB = new THREE.Box3().;
    // Scene.add(new Box3Helper(nextAABB,Math.random()*0xffffff));
    let preNode = new BVHNode(preAABB, preArray);
    // preGroup.getWorldPosition(preNode.worldPosition);
    let nextNode = new BVHNode(nextAABB, nextArray);
    // nextGroup.getWorldPosition(nextNode.worldPosition);
    rootNode.prev = preNode;
    rootNode.next = nextNode;
    Divide(preNode, preArray, start, split, model, contentArray,radius);
    Divide(nextNode, nextArray, split, end, model, contentArray,radius);
}