import * as THREE from "three";
import { BVHTree } from "./BVH_new.js";
export class CrowdLod {
    constructor(crowd) {
        this.open=true//是否开启LOD功能
        this.cameraStatePre = ""//上一次更新的时候相机的状态
        this.cameraStatePreFrame = ""//上一帧相机的状态
        this.crowd = crowd;
        this.countAll = crowd.count
        // 构建bvh
        this.bvhOpen=true;//true;//
        // this.bvh = crowd.bvh;
        this.camera = crowd.camera;
        this.radius = 0.6//0.6//1 //化身包围球的最大半径
        this.lod_distance = crowd.lod_distance//[15,25,50,75,100]//2000,10000
        this.lod_distance_max = this.lod_distance[this.lod_distance.length - 1]
        this.lod_distanceSqua = []
        for (let i = 0; i < this.lod_distance.length; i++) {
            this.lod_distanceSqua.push(
                Math.pow(this.lod_distance[i], 2)
            )
        }
        this.frustum = new THREE.Frustum()
        this.lod_lim = crowd.opt.lod_avatarCount
        this.dis_a = Array.apply( Infinity, { length: crowd.count } )

        setTimeout(()=>{
           CrowdLod.frustumCulling(this)//启动遮挡剔除 
        },3000)
        
        // window.test=()=>{
        //     CrowdLod.frustumCulling(scope)
        // }
        var scope = this
        window.addEventListener('resize', () => {
            scope.cameraStatePre = ""
        }, false)
    }
    getCameraState() {
        var p = this.camera.position
        var r = this.camera.rotation
        return p.x + "," + p.y + "," + p.z + ","
            + r.x + "," + r.y + "," + r.z
    }

    static frustumCulling(scope) { //每帧执行一次
        // let startTime = Date.now();
        var cameraState = scope.getCameraState()
        // if (cameraState == scope.cameraStatePreFrame&&scope.open)//相机停止了运动 且系统启动LOD功能
        if (scope.open)//系统启动LOD功能
          if (cameraState !== scope.cameraStatePre) {//如果先将状态发生了改变
            if(scope.bvhOpen){
                let matrix = new THREE.Matrix4().multiplyMatrices(scope.camera.projectionMatrix, scope.camera.matrixWorldInverse);
                scope.frustum.setFromProjectionMatrix(matrix);
                for (let i = 0; i < scope.countAll; i++) {//遍历所有化身的位置
                    if (scope.crowd.lodList[i] == -2) continue//lodList==-2指的是始终不显示这个化身
                    else scope.crowd.lodList[i] = -1
                }
                let p0 = scope.crowd.getPosition(0)
                if (scope.crowd.bvh == null && (p0[0]!= 0 || p0[1] != 0 || p0[2] != 0)) {
                    console.log("build BVH");
                    scope.crowd.bvh = new BVHTree(scope.crowd, scope.radius);
                    // console.log(scope.bvh)
                }
                // 确定BVH的可视性
                if (scope.crowd.bvh != null) var arrayList = scope.crowd.bvh.TraverseBVH(scope.frustum)
                for (let i = 0; i < arrayList.length; i++) {
                    let p = scope.crowd.getPosition(arrayList[i])
                    let point = new THREE.Vector3(p[0], p[1], p[2]);
                    var s = camera.position.clone().sub(point)
                    if (//距离非常远，lod精度最低
                        s.x >= scope.lod_distance_max
                        || s.y >= scope.lod_distance_max
                        || s.z >= scope.lod_distance_max
                    ) {
                        scope.crowd.lodList[arrayList[i]] = scope.lod_distance.length
                    } else {//距离较近具体判断lod等级
                        let distance = s.x * s.x + s.y * s.y + s.z * s.z
                        scope.dis_a[arrayList[i]]=distance
                    }
                }
                scope.form_lodList(arrayList)//对现有层级人数进行检查
            }else{
                let matrix = new THREE.Matrix4().multiplyMatrices(scope.camera.projectionMatrix, scope.camera.matrixWorldInverse);
                scope.frustum.setFromProjectionMatrix(matrix);

                for (let i = 0; i < scope.countAll; i++) {//遍历所有化身的位置
                    if (scope.crowd.lodList[i] == -2) continue//lodList==-2指的是始终不显示这个化身
                    if (window.visibleArea)
                        if(!window.visibleArea[i]){
                            console.log(window.visibleArea)
                            scope.crowd.lodList[i] = -1
                            continue
                        }
                    scope.crowd.lodList[i] = 0//默认显示最低等级的化身
                    let p = scope.crowd.getPosition(i)
                    let point = new THREE.Vector3(p[0], p[1], p[2]);
                    // 视锥剔除
                    // console.log(scope.frustum)
                    for (let j = 0; j < scope.frustum.planes.length-2; j++) {//遍历4个视锥面
                        if (scope.frustum.planes[j].distanceToPoint(point) < -scope.radius) {
                            scope.crowd.lodList[i] = -1//不可见
                            break
                        }
                    }
                    // LOD
                    if (scope.crowd.lodList[i] !== -1) {
                        var s = camera.position.clone().sub(point)
                        if (//距离非常远，lod精度最低
                            s.x >= scope.lod_distance_max
                            || s.y >= scope.lod_distance_max
                            || s.z >= scope.lod_distance_max
                        ) {
                            scope.crowd.lodList[i] = scope.lod_distance.length
                        } else {//距离较近具体判断lod等级
                            let distance = s.x * s.x + s.y * s.y + s.z * s.z
                            scope.crowd.lodList[i] = scope.lod_distanceSqua.length//4
                            for (let j = 0; j < scope.lod_distanceSqua.length; j++) {//j=0 1 2 3
                                if (distance < scope.lod_distanceSqua[j]) {
                                    scope.crowd.lodList[i] = j
                                    break
                                }
                            }
                        }
                    } else {
                        // scope.crowd.lodList[i]=scope.lod_distance.length//不可见的对象使用超低模渲染
                    }
                }
            }
            scope.crowd.update()
            scope.cameraStatePre = cameraState
          }else{
            if (scope.crowd.bvh != null) var arrayList = scope.crowd.bvh.TraverseBVH(scope.frustum)
                for (let i = 0; i < arrayList.length; i++) {
                    let p = scope.crowd.getPosition(arrayList[i])
                    let point = new THREE.Vector3(p[0], p[1], p[2]);
                    var s = camera.position.clone().sub(point)
                    if (//距离非常远，lod精度最低
                        s.x >= scope.lod_distance_max
                        || s.y >= scope.lod_distance_max
                        || s.z >= scope.lod_distance_max
                    ) {
                        scope.crowd.lodList[arrayList[i]] = scope.lod_distance.length
                    } else {//距离较近具体判断lod等级
                        let distance = s.x * s.x + s.y * s.y + s.z * s.z
                        scope.dis_a[arrayList[i]]=distance
                    }
                }
                scope.form_lodList(arrayList)
          }
          scope.cameraStatePreFrame = cameraState
          requestAnimationFrame(() => {
            CrowdLod.frustumCulling(scope)
          })
        // setTimeout(()=>{//每秒更新一次
        //     CrowdLod.frustumCulling(scope)
        // },3000)
    }
    form_lodList(arrayList){
        var scope = this
        arrayList.sort(function(a,b){return scope.dis_a[a]-scope.dis_a[b]})
        let j = 0;
        for(var i = 0; i < arrayList.length; i++){
            this.crowd.lodList[arrayList[i]] = this.lod_distanceSqua.length//4
            if (this.dis_a[arrayList[i]] < this.lod_distanceSqua[j] && i < this.lod_lim[j]) {
                this.crowd.lodList[arrayList[i]] = j
                arrayList.slice(i)
            }else{ 
                j+=1
                this.crowd.lodList[arrayList[i]] = j
                arrayList.slice(i)
                if(j ==  this.lod_distanceSqua.length){
                    break
                }
            }
        }
    }

}

