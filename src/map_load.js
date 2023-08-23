import {escapmap} from './map.js'
import * as THREE from "three"
import { SimplexNoise } from '../lib/three/examples/jsm/math/SimplexNoise.js';
import { TextureAnimator } from '../lib/TextureAnimator.js'
import {GPUComputationRenderer} from '../lib/three/examples/jsm/misc/GPUComputationRenderer.js'
export class map_load {
    constructor(scene, renderer) {
        this.renderer = renderer
        this.maps=new escapmap()
        this.map_edges=[]
        this.map = undefined
        this.smoke_plane = undefined
        this.scene=scene
        var map = []
        var self=this
        this.smoke_Q = 10000
        this.finish_load = false
        var data = this.loadcsv("KaiLiNan.csv")
        data.then((value)=>{
            value.split('\n').forEach(function(v){
                var line = []
                v.split(',').forEach(function(w){
                    line.push(parseInt(w))
                });
                if(line.length == 5){
                    self.map_edges=line
                    self.maps.map_edges.push(line)
                }else if(line.length > 1){
                    map.push(line)
                }
            });
            self.map = map
            self.smoke_plane = new smokeplane(self.map_edges, self.scene)
            var final = self.combin(map)
            self.maps.init(final,self.scene)
        }) 
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
    loadcsv(path){
        const loader = new THREE.FileLoader()
        return new Promise((resolve,reject)=>{
            loader.load(path, object=>{
                resolve(object)
            })
        })
        
    }
    init(pos = [1800, 1000]){
        this.firemap = new THREE.TextureLoader().load('textures/fire.webp')
        this.fire_t = new TextureAnimator( this.firemap, 12, 6, 72, 55 ); // texture, horiz, vert, total, duration.
        let Fmaterial=new THREE.SpriteMaterial({ transparent: true, map: this.firemap, color: 0xffffff });
        this.Fmesh = new THREE.Sprite(Fmaterial);
        this.Fmesh.position.set(pos[0]-1322,pos[1]-768,520) 
        this.Fmesh.scale.set(100,100,100)
        this.scene.add(this.Fmesh)
        this.smoke_plane.init(this.renderer, this.map, pos)
        console.log("yes")
    }
    update(delta = 0.01){
        this.smoke_plane.update(delta)
        this.fire_t.update(50)
    }
    reQ(smoke_Q){
        this.smoke_Q = smoke_Q
        this.dops.map(v => v * smoke_Q)
    }
    exportCSV(jsonData,fileName = "test"){
        var csvText = ""
        //增加\t为了不让表格显示科学计数法或者其他格式
        for(let i = 0 ; i < jsonData.length ; i++ ){
            let row="";
            for(let item in jsonData[i]){
                row+=`${jsonData[i][item] + '\t'},`;
            }
            csvText+=row + '\n';
        }
        //encodeURIComponent解决中文乱码
        let uri = 'data:text/csv;charset=utf-8,\ufeff' + encodeURIComponent(csvText);
        //通过创建a标签实现
        let link = document.createElement("a");
        link.href = uri;
        //对下载的文件命名
        link.download =  fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
const smoke_t = new THREE.TextureLoader().load('textures/pur.jpg' )
smoke_t.wrapS = smoke_t.wrapT = THREE.MirroredRepeatWrapping
class smokeplane
{
    constructor(map_edges, scene){
        const waterVertexShader = `
            uniform sampler2D heightmap;
            varying vec2 vUv;
            uniform float time;
            varying float op;
            varying float heightValue;
            uniform float id;

            void main() {
                vUv = uv;

                heightValue = texture2D(heightmap, uv).g;
                vec3 transformed = vec3(position.x, position.y, heightValue);
                op = texture2D(heightmap, uv).a / 200.0;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
            }
        `;

        const smokeFragmentShader = `
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
        smoke_t.wrapS=smoke_t.wrapT=THREE.MirroredRepeatWrapping
        smoke_t.repeat.set(10,10)
        const material = new THREE.ShaderMaterial( {
            uniforms: THREE.UniformsUtils.merge( [
                THREE.ShaderLib[ 'phong' ].uniforms,
                {
                    'heightmap': { value: null },
                    'texture2': { value: smoke_t },
                    'time': { value: 1.0 }
                }
            ] ),
            vertexShader: waterVertexShader,
            fragmentShader:smokeFragmentShader,
            lights: true,
            transparent: true,
            side: THREE.DoubleSide
        } );
        var lay = 10
        this.waterMesh = new THREE.InstancedMesh( geometry, material, lay );
        for(var i = 0; i < lay; i++){
            this.waterMesh.setMatrixAt(i, new THREE.Matrix4().set(1,0,0,0,0,1,0,0,0,0,1,550-i,0,0,0,1))
        }
        scene.add(this.waterMesh)
        this.gmesh = new THREE.Mesh(new THREE.PlaneGeometry(1,1), new THREE.ShaderMaterial({uniforms:{map:{value:null}}}))
        console.log("finish")
    }
    init(renderer, map, point){
        this.renderer = renderer
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
            if(point.r > 0.0){
                if(point.a < 1.0) {
                    if (point.b > 0.0) {
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
                    if(point.b == 0.0) {
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
                else{
                    point.a += 1.0;
                }
            }

            vec2 neuv = uv + vec2(cellSize.x, 0.0);
            if(neuv.x > 1.0){
                neuv.x = 0.0;
            }
            point.g = texture2D(heightmap, neuv).g;
            gl_FragColor = point;
        }
        `;
        const LENGTH = (this.map_edges[0]-this.map_edges[1])/1.0
        const WIDTH = (this.map_edges[2]-this.map_edges[3])/1.0
        this.gpuCompute = new GPUComputationRenderer( LENGTH, WIDTH, renderer );
        if ( renderer.capabilities.isWebGL2 === false ) 
            this.gpuCompute.setDataType( THREE.HalfFloatType );
        const heightmap0 = this.gpuCompute.createTexture();
        this.fillTexture( heightmap0, map, point );
        this.heightmapVariable = this.gpuCompute.addVariable( 'heightmap', heightmapFragmentShader, heightmap0 );
        this.gpuCompute.setVariableDependencies( this.heightmapVariable, [ this.heightmapVariable ] );
        this.heightmapVariable.material.uniforms[ 'smokeQ' ] = { value: 0.0 };
        const error = this.gpuCompute.init();
        if ( error !== null ) 
            console.error( error );
        this.finish_load = true
        console.log("init_smoke")
    }
    update(delta){
        this.fire_alarm()
        this.gpuCompute.compute();
        this.gmesh.material.uniforms['map'].value =  this.gpuCompute.getCurrentRenderTarget( this.heightmapVariable ).texture;
        this.waterMesh.material.uniforms[ 'heightmap' ].value = this.gpuCompute.getCurrentRenderTarget( this.heightmapVariable ).texture;
        this.waterMesh.material.uniforms[ 'time' ].value += delta;
    }
    reQ(smoke_Q){
        let Q = smoke_Q - 1.0
        this.heightmapVariable.material.uniforms[ 'smokeQ' ].value.set(Q)
    }
    fillTexture(texture, map, point) {// 要求map为建筑物时为-1，非建筑物时大于等于0，且point处不是建筑物    need update
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
                let redValue = map[j][i].toFixed(1);
                let greenValue = noise(i.toFixed(1), j.toFixed(1)); 
                let blueValue = 0.0; 
                let alphaValue = 1.0;
                if(point[0] == j && point[1] == i){
                    blueValue = 1.0
                    alphaValue = 0.0
                }
                pixels[p + 0] = redValue; 
                pixels[p + 1] = greenValue; 
                pixels[p + 2] = blueValue; 
                pixels[p + 3] = alphaValue;
                p += 4;
            }
        }
    }
    fire_alarm(pos=[0,0]){
       // 获取纹理对象
        const heightmapTexture = this.gpuCompute.getCurrentRenderTarget(this.heightmapVariable).texture;

        // 准备一个Float32Array来存储高度图数据
        const width = heightmapTexture.image.width;
        const height = heightmapTexture.image.height;
        const dataArray = new Float32Array(width * height); // 仅存储一个通道的数据

        // 从纹理中读取 alpha 通道数据到dataArray
        const gl = renderer.getContext();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.heightmapVariable._framebuffer);
        gl.readPixels(0, 0, width, height, gl.ALPHA, gl.FLOAT, dataArray);

        console.log(dataArray);

        // 解绑帧缓冲区
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    }
    
    textureToArray(texture) {
        const width = texture.width;
        const height = texture.height;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        context.drawImage(texture, 0, 0, width, height);

        const imageData = context.getImageData(0, 0, width, height).data;
        const dataArray = [];

        for (let i = 0; i < imageData.length; i += 4) {
            const grayscaleValue = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
            dataArray.push(grayscaleValue / 255); // 将像素值映射到 0-1 范围内
        }

        return dataArray;
    }
}