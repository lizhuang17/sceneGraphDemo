import * as THREE from "three";
export class CrowdPoints extends THREE.Points{
    constructor(count,instancedMesh){

        let vertexShader=instancedMesh.material.vertexShader
        vertexShader=
            vertexShader.replace( 
                '#include <fog_vertex>', 
                '#include <fog_vertex> \n gl_PointSize = 2.0;' )
        vertexShader=
            vertexShader.replace( 'vertex.position.x*=direction;', '')
        vertexShader=
        vertexShader.replace( 'vertex.position.z*=direction;', '')
        vertexShader=/* glsl */`
            varying float d0;
            in vec3 mcol0,mcol1,mcol2,mcol3;
            in vec3 vViewPosition;
            
            uniform float time;
            in float speed;
            in float moveMaxLength;
            in float animationStartTime;

            void main() {
                mat4 matrix2 = mat4(//确定位置//最后一列是 0 0 0 1
                    vec4(mcol0, 0),
                    vec4(mcol1, 0),
                    vec4(mcol2, 0),
                    vec4(mcol3, 1)//实例化物体对象世界矩阵
                );

                vec3 pos = vec3(0.);//(matrix2*vec4(0.,0.,0.,1.)).xyz;//position;//  //计算位置偏移
                float max=moveMaxLength;//移动路线的长度
                if(max>0.){
                    float direction=1.;
                    float x=0.25*(time + animationStartTime) * speed;
                    x=x-max*2.*floor(x/(max*2.));
                    if(x>max){
                        x=2.*max-x;
                        direction=-1.;
                    }
                    x-=max/2.;
                    pos.z-=x;
                }

                gl_Position = projectionMatrix * modelViewMatrix *matrix2* vec4(pos, 1.0);
                gl_PointSize = 3.0;
                // d0=-dot(modelViewMatrix * vec4(pos, 1.0),vec4(1.))/300.;
                d0=-(modelViewMatrix *matrix2* vec4(pos, 1.0)).z;
                // if(d0<0.)d0=.5;
            }
        
        `
        let fragmentShader=
        `in vec3 instanceColorOut;
        void main() {
            vec3 color = vec3(.0);//100.*instanceColorOut;//vec3(111./255.,82./255.,73./255.);//
            gl_FragColor = vec4(color, 1.0);
        }`
        instancedMesh.material.fragmentShader
        fragmentShader=/* glsl */`
            in vec3 instanceColorOut;
            varying float d0;
            void main() {
                vec3 color = vec3(1.);//100.*instanceColorOut;//vec3(111./255.,82./255.,73./255.);//
                // float distance0=dot(vViewPosition.xyz-vWorldPosition.xyz,vec3(1.));
                // if(d0<0.3)return;
                if(d0<100.)return;
                gl_FragColor = vec4(0.,0.,0.,1.);//gl_FragColor = vec4(color*((d0-0.3)/20.),1.);
            }
        `

        let uniforms={}
        let uniforms0=instancedMesh.material.uniforms
        const tags=[
            'diffuse','opacity','map','uvTransform','uv2Transform','alphaMap','alphaTest','envMap','flipEnvMap','reflectivity',
            'ior','refractionRatio','aoMap','aoMapIntensity','lightMap','lightMapIntensity','emissiveMap','bumpMap','bumpScale',
            'normalMap','normalScale','displacementMap','displacementScale','displacementBias','roughnessMap','metalnessMap','fogDensity',
            'fogNear','fogFar','fogColor','ambientLightColor','lightProbe','directionalLights','directionalLightShadows','directionalShadowMap',
            'directionalShadowMatrix','spotLights','spotLightShadows','spotLightMap','spotShadowMap','spotLightMatrix','pointLights',
            'pointLightShadows','pointShadowMap','pointShadowMatrix','hemisphereLights','rectAreaLights','ltc_1','ltc_2','emissive',
            'roughness','metalness','envMapIntensity','brightness_specular','sssIntensity','sssIntensity2','CurveFactor','sssLUT',
            'textureData','headUV','bottomUV','time','boneCount','animationCount','animationFrameCount','animationTexture',
            // 'animationTextureLength',
            'cameraPosition'
        ]
        for(let i=0;i< tags.length;i++){
            uniforms[tags[i]]=uniforms0[tags[i]]
        }
        setInterval(()=>{
            // console.log(uniforms.time.value)
            uniforms.time.value=uniforms0.time.value
        },0)
        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,//{},//instancedMesh.material.uniforms,
            vertexShader,
            fragmentShader
          })
        material.transparent=true

        const positions = new Float32Array(count*3)//instancedMesh.count是总共的化身数量，而不仅仅是可见的化身数量
        const moveMaxLength=new  Float32Array(count)
        const speed=new  Float32Array(count)
        const animationStartTime=new Float32Array(count)
        const forword=new Float32Array(count*16)
        // const uv=new  Float32Array(count*2)
        // const normal=new  Float32Array(count*3)
        const mcol0=new Float32Array(count * 3)
        const mcol1=new Float32Array(count * 3)
        const mcol2=new Float32Array(count * 3)
        const mcol3=new Float32Array(count * 3)

        
        
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('moveMaxLength', new THREE.BufferAttribute(moveMaxLength, 1))
        geometry.setAttribute('speed', new THREE.BufferAttribute(speed, 1))
        geometry.setAttribute('animationStartTime', new THREE.BufferAttribute(animationStartTime, 1))
        // geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
        // geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3))
        // geometry.setAttribute('instanceColorIn', new THREE.BufferAttribute(instanceColorIn, 3))
        geometry.setAttribute('mcol0', new THREE.BufferAttribute(mcol0, 3))//InstancedBufferAttribute
        geometry.setAttribute('mcol1', new THREE.BufferAttribute(mcol1, 3))
        geometry.setAttribute('mcol2', new THREE.BufferAttribute(mcol2, 3))
        geometry.setAttribute('mcol3', new THREE.BufferAttribute(mcol3, 3))
        // console.log(uniforms)
        super(geometry, material)
        // this.isInstancedMesh = true;
        window.points=this
        this.positions=positions
        this.moveMaxLength=moveMaxLength
        this.speed=speed
        this.animationStartTime=animationStartTime
        this.mcol0=mcol0
        this.mcol1=mcol1
        this.mcol2=mcol2
        this.mcol3=mcol3
        // console.log("instancedMesh/this",instancedMesh,this)
        // console.log(geometry)
    }
    update(instancedMesh){
        // console.log("instancedMesh",instancedMesh)
        const positions=this.positions
        const moveMaxLength=this.moveMaxLength
        const speed=this.speed
        const normal=this.normal
        const uv=this.uv
        let count=0
        const visibleList=instancedMesh.parent.visibleList
        for(let i=0;i<instancedMesh.meshTypeList.length;i++){
            if(visibleList[i]==1){
                const pos=instancedMesh.parent.getPosition(i)//const pos=instancedMesh.parent.getPosition(i)
                const scale=instancedMesh.parent.getScale(i)
                for(let j=0;j<3;j++){
                    positions[3*count+j] =pos[j]
                    normal[3*count+j] =instancedMesh.geometry.attributes.normal.array[j]
                    // console.log(instancedMesh.parent.instanceColorIn)
                    // instanceColorIn[3*count+j] =instancedMesh.parent.instanceColorIn_All[instancedMesh.meshType].array[j]
                }
                for(let j=0;j<2;j++){
                    uv[2*count+j]=instancedMesh.geometry.attributes.uv.array[j]
                }   
                //
                moveMaxLength[count]=instancedMesh.parent.moveMaxLength.array[i]*scale[0]//getPosition(i)
                speed[count]=instancedMesh.parent.speed.array[i]*scale[0]
                
                const matrix=new THREE.Matrix4()
                instancedMesh.parent.getMatrixAt(i,matrix)
                window.matrix=matrix
                // if(moveMaxLength[count]!==0)alert(moveMaxLength[count])
                count=count+1
            }
        }
    }
    update2(instanced5Object){
        const positions=this.positions
        for(let i=0;i<instanced5Object.count;i++){
                if(positions){
                    const pos=instanced5Object.getPosition(i)
                    for(let j=0;j<3;j++){
                        positions[3*i+j] =pos[j]
                    }
                }
                

                const matrix=new THREE.Matrix4()
                instanced5Object.getMatrixAt(i,matrix)
                
                this.mcol0[3*i+0]=matrix.elements[0]
                this.mcol0[3*i+1]=matrix.elements[1]
                this.mcol0[3*i+2]=matrix.elements[2]

                this.mcol1[3*i+0]=matrix.elements[4]
                this.mcol1[3*i+1]=matrix.elements[5]
                this.mcol1[3*i+2]=matrix.elements[6]

                this.mcol2[3*i+0]=matrix.elements[8]
                this.mcol2[3*i+1]=matrix.elements[9]
                this.mcol2[3*i+2]=matrix.elements[10]

                this.mcol3[3*i+0]=matrix.elements[12]//pos[0];//
                this.mcol3[3*i+1]=matrix.elements[13]
                this.mcol3[3*i+2]=matrix.elements[14]
                // this.mcol3.setXYZ(i, pos[0],pos[1],pos[2])
        }
        this.mcol0.needUpdate=true
        this.mcol1.needUpdate=true
        this.mcol2.needUpdate=true
        this.mcol3.needUpdate=true
        // console.log(this.moveMaxLength,instanced5Object.moveMaxLength)
        for(let i=0;i<instanced5Object.moveMaxLength.array.length;i++)
            this.moveMaxLength[i]=instanced5Object.moveMaxLength.array[i]
        for(let i=0;i<instanced5Object.speed.array.length;i++)
            this.speed[i]=instanced5Object.speed.array[i]
        for(let i=0;i<instanced5Object.animationStartTime.array.length;i++)
            this.animationStartTime[i]=instanced5Object.animationStartTime.array[i]
        // for(let i=0;i<instanced5Object.instanceMatrix.array.length;i++)
        //     this.instanceMatrix[i]=instanced5Object.instanceMatrix.array[i]

        this.speed.needUpdate=true
        this.moveMaxLength.needUpdate=true
        this.animationStartTime.needUpdate=true
        // this.instanceMatrix.needUpdate=true
    }
    static createPoints(instanced5Object){
        const instanced4Model=instanced5Object.children[0]
        const instanced3Group=instanced4Model.children[0]
        const instanced2Mesh=instanced3Group.children[0]
        console.log("instanced2Mesh",instanced2Mesh)
        const count=instanced5Object.count
        // const instancedMesh={
        //     material:{
        //         vertexShader:"",
        //         uniforms:{}
        //     },
        //     geometry:{},
        //     meshTypeList:{length:instanced5Object.count},
        //     parent:{visibleList: Array.from(Array(instanced5Object.count)).map(() => 1)},
        // }
        const crowdPoints=new CrowdPoints(
            count,
            instanced2Mesh,//instancedMesh,
            instanced5Object.speed,
            instanced5Object.animationStartTime,
            instanced5Object.moveMaxLength
        )
        crowdPoints.update2(instanced5Object)
        return crowdPoints
    }
}