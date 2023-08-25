import * as THREE from "three";
import { Instanced1Material } from './Instanced1Material.js'
import { Instanced1Geometry } from './Instanced1Geometry.js'
import { Instanced1Animation } from './Instanced1Animation.js'
import { CrowdPoints } from './CrowdPoints.js'
export class Instanced2Mesh extends THREE.InstancedMesh {
    constructor( geometry,material2,count,isSimShader,lodLevel) {
        var geometry2=new Instanced1Geometry({
            "oldGeometry":geometry,
            "lodLevel":lodLevel
        })
        super(geometry2, material2, count )
        this.isSimShader=isSimShader
        
    }
    static async getInstanced2Mesh(
        originMesh,
        animationUrl,
        morphTargetUrl,
        textureData,// textureUrl,
        lightMapUrl,
        textureCount, // [row, col]
        camera,
        clock,
        count,
        crowdGroup,
        meshTypeList,
        meshTypeListElem,
        meshType0,
        cb
        ){
        const isInstancedMesh=typeof originMesh.geometry.attributes.skinIndex!=="undefined"
        originMesh.visible=false
        if(typeof(crowdGroup.assets[animationUrl])=="undefined")crowdGroup.assets[animationUrl]=await Instanced1Animation.createAnimation(animationUrl)//await Instanced2Mesh.loadAnimJSON(animationUrl)
        
        const animations = crowdGroup.assets[animationUrl];
        const material=originMesh.material
        const isSimShader=crowdGroup.lodLevel>15//除了0,1,2,3
        const useNormalMap=crowdGroup.lodLevel>5
        const material2=await Instanced1Material.create({
            "oldMaterial":material,
            "scattering":material.scattering,//true
            "isSimShader":isSimShader,
            "assets":crowdGroup.assets,
            "useNormalMap":useNormalMap,
            "isInstancedMesh":isInstancedMesh
        })
        // material2.side=0//单面渲染 if(crowdGroup.lodLevel>18)material2.side=2//19
        // console.log(originMesh.geometry)
        
        var mesh= new Instanced2Mesh(//THREE.InstancedMesh(//
            originMesh.geometry,
            material2,//originMesh.material,
            count,
            isSimShader,//lod0和lod1使用高计算量的方法渲染，更远的使用用低计算量的方法渲染
            crowdGroup.lodLevel
        )
        mesh.material.mesh=mesh
        mesh.init(
            originMesh,
            animationUrl,
            morphTargetUrl,
            textureData,// textureUrl,
            lightMapUrl,
            textureCount, // [row, col]
            camera,
            clock,
            animations,
            crowdGroup,
            meshTypeList,
            meshTypeListElem,
            meshType0
        )
        // console.log(
        //     "getCrowdPoints()",
        //     mesh.getCrowdPoints()
        // )
        // setTimeout(()=>{
        //     window.scene.add(mesh.getCrowdPoints())
        //     mesh.visible=false
        // },5000)
        cb(mesh)        
    }
    getCrowdPoints(){
        // alert(123)
        // console.lot(this.visible)
        let p= new CrowdPoints(this)
        p.name=this.name
        return p
        // return new CrowdPoints(this)
    }
    init(
        originMesh,
        animationUrl,
        morphTargetUrl,
        textureData,// textureUrl,
        lightMapUrl,
        textureCount, // [row, col]
        camera,
        clock,
        animations,
        crowdGroup,
        meshTypeList,
        meshTypeListElem,
        meshType0,
        ) {
        this.meshTypeList=meshTypeList
        this.meshTypeListElem=meshTypeListElem
        this.meshType=meshType0

        this.name=originMesh.name
        this.crowdGroup=crowdGroup

        this.animations=animations
        this.originMesh = originMesh;
        this.animationUrl = animationUrl;
        this.morphTargetUrl = morphTargetUrl;
        this.textureData=textureData;//this.textureUrl = textureUrl;
        this.textureCount = textureCount;
        this.lightMapUrl = lightMapUrl;
        this.camera = camera;
        // this.uniforms;

        this.clock = clock;
        this.ifAnimated = !!animationUrl;
        this.ifMorphTarget = !!morphTargetUrl;
        this.dummy = new THREE.Object3D();

        this.speed; // 动画速度
        this.obesity
        this.moveMaxLength
        this.morphTargetWeight; // morph target 权重
        this.animationStartTime;
        this.animationType; // 动画类型
        this.textureType; // 身体贴图类型 vec4
        this.bodyScale; // 身体各部位缩放比例

        // body 每个身体部位对应的贴图uv坐标位置
        this.body = {
            head: [],
            hand: [],
            bottom: []
        }
        ////////////////////////////////////////////////////////////////////////////////////////////
        const crowd=crowdGroup.crowd
        // console.log(this.meshType)
        // console.log(crowd.instanceColorIn_All[this.meshType])

        // console.log(this.name)
        if(crowd.instanceColorIn_All[this.name])//if(crowd.instanceColorIn_All[this.meshType])//
            this.instanceColorIn=new THREE.InstancedBufferAttribute(new Float32Array(this.count*3), 3);//this.crowdGroup.instanceColorInVisible_All[this.name]
        // else console.log("test")
        // console.log(crowd.lodLevel)
        const test0=1
                    crowdGroup.lodLevel>19?3:
                    crowdGroup.lodLevel>18?100:
                    crowdGroup.lodLevel>10?1050:
                        10000
        // console.log("this.count",this.count)
        if(crowdGroup.lodLevel<10)
            this.castShadow = true 
        if(this.meshTypeListElem.length<2){
            if(!crowdGroup.visible_instanceMatrix){
                // console.log(crowdGroup.lodLevel)
                
                crowdGroup.visible_instanceMatrix  =new THREE.InstancedBufferAttribute(new Float32Array(this.count*16/test0), 16);
                crowdGroup.visible_textureType     = new THREE.InstancedBufferAttribute(new Uint8Array(this.count * 4/test0), 4);
                crowdGroup.visible_animationType   = new THREE.InstancedBufferAttribute(new Uint8Array(this.count/test0), 1);
                crowdGroup.visible_speed           = new THREE.InstancedBufferAttribute(new Float32Array(this.count/test0), 1);
                crowdGroup.visible_obesity         = new THREE.InstancedBufferAttribute(new Float32Array(this.count/test0), 1);
                crowdGroup.visible_moveMaxLength   = new THREE.InstancedBufferAttribute(new Float32Array(this.count/test0), 1);
                crowdGroup.visible_animationStartTime = new THREE.InstancedBufferAttribute(new Float32Array(this.count/test0), 1);
                crowdGroup.visible_bodyScale       = new THREE.InstancedBufferAttribute(new Float32Array(this.count * 4/test0), 4);
            }
            this.instanceMatrix  = crowdGroup.visible_instanceMatrix
            this.textureType     = crowdGroup.visible_textureType
            this.animationType   = crowdGroup.visible_animationType
            this.speed           = crowdGroup.visible_speed
            this.obesity         = crowdGroup.visible_obesity 
            this.moveMaxLength   = crowdGroup.visible_moveMaxLength
            this.animationStartTime = crowdGroup.visible_animationStartTime
            this.bodyScale       = crowdGroup.visible_bodyScale
        }else{//每个mesh单独进行设置缓冲区域
            // console.log(crowd.lodLevel)
            this.instanceMatrix  =new THREE.InstancedBufferAttribute(new Float32Array(this.count*16/test0), 16);
            this.textureType     = new THREE.InstancedBufferAttribute(new Uint8Array(this.count * 4/test0), 4);
            this.animationType   = new THREE.InstancedBufferAttribute(new Uint8Array(this.count/test0), 1);
            this.speed           = new THREE.InstancedBufferAttribute(new Float32Array(this.count/test0), 1);
            this.obesity         = new THREE.InstancedBufferAttribute(new Float32Array(this.count/test0), 1);
            this.moveMaxLength   = new THREE.InstancedBufferAttribute(new Float32Array(this.count/test0), 1);
            this.animationStartTime = new THREE.InstancedBufferAttribute(new Float32Array(this.count/test0), 1);
            this.bodyScale       = new THREE.InstancedBufferAttribute(new Float32Array(this.count * 4/test0), 4);
        }
        
        if(this.instanceColorIn)
            this.instanceColorIn.origin=crowd.instanceColorIn_All[this.name]//crowd.instanceColorIn_All[this.meshType]
        this.instanceMatrix.origin=crowd.instanceMatrix
        this.textureType.origin=crowd.textureType
        this.animationType.origin=crowd.animationType
        this.speed.origin=crowd.speed
        this.obesity.origin=crowd.obesity
        this.moveMaxLength.origin=crowd.moveMaxLength
        this.animationStartTime.origin=crowd.animationStartTime
        this.bodyScale.origin= crowd.bodyScale
        this.buffer_all=[
            this.instanceMatrix,
            this.textureType,
            this.animationType,
            this.speed,
            this.obesity,
            this.moveMaxLength,
            this.animationStartTime,
            this.bodyScale
        ]
        if(this.instanceColorIn){
            // alert(76734)
            this.instanceColorIn.name="instanceColorIn"
            this.buffer_all.push(this.instanceColorIn)
        }

        this.initMaterial()
        this.initGeometry()

        this.castShadow = true; // 阴影
        this.receiveShadow = true;
        this.frustumCulled = false;

        this.castShadow = false
        this.receiveShadow = false//true

        var mat4=new THREE.Matrix4()
        mat4.set(
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1
        )
        for(var i=0;i<this.count;i++){
            this.setMatrixAt(i,mat4)
        }
    }
    initMaterial() {
        var uniforms=this.material.uniforms
        uniforms.textureData= { value: this.textureData },
        uniforms.headUV= {value: this.body.head}//{ value: new THREE.Vector4(...this.body.head) },
        uniforms.bottomUV= {value:this.body.bottom}//{ value: new THREE.Vector4(...this.body.bottom) }
        if (this.ifAnimated) {
            uniforms.time = { value: 0 };
            uniforms.boneCount = { value: 0 };
            uniforms.animationCount = { value: 0 };
            uniforms.animationFrameCount = { value: 0 };
            uniforms.animationTexture = { value: new THREE.DataTexture(new Float32Array([0,0,0]), 1, 1, THREE.RGBFormat, THREE.FloatType) }
            uniforms.animationTextureLength = { value: 0 };
            this.initAnimation(uniforms); // 异步加载动画数据
        }
    }
    initAnimation(uniforms) {
        var animations = this.animations//await this.loadAnimJSON(this.animationUrl);
        const boneCount = this.originMesh.skeleton.bones.length;//84
        uniforms.animationTexture.value.dispose();
        uniforms.time = { value: 0 };
        uniforms.boneCount = { value: boneCount };
        uniforms.animationFrameCount = { value: animations.config[1] / boneCount / 12 };//动画帧数 每个动画的帧数必须相同
        uniforms.animationTexture = 
            this.isSimShader?animations.animationTexture2:animations.animationTexture
        uniforms.animationTextureLength = { value: animations.animationTextureLength };
        
        let scope = this;
        updateAnimation();
        function updateAnimation() {
            let time = scope.clock.getElapsedTime();
            uniforms.time = { value: time };
            uniforms.cameraPosition = { value: scope.camera.position };
            requestAnimationFrame(updateAnimation);
        }
    }
    initGeometry() {
        // let geometry = this.geometry//new THREE.InstancedBufferGeometry();
        let geometry = this.geometry//new THREE.InstancedBufferGeometry();
        geometry.setAttribute('animationIndex', this.animationType);
        if(this.instanceColorIn)
            geometry.setAttribute('instanceColorIn', this.instanceColorIn);
        if (this.ifAnimated) {
            geometry.setAttribute('skinIndex', this.originMesh.geometry.attributes.skinIndex);
            geometry.setAttribute('skinWeight', this.originMesh.geometry.attributes.skinWeight);
            geometry.setAttribute('speed', this.speed);
            geometry.setAttribute('obesity',this.obesity)
            geometry.setAttribute('moveMaxLength',this.moveMaxLength)
            geometry.setAttribute('animationStartTime', this.animationStartTime);
            geometry.setAttribute('bodyScale', this.bodyScale);
        }
        geometry.setAttribute('textureIndex', this.textureType);
    }
    getMatrixAt( index, matrix ) {
		matrix.fromArray( this.instanceMatrix.array, index * 16 );
	}
    getPosition(avatarIndex) {
        var mat4 = new THREE.Matrix4();
        this.getMatrixAt(avatarIndex,mat4)
        var e=mat4.elements
        return [e[12],e[13],e[14]];
    }
}