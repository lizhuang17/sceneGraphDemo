import * as THREE from "three"
export class escapmap{
    constructor(){
        this.grids=[]
        this.map_edges = []
        this.normal=1  
        this.ext_arr=[]
        this.meshs = null
        this.ext_mesh = null
        this.matrix = []
        this.count = 0// HaiNing2-1:131587, KaiLiNan4-1:4062291
    }
    init(map){
        let floor = []
        for(var x = 0; x < map.length; x++){
            let row = []
            for(var y = 0; y < map[x].length; y++){
                row.push(new ceil(map[x][y], [x,y]))
            }
            floor.push(row)
        }
        const geometry = new THREE.BufferGeometry()
		const vertices = new Float32Array( [
			-1.0, -1.0,  1.0, // v0
			 1.0, -1.0,  1.0, // v1
			 1.0,  1.0,  1.0, // v2

			 1.0,  1.0,  1.0, // v3
			-1.0,  1.0,  1.0, // v4
			-1.0, -1.0,  1.0  // v5
		] )
		geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) )
		const material = new THREE.MeshBasicMaterial( { color: 0x000000 } )
		this.meshs = new THREE.InstancedMesh( geometry, material, 4062300)
        this.grids.push(this.link(floor))
    }
    link(grid){
        /*  1|2|3
            8|x|4
            7|6|5   */
        let lenx = grid.length
        let leny = grid[0].length
        for(var x = 0; x < lenx; x++){
            for(var y = 0; y < leny; y++){
                if(grid[x][y].ph >= 0){
                    // 计划加入烟雾，让烟雾也占据格子，多分辨率：用不同粒度的烟雾粒子填格子，参考人群的实现方法
                    // this.meshs.setMatrixAt(this.count,new THREE.Matrix4().set(1,0,0,x-1322,0,1,0,y-751,0,0,1,481,0,0,0,1))// 需要修改，将map_edge传入
                    this.count+=1
                    try{var n1=grid[x-1][y+1];if(n1==undefined)n1 = null;}catch{var n1 = null;}
                    try{var n2=grid[x][y+1];if(n2==undefined)n2 = null;}catch{var n2 = null;}
                    try{var n3=grid[x+1][y+1];if(n3==undefined)n3 = null;}catch{var n3 = null;}
                    try{var n4=grid[x+1][y];if(n4==undefined)n4 = null;}catch{var n4 = null;}
                    try{var n5=grid[x+1][y-1];if(n5==undefined)n5 = null;}catch{var n5 = null;}
                    try{var n6=grid[x][y-1];if(n6==undefined)n6 = null;}catch{var n6 = null;}
                    try{var n7=grid[x-1][y-1];if(n7==undefined)n7 = null;}catch{var n7 = null;}
                    try{var n8=grid[x-1][y];if(n8==undefined)n8 = null;}catch{var n8 = null;}
                    grid[x][y].findchild([n1,n2,n3,n4,n5,n6,n7,n8])
                }
                // if(grid[x][y].ph == 0){
                //     // 计划加入烟雾，让烟雾也占据格子，多分辨率：用不同粒度的烟雾粒子填格子，参考人群的实现方法
                //     this.meshs.setMatrixAt(this.count,new THREE.Matrix4().set(1,0,0,x-1322,0,1,0,y-751,0,0,1,481,0,0,0,1))// 需要修改，将map_edge传入
                //     this.count+=1
                // }
            }
        }
        return grid

    }
    count_m(x,y){
            const position = new THREE.Vector3(x,y,-3);
            const rotation = new THREE.Euler();
            const quaternion = new THREE.Quaternion();
            const scale = new THREE.Vector3();
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 0;
                quaternion.setFromEuler( rotation );
                scale.x = scale.y = scale.z = 1;
                matrix.compose( position, quaternion, scale );
    }
}
class ceil
{
    constructor(ph,pos){
        this.child=[]
        this.ph=ph
        this.ph0=ph
        this.pos=pos
        this.ore=-1
        this.people=-1
        this.panic = 0
        this.know = 0
    }
    findchild(next){
        for(var i = 0; i < 8; i++){
            if(next[i] != null){
                if(next[i].ph0 < 0)
                    next[i] = null
            }
            this.child.push(next[i])
        }
    }
    setpeople(id){
        this.people=id
        this.ph=-1
    }
    nextstep(){
        let m = Infinity
        let n = 8
        let next = this.pos
        for(var i=0;i<8;i++){
            if(this.child[i] && this.child[i].ph >= 0){
                if(this.child[i].ph0 < m){
                    m = this.child[i].ph0
                    n = i
                    next = this.child[n].pos
                }else if(this.child[i].ph0 == m){
                    n = i % 2 > n % 2 ? i : n
                    next = this.child[n].pos
                }

            }
        }
        if(m == 0){
            this.people=-1
            this.ph=this.ph0
        }
        else if(n < 8){
            this.child[n].setpeople(this.id)
            this.child[n].ore = n
            this.people=-1
            this.ph=this.ph0
        } 
        return [n, this.ph0, next[0], next[1], -3]
    }
    // set_ext(ext){
    //     this.ext = ext
    //     if(ext < 100)
    //         this.child.forEach(function(e){
    //             if(e && e.ext>ext)
    //                 e.set_ext(ext+1)
    //         })
    // }
}