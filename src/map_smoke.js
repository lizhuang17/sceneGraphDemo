import * as THREE from "three"
import {escapmap} from './map.js'
import {GPUComputationRenderer} from '../lib/three/examples/jsm/misc/GPUComputationRenderer.js'
import { SimplexNoise } from '../lib/three/examples/jsm/math/SimplexNoise.js';
import {TextureAnimator} from '../lib/TextureAnimator'
export class smokemap{
    constructor(scene){
        this.scene = scene
        this.map = []
        this.final = []
        this.maps=new escapmap()
        this.map_edges = []
        this.grids = undefined
        this.meshs = undefined
        this.rm = undefined
        this.count = 0// HaiNing2-1:131587, KaiLiNan4-1:4062291
        this.move_mesh = undefined
        this.smoke_plane = undefined
        this.all_list = []// 存储所粒子的id
        this.ops = []// 存储透明度
        this.positions = []// 存储位置
        this.list = []
        this.list_id = []
        this.dops = []// 变化的块的变化程度
        this.smoke_Q = 10000
        this.finish_load = false
        let self = this
        const loader = new THREE.FileLoader();
        loader.load('KaiLiNan.csv', function (value) {
            let i = 0;
            value.split('\n').forEach(function(v){
                if(i == 0){
                    v.split(',').forEach(function(w){
                        self.map_edges.push(parseInt(w))
                    });
                    i += 1
                }else{
                    let line = []
                    v.split(',').forEach(function(w){
                        line.push(parseInt(w))
                    });
                    if(line.length > 5)
                        self.map.push(line)
                }
            });
        })  
        loader.load('KaiLiNan4-1.csv', function (value) {
            value.split('\n').forEach(function(v){
                let line = []
                v.split(',').forEach(function(w){
                    line.push(parseInt(w))
                });
                if(line.length > 6)
                    self.final.push(line)
            });
        }) 
    }
    init(renderer, pos = [1800, 1000]){//[815, 320]
        {
            // self.rm = new Mesh(new PlaneGeometry(10,10), new THREE.MeshBasicMaterial( { color: 0xff0000, side:THREE.DoubleSide } ))
            // self.am = new Mesh(new PlaneGeometry(10,10), new THREE.MeshBasicMaterial( { color: 0xffff00, side:THREE.DoubleSide } ))
            // self.am.position.set(pos[0]-1422,pos[1]-848,555)
            // self.rm.position.set(pos[0]-1322,pos[1]-768-20,555) // KaiLiNan
            // // self.rm.position.set(pos[0]-992,pos[1]-425,10)

            // // self.scene.add(self.rm)
            // // self.scene.add(self.am)
            // const geometry = new THREE.BufferGeometry()
            // const vertices = new Float32Array( [
            //     -1.0, -1.0,  1.0, // v0
            //      1.0, -1.0,  1.0, // v1
            //      1.0,  1.0,  1.0, // v2
    
            //      1.0,  1.0,  1.0, // v3
            //     -1.0,  1.0,  1.0, // v4
            //     -1.0, -1.0,  1.0  // v5
            // ] )
            // geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) )
            // const material = new THREE.MeshBasicMaterial( { color: 0x0000ff } )
            // self.meshs = new THREE.InstancedMesh( geometry, material, 4062300)
            // self.grids=self.link(map)
            // // self.scene.add(self.meshs)

            // let wall = new Mesh(new PlaneGeometry(10000,10000), new THREE.MeshBasicMaterial( { color: 0xaaaaaa, side:THREE.DoubleSide } ))
            // wall.position.set(0,0,0)
            // wall.rotation.set(Math.PI/2,0,0)
            // // self.scene.add(wall)
        }
        this.smoke_plane = new smokeplane(this.map, this.map_edges, pos, this.scene, renderer)
        this.maps.init(this.final,this.scene)

        this.firemap = new THREE.TextureLoader().load('textures/fire.webp')
        this.fire_t = new TextureAnimator( this.firemap, 12, 6, 72, 55 ); // texture, #horiz, #vert, #total, duration.
        let Fmaterial=new THREE.SpriteMaterial({ transparent: true, map: this.firemap, color: 0xffffff });
        this.Fmesh = new THREE.Sprite(Fmaterial);
        this.Fmesh.position.set(pos[0]-1322,pos[1]-768,520) 
        this.Fmesh.scale.set(100,100,100)
        this.scene.add(this.Fmesh)
        
        this.finish_load = true
        console.log("finish_smoke_map") 
    }
    link(grid){
        /*  1|2|3
            8|x|4
            7|6|5   */
        let rn = 0
        let lenx = grid.length
        let leny = grid[0].length
        for(var x = 0; x < lenx; x++){
            for(var y = 0; y < leny; y++){
                if(grid[x][y].ph >= 0){
                    try{var n1=grid[x-1][y+1];if(n1==undefined)n1 = null;}catch{var n1 = null;}
                    try{var n2=grid[x][y+1];if(n2==undefined)n2 = null;}catch{var n2 = null;}
                    try{var n3=grid[x+1][y+1];if(n3==undefined)n3 = null;}catch{var n3 = null;}
                    try{var n4=grid[x+1][y];if(n4==undefined)n4 = null;}catch{var n4 = null;}
                    try{var n5=grid[x+1][y-1];if(n5==undefined)n5 = null;}catch{var n5 = null;}
                    try{var n6=grid[x][y-1];if(n6==undefined)n6 = null;}catch{var n6 = null;}
                    try{var n7=grid[x-1][y-1];if(n7==undefined)n7 = null;}catch{var n7 = null;}
                    try{var n8=grid[x-1][y];if(n8==undefined)n8 = null;}catch{var n8 = null;}
                    grid[x][y].findchild([n1,n2,n3,n4,n5,n6,n7,n8], 0, [x+this.map_edges[1],y+this.map_edges[3]])
                    // this.count += 1
                }
                else if(grid[x][y].ph == -1){
                    // this.meshs.setMatrixAt(this.count, new THREE.Matrix4().set(1,0,0,x-992,0,1,0,y-425,0,0,1,10,0,0,0,1))
                    this.meshs.setMatrixAt(this.count, new THREE.Matrix4().set(1,0,0,x-1322,0,1,0,y-768,0,0,1,555,0,0,0,1))// 需要修改，将map_edge传入
                    this.count+=1
                }
                // else{
                //     this.rm.setMatrixAt(rn,new THREE.Matrix4().set(1,0,0,x-1322,0,1,0,y-751,0,0,1,481,0,0,0,1))// 需要修改，将map_edge传入
                //     rn+=1
                // }
            }
        }
        return grid
    }
    combin(map){
        var mx = map.length
        var my = map[0].length
        if(my % 4 != 0){
            for(var i = 0; i < 4 - my % 4; i++){
                for(var j = 0; j < mx; j++){
                    map[j].push(-1)
                }
            }
        }
        my = map[0].length
        if(mx % 4 != 0){
            for(var i = 0; i < 4 - mx % 4; i++){
                var add = new Array(my).fill(-1)
                map.push(add)
            }
        }
        mx = map.length
        var sy = Math.floor(my / 4)
        var new_data = []
        for(var i = 0; i < mx; i++){
            let line =[]
            for(var j = 0; j < sy; j++){
                let ph = Infinity
                if(map[i][j * 4] >= 0)
                    ph = Math.min(map[i][j * 4], ph)
                if(map[i][j * 4 + 1] >= 0)
                    ph = Math.min(map[i][j * 4 + 1], ph)
                if(map[i][j * 4 + 2] >= 0)
                    ph = Math.min(map[i][j * 4 + 2], ph)
                if(map[i][j * 4 + 3] >= 0)
                    ph = Math.min(map[i][j * 4 + 3], ph)
                if(ph != Infinity)
                    line.push(ph)
                else
                    line.push(-1)
            }
            new_data.push(line)
        }
        var sx = Math.floor(mx / 4)
        my = new_data[0].length
        var final = []
        for(var i = 0; i < sx; i++){
            let line = []
            for(var j = 0; j < my; j++){
                let ph = Infinity
                if(new_data[i * 4][j] >= 0)
                    ph = Math.min(new_data[i * 4][j], ph)
                if(new_data[i * 4 + 1][j] >= 0)
                    ph = Math.min(new_data[i * 4 + 1][j], ph)
                if(new_data[i * 4 + 2][j] >= 0)
                    ph = Math.min(new_data[i * 4 + 2][j], ph)
                if(new_data[i * 4 + 3][j] >= 0)
                    ph = Math.min(new_data[i * 4 + 3][j], ph)
                if(ph != Infinity)
                    line.push(ph)
                else
                    line.push(-1)
            }
            final.push(line)
        }
        // this.exportCSV(final)
        return final
    }
    // init_smoke(pos){// 生成第一个粒子
    //     const vertexShader = `
    //         uniform float pixelRatio; // 设备像素比例
    //         uniform float pointSize; // 粒子的固定大小
            
    //         attribute float alpha; // 透明度属性
    //         varying float vAlpha; // 透明度传递给片段着色器
            
    //         void main() {
    //             vAlpha = alpha; // 将透明度值赋给 vAlpha
                
    //             // 计算相对屏幕空间的尺寸
    //             vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    //             gl_PointSize = pointSize * pixelRatio;
                
    //             // 应用尺寸衰减
    //             gl_PointSize /= -mvPosition.z;
                
    //             gl_Position = projectionMatrix * mvPosition; // 计算最终的顶点位置
    //         }
    //         `;
    //     const fragmentShader = `
    //     uniform sampler2D textureSampler; // 贴图
    //     varying float vAlpha; // 接收顶点着色器传递的透明度值
        
    //     void main() {
    //         vec4 color = texture(textureSampler, gl_PointCoord); // 从贴图中获取颜色
    //         gl_FragColor = vec4(color.rgb, color.a * vAlpha); // 设置粒子的颜色和透明度
    //     }
    //     `;
    //     const texture = new THREE.TextureLoader().load('textures/smokeparticle.png')

    //     let id = this.grids[pos[0]-this.map_edges[1]][pos[1]-this.map_edges[3]].id
    //     this.all_list.push(id)
    //     this.list.push([pos[0],pos[1]])
    //     this.list_id.push(id)
    //     this.dops.push(this.smoke_Q)// 默认源强为1

    //     const geometry = new THREE.BufferGeometry();
    //     this.positions.push(...pos);
    //     this.ops.push(1, 1, 1)
        
    //     this.colorAttribute = new THREE.Float32BufferAttribute(this.ops, 3);
    //     geometry.setAttribute('color', this.colorAttribute);
    //     this.positionAttribute = new THREE.Float32BufferAttribute(this.positions, 3);
    //     geometry.setAttribute('position', this.positionAttribute);

    //     this.material = new THREE.PointsMaterial({
    //         vertexColors: true,
    //         map: texture
    //     });

    //     this.meshs = new THREE.Points(geometry, this.material)
    //     console.log("added")
    //     this.scene.add(this.meshs)
    // }

    // add_new(new_list){
    //     for(let i = 0; i < new_list.length; i++){
    //         let id = this.grids[new_list[i][0]-this.map_edges[1]][new_list[i][1]-this.map_edges[3]].id
    //         this.all_list.push(id)
    //         this.positions.push(...new_list[i]);
    //         this.ops.push(1, 1, 1)
    //     }
    //     this.colorAttribute = new THREE.Float32BufferAttribute(this.ops, 3);
    //     this.meshs.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.ops, 3));
    //     this.positionAttribute = new THREE.Float32BufferAttribute(this.positions, 3);
    //     this.meshs.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    // }

    // update_points(new_list){
    //     if(new_list && new_list.length > 0){
    //         this.add_new(new_list)
    //     }  
    //     this.positionAttribute.needsUpdate = true
    //     this.colorAttribute.needsUpdate = true
    // }

    // checkifallin(list){
    //     let new_list = []
    //     for(var i = 0; i< list.length; i++){
    //         let [rowIndex, columnIndex] = this.list[i];
    //         let id = this.grids[rowIndex-this.map_edges[1]][columnIndex-this.map_edges[3]].id
    //         let tn = this.all_list.indexOf(id)
    //         if(tn < 0){
    //             new_list.push([rowIndex, columnIndex, 500])
    //         }
    //     }
    //     return new_list
    // }

    // randomstart(){
    //     let x = Math.round(Math.random() * (this.map_edges[0] - this.map_edges[1]) + this.map_edges[1]) 
    //     let y = Math.round(Math.random() * (this.map_edges[2] - this.map_edges[3]) + this.map_edges[3]) 
    //     while(this.grids[x-this.map_edges[1]][y-this.map_edges[3]].ph < 0){
    //         x = Math.round(Math.random() * (this.map_edges[0] - this.map_edges[1]) + this.map_edges[1]) 
    //         y = Math.round(Math.random() * (this.map_edges[2] - this.map_edges[3]) + this.map_edges[3]) 
    //     }

    //     console.log([x,y])
    //     this.init_smoke([905, 432, 500])
    // }

    // update(){// 加入溢出计算公式
    //     let count = this.list.length
    //     //console.log(count)
    //     // this.smoke_Q -= count
    //     let new_list = this.checkifallin(this.list)
    //     for(let i = 0; i < count; i++){
    //         if(this.list[i]){
    //             let [rowIndex, columnIndex] = this.list[i];
    //             let id = this.grids[rowIndex-this.map_edges[1]][columnIndex-this.map_edges[3]].id
    //             let tn = this.all_list.indexOf(id)
    //             let n = undefined
    //             if(this.smoke_Q <= 1){
    //                 this.ops[tn*3] -= this.dops[i]/3
    //                 this.ops[tn*3+1] -= this.dops[i]/3
    //                 this.ops[tn*3+2] -= this.dops[i]/3
    //                 n = this.grids[rowIndex-this.map_edges[1]][columnIndex-this.map_edges[3]].update(this.dops[i])    
    //             }else{
    //                 this.ops[tn*3] -= 0.75
    //                 this.ops[tn*3+1] -= 0.75
    //                 this.ops[tn*3+2] -= 0.75
    //                 n = this.grids[rowIndex-this.map_edges[1]][columnIndex-this.map_edges[3]].update(1)
    //             }
    //             let numbers = n.length
    //             if(numbers > 0){// 格子移除了，将新的格子推入列表
    //                 this.list.splice(i, 1)
    //                 this.list_id.splice(i, 1)

    //                 for(let j = 0; j < numbers; j++){
    //                     if(n[j]){
    //                         let d = this.dops[i] / numbers
    //                         if(j % 2 == 0) d / 1.4
    //                         let newer = this.list_id.indexOf(n[j].id)
    //                         if(newer >= 0) this.dops[newer] += d
    //                         else{
    //                             this.list.push(n[j].pos)
    //                             this.list_id.push(n[j].id)
    //                             this.dops.push(d)
    //                             new_list.push([...n[j].pos,500])
    //                         }
    //                     }
    //                 }
    //                 this.dops.splice(i,1)
    //             }
    //         }   
    //     }
    //     this.update_points(new_list)
    // }

    // update_0(){
    //     let count = this.list.length
    //     let new_list = this.checkifallin(this.list)
    //     for(let i = 0; i < count; i++){
    //         if(this.list[i]){
    //             let [rowIndex, columnIndex] = this.list[i];
    //             let id = this.grids[rowIndex-this.map_edges[1]][columnIndex-this.map_edges[3]].id
    //             let tn = this.all_list.indexOf(id)

    //             this.ops[tn*3] -= this.dops[i]/3
    //             this.ops[tn*3+1] -= this.dops[i]/3
    //             this.ops[tn*3+2] -= this.dops[i]/3
    //             let n = this.grids[rowIndex-this.map_edges[1]][columnIndex-this.map_edges[3]].update(this.dops[i])
                
    //             // this.ops[tn*3] -= 0.5
    //             // this.ops[tn*3+1] -= 0.5
    //             // this.ops[tn*3+2] -= 0.5
    //             // let n = this.grids[rowIndex-this.map_edges[1]][columnIndex-this.map_edges[3]].update(1)

    //             let numbers = n.length
    //             if(numbers > 0){// 格子移除了，将新的格子推入列表
    //                 this.list.splice(i, 1)
    //                 this.list_id.splice(i, 1)

    //                 for(let j = 0; j < numbers; j++){
    //                     if(n[j]){
    //                         let d = this.dops[i] / numbers
    //                         if(j % 2 == 0) d / 1.4
    //                         let newer = this.list_id.indexOf(n[j].id)
    //                         if(newer >= 0) this.dops[newer] += d
    //                         else{
    //                             this.list.push(n[j].pos)
    //                             this.list_id.push(n[j].id)
    //                             this.dops.push(d)
    //                             // this.dops.push(1)
    //                             new_list.push([...n[j].pos,500])
    //                         }
    //                     }
    //                 }
    //                 this.dops.splice(i,1)
    //             }
    //         }   
    //     }
    //     this.update_points(new_list)
    // }

    update(delta = 0.01){
        this.smoke_plane.update(delta)
        this.fire_t.update(50)
    }

    reQ(smoke_Q){
        this.smoke_Q = smoke_Q
        this.dops.map(v => v * smoke_Q)
    }
}
// const texture = new THREE.TextureLoader().load('textures/smokeparticle.png')
// const sprit_ceil = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0}))
class ceil
{
    constructor(ph){
        this.op = 0
        this.id = undefined
        this.pos = undefined
        this.child=[]
        if(ph == 0)
            this.ph = 1
        // else if(ph == -1)
        //     this.ph = -2
        else
            this.ph = -1
        // this.added = false
    }
    findchild(next, count, pos){
        this.pos = pos
        // if(pos[0] > -200 && pos[0] < 400 && pos[1] > -200 && pos[1] < 400){
        //     this.sprit = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0}))
        //     this.sprit.scale.set(10,10,10)
        //     this.sprit.position.set(pos[0], pos[1], 100)
        // }
        this.id = count
        for(let i = 0; i < 8; i++){
            if(next[i] != null){
                if(next[i].ph < 0)
                    next[i] = null
            }
            this.child.push(next[i])
        }
    }
    update(op){
        this.op += op
        // if(!this.added)
        //     scene.add(this.sprit)
        // this.sprit.material.opacity = this.op
        if(this.op >= 1){
            this.op = 1
            let next = []
            let yes = false
            for(let i = 0; i < 8; i++){
                if(this.child[i] && this.child[i].ph > 0 && this.child[i].op < 1){
                    next.push(this.child[i])
                    yes = true
                }
                else
                    next.push(null)
            }
            if(yes) return next
            else return []
        }else return []
    }
    mov_n(end){
        if(this.ph < 0){
            let next = [0,0,0,0,0,0,0,0]
            if(end[0] > this.pos[0]){
                next[2]+=1
                next[3]+=1
                next[4]+=1
            }
            else if(end[0] == this.pos[0]){
                next[1]+=1
                next[5]+=1
            }
            else if(end[0] < this.pos[0]){
                next[0]+=1
                next[7]+=1
                next[6]+=1
            }
            if(end[1] > this.pos[1]){
                next[0]+=1
                next[1]+=1
                next[2]+=1
            }
            else if(end[1] == this.pos[1]){
                next[7]+=1
                next[3]+=1
            }
            else if(end[1] < this.pos[1]){
                next[4]+=1
                next[5]+=1
                next[6]+=1
            }
            for(let i = 0; i < 8; i++){
                if(this.child[i] && this.child[i].ph > 0)
                    next[i]+=1
            }
            let choose = next.indexOf(Math.max(...next))// 存在问题，如果遇到凹字形障碍会出错
            return this.child[choose]
        }
        else
            return false
    }
}
const noise = new THREE.TextureLoader().load( 'textures/cloud.png' );
const smoke_t = new THREE.TextureLoader().load('textures/pur.jpg' )
smoke_t.wrapS = smoke_t.wrapT = THREE.MirroredRepeatWrapping
const heightmapFragmentShader = `
    #include <common>

    uniform float smokeQ;
    uniform float time;

    void main()	{
        // 获取坐标
        vec2 cellSize = 1.0 / resolution.xy;
        vec2 uv = gl_FragCoord.xy * cellSize;

        // 获取周围节点
        vec4 point = texture2D(heightmap, uv);
        vec4 n_0 = texture2D(heightmap, uv + vec2(-cellSize.x, cellSize.y));
        vec4 n_1 = texture2D(heightmap, uv + vec2(0.0, cellSize.y));
        vec4 n_2 = texture2D(heightmap, uv + vec2(cellSize.x, cellSize.y));
        vec4 n_3 = texture2D(heightmap, uv + vec2(cellSize.x, 0.0));
        vec4 n_4 = texture2D(heightmap, uv + vec2(cellSize.x, -cellSize.y));
        vec4 n_5 = texture2D(heightmap, uv + vec2(0.0, -cellSize.y));
        vec4 n_6 = texture2D(heightmap, uv + vec2(-cellSize.x, -cellSize.y));
        vec4 n_7 = texture2D(heightmap, uv + vec2(-cellSize.x, 0.0));
        
        // 计算烟雾浓度值
        // float pa = mod(point.a, 100.0);
        // if ( pa < 1.0 ) {
            if(point.a < 1.0) {
                if (point.b > 0.0 && point.r >= 1.0) {
                    float added = (smokeQ + 1.0) / point.r;
                    if(added >= 0.1) {
                        point.a += added;
                    }
                    if(point.r >= point.b + 1.0) {
                        point.r -= point.b;
                    }else {
                        point.r = 1.0;
                    }
                    if (point.a >= 1.0) {
                        point.r = 1.0;
                        float count = 0.0;
                        if (n_0.a < 1.0 && n_0.r >= 1.0) { count += 1.0; }
                        if (n_1.a < 1.0 && n_1.r >= 1.0) { count += 1.0; }
                        if (n_2.a < 1.0 && n_2.r >= 1.0) { count += 1.0; }
                        if (n_3.a < 1.0 && n_3.r >= 1.0) { count += 1.0; }
                        if (n_4.a < 1.0 && n_4.r >= 1.0) { count += 1.0; }
                        if (n_5.a < 1.0 && n_5.r >= 1.0) { count += 1.0; }
                        if (n_6.a < 1.0 && n_6.r >= 1.0) { count += 1.0; }
                        if (n_7.a < 1.0 && n_7.r >= 1.0) { count += 1.0; }
                        point.b = -1.0 * count * (smokeQ + 1.0);
                    }
                } 
                if(point.b == 0.0 && point.r >= 1.0) {
                    float if_c = -1.0;
                    if(n_0.b < 0.0){ point.b += smokeQ + 1.0; if_c = min(if_c, n_0.b); }
                    if(n_1.b < 0.0){ point.b += smokeQ + 1.0; if_c = min(if_c, n_1.b); }
                    if(n_2.b < 0.0){ point.b += smokeQ + 1.0; if_c = min(if_c, n_2.b); }
                    if(n_3.b < 0.0){ point.b += smokeQ + 1.0; if_c = min(if_c, n_3.b); }
                    if(n_4.b < 0.0){ point.b += smokeQ + 1.0; if_c = min(if_c, n_4.b); }
                    if(n_5.b < 0.0){ point.b += smokeQ + 1.0; if_c = min(if_c, n_5.b); }
                    if(n_6.b < 0.0){ point.b += smokeQ + 1.0; if_c = min(if_c, n_6.b); }
                    if(n_7.b < 0.0){ point.b += smokeQ + 1.0; if_c = min(if_c, n_7.b); }
                    point.r = if_c * -1.0;
                }
            }
            // else {
            //     float count = 0.0;
            //     if (n_0.b < 0.0 || n_0.r < 0.0) { count += 1.0; }
            //     if (n_1.b < 0.0 || n_1.r < 0.0) { count += 1.0; }
            //     if (n_2.b < 0.0 || n_2.r < 0.0) { count += 1.0; }
            //     if (n_3.b < 0.0 || n_3.r < 0.0) { count += 1.0; }
            //     if (n_4.b < 0.0 || n_4.r < 0.0) { count += 1.0; }
            //     if (n_5.b < 0.0 || n_5.r < 0.0) { count += 1.0; }
            //     if (n_6.b < 0.0 || n_6.r < 0.0) { count += 1.0; }
            //     if (n_7.b < 0.0 || n_7.r < 0.0) { count += 1.0; }
            //     if (count == 8.0) {
            //         point.b = smokeQ + 1.0;
            //     }
                
            // }
        // }
        else {
            point.a += 1.0;
        }

        vec2 neuv = uv + vec2(cellSize.x, 0.0);
        if(neuv.x > 1.0){
            neuv.x = 0.0;
        }
        point.g = texture2D(heightmap, neuv).g;
        gl_FragColor = point;
    }
`;
class smokeplane
{
    // constructor(map, map_edges, point, scene, renderer){
    //     const heightmapFragmentShader = `
    //         #include <common>

    //         uniform float smokeQ;
    //         uniform float time;

    //         void main()	{
    //             // 获取坐标
    //             vec2 cellSize = 1.0 / resolution.xy;
    //             vec2 uv = gl_FragCoord.xy * cellSize;

    //             // 获取周围节点
    //             vec4 point = texture2D(heightmap, uv);
    //             vec4 n_0 = texture2D(heightmap, uv + vec2(-cellSize.x, cellSize.y));
    //             vec4 n_1 = texture2D(heightmap, uv + vec2(0.0, cellSize.y));
    //             vec4 n_2 = texture2D(heightmap, uv + vec2(cellSize.x, cellSize.y));
    //             vec4 n_3 = texture2D(heightmap, uv + vec2(cellSize.x, 0.0));
    //             vec4 n_4 = texture2D(heightmap, uv + vec2(cellSize.x, -cellSize.y));
    //             vec4 n_5 = texture2D(heightmap, uv + vec2(0.0, -cellSize.y));
    //             vec4 n_6 = texture2D(heightmap, uv + vec2(-cellSize.x, -cellSize.y));
    //             vec4 n_7 = texture2D(heightmap, uv + vec2(-cellSize.x, 0.0));
                
    //             // 计算烟雾浓度值
    //             float pa = mod(point.a, 100.0);
    //             if ( pa < 1.0 ) {
    //                 if(point.a < 100.0) {
    //                     if (point.b > 0.0 && point.r >= 1.0) {
    //                         float added = (smokeQ + 1.0) / point.r;
    //                         if(added >= 0.1) {
    //                             point.a += added;
    //                         }
    //                         if(point.r >= point.b + 1.0) {
    //                             point.r -= point.b;
    //                         }else {
    //                             point.r = 1.0;
    //                         }
    //                         if (point.a >= 1.0) {
    //                             point.r = 1.0;
    //                             float count = 0.0;
    //                             if (n_0.a < 1.0 && n_0.r >= 1.0) { count += 1.0; }
    //                             if (n_1.a < 1.0 && n_1.r >= 1.0) { count += 1.0; }
    //                             if (n_2.a < 1.0 && n_2.r >= 1.0) { count += 1.0; }
    //                             if (n_3.a < 1.0 && n_3.r >= 1.0) { count += 1.0; }
    //                             if (n_4.a < 1.0 && n_4.r >= 1.0) { count += 1.0; }
    //                             if (n_5.a < 1.0 && n_5.r >= 1.0) { count += 1.0; }
    //                             if (n_6.a < 1.0 && n_6.r >= 1.0) { count += 1.0; }
    //                             if (n_7.a < 1.0 && n_7.r >= 1.0) { count += 1.0; }
    //                             point.b = -1.0 * count * (smokeQ + 1.0);
    //                         }
    //                     } 
    //                     if(point.b == 0.0 && point.r >= 1.0) {
    //                         float if_c = -1.0;
    //                         if(n_0.b < 0.0){ point.b += smokeQ + 1.0; if_c = min(if_c, n_0.b); }
    //                         if(n_1.b < 0.0){ point.b += smokeQ + 1.0; if_c = min(if_c, n_1.b); }
    //                         if(n_2.b < 0.0){ point.b += smokeQ + 1.0; if_c = min(if_c, n_2.b); }
    //                         if(n_3.b < 0.0){ point.b += smokeQ + 1.0; if_c = min(if_c, n_3.b); }
    //                         if(n_4.b < 0.0){ point.b += smokeQ + 1.0; if_c = min(if_c, n_4.b); }
    //                         if(n_5.b < 0.0){ point.b += smokeQ + 1.0; if_c = min(if_c, n_5.b); }
    //                         if(n_6.b < 0.0){ point.b += smokeQ + 1.0; if_c = min(if_c, n_6.b); }
    //                         if(n_7.b < 0.0){ point.b += smokeQ + 1.0; if_c = min(if_c, n_7.b); }
    //                         point.r = if_c * -1.0;
    //                     }
    //                 }else {
    //                     point.a += 1.0;
    //                 }
    //                 // else {
    //                 //     float count = 0.0;
    //                 //     if (n_0.b < 0.0 || n_0.r < 0.0) { count += 1.0; }
    //                 //     if (n_1.b < 0.0 || n_1.r < 0.0) { count += 1.0; }
    //                 //     if (n_2.b < 0.0 || n_2.r < 0.0) { count += 1.0; }
    //                 //     if (n_3.b < 0.0 || n_3.r < 0.0) { count += 1.0; }
    //                 //     if (n_4.b < 0.0 || n_4.r < 0.0) { count += 1.0; }
    //                 //     if (n_5.b < 0.0 || n_5.r < 0.0) { count += 1.0; }
    //                 //     if (n_6.b < 0.0 || n_6.r < 0.0) { count += 1.0; }
    //                 //     if (n_7.b < 0.0 || n_7.r < 0.0) { count += 1.0; }
    //                 //     if (count == 8.0) {
    //                 //         point.b = smokeQ + 1.0;
    //                 //     }
                        
    //                 // }
    //             }else {
    //                 point.a += 1.0;
    //             }

    //             vec2 neuv = uv + vec2(cellSize.x, 0.0);
    //             if(neuv.x > 1.0){
    //                 neuv.x = 0.0;
    //             }
    //             point.g = texture2D(heightmap, neuv).g;
    //             gl_FragColor = point;
    //         }
    //     `;

    //     const vertexShader = /* glsl */`
    //         in vec3 position;

    //         uniform mat4 modelMatrix;
    //         uniform mat4 modelViewMatrix;
    //         uniform mat4 projectionMatrix;
    //         uniform vec3 cameraPos;

    //         out vec3 vOrigin;
    //         out vec3 vDirection;

    //         void main() {
    //             vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

    //             vOrigin = vec3( inverse( modelMatrix ) * vec4( cameraPos, 1.0 ) ).xyz;
    //             vDirection =  position - vec3(0.0,1.0,0.0);

    //             gl_Position = projectionMatrix * mvPosition;
    //         }
    //     `;

    //     const fragmentShader = /* glsl */`
    //         precision highp float;
    //         precision highp sampler2D;

    //         uniform mat4 modelViewMatrix;
    //         uniform mat4 projectionMatrix;

    //         in vec3 vOrigin;
    //         in vec3 vDirection;

    //         out vec4 color;

    //         uniform float time;
    //         uniform sampler2D map;
    //         uniform sampler2D heightmap;

    //         vec2 hitBox( vec3 orig, vec3 dir ) {
    //             const vec3 box_min = vec3( - 0.5 );
    //             const vec3 box_max = vec3( 0.5 );
    //             vec3 inv_dir = 1.0 / dir;
    //             vec3 tmin_tmp = ( box_min - orig ) * inv_dir;
    //             vec3 tmax_tmp = ( box_max - orig ) * inv_dir;
    //             vec3 tmin = min( tmin_tmp, tmax_tmp );
    //             vec3 tmax = max( tmin_tmp, tmax_tmp );
    //             float t0 = max( tmin.x, max( tmin.y, tmin.z ) );
    //             float t1 = min( tmax.x, min( tmax.y, tmax.z ) );
    //             return vec2( t0, t1 );
    //         }

    //         float sample1( vec3 p ) {
    //             return texture(heightmap, p.xy).a / 100.0 - p.z * 100.0;
    //         }

    //         void main(){
    //             vec3 rayDir = normalize( vDirection );
    //             vec2 bounds = hitBox( vOrigin, rayDir );
    //             if ( bounds.x > bounds.y ) discard;
    //             bounds.x = max( bounds.x, 0.0 );
    //             vec3 p = vOrigin + bounds.x * rayDir;
    //             vec2 vUv = vec2((p+0.5).x,(p+0.5).y);
    //             // vec2 T2 = vUv + vec2(-0.5, 2.0) * time * 0.05;
    //             // vec3 tc = texture(map, T2 * 2.0).rgb;
    //             vec3 tc = texture(map, vUv).rgb;
    //             vec3 inc = 1.0 / abs( rayDir );
    //             float delta = min( inc.x, min( inc.y, inc.z ) );
    //             delta /= 200.0;
    //             for ( float t = bounds.x; t < bounds.y; t += delta ) {
    //                 float d = sample1( p + 0.5 );
    //                 if ( d > 0.0 ) {
    //                     color.rgb = tc;
    //                     color.a = 1.0;
    //                     break;
    //                 }
    //                 p += rayDir * delta;
    //             }
    //             if ( color.a == 0.0 ) discard;
    //         }
    //     `;
    //     this.map_edges = map_edges
    //     const LENGTH = (this.map_edges[0]-this.map_edges[1])// 2643
    //     const WIDTH = (this.map_edges[2]-this.map_edges[3])// 1537
    //     const HEIGHT = 100;
    //     console.log(LENGTH, WIDTH)
    //     const geometry = new THREE.BoxGeometry( 1,1,1 );
    //     const material = new THREE.RawShaderMaterial( {
    //         glslVersion: THREE.GLSL3,
    //         uniforms: {
    //             map: { value: smoke_t },
    //             cameraPos: { value: new THREE.Vector3() },
    //             heightmap: { value: null },
    //             time: { value: 1.0 }
    //         },
    //         vertexShader,
    //         fragmentShader,
    //         side: THREE.DoubleSide,
    //     } );

    //     this.waterMesh = new THREE.Mesh( geometry, material );
    //     this.waterMesh.scale.set(LENGTH, WIDTH, HEIGHT)
    //     this.waterMesh.position.set(0,0,550)
    //     scene.add(this.waterMesh)

    //     this.gpuCompute = new GPUComputationRenderer( LENGTH, WIDTH, renderer );
    //     if ( renderer.capabilities.isWebGL2 === false ) 
    //         this.gpuCompute.setDataType( THREE.HalfFloatType );
    //     const heightmap0 = this.gpuCompute.createTexture();
    //     this.fillTexture( heightmap0, map, point );
    //     this.heightmapVariable = this.gpuCompute.addVariable( 'heightmap', heightmapFragmentShader, heightmap0 );
    //     this.gpuCompute.setVariableDependencies( this.heightmapVariable, [ this.heightmapVariable ] );
    //     this.heightmapVariable.material.uniforms[ 'smokeQ' ] = { value: 0.0 };
    //     const error = this.gpuCompute.init();
    //     if ( error !== null ) 
    //         console.error( error );
    // }
    constructor(map, map_edges, point, scene, renderer){
        this.idjlaf =0
        this.scene =scene
        this.camera = window.camera
        this.renderer = renderer
        const waterVertexShader = `
            uniform sampler2D heightmap;
            varying vec2 vUv;
            uniform float time;
            varying float op;
            varying float heightValue;

            void main() {
                vUv = uv;

                heightValue = texture2D(heightmap, uv).g ;
                vec3 transformed = vec3(position.x, position.y, heightValue);
                op = texture2D(heightmap, uv).a / 200.0 ;
                // if(op < 0.3 && op > 0.0){
                //     op = 0.2;
                // }else if(op > 1.0){
                //     op = 0.95;
                // }else if(op > 0.0 && op < 0.8){
                //     op = 0.6;
                // }else if(op > 0.0 && op < 0.5){
                //     op = 0.5;
                // }
                // 将 transformed 作为最终的顶点位置
                gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
            }
        `;

        const smokeFragmentShader = `
            uniform sampler2D texture1;
            uniform sampler2D texture2;
            varying vec2 vUv;
            uniform float time;
            varying float op;
            varying float heightValue;

            void main() {
                vec2 T2 = vUv + vec2(-0.5, 2.0) * time * 0.05;
                vec4 color = texture2D(texture2, T2 * 2.0);
                // vec4 color = texture2D(texture2, vUv);
                // 输出最终颜色和透明度
                // vec3 color = (1.0 - vec3(0.1) * op * 10.0);
                gl_FragColor = vec4(color.rgb, op);
            }
        `;

        this.map_edges = map_edges
        const LENGTH = (this.map_edges[0]-this.map_edges[1])/1.0
        const WIDTH = (this.map_edges[2]-this.map_edges[3])/1.0
        
        console.log(LENGTH, WIDTH)
        const geometry = new THREE.PlaneGeometry( LENGTH, WIDTH, LENGTH - 1, WIDTH - 1 );
        
        noise.wrapS=noise.wrapT=THREE.MirroredRepeatWrapping
        smoke_t.wrapS=smoke_t.wrapT=THREE.MirroredRepeatWrapping
        smoke_t.repeat.set(10,10)
        const material = new THREE.ShaderMaterial( {
            uniforms: THREE.UniformsUtils.merge( [
                THREE.ShaderLib[ 'phong' ].uniforms,
                {
                    'heightmap': { value: null },
                    'texture1': { value: noise },
                    'texture2': { value: smoke_t },
                    'time': { value: 1.0 },
                    'smokeQ': { value: 0.0 }
                }
            ] ),
            vertexShader: waterVertexShader,
            fragmentShader:smokeFragmentShader,
            lights: true,
            transparent: true,
            side: THREE.DoubleSide
        } );

        this.waterMesh = new THREE.InstancedMesh( geometry, material, 5);
        this.waterMesh.position.set(0,0,550);
        for(let i = 0; i < 5; i++){
            const position = new THREE.Vector3(0,0,545+i)
            const quaternion = new THREE.Quaternion()
            const scale = new THREE.Vector3(1,1,1)
            this.waterMesh.setMatrixAt(i, new THREE.Matrix4().compose(position,quaternion,scale))
        }
        this.waterMesh.updateMatrix();
        this.gpuCompute = new GPUComputationRenderer( LENGTH, WIDTH, renderer );
        if ( renderer.capabilities.isWebGL2 === false ) 
            this.gpuCompute.setDataType( THREE.HalfFloatType );
        
        const heightmap0 = this.gpuCompute.createTexture();
        this.fillTexture( heightmap0, map, point );
        this.heightmapVariable = this.gpuCompute.addVariable( 'heightmap', heightmapFragmentShader, heightmap0 );
        this.gpuCompute.setVariableDependencies( this.heightmapVariable, [ this.heightmapVariable ] );
        const error = this.gpuCompute.init();
        if ( error !== null ) 
            console.error( error );
        scene.add(this.waterMesh)
        for(var i = 0; i < 10; i++){
            let me = this.waterMesh.clone()
            me.position.set(0,0,550-i/2);
            scene.add(me)
        }
    }
    update(delta){
        this.gpuCompute.compute();
        this.gpuCompute.compute();
        this.gpuCompute.compute();
        this.gpuCompute.compute();
        this.gpuCompute.compute();
        // this.idjlaf++
        // if(this.idjlaf==10)
        //     this.fire_alarm([1800, 1000])
        this.waterMesh.material.uniforms[ 'heightmap' ].value = this.gpuCompute.getCurrentRenderTarget( this.heightmapVariable ).texture;
        this.waterMesh.material.uniforms[ 'time' ].value += delta;
    }
    reQ(smoke_Q){
        let Q = smoke_Q - 1.0
        this.heightmapVariable.material.uniforms[ 'smokeQ' ].value.set(Q)
    }
    fire_alarm(point){
        var pos = [Math.floor(point.x+1322), Math.floor(point.y+768)]
        console.log(pos)
        const texture = this.gpuCompute.getCurrentRenderTarget(this.heightmapVariable);
        const renderer = this.renderer;
        const width = texture.texture.image.width;
        const height = texture.texture.image.height;
        var pixelData = new Float32Array(width * height * 4);
        renderer.readRenderTargetPixels(texture, 0, 0, width, height, pixelData);

        let mubiao = pixelData[(pos[1]*width+pos[0])*4+3]
        console.log(mubiao)
            for (var x = 0; x < width; x++) {
                for (var y = 0; y < height; y++) {
                    var index = (y * width + x) * 4 + 3;
                    if(pixelData[index] == mubiao){
                        pixelData[index] = 1.0
                    }
                    else if(pixelData[index] < mubiao){
                        pixelData[index] = 0.0
                        pixelData[index-1] = 0.0
                    }
                    else{
                        pixelData[index] -= mubiao
                    }
                }
            }
        
        // else{
        //     for (var x = 0; x < width; x++) {
        //         for (var y = 0; y < height; y++) {
        //             var index = (y * width + x) * 4 + 3;
        //             if(pixelData[index] <= 1.0){

        //             }
        //         }
        //     }
        // }
        var newmap = this.gpuCompute.createTexture();
        newmap.image.data = pixelData

        this.gpuCompute.dispose()
        this.heightmapVariable = this.gpuCompute.addVariable( 'heightmap', heightmapFragmentShader, newmap );
        this.gpuCompute.setVariableDependencies( this.heightmapVariable, [ this.heightmapVariable ] );
        this.gpuCompute.init();
        this.gpuCompute.compute()
     }
    fillTexture(texture, map, point) {// 要求map为建筑物时为-1，非建筑物为1，且point处不是建筑物
        // r:建筑物信息 g:随机高度信息 b:是否为当前正在扩散的烟雾格子 a:烟雾浓度信息
        let pixels = texture.image.data;
        let p = 0;
        let simplex = new SimplexNoise()
        function noise( x, y ) {

            let multR = 3;
            let mult = 0.025;
            let r = 0;
            for ( let i = 0; i < 15; i ++ ) {
                r += multR * simplex.noise( x * mult, y * mult );
                multR *= 0.53 + 0.025 * i;
                mult *= 1.25;
            }
            return r;
        }

        const rows = map.length;
        const cols = map[0].length;
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                let redValue = map[j][i] > 0 ? 1.0 : 0.0
                let greenValue = noise(i.toFixed(1), j.toFixed(1)); 
                let blueValue = 0.0; 
                if(point[0] == j && point[1] == i)
                    blueValue = 1.0
                let alphaValue = 0.0;
                pixels[p + 0] = redValue; 
                pixels[p + 1] = greenValue; 
                pixels[p + 2] = blueValue; 
                pixels[p + 3] = alphaValue;
                p += 4;
            }
        }
    }
}

class move_particle
{
    constructor(start, list){
        this.start = start
        this.list = list
    }
    update(arr){
        const positions = this.geom.attributes.position.array;
        for (let i = 0; i < arr.length; i++) {
            const index = i * 3;
            positions[index] += deltaX;
            positions[index + 1] += deltaY;
            positions[index + 2] += deltaZ;
        }
        this.geom.attributes.position.needsUpdate = true;
    }
}

