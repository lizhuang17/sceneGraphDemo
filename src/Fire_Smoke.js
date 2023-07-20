import * as THREE from "three"
import {TextureAnimator} from '../lib/TextureAnimator'
import {SimplexNoise} from '../lib/three/examples/jsm/math/SimplexNoise.js'
import {GPUComputationRenderer} from '../lib/three/examples/jsm/misc/GPUComputationRenderer.js'
export class Fire {
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

export class Fire_Sprit {
    constructor(pos, mesh){
        this.pos = pos
        this.time = 0
        this.mesh = mesh.clone()
    }
    animate(delta){

    }
}
const noise = new THREE.TextureLoader().load( 'textures/cloud.png' );
const smoke_t = new THREE.TextureLoader().load('textures/pur.png' )
const smoke_p = new THREE.TextureLoader().load('textures/smokeparticle.png')
export class Smoke {
    constructor(scene, renderer){
        const BOUNDS = 512
        const WIDTH = 128
        this.scene = scene
        this.count = 0
        this.angle = []
        this.pos = [0,0,0]
        this.scale = [0.05, 0.05]
        this.roof = 0
        noise.wrapS=noise.wrapT=THREE.MirroredRepeatWrapping
        smoke_t.wrapS=smoke_t.wrapT=THREE.MirroredRepeatWrapping

        const geometry = new THREE.PlaneGeometry( BOUNDS, BOUNDS, WIDTH - 1, WIDTH - 1 );
        const material = new THREE.ShaderMaterial( {
            uniforms: THREE.UniformsUtils.merge( [
                THREE.ShaderLib[ 'phong' ].uniforms,
                {
                    'heightmap': { value: null },
                    'texture1': { value: noise },
                    'texture2': { value: smoke_t},
                    'time': { value: 1.0 }
                }
            ] ),
            vertexShader: document.getElementById( 'waterVertexShader' ).textContent,
            fragmentShader: document.getElementById( 'smokeFragmentShader' ).textContent,
            //fragmentShader: THREE.ShaderChunk[ 'meshphong_frag' ]
        } );

        material.lights = true;
        material.color = new THREE.Color( 0x808080 );
        material.transparent = true;
        material.side = THREE.DoubleSide
        material.uniforms[ 'diffuse' ].value = material.color;
        material.uniforms[ 'specular' ].value = material.specular;
        material.uniforms[ 'shininess' ].value = Math.max( material.shininess, 1e-4 );
        material.uniforms[ 'opacity' ].value = material.opacity;

        material.defines.WIDTH = WIDTH.toFixed( 1 );
        material.defines.BOUNDS = BOUNDS.toFixed( 1 );

        this.waterMesh = new THREE.Mesh( geometry, material );
        this.waterMesh.position.set(0,0,0)
        this.waterMesh.updateMatrix();

        this.gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, renderer );
        if ( renderer.capabilities.isWebGL2 === false ) {
            this.gpuCompute.setDataType( THREE.HalfFloatType );
        }
        const heightmap0 = this.gpuCompute.createTexture();
        fillTexture( heightmap0 );
        this.heightmapVariable = this.gpuCompute.addVariable( 'heightmap', document.getElementById( 'heightmapFragmentShader' ).textContent, heightmap0 );
        this.gpuCompute.setVariableDependencies( this.heightmapVariable, [ this.heightmapVariable ] );
        this.heightmapVariable.material.uniforms[ 'mousePos' ] = { value: new THREE.Vector2( 10000, 10000 ) };
        this.heightmapVariable.material.uniforms[ 'mouseSize' ] = { value: 20.0 };
        this.heightmapVariable.material.uniforms[ 'viscosityConstant' ] = { value: 0.99 };
        this.heightmapVariable.material.uniforms[ 'heightCompensation' ] = { value: 0 };
        this.heightmapVariable.material.defines.BOUNDS = BOUNDS.toFixed( 1 );

        const error = this.gpuCompute.init();
        if ( error !== null ) 
            console.error( error );
        
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
        this.waterMesh.position.set(pos[0],pos[1],25)
        this.waterMesh.scale.set(this.scale[0],this.scale[1])
        this.waterMesh.rotation.set(0,Math.PI,0)
    }
    animate(){
        this.move(0.1)
        this.gpuCompute.compute();
        this.waterMesh.material.uniforms[ 'heightmap' ].value = this.gpuCompute.getCurrentRenderTarget( this.heightmapVariable ).texture;
        this.waterMesh.material.uniforms[ 'time' ].value += 0.1;
    }
    move(t){
        // const heightmap0 = this.gpuCompute.createTexture();
        // fillTexture( heightmap0 );
        // console.log(heightmap0)
        // console.log(this.waterMesh.material.uniforms[ 'heightmap' ].value)
        // this.waterMesh.material.uniforms[ 'heightmap' ].value = heightmap0.texture
        let uniforms = this.heightmapVariable.material.uniforms;
        for(var i=0;i<this.count;i++){
            let vec = this.smoke[i].position
            vec.x+=this.angle[i][0]*t
            vec.y+=this.angle[i][1]*t
            vec.z+=t
            this.smoke[i].scale.set(5*(0.5+i/this.count),5*(0.5+i/this.count),5*(0.5+i/this.count))
            this.smoke[i].material.opacity=i/this.count
            if(this.smoke[i].position.z > 25){
                if(this.roof == 0){
                    this.scene.add(this.waterMesh)
                    this.roof = 1
                }else if(this.roof < 3){
                    this.roof = 1
                    if(this.scale[0]<3)
                        this.scale[0]+=t/200
                    else 
                        this.roof++
                    if(this.scale[1]<0.4)
                        this.scale[1]+=t/200
                    else
                        this.roof++
                    this.waterMesh.scale.set(this.scale[0],this.scale[1])
                }
                uniforms[ 'mousePos' ].value.set((Math.random()*1000-500)*this.scale[0], (Math.random()*1000-500)*this.scale[1]);
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
function fillTexture( texture ) {
    let simplex = new SimplexNoise()
    let waterMaxHeight = 10;
    function noise( x, y ) {
        let multR = waterMaxHeight;
        let mult = 0.025;
        let r = 0;
        for ( let i = 0; i < 15; i ++ ) {
            r += multR * simplex.noise( x * mult, y * mult );
            multR *= 0.53 + 0.025 * i;
            mult *= 1.25;
        }
        return r;
    }
    let pixels = texture.image.data;
    let p = 0;
    for ( let j = 0; j < 128; j ++ ) {
        for ( let i = 0; i < 128; i ++ ) {
            let x = i * 128 / 128;
            let y = j * 128 / 128;
            pixels[ p + 0 ] = noise( x, y );
            pixels[ p + 1 ] = pixels[ p + 0 ];
            pixels[ p + 2 ] = 0;
            pixels[ p + 3 ] = 1;
            p += 4;
        }
    }
}
