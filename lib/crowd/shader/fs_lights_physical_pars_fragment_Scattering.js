export class fs_lights_physical_pars_fragment_Scattering{
    static shader=/* glsl */`
	float thicknessDistortion = 0.1;
	float thicknessPower = 2.0;
	float thicknessScale = 2.0;

	uniform sampler2D sssLUT;//Subsurface Scattering //https://developer.nvidia.com/gpugems/gpugems3/part-iii-rendering/chapter-14-advanced-techniques-realistic-real-time-skin
	uniform float sssIntensity;
	uniform float CurveFactor;

	void RE_Direct_Physical_Scattering( const in IncidentLight directLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
			RE_Direct_Physical( directLight, geometry, material, reflectedLight ) ;
			vec3 scatteringHalf = normalize( directLight.direction + (geometry.normal * thicknessDistortion));
			float scatteringDot = pow(saturate(dot(geometry.viewDir, -scatteringHalf)), thicknessPower) * thicknessScale;
			reflectedLight.directDiffuse += scatteringDot * directLight.color * material.diffuseColor.rgb;

			float wrappedDotNL = (dot(directLight.direction, geometry.normal) * 0.5 + 0.5);
			vec4 scatteringColor = texture2D(sssLUT, vec2(wrappedDotNL, CurveFactor  ));
			reflectedLight.directDiffuse += (1.0 - wrappedDotNL) * directLight.color * material.diffuseColor * scatteringColor.rgb * sssIntensity;//计算次表面散射并加入到漫反射中
	}
	#define  RE_Direct_Physical  RE_Direct_Physical_Scattering
	`
}