const assets={}
import * as THREE from "three";
export class Instanced1Animation {
    constructor( buffer ) {
		let itemSize1=4
		let itemSize2=2
		let headSize=4
		let head = new Uint32Array(buffer.slice(0, headSize * itemSize1))
		let config_len=head[0]
		let config_0=head[1]
		let animationDataLength=head[2]
		let frameNumber=head[3]
		var config=[]
		for(var i=0;i<config_len;i++)
			config.push(config_0)
		
		let animationTextureLength = 
			THREE.MathUtils.ceilPowerOfTwo( Math.sqrt(animationDataLength / 4) )
		let length=animationTextureLength
		let data1 = new Uint16Array(buffer.slice(
			headSize * itemSize1, 
			headSize * itemSize1+head[2]* itemSize2
			))
		let data1_ = new Uint16Array(length * length * 4)
		data1_.set(data1)

		let data2 = new Uint16Array(buffer.slice(
			headSize * itemSize1+head[2]* itemSize2, 
			buffer.byteLength
			))	
		let data2_ = new Uint16Array(length * length * 4)
		data2_.set(data2)
		
		let map1 = new THREE.DataTexture()
		map1.type = THREE.HalfFloatType
		map1.image = {
			  data: data1_,
			  width: animationTextureLength,
			  height: animationTextureLength,
		}	
		map1.needsUpdate = true
		let map2 = new THREE.DataTexture()
		map2.type = THREE.HalfFloatType
		map2.image = {
			  data: data2_,
			  width: animationTextureLength,
			  height: animationTextureLength,
		}	
		map2.needsUpdate = true

		this.config=config
		this.frameNumber=frameNumber
		this.animationTextureLength=animationTextureLength
		this.animationTexture={value:map1}
		this.animationTexture2={value:map2}
    }	
	static createAnimation(path){
		if(path==null)return null//非skinnedmesh
		if(!assets[path])
			assets[path]=new Promise( (resolve, reject) => { 
				let loader = new THREE.FileLoader();
				loader.setResponseType("arraybuffer");
				loader.load(
					path,
					buffer => {
						
						resolve( new Instanced1Animation(buffer) );
					}	
				)//end
			} );
		return assets[path]
	}
}