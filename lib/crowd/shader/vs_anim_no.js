export class vs_anim_no{
    static shader=/* glsl */`
	in vec3 instanceColorIn;
	out vec3 instanceColorOut;
	//////////////////////////////////////
	uniform float time;
	in float moveMaxLength;
	struct Vertex{
		vec3 position;
		vec3 normal;
	};
	mat3 mat4_mat3(mat4 m){
		return mat3(
			m[0].xyz,
			m[1].xyz,
			m[2].xyz
		);
	}
	Vertex frameInterpolation(Vertex vertex) { // 点坐标插值, 考虑优化:变换矩阵插值
		return vertex;
	}
	//////////////////////////////////////
	`
}