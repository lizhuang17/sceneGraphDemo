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
        this.map_edges = [1321,-1322,786,-751,481]
        this.poslist = []
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
        this.texture_data = new Float32Array(2643*1537*4)
        this.simplex = new SimplexNoise()
        this.firemap = new THREE.TextureLoader().load('textures/fire.webp')
        this.fire_t = new TextureAnimator( this.firemap, 12, 6, 72, 55 ); // texture, #horiz, #vert, #total, duration.
        let self = this
        loadJson("wall_KaiLiNan.json",data=>{
            const temp={}
            for(let p of data)temp[p]=true
            //行数(2643) [Array(列数 1537)
            //1321,-1322,786,-751,481
            self.map=[]
            for(let x=0;x<2643;x++){
                const list=[]
                for(let y=0;y<1537;y++){
                    let p = (y*2643+x)*4
                    let wall=temp[p]?1:0
                    self.texture_data[p]=wall
                    self.texture_data[p+1]=self.noise(x,y)
                    list.push(temp[p]?1555:-1)
                }
                self.map.push(list)
            }
        })
        function loadJson(path,cb){   
            var xhr = new XMLHttpRequest()
            xhr.open('GET', path, true)
            xhr.send()
            xhr.onreadystatechange = ()=> {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    var json_data = JSON.parse(xhr.responseText)
                    cb(json_data)
                }
            }
        }
    }
    noise( x, y ) {    
        let multR = 3;
        let mult = 0.025;
        let r = 0;
        for ( let i = 0; i < 15; i ++ ) {
            r += multR * this.simplex.noise( x * mult, y * mult );
            multR *= 0.53 + 0.025 * i;
            mult *= 1.25;
        }
        return r;
    }
    add_fire(point){
        const LENGTH = this.map_edges[0]-this.map_edges[1]
        let pos = [Math.floor(point[0]+1322), Math.floor(point[1]+768)]
        if(this.texture_data[(pos[1] * LENGTH + pos[0]) * 4 ] > 0){
            this.poslist.push(pos)
            let Fmaterial=new THREE.SpriteMaterial({ transparent: true, map: this.firemap, color: 0xffffff });
            let Fmesh = new THREE.Sprite(Fmaterial);
            Fmesh.position.set(Math.floor(point[0]),Math.floor(point[1]),520) 
            Fmesh.scale.set(100,100,100)
            this.scene.add(Fmesh)
        }
    }
    init(renderer){//[815, 320]  
        const LENGTH = this.map_edges[0]-this.map_edges[1]
        let Fmaterial=new THREE.SpriteMaterial({ transparent: true, map: this.firemap, color: 0xffffff });
        if(this.poslist.length == 0){
            this.poslist.push([1800,1000]) 
            let Fmesh = new THREE.Sprite(Fmaterial);
            Fmesh.position.set(1800-1322,1000-768,520) 
            Fmesh.scale.set(100,100,100)
            this.scene.add(Fmesh)
        }
        for(var i = 0; i < this.poslist.length; i++){
            let pos = this.poslist[i]
            if(this.texture_data[(pos[1] * LENGTH + pos[0]) * 4 ] > 0)
                this.texture_data[(pos[1] * LENGTH + pos[0]) * 4 + 2] = 1.0
        }
        this.smoke_plane = new smokeplane(this.map_edges, this.texture_data, this.scene, renderer)
        this.finish_load = true
        console.log("finish_smoke_map") 
    }
    update(delta = 0.01){
        this.smoke_plane.update(delta)
        this.fire_t.update(50)
    }
    rebuild(){
        this.smoke_plane.fire_alarm(new THREE.Vector3(this.poslist[0][0]-1322,this.poslist[0][1]-768,550))
    }
    reQ(smoke_Q){
        this.smoke_Q = smoke_Q
        this.dops.map(v => v * smoke_Q)
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
    constructor(map_edges, map_data, scene, renderer){
        this.speed = 5
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
                gl_FragColor = vec4(color.rgb, op);
            }
        `;

        this.map_edges = map_edges
        const LENGTH = (this.map_edges[0]-this.map_edges[1])/1.0
        const WIDTH = (this.map_edges[2]-this.map_edges[3])/1.0

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
        heightmap0.image.data = map_data
        this.heightmapVariable = this.gpuCompute.addVariable( 'heightmap', heightmapFragmentShader, heightmap0 );
        this.gpuCompute.setVariableDependencies( this.heightmapVariable, [ this.heightmapVariable ] );
        const error = this.gpuCompute.init();
        if ( error !== null ) 
            console.error( error );
        scene.add(this.waterMesh)
    }
    update(delta){
        for(var i = 0; i < this.speed; i++){
            this.gpuCompute.compute();
        }
        this.waterMesh.material.uniforms[ 'heightmap' ].value = this.gpuCompute.getCurrentRenderTarget( this.heightmapVariable ).texture;
        this.waterMesh.material.uniforms[ 'time' ].value += delta;
    }
    reQ(smoke_Q){
        let Q = smoke_Q - 1.0
        this.heightmapVariable.material.uniforms[ 'smokeQ' ].value.set(Q)
    }
    fire_alarm(point){
        var pos = [Math.floor(point.x+1322), Math.floor(point.y+768)]
        const texture = this.gpuCompute.getCurrentRenderTarget(this.heightmapVariable);
        const renderer = this.renderer;
        const width = texture.texture.image.width;
        const height = texture.texture.image.height;
        var pixelData = new Float32Array(width * height * 4);
        renderer.readRenderTargetPixels(texture, 0, 0, width, height, pixelData);
        let mubiao = pixelData[(pos[1]*width+pos[0])*4+3]
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
        var newmap = this.gpuCompute.createTexture();
        newmap.image.data = pixelData
        this.gpuCompute.dispose()
        this.heightmapVariable = this.gpuCompute.addVariable( 'heightmap', heightmapFragmentShader, newmap );
        this.gpuCompute.setVariableDependencies( this.heightmapVariable, [ this.heightmapVariable ] );
        this.gpuCompute.init();
        this.gpuCompute.compute()
     }
}

