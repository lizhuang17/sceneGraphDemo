export class vs_anim_sim{
    static shader=/* glsl */`
	in vec3 instanceColorIn;
	out vec3 instanceColorOut;
	//////////////////////////////////////
	uniform sampler2D animationTexture;
	uniform float boneCount, animationFrameCount, animationTextureLength;
	uniform float time;
	in vec4 skinIndex, skinWeight; // 仅使用了绑定的第一个骨骼
	in float speed;//float speed=1.;//
	// in float obesity;
	in float moveMaxLength;
	in float animationStartTime;
	in float animationIndex; // float animationIndex=0.; // 动画类型// in float animationIndex; // 动画类型//
	in vec4 bodyScale; // 0:身体 1:头部 2:上肢 3:下肢
	struct Vertex{
		vec3 position;
		vec3 normal;
	};
	float getBoneScale(float bone) { // 身体形变
		float b=round(bone);
		float A=bodyScale[0],B=bodyScale[1],C=bodyScale[2],D=bodyScale[3];
		if((2.<=b&&b<=4.)||(75.<=b&&b<=77.))return A;
		else if((5.<=b&&b<=7.)||(78.<=b&&b<=80.))return B;
		else if(b==8.||b==81.)return C;
		else if((9.<=b&&b<=10.)||(82.<=b&&b<=83.))return D;
		else if(12.<=b&&b<=13.)return (A+B)/2.;
		else if(b==14.)return (A+C)/2.;
		else if(15.<=b&&b<=16.)return (A+D)/2.;
		else if(17.<=b&&b<=18.)return (B+C)/2.;
		else if(b==19.||b==47.)return (B+D)/2.;
		else if((20.<=b&&b<=22.)||(48.<=b&&b<=50.))return (B+C+D)/2.;
		else if((23.<=b&&b<=25.)||(51.<=b&&b<=53.))return (A+C+D)/2.;
		else if(b==26.||b==54.)return (A+B+D)/2.;
		else if((27.<=b&&b<=46.)||(55.<=b&&b<=74.))return (A+B+C)/2.;
		else return 0.;
		// if ( bone < 3.5 || (bone > 5.5 && bone < 6.5) || (bone > 15.5 && bone < 16.5) ) // 身体
		// 	return bodyScale[0];
		// if ( bone > 3.5 && bone < 5.5 ) // 头部
		// 	return bodyScale[1];
		// if ( bone > 6.5 && bone < 15.5 || (bone > 16.5 && bone < 25.5) ) // 上肢
		// 	return bodyScale[2];
		// if ( bone > 25.5 ) // 下肢
		// 	return bodyScale[3];
	}
	float computeBodyScale() {
		return (
			skinWeight[0] * getBoneScale(skinIndex[0]) + 
			skinWeight[1] * getBoneScale(skinIndex[1]) +
			skinWeight[2] * getBoneScale(skinIndex[2]) +
			skinWeight[3] * getBoneScale(skinIndex[3])
		);
	}
	vec4 getAnimationItem(float index) { // 从texture中提取矩阵元素
		float v = floor(index / animationTextureLength);
		float u = index - v * animationTextureLength;
		return texture(
			animationTexture, 
			vec2( (0.5 + u) / animationTextureLength, (0.5 + v) / animationTextureLength )
		);
	}
	mat4 computeAnimationMatrix(float boneIndex, float frameIndex) { // 计算一个骨骼的变换矩阵
		float startPos = //4. * boneCount +
				3. * (boneCount * (animationIndex  * (animationFrameCount-1.) + frameIndex) + boneIndex);
		vec4 a=getAnimationItem(startPos + 0.);
		vec4 b=getAnimationItem(startPos + 1.);
		vec4 c=getAnimationItem(startPos + 2.);
		
		return mat4(
			vec4(a.x,a.y,a.z, 0.),
			vec4(a.a,b.x,b.y, 0.),
			vec4(b.z,b.a,c.x, 0.),
			vec4(c.y,c.z,c.a, 1.)
		);
	}
	mat3 mat4_mat3(mat4 m){
		return mat3(
			m[0].xyz,
			m[1].xyz,
			m[2].xyz
		);
	}
	Vertex computeAnimationPos(float boneIndex, float frameIndex,Vertex vertex) { // 计算一个骨骼的变换矩阵
		vec4 position=vec4(vertex.position, 1.);
		// mat4 m1=computeAnimationMatrix( boneIndex,  0.);
		// mat4 m2=computeAnimationMatrix( boneIndex,  frameIndex+1.);
		// vertex.position=(m2*m1*position).xyz;
		mat4 m=computeAnimationMatrix( boneIndex,  frameIndex);
		vertex.position=(m*position).xyz;
		return vertex;
	}
	Vertex vertexBlending(Vertex vertex, float frameIndex) { // 动画形变, 计算4个骨骼的影响
		if ( animationTextureLength < 0.5) return vertex; // 动画未加载 //点集渲染的时候可以用到
		Vertex vertexResult;
		vertexResult.position=vec3(0.,0.,0.);
		// vertexResult.normal=vec3(0.,0.,0.);
		for(int i=0;i<4;i++){
			Vertex v=computeAnimationPos(skinIndex[i], frameIndex,vertex) ;
			vertexResult.position+=skinWeight[i] * v.position;
			// vertexResult.normal+=skinWeight[i] * v.normal;
		}
		return vertexResult;
	}
	Vertex frameInterpolation(Vertex vertex) { // 点坐标插值, 考虑优化:变换矩阵插值
		float m = floor((time + animationStartTime) * speed / (animationFrameCount-2.));
		float temp = (time + animationStartTime) * speed - m * (animationFrameCount-2.);
		float frameIndex1 = floor(temp);
		float weight = temp - frameIndex1; // 插值权重
		float frameIndex2 = float(int(frameIndex1 + 1.) % int(animationFrameCount-1.));
		if(frameIndex2>=animationFrameCount-2.)frameIndex2=0.;
		Vertex vertex1 = vertexBlending(vertex, frameIndex1);
		Vertex vertex2 = vertexBlending(vertex, frameIndex2);
		vertex.position = (1. - weight) * vertex1.position + weight * vertex2.position;
	
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
			vertex.position.x*=direction;
			vertex.position.z*=direction;
			vertex.position.z-=x;
	
			vertex.normal.x*=direction;
			vertex.normal.z*=direction;
		}
		return vertex;
	}
	//////////////////////////////////////
	`
}