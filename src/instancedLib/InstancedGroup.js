function InstancedGroup(instanceCount,originMesh,animationClip ){
    console.log("InstancedGroup")
    //若有骨骼，则需要源mesh是skinnedMesh
    this.obj=new THREE.Object3D();
    this.instanceCount=instanceCount;

    //记录有无骨骼动画
    this.haveSkeleton = !(typeof (animationClip) == "undefined" || animationClip === false);
    this.originMeshs=originMesh;//这是一个数组，每个元素播放一种动画
    //this.animationClip=animationClip;
    this.mesh=null;//实例化渲染对象的网格

    this.speed;
    this.mcol0;//变换矩阵的一部分
    this.mcol1;
    this.mcol2;
    this.mcol3;
    this.type;
    this.colors;
    this.bonesWidth;

    this.time=0;//每帧自动加1，加到一定值之后自动归0

    this.dummy=new THREE.Object3D();//dummy仿制品//工具对象

    //shader地址
    this.vertURL;
    this.fragURL;

    //以下参数用于将模型划分为头、上身、下身三部分
    this.neckPosition;
}
InstancedGroup.prototype={

    setGeometry:function(geometryNew){//更新网格//用于和PM技术相结合
        var geometryTemp= new THREE.InstancedBufferGeometry();
        geometryTemp.instanceCount = this.instanceCount;
        geometryTemp.setAttribute('position', geometryNew.attributes.position);//Float32Array
        geometryTemp.setAttribute('inUV',geometryNew.attributes.uv);
        if(this.haveSkeleton){
            //console.log(geometryNew.attributes);//skinWeight
            geometryTemp.setAttribute('skinIndex',geometryNew.attributes.skinIndex);
            geometryTemp.setAttribute('skinWeight',geometryNew.attributes.skinWeight);
        }

        geometryTemp.setAttribute('speed', this.speed);

        geometryTemp.setAttribute('mcol0', this.mcol0);//四元数、齐次坐标
        geometryTemp.setAttribute('mcol1', this.mcol1);
        geometryTemp.setAttribute('mcol2', this.mcol2);
        geometryTemp.setAttribute('mcol3', this.mcol3);

        geometryTemp.setAttribute('type', this.type);
        geometryTemp.setAttribute('color', this.colors);
        geometryTemp.setAttribute('bonesWidth', this.bonesWidth);


        if(this.mesh)this.mesh.geometry=geometryTemp;
        return geometryTemp;
    },
    initAnimation:function(uniforms){
        var camera={
            position:{}
        }
        var scope=this;

        function updateAnimation() {//每帧更新一次动画
            requestAnimationFrame(updateAnimation);
            scope.time=(scope.time+1.0)%60000;

            uniforms.time={value: scope.time};
            //console.log(scope.time,uniforms.cameraX.value)
            uniforms.cameraX={value: camera.position.x};
            uniforms.cameraY={value: camera.position.y};
            uniforms.cameraZ={value: camera.position.z};
        }

        uniforms.time={value: 0.0};
        uniforms.cameraX={value: camera.position.x};
        uniforms.cameraY={value: camera.position.y};
        uniforms.cameraZ={value: camera.position.z};
        uniforms.animationData={type: 't', value:[]};updateAnimation();
        uniforms.animationDataLength={value:0};
        this.animationData=[];
        this.animationConfig=[];
        var animationDataLength=0;

        this.animationConfig=this.crowdData_json.config;
        for(i=0;i<scope.animationConfig.length;i++){
            animationDataLength+=this.animationConfig[i];
            this.animationData= this.animationData.concat(this.crowdData_json.animation[i]);
        }
        console.log(this.animationData)
        uniforms.animationDataLength={value:animationDataLength};
        uniforms.animationData=getTex(this.animationData);


        function getTex(arr) {//(str) {
            //var data0=JSON.parse(str).data;//204
            var data = new Float32Array( arr.length);//1944
            var width = 1 , height = data.length/3 ;//648
            data.set(arr)//for(var i=0;i<data.length;i++)data[i]=arr[i];//972
            var tex=new THREE.DataTexture(data, width, height, THREE.RGBFormat,THREE.FloatType);
            return {"value":tex};
        }
    },
    init:function (texSrc,textNum,texFlipY){//纹理贴图资源路径，贴图中包含纹理的个数
        if(typeof(textNum)=="undefined")textNum=16;
        if(typeof(texFlipY)=="undefined")texFlipY=true;
        this.originMeshs[0].geometry=this.originMeshs[0].geometry.toNonIndexed();



        //InstancedBufferAttribute为每个对象一组数据：先生成空间，再设置数据
        this.speed=new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 1), 1);
        this.mcol0=new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
        this.mcol1=new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
        this.mcol2=new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
        this.mcol3=new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
        this.type=new THREE.InstancedBufferAttribute(new Uint16Array(this.instanceCount*4), 4);//头部、上衣、裤子、动作
        this.colors=new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount*3), 3);
        this.bonesWidth=new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount*4), 4);
        this.faceShape =new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount), 1);

        for(i=0;i<this.instanceCount;i++){
            this.mcol0.setXYZ(i, 1,0,0);//随机长宽高
            this.mcol1.setXYZ(i, 0,1,0);//四元数、齐次坐标
            this.mcol2.setXYZ(i, 0,0,1);//mcol3.setXYZ(i, 0,0,0);

            this.type.setXYZW(i,
                Math.floor(Math.random() * textNum),
                Math.floor(Math.random() * textNum),
                Math.floor(Math.random() * textNum),
                Math.floor(Math.random() *2)//Math.random()//这个缓冲区是int类型的//所以这里不能传小数
            );

            this.boneWidthSet(i,0,Math.random()/2-0.25);
            this.boneWidthSet(i,1,Math.random()+0.5);//头部
            this.boneWidthSet(i,3,Math.random()/2-0.25);
        }



        let text0= THREE.ImageUtils.loadTexture(texSrc[0]);
        text0.flipY=texFlipY;
        text0.wrapS = text0.wrapT = THREE.ClampToEdgeWrapping;

        var uniforms={
            text0: {type: 't', value: text0}
            ,textNum:{value: textNum}
        };
        uniforms.neckPosition={
            value: (
                (this.neckPosition===undefined)?0.59:this.neckPosition
            )
        };

        if(this.vertURL===undefined)this.vertURL=this.haveSkeleton?"shader/vertexBone2.vert":"shader/vertex.vert";
        if(this.fragURL===undefined)this.fragURL="shader/fragment.frag";
        let material = new THREE.RawShaderMaterial();//原始着色器材质
        material.side=THREE.DoubleSide;
        material.uniforms= uniforms;
        material.vertexShader=load(this.vertURL);
        material.fragmentShader=load(this.fragURL);

        function load(name) {
            let xhr = new XMLHttpRequest(),
                okStatus = document.location.protocol === "file:" ? 0 : 200;
            xhr.open('GET', name, false);
            xhr.overrideMimeType("text/html;charset=utf-8");//默认为utf-8
            xhr.send(null);
            return xhr.status === okStatus ? xhr.responseText : null;
        }
        if(this.haveSkeleton){
            var scope=this;
            uniforms.time={value: 0.0};
            uniforms.animationData={type: 't', value:[]};
            uniforms.animationDataLength={value:0};
            this.animationData=[];
            this.animationConfig=[];
            var animationDataLength=0;
            var loader = new THREE.XHRLoader(THREE.DefaultLoadingManager);
            loader.load("json/animationConfig.json", function(str){
                scope.animationConfig=JSON.parse(str).data;
                updateAnimationData(0);
            });

            function updateAnimationData(index) {
                let worker = new Worker('js/animationLoadWorker.js');
                worker.postMessage("../json/animationData"+index+".json");
                worker.onmessage = function (event)
                {
                    animationDataLength+=scope.animationConfig[index];
                    uniforms.animationDataLength={value:animationDataLength};
                    scope.animationData= scope.animationData.concat(JSON.parse(event.data).data);
                    uniforms.animationData=getTex(scope.animationData);
                    if(index+1<scope.animationConfig.length)updateAnimationData(index+1);
                }
            }
            function getTex(arr) {//(str) {
                var data = new Float32Array( arr.length);//1944
                var width = 1 , height = data.length/3 ;//648
                for(var i=0;i<data.length;i++)data[i]=arr[i];//972
                var tex=new THREE.DataTexture(data, width, height, THREE.RGBFormat,THREE.FloatType);
                return {"value":tex};
            }
        }
        //以下是根据material设置的uniform
        var texSrc_index=1;
        function setText0(){
            if(texSrc_index>=texSrc.length)return;
            var myText0= THREE.ImageUtils.loadTexture(texSrc[texSrc_index],null,function () {
                texSrc_index++;
                myText0.flipY=texFlipY;
                myText0.wrapS = myText0.wrapT = THREE.ClampToEdgeWrapping;
                material.uniforms.text0={value: myText0};
                setText0();
            });
        }
        if(typeof(texSrc[0])==="string")setText0();//传入资源地址
        else material.uniforms.text0={value:texSrc[0]};//传入map类型

        this.mesh = new THREE.Mesh(
            this.setGeometry(this.originMeshs[0].geometry)
            , material);//重要
        this.mesh.frustumCulled=false;

        if(this.haveSkeleton){
            this.handleSkeletonAnimation();
            /*for(i=0;i<this.originMeshs.length;i++){
                this.originMeshs[i].visible=false;
                this.obj.add(this.originMeshs[i]);//threeJS中模型的位置尺寸角度变化，似乎是通过骨骼来实现的
            }*/
        }

        this.obj.add(this.mesh);

        //完成进行实例化渲染
    },
    handleSkeletonAnimation:function(){
        var scope=this;
        //var scope=this;//scope范围//为了避免this重名
        updateAnimation();
        function updateAnimation() {//每帧更新一次动画
            requestAnimationFrame(updateAnimation);
            scope.time=(scope.time+1.0)%60000;
            scope.mesh.material.uniforms.time={value: scope.time};
        }
    },

    setMatrix:function (i,matrix){//获取实例化对象第i个成员的变换矩阵
        this.mcol0.array[3*i  ]=matrix.elements[0];
        this.mcol0.array[3*i+1]=matrix.elements[1];
        this.mcol0.array[3*i+2]=matrix.elements[2];

        this.mcol1.array[3*i  ]=matrix.elements[4];
        this.mcol1.array[3*i+1]=matrix.elements[5];
        this.mcol1.array[3*i+2]=matrix.elements[6];

        this.mcol2.array[3*i  ]=matrix.elements[8];
        this.mcol2.array[3*i+1]=matrix.elements[9];
        this.mcol2.array[3*i+2]=matrix.elements[10];

        this.mcol3.array[3*i  ]=matrix.elements[12];
        this.mcol3.array[3*i+1]=matrix.elements[13];
        this.mcol3.array[3*i+2]=matrix.elements[14];
    },
    getMatrix:function (i){//获取实例化对象第i个成员的变换矩阵
        var matrix=new THREE.Matrix4();
        matrix.set(
            this.mcol0.array[3*i  ],this.mcol1.array[3*i  ],this.mcol2.array[3*i  ],this.mcol3.array[3*i  ],
            this.mcol0.array[3*i+1],this.mcol1.array[3*i+1],this.mcol2.array[3*i+1],this.mcol3.array[3*i+1],
            this.mcol0.array[3*i+2],this.mcol1.array[3*i+2],this.mcol2.array[3*i+2],this.mcol3.array[3*i+2],
            0                      ,0                      ,0                      ,1
        );
        return matrix;
    },

    positionGet:function(i){
        return [this.mcol3.array[3*i],this.mcol3.array[3*i+1],this.mcol3.array[3*i+2]];
    },
    rotationGet:function(i){
        var mat4=this.getMatrix(i);
        var position=new THREE.Vector3();
        var quaternion=new THREE.Quaternion();
        var scale=new THREE.Vector3();
        mat4.decompose(position,quaternion,scale);
        var euler=new THREE.Euler(0,0,0, 'XYZ');
        euler.setFromQuaternion(quaternion);
        return [euler.x,euler.y,euler.z];
    },
    scaleGet:function(i){
        var mat4=this.getMatrix(i);
        var position=new THREE.Vector3();
        var quaternion=new THREE.Quaternion();
        var scale=new THREE.Vector3();
        mat4.decompose(position,quaternion,scale);
        return [scale.x,scale.y,scale.z];
    },

    positionSet:function (i,pos){//.instanceMatrix.needsUpdate=true;
        this.mcol3.needsUpdate=true;
        this.mcol3.array[3*i  ]=pos[0];
        this.mcol3.array[3*i+1]=pos[1];
        this.mcol3.array[3*i+2]=pos[2];
    },
    rotationSet:function (i,rot){
        this.mcol0.needsUpdate=true;
        this.mcol1.needsUpdate=true;
        this.mcol2.needsUpdate=true;
        var mat4=this.getMatrix(i);
        var position=new THREE.Vector3();
        var quaternion=new THREE.Quaternion();
        var scale=new THREE.Vector3();
        mat4.decompose(position,quaternion,scale);

        this.dummy.scale.set(scale.x,scale.y,scale.z);
        this.dummy.rotation.set(rot[0],rot[1],rot[2]);
        this.dummy.position.set(position.x,position.y,position.z);
        this.dummy.updateMatrix();

        this.setMatrix(i,this.dummy.matrix);
    },
    scaleSet:function(i,size){
        var mat4=this.getMatrix(i);
        var position=new THREE.Vector3();
        var quaternion=new THREE.Quaternion();
        var scale=new THREE.Vector3();
        mat4.decompose(position,quaternion,scale);
        var euler=new THREE.Euler(0,0,0, 'XYZ');
        euler.setFromQuaternion(quaternion);

        this.dummy.scale.set(size[0],size[1],size[2]);
        this.dummy.rotation.set(euler.x,euler.y,euler.z);
        this.dummy.position.set(position.x,position.y,position.z);
        this.dummy.updateMatrix();

        this.setMatrix(i,this.dummy.matrix);
    },
    typeSet:function (i,type) {//设置贴图和动画类型
        this.type.array[4*i  ]=type[0];
        this.type.array[4*i+1]=type[1];
        this.type.array[4*i+2]=type[2];
        this.type.array[4*i+3]=type[3];//动画类型 0,1
    },
    textureSet: function (i, type) {//设置贴图和动画类型
        this.type.array[4 * i] = type[0];
        this.type.array[4 * i + 1] = type[1];
        this.type.array[4 * i + 2] = type[2];
    },
    textureSet0: function (i, type) {//头部贴图
        this.type.array[4 * i] = type;//设置贴图
    },
    textureSet1: function (i, type) {//设置上身贴图
        this.type.array[4 * i+ 1] = type;//设置贴图
    },
    animationSet:function(i,animationType){
        this.type.array[4*i+3]=animationType;//动画类型 0,1
    },
    colorSet:function (i,color) {
        this.colors.array[3*i  ]=color[0];
        this.colors.array[3*i+1]=color[1];
        this.colors.array[3*i+2]=color[2];
    },
    boneWidthSet:function (avatarIndex,regionIndex,width) {
        this.bonesWidth.array[4*avatarIndex+regionIndex]=width;
    },
    faceShapeSet:function (avatarIndex,width) {
        // console.log("!!!!",avatarIndex,width)
        this.faceShape.needsUpdate=true;
        this.faceShape.array[avatarIndex]=width;
    },
    speedSet:function (i,speed) {//设置动画速度
        this.speed.array[i]=speed;
    },

    move:function (i,dPos){
        var pos=this.positionGet(i);
        this.positionSet(i,[pos[0]+dPos[0],pos[1]+dPos[1],pos[2]+dPos[2]]);
    },
    rotation:function (i,dRot){
        var rot=this.rotationGet(i);
        this.rotationSet(i,[rot[0]+dRot[0],rot[1]+dRot[1],rot[2]+dRot[2]]);
    },
}
function CanvasControl(n,h,colors,flipY) {
    this.canvas;
    this.context;
    this.flipY;
    this.w;
    this.h;
    this.init(n,h,colors,flipY);
}
CanvasControl.prototype={
    init:function (n,h,colors,flipY) {
        this.flipY=typeof(flipY)=="undefined"?true:flipY;
        this.h=h;
        this.w=h*n;
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.w;
        this.canvas.height = this.h;
        this.context = this.canvas.getContext("2d");

        for(var i=0;i<n;i++)
            this.drawColor(colors[i],i);
    },
    drawColor:function(color,k){
        this.context.fillStyle = color;//"#FFFF00";
        this.context.fillRect(k*this.h,0,this.h,this.h);
    },
    drawImg:function(src,k,myOnload){
        var scope=this;
        var myImage = new Image();
        myImage.src = src;   //你自己本地的图片或者在线图片
        myImage.crossOrigin = 'Anonymous';
        myImage.onload = function(){//pos[0],pos[1]是落笔的起始位置，pos[2],pos[3]是落笔区域的大小
            myImage.width=scope.h;
            myImage.height=scope.h;
            scope.context.drawImage(myImage , k*scope.h,0,scope.h,scope.h);
            if(typeof (myOnload)!="undefined")myOnload(scope.getTex());
        }
    },
    getTex:function () {
        var texture=new THREE.CanvasTexture(this.canvas);
        texture.flipY=this.flipY;
        texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
        return texture;
    },
    download:function (name) {//将画布的内容保存为图片
        let url = this.canvas.toDataURL("image/jpeg");
        //let url = this.canvas.toDataURL("image/png"); //得到图片的base64编码数据
        //console.log(url);
        let a = document.createElement("a"); // 生成一个a元素
        let event = new MouseEvent("click"); // 创建一个单击事件
        a.download = name || "photo"; // 设置图片名称
        a.href = url; // 将生成的URL设置为a.href属性
        a.dispatchEvent(event); // 触发a的单击事件
    },
}
class Octree{
    tree;
    step;
    constructor(x1,x2,y1,y2,z1,z2,height){
        this.tree=Octree.createTree(x1,x2,y1,y2,z1,z2,height);
        var sx=(x2-x1)/(Math.pow(2,height))
        var sy=(y2-y1)/(Math.pow(2,height))
        var sz=(z2-z1)/(Math.pow(2,height))
        this.step={x:sx,y:sy,z:sz}
    }
    push(x,y,z,data){
        var arr=Octree.find(this.tree,x,y,z)
        arr.push(data)
    }
    pop(x,y,z){
        var arr=[]
        var t=this.step;
        var a=[-t.x,0,t.x]
        var b=[-t.y,0,t.y]
        var c=[-t.z,0,t.z]
        for(var i=0;i<2;i++)
            for(var j=0;j<2;j++)
                for(var k=0;k<2;k++)
                    arr.push(
                        Octree.find(this.tree,x+a[i],y+b[j],z+c[k])
                    )
        var result=[];
        for(var l=0;l<arr.length;l++)
            for(var m=0;m<arr[l].length;m++)
                result.push(arr[l][m])
        return result;
    }

    static find(tree,x,y,z){
        if(tree.length===11&&tree[0] instanceof Array){
            var k=0;
            if(z>tree[10])k+=1
            if(y>tree[9])k+=2;
            if(x>tree[8])k+=4;
            return Octree.find(tree[k],x,y,z)
        }else return tree;
    }
    static createTree(x1,x2,y1,y2,z1,z2,height){
        var x0=(x1+x2)/2
        var y0=(y1+y2)/2
        var z0=(z1+z2)/2
        if(height===1){
            return [[],[],[],[],[],[],[],[],x0,y0,z0]
        }else{
            var l0=Octree.createTree(x1,x0,y1,y0,z1,z0,height-1)//---
            var l1=Octree.createTree(x1,x0,y1,y0,z0,z2,height-1)//--+
            var l2=Octree.createTree(x1,x0,y0,y2,z1,z0,height-1)//-+-
            var l3=Octree.createTree(x1,x0,y0,y2,z0,z2,height-1)//-++
            var l4=Octree.createTree(x0,x2,y1,y0,z1,z0,height-1)//+--
            var l5=Octree.createTree(x0,x2,y1,y0,z0,z2,height-1)//+-+
            var l6=Octree.createTree(x0,x2,y0,y2,z1,z0,height-1)//++-
            var l7=Octree.createTree(x0,x2,y0,y2,z0,z2,height-1)//+++
            return [l0,l1,l2,l3,l4,l5,l6,l7,x0,y0,z0]
        }

    }
}