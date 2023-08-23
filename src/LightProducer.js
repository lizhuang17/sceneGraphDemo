import * as THREE from "three";
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';
class LightProducer{
    constructor(scene,camera){
        this.camera=camera
        this.object=new THREE.Object3D()
        scene.add(this.object)
        this.objectMove=new THREE.Object3D()
        this.object.add(this.objectMove)
        this.targetList=[]
        this.init(scene)//this.test()
        // this.add_lensflares()

        // this.setPos(-319.59561744433125,  16,  323.70333357412926)
        // this.objectMove.position.set(-319.59561744433125,  16,  323.70333357412926)
        // for(let i=0;i<this.targetList.length;i++){
        //     const target=this.targetList[i]
        //     const origin=target.origin
        //     target.position.set(
        //         position.x+origin.x,
        //         position.y+origin.y,
        //         position.z+origin.z
        //     )
        // }

        this.animate = this.animate.bind(this)
        requestAnimationFrame(this.animate)
    }
    animate(){
        this.setPos(this.camera.position)
        requestAnimationFrame(this.animate)
    }
    add_lensflares(){
        const textureFlare3 = new THREE.TextureLoader().load( 'assets/textures/lensflare/lensflare0_alpha.png' );
        const lensflare = new Lensflare();
        const s0=1
        lensflare.addElement( new LensflareElement( textureFlare3, 500*s0, 0, new THREE.Color(1,0,0) ) );
		lensflare.addElement( new LensflareElement( textureFlare3, 60*s0, 0.6 ) );
		lensflare.addElement( new LensflareElement( textureFlare3, 70*s0, 0.7 ) );
		lensflare.addElement( new LensflareElement( textureFlare3, 120*s0, 0.9 ) );
        lensflare.position.set(61, 17, -169)
        window.lensflare=lensflare
        this.objectMove.add(lensflare)

        const lensflare2 = new Lensflare();
        lensflare2.addElement( new LensflareElement( textureFlare3, 1500*s0, 0, new THREE.Color(0,0,0.1) ) );
        lensflare2.position.set( -255,  32,  176)
        this.object.add(lensflare2)
        window.lensflare2=lensflare2
    }
    setPos(position){
        // this.light.position.set(position.x,position.y,position.z)
        // this.scene.position.set(position.x,position.y,position.z)
        this.objectMove.position.set(position.x,position.y,position.z)
    }
    init(scene){
        // Lights 
        const x=0.5
        const ambient = new THREE.AmbientLight( 0xffffff ,0.5);//new THREE.AmbientLight( 0xffffff ,.8);
        this.ambient=ambient
        scene.add( ambient );
        // ambient.name="ambient"

        // const Light1 = new THREE.PointLight( 0xffffff, 0.7, 10000 ,1.5)//new THREE.DirectionalLight( 0xffddcc, 0.5 );
        // Light1.position.set( 0.2001199212621189,  1.8324430884592016,  -0.285745579849489)//( 10, 10, 10 );
        // scene.add( Light1 );
        // Light1.name="Light1"
        // return

        const directionalLight = new THREE.DirectionalLight( 0xcffffff,x+0.5+0.5 );
   
        directionalLight.shadow.camera.near = -1000//0.01 //产生阴影的最近距离
        directionalLight.shadow.camera.far = 3000 //产生阴影的最远距离
        directionalLight.shadow.camera.left = -1000 //产生阴影距离位置的最左边位置
        directionalLight.shadow.camera.right = 1000 //最右边
        directionalLight.shadow.camera.top = 500 //最上边
        directionalLight.shadow.camera.bottom = -100 //最下面

        directionalLight.shadow.camera.near = -2000//0.01 //产生阴影的最近距离
        directionalLight.shadow.camera.far = 2000 //产生阴影的最远距离
        directionalLight.shadow.camera.left = -2000 //产生阴影距离位置的最左边位置
        directionalLight.shadow.camera.right = 2000 //最右边
        directionalLight.shadow.camera.top = 500 //最上边
        directionalLight.shadow.camera.bottom = -100 //最下面
        //告诉平行光需要开启阴影投射
        directionalLight.castShadow = true
        // directionalLight.shadow.bias = -0.0005;
        directionalLight.shadow.mapSize.width = 2*2048; 
        directionalLight.shadow.mapSize.height = 2*2048;//这两个值决定使用多少像素生成阴影 默认512
        this.objectMove.add( directionalLight )
        // directionalLight.target = new THREE.Object3D();
        // directionalLight.target.origin=new THREE.Object3D(10,10,10)
        directionalLight.target.position.set(1,-0.5,1)
        
        window.target=directionalLight.target
        this.targetList.push(directionalLight.target)
        this.objectMove.add( directionalLight.target )
        this.directionalLight=directionalLight
        


        // const directionalLight2 = new THREE.DirectionalLight( 0xcffffff,x+1.5 );
        // directionalLight2.position.set(-1,0,0)
        // directionalLight2.lookAt(new THREE.Vector3(0,0,0))
        // light.add( directionalLight2 )

        // const Light4 = new THREE.PointLight( 0xcffffff,x+0.5-3.3 );
        // this.object.add( Light4 )//window.scene.add(Light4)//

        // const Light2 = new THREE.PointLight( 0xc0000ff,0.01 );
        // Light2.position.set(-257, 35, 196)
        // this.object.add(Light2)


        //创建区域光 
        // let rectLight = new THREE.RectAreaLight(0xffffff,1500,5,5);
        // //设置区域光位置
        // rectLight.position.set(0,50,0);
        // //设置区域光旋转角度
        // rectLight.rotation.x = 0.5*Math.PI;
        // //将区域光添加进场景
        // scene.add(rectLight);
        //创建区域光辅助器
        // let rectLightHelper = new THREE.RectAreaLightHelper(rectLight,0xff0000);
        //将区域光辅助器添加进场景
        // scene.add(rectLightHelper);

    }
    getSpotGroup(){
        const light=new THREE.Object3D()
        for(let i=0;i<3;i++){
            light.add(this.getSpotLight())
        }
        return light
    }
    getSpotLight(){
        const spotLight = new THREE.SpotLight( 
            Math.floor(0xffffff*Math.random()),//0xffffff,
            10 ,
            10000,
            Math.PI*(Math.random()*5+4.5)/60,
            0,
            0,
            );
        spotLight.position.set(0,50,0)
        // spotLight.castShadow = true
        this.scene.add(spotLight.target)
        const speed=0.003*(Math.random()+0.2)

        const tool=new THREE.Object3D();
        tool.rotation.y=Math.random()*100
        const x=80*(Math.random()+0.01);
        const y=-0.1;
        const z=80*(Math.random()+0.01);
        setInterval(()=>{
            tool.rotation.y+=speed
            tool.updateMatrix();
            const e=tool.matrix.elements
            const x2=x*e[0]+y*e[4]+z*e[8]
            const y2=x*e[1]+y*e[5]+z*e[9]
            const z2=x*e[2]+y*e[6]+z*e[10]
            // console.log()
            spotLight.target.position.set(x2,y2,z2)

        },1/60)

// color - (optional) hexadecimal color of the light. Default is 0xffffff (white).
// intensity - (optional) numeric value of the light's strength/intensity. Default is 1.
// distance - Maximum range of the light. Default is 0 (no limit).
// angle - Maximum angle of light dispersion from its direction whose upper bound is Math.PI/2.
// penumbra - Percent of the spotlight cone that is attenuated due to penumbra. Takes values between zero and 1. Default is zero.
// decay - The amount the light dims along the distance of the light.
        return spotLight
    }
}
export { LightProducer }