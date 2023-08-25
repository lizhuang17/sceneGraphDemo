export class vs_MeshStandardMaterial{
    static shader=/* glsl */`
	#define STANDARD
	varying vec3 vViewPosition;

	#ifdef USE_TRANSMISSION

		varying vec3 vWorldPosition;

	#endif

	#include <common>
	#include <uv_pars_vertex>
	//#include <uv2_pars_vertex>
	#include <displacementmap_pars_vertex>
	#include <color_pars_vertex>
	#include <fog_pars_vertex>
	#include <normal_pars_vertex>
	#include <morphtarget_pars_vertex>
	#include <skinning_pars_vertex>
	#include <shadowmap_pars_vertex>
	#include <logdepthbuf_pars_vertex>
	#include <clipping_planes_pars_vertex>
	void main() {
		// gl_Position=vec4(0.,0.,-1000.,1.);
		// return;
		#include <uv_vertex>
		//#include <uv2_vertex>
		#include <color_vertex>

		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
		#include <normal_vertex>

		#include <begin_vertex>
		#include <morphtarget_vertex>
		#include <skinning_vertex>
		#include <displacementmap_vertex>
		///////////////////////////////////////////
		Vertex vertex;
		vertex.position=transformed;
		vertex.normal=vNormal;
		// transformed_temp=transformed;
		// vNormal_temp=vNormal;
		vertex=frameInterpolation(vertex);
		// transformed=transformed_temp;
		// vNormal=vNormal_temp;
		transformed=vertex.position;
		vNormal=vertex.normal;

		// vec4 temp=frameInterpolation(transformed);
		// transformed=temp.xyz;
		// float direction=temp.a;
		instanceColorOut= instanceColorIn;//vNormal
		///////////////////////////////////////////
		#include <project_vertex>
		
		#include <logdepthbuf_vertex>
		#include <clipping_planes_vertex>

		vViewPosition = - mvPosition.xyz;

		#include <worldpos_vertex>
		#include <shadowmap_vertex>
		#include <fog_vertex>

	#ifdef USE_TRANSMISSION

		vWorldPosition = worldPosition.xyz;

	#endif
	}`;
}