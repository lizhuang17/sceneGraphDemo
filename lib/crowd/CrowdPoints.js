import * as THREE from "three";
export class CrowdPoints extends THREE.Points{
    constructor(instancedMesh){
        // alert(instancedMesh.name)
        // const vertexShader0 = `
        // void main() {
        //     vec3 pos = position;  
        //     gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        //     gl_PointSize = 6.0;
        // }`
        // const fragmentShader0 = `
        // void main() {
        //     vec3 color = vec3(111./255.,82./255.,73./255.);
        //     gl_FragColor = vec4(color, 1.0);
        // }` 
        // const material = new THREE.ShaderMaterial({
        //     uniforms: {},
        //     vertexShader,
        //     fragmentShader
        //   })
        // console.log("instancedMesh.name",instancedMesh.name)

        let vertexShader=instancedMesh.material.vertexShader
        vertexShader=
            vertexShader.replace( 
                '#include <fog_vertex>', 
                '#include <fog_vertex> \n gl_PointSize = 2.0;' )
        vertexShader=
            vertexShader.replace( 'vertex.position.x*=direction;', '')
        vertexShader=
            vertexShader.replace( 'vertex.position.z*=direction;', '')
        let fragmentShader=
        `in vec3 instanceColorOut;
        void main() {
            vec3 color = vec3(.0);//100.*instanceColorOut;//vec3(111./255.,82./255.,73./255.);//
            gl_FragColor = vec4(color, 1.0);
        }`
        instancedMesh.material.fragmentShader

        let uniforms={}
        let uniforms0=instancedMesh.material.uniforms
        // var str0=""
        // for(var i in uniform0)str0=str0+"'"+i+"',";
        // console.log(str0)
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
        // console.log(uniforms)
        setInterval(()=>{
            // console.log(uniforms.time.value)
            uniforms.time.value=uniforms0.time.value
        },0)
        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,//{},//instancedMesh.material.uniforms,
            vertexShader,
            fragmentShader
          })

        
        
        const visibleList=instancedMesh.parent.visibleList
        let count=0
        for(let i=0;i<instancedMesh.meshTypeList.length;i++){
            if(visibleList[i]==1)count++
        }
        const positions = new Float32Array(count*3)//instancedMesh.count是总共的化身数量，而不仅仅是可见的化身数量
        const moveMaxLength=new  Float32Array(count)
        const speed=new  Float32Array(count)
        const uv=new  Float32Array(count*2)
        const normal=new  Float32Array(count*3)
        // const instanceColorIn=new  Float32Array(count*3)
        count=0
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
                // if(moveMaxLength[count]!==0)alert(moveMaxLength[count])
                count=count+1
            }
        }
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('moveMaxLength', new THREE.BufferAttribute(moveMaxLength, 1))
        geometry.setAttribute('speed', new THREE.BufferAttribute(speed, 1))
        geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
        geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3))
        // geometry.setAttribute('instanceColorIn', new THREE.BufferAttribute(instanceColorIn, 3))
        super(geometry, material)
        // console.log("instancedMesh/this",instancedMesh,this)
        // console.log(geometry)
    }
}