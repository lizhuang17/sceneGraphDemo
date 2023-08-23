
class method_1{// 粒子系统的烟雾扩散
    constructor(pos){
        this.init_smoke(pos)
    }
    init_smoke(pos){// 生成第一个粒子
        const vertexShader = `
            uniform float pixelRatio; // 设备像素比例
            uniform float pointSize; // 粒子的固定大小
            
            attribute float alpha; // 透明度属性
            varying float vAlpha; // 透明度传递给片段着色器
            
            void main() {
                vAlpha = alpha; // 将透明度值赋给 vAlpha
                
                // 计算相对屏幕空间的尺寸
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = pointSize * pixelRatio;
                
                // 应用尺寸衰减
                gl_PointSize /= -mvPosition.z;
                
                gl_Position = projectionMatrix * mvPosition; // 计算最终的顶点位置
            }
            `;
        const fragmentShader = `
            uniform sampler2D textureSampler; // 贴图
            varying float vAlpha; // 接收顶点着色器传递的透明度值
            
            void main() {
                vec4 color = texture(textureSampler, gl_PointCoord); // 从贴图中获取颜色
                gl_FragColor = vec4(color.rgb, color.a * vAlpha); // 设置粒子的颜色和透明度
            }
        `;
        const texture = new THREE.TextureLoader().load('textures/smokeparticle.png')

        let id = this.grids[pos[0]-this.map_edges[1]][pos[1]-this.map_edges[3]].id
        this.all_list.push(id)
        this.list.push([pos[0],pos[1]])
        this.list_id.push(id)
        this.dops.push(this.smoke_Q)// 默认源强为1

        const geometry = new THREE.BufferGeometry();
        this.positions.push(...pos);
        this.ops.push(1, 1, 1)
        
        this.colorAttribute = new THREE.Float32BufferAttribute(this.ops, 3);
        geometry.setAttribute('color', this.colorAttribute);
        this.positionAttribute = new THREE.Float32BufferAttribute(this.positions, 3);
        geometry.setAttribute('position', this.positionAttribute);

        this.material = new THREE.PointsMaterial({
            vertexColors: true,
            map: texture
        });

        this.meshs = new THREE.Points(geometry, this.material)
        console.log("added")
        this.scene.add(this.meshs)
    }

    add_new(new_list){
        for(let i = 0; i < new_list.length; i++){
            let id = this.grids[new_list[i][0]-this.map_edges[1]][new_list[i][1]-this.map_edges[3]].id
            this.all_list.push(id)
            this.positions.push(...new_list[i]);
            this.ops.push(1, 1, 1)
        }
        this.colorAttribute = new THREE.Float32BufferAttribute(this.ops, 3);
        this.meshs.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.ops, 3));
        this.positionAttribute = new THREE.Float32BufferAttribute(this.positions, 3);
        this.meshs.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    }

    update_points(new_list){
        if(new_list && new_list.length > 0){
            this.add_new(new_list)
        }  
        this.positionAttribute.needsUpdate = true
        this.colorAttribute.needsUpdate = true
    }

    checkifallin(list){
        let new_list = []
        for(var i = 0; i< list.length; i++){
            let [rowIndex, columnIndex] = this.list[i];
            let id = this.grids[rowIndex-this.map_edges[1]][columnIndex-this.map_edges[3]].id
            let tn = this.all_list.indexOf(id)
            if(tn < 0){
                new_list.push([rowIndex, columnIndex, 500])
            }
        }
        return new_list
    }

    randomstart(){
        let x = Math.round(Math.random() * (this.map_edges[0] - this.map_edges[1]) + this.map_edges[1]) 
        let y = Math.round(Math.random() * (this.map_edges[2] - this.map_edges[3]) + this.map_edges[3]) 
        while(this.grids[x-this.map_edges[1]][y-this.map_edges[3]].ph < 0){
            x = Math.round(Math.random() * (this.map_edges[0] - this.map_edges[1]) + this.map_edges[1]) 
            y = Math.round(Math.random() * (this.map_edges[2] - this.map_edges[3]) + this.map_edges[3]) 
        }

        console.log([x,y])
        this.init_smoke([905, 432, 500])
    }

    update(){// 加入溢出计算公式
        let count = this.list.length
        //console.log(count)
        // this.smoke_Q -= count
        let new_list = this.checkifallin(this.list)
        for(let i = 0; i < count; i++){
            if(this.list[i]){
                let [rowIndex, columnIndex] = this.list[i];
                let id = this.grids[rowIndex-this.map_edges[1]][columnIndex-this.map_edges[3]].id
                let tn = this.all_list.indexOf(id)
                let n = undefined
                if(this.smoke_Q <= 1){
                    this.ops[tn*3] -= this.dops[i]/3
                    this.ops[tn*3+1] -= this.dops[i]/3
                    this.ops[tn*3+2] -= this.dops[i]/3
                    n = this.grids[rowIndex-this.map_edges[1]][columnIndex-this.map_edges[3]].update(this.dops[i])    
                }else{
                    this.ops[tn*3] -= 0.75
                    this.ops[tn*3+1] -= 0.75
                    this.ops[tn*3+2] -= 0.75
                    n = this.grids[rowIndex-this.map_edges[1]][columnIndex-this.map_edges[3]].update(1)
                }
                let numbers = n.length
                if(numbers > 0){// 格子移除了，将新的格子推入列表
                    this.list.splice(i, 1)
                    this.list_id.splice(i, 1)

                    for(let j = 0; j < numbers; j++){
                        if(n[j]){
                            let d = this.dops[i] / numbers
                            if(j % 2 == 0) d / 1.4
                            let newer = this.list_id.indexOf(n[j].id)
                            if(newer >= 0) this.dops[newer] += d
                            else{
                                this.list.push(n[j].pos)
                                this.list_id.push(n[j].id)
                                this.dops.push(d)
                                new_list.push([...n[j].pos,500])
                            }
                        }
                    }
                    this.dops.splice(i,1)
                }
            }   
        }
        this.update_points(new_list)
    }
}
    
class method_2{// 烟雾平面，向四周扩散
    constructor(map, map_edges, point, scene, renderer){
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
                float pa = mod(point.a, 100.0);
                if ( pa < 1.0 ) {
                    if(point.a < 100.0) {
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
                }else {
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

        const waterVertexShader = `
            uniform sampler2D heightmap;
            varying vec2 vUv;
            uniform float time;
            varying float op;
            varying float heightValue;
            uniform float id;

            void main() {
                vUv = uv;

                heightValue = texture2D(heightmap, uv).g ;
                vec3 transformed = vec3(position.x, position.y, heightValue);
                op = texture2D(heightmap, uv).a / 100.0 ;
                if(op >= 0.9) {
                    op = 0.9;
                }

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
            uniform float id;

            void main() {
                vec4 noise = texture2D(texture1, vUv);
                
                // 对贴图进行移动
                vec2 T1 = vUv + vec2(1.5, -1.5) * time * 0.2;
                vec2 T2 = vUv + vec2(-0.5, 2.0) * time * 0.05;
                T1.x += noise.x * 2.0;
                T1.y += noise.y * 2.0;
                T2.x += noise.y * 0.2;
                T2.y += noise.z * 0.2;
                
                // 获取贴图的颜色
                float p = texture2D( texture1, T1 * 2.0 ).a + 0.7;
                vec4 color = texture2D(texture2, T2 * 2.0);

                // 输出最终颜色和透明度
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
                    'id': { value: 1.0 }
                }
            ] ),
            vertexShader: waterVertexShader,
            fragmentShader:smokeFragmentShader,
            lights: true,
            transparent: true,
            side: THREE.DoubleSide
        } );

        this.waterMesh = new THREE.Mesh( geometry, material );
        this.waterMesh.position.set(0,0,500);
        this.waterMesh.updateMatrix();
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
        // var testMesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial({color:0xffffff}) );
        // testMesh.position.set(0,0,490)
        // scene.add(testMesh)
        scene.add(this.waterMesh)
    }
    update(delta){
        console.log(delta)
        this.gpuCompute.compute();
        this.waterMesh.material.uniforms[ 'heightmap' ].value = this.gpuCompute.getCurrentRenderTarget( this.heightmapVariable ).texture;
        this.waterMesh.material.uniforms[ 'time' ].value += delta;
    }
    reQ(smoke_Q){
        let Q = smoke_Q - 1.0
        this.heightmapVariable.material.uniforms[ 'smokeQ' ].value.set(Q)
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
            let rani = Math.sin(Math.sin(i/10))
            for (let j = 0; j < rows; j++) {
                let redValue = map[j][i].ph.toFixed(1);
                let greenValue = noise(i.toFixed(1), j.toFixed(1)); 
                // let greenValue = 0.0; 
                let blueValue = 0.0; 
                let alphaValue = 0.0;
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
}

class method_old{// 向上的烟雾
    constructor(){
        this.material_s = new THREE.SpriteMaterial({transparent:true,map:smoke_p,color:0xffffff,side:THREE.DoubleSide});
        this.material_s.color.setHSL(0,0,0.5)
        this.smoke = []
        this.death = []
    }
    init(pos){
        this.pos=pos
        let mesh = new THREE.Sprite(this.material_s)
        mesh.scale.set(5,5,5)
        mesh.position.set(this.pos[0]+(0.5-Math.random()),this.pos[1]+(0.5-Math.random()),this.pos[2])
        this.angle.push([Math.random(),Math.random()])
        this.scene.add(mesh)
        this.smoke.push(mesh)
        this.count++
    }
    animate(t){
        for(var i=0;i<this.count;i++){
            let vec = this.smoke[i].position
            vec.x+=this.angle[i][0]*t
            vec.y+=this.angle[i][1]*t
            vec.z+=t
            this.smoke[i].scale.set(5*(0.5+i/this.count),5*(0.5+i/this.count),5*(0.5+i/this.count))
            this.smoke[i].material.opacity=i/this.count
            if(this.smoke[i].position.z > 25){
                this.smoke[i].position.set(this.pos[0]+(0.5-Math.random()),this.pos[1]+(0.5-Math.random()),this.pos[2])
                this.smoke[i].scale.set(5,5,5)
                this.death.push(this.smoke.splice(i,1)[0])
                this.angle.splice(i,1)
                this.count--
            }
        }
        if(this.death.length > 0){
            let mesh = this.death.splice(0,1)[0]
            this.angle.push([0.5-Math.random(),0.5-Math.random()])
            this.smoke.push(mesh) 
            this.count++
        }
        else{
            this.count++
            let mesh = new THREE.Sprite(this.material_s)
            mesh.position.set(this.pos[0]+(0.5-Math.random()),this.pos[1]+(0.5-Math.random()),this.pos[2])
            this.angle.push([0.5-Math.random(),0.5-Math.random()])
            mesh.scale.set(5,5,5)
            this.smoke.push(mesh)
            this.scene.add(mesh)
        }

    }
}
class method_3 {// 动态的火焰粒子
    constructor(pos, scene){
        this.scene = scene
        this.pos = pos
        this.firemap = new THREE.TextureLoader().load('textures/fire.webp')
        this.fire_t = new TextureAnimator( this.firemap, 12, 6, 72, 55 ); // texture, #horiz, #vert, #total, duration.
        var self = this
        let material=new THREE.SpriteMaterial({ transparent: true, map: self.firemap, color: 0xffffff });
        this.mesh = new THREE.Sprite(material);
        this.fire = []
    }
    init(){
        // this.fire.push(mesh)
        this.scene.add( this.mesh );
    }
    update(){
        this.fire_t.update(100)
        // 新建火焰粒子，让粒子具有流动性
    }
}
class TextureAnimator{
	constructor(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) 
	{	
		// note: texture passed by reference, will be updated by the update function.
		this.texture=texture
		this.tilesHorizontal = tilesHoriz;
		this.tilesVertical = tilesVert;
		// how many images does this spritesheet contain?
		//  usually equals tilesHoriz * tilesVert, but not necessarily,
		//  if there at blank tiles at the bottom of the spritesheet. 
		this.numberOfTiles = numTiles;
		this.texture.wrapS = this.texture.wrapT = THREE.RepeatWrapping; 
		this.texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );
	
		// how long should each image be displayed?
		this.tileDisplayDuration = tileDispDuration;
	
		// how long has the current image been displayed?
		this.currentDisplayTime = 0;
	
		// which image is currently being displayed?
		this.currentTile = 0;
	}		
	update( milliSec )
	{
		this.currentDisplayTime += milliSec;
		while (this.currentDisplayTime > this.tileDisplayDuration)
		{
			this.currentDisplayTime -= this.tileDisplayDuration;
			this.currentTile++;
			if (this.currentTile == this.numberOfTiles)
				this.currentTile = 0;
			var currentColumn = this.currentTile % this.tilesHorizontal;
			this.texture.offset.x = currentColumn / this.tilesHorizontal;
			var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
			this.texture.offset.y = currentRow / this.tilesVertical;
		}
	};
}
