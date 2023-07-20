import * as THREE from "three";
class GridHelperX extends THREE.LineSegments {

	constructor( edge, step = 1, Color = 0x666666 ) {
		const color = new THREE.Color( Color )
		const vertices = [], colors = [];

		let j = 0
		for(var x = edge[1]; x <= edge[0]; x += step){
			vertices.push(x, 0, edge[3], x, 0, edge[2])
			color.toArray( colors, j ); j += 3;
			color.toArray( colors, j ); j += 3;
		}
		for(var y = edge[3]; y <= edge[2]; y += step){
			vertices.push(edge[1], 0, y, edge[0], 0 , y)
			color.toArray( colors, j ); j += 3;
			color.toArray( colors, j ); j += 3;
		}
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

		const material = new THREE.LineBasicMaterial( { vertexColors: true, toneMapped: false } );

		super( geometry, material );
	}

}

export { GridHelperX };