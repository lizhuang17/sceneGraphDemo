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
        this.finish_load = false
    }
    init(map, scene=null){
        let floor = []
        let self = this
        const loader = new THREE.FileLoader();
        loader.load('KaiLiNan4-1.csv', function (value) {
            let x = 0
            value.split('\n').forEach(function(v){
                let y = 0
                let line = []
                v.split(',').forEach(function(w){
                    line.push(new ceil(parseInt(w),[x,y]))
                    y++
                });
                if(line.length > 6){
                    self.grids.push(line)
                    x++
                }
            });
            self.finish_load = true
        }) 
        // for(var x = 0; x < map.length; x++){
        //     let row = []
        //     for(var y = 0; y < map[x].length; y++){
        //         row.push(new ceil(map[x][y], [x,y]))
        //     }
        //     // floor.push(row)
        //     this.grids.push(row)
        // }

        // const ball = new THREE.BufferGeometry()
        // const ball_v = []
        // const circleRadius = 1.0; // 圆片的半径
        // const circleSegments = 32; // 圆片的分段数
        // for (let i = 0; i <= circleSegments; i++) {
        //     const theta = (i / circleSegments) * Math.PI * 2; // 计算当前分段的角度
        //     const x = Math.cos(theta) * circleRadius; // 计算当前分段的x坐标
        //     const y = Math.sin(theta) * circleRadius; // 计算当前分段的y坐标
        //     ball_v.push(x, y, 0); // 将顶点坐标添加到数组中
        // }

        // const positions = new Float32Array(ball_v); // 创建Float32Array类型的顶点坐标数组
        // ball.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		// const ball_m = new THREE.MeshBasicMaterial( { color: 0x00ff00 } )
		// this.balls = new THREE.InstancedMesh( ball, ball_m, 10000)
        
        // this.grids.push(this.link(floor))

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
                // if(grid[x][y].ph == -1){
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
    nextstep(pos, e){
        let n = Infinity
        let next = [pos[0],pos[1]]
        let x = next[0]
        let y = next[1]
        let alph = this.grids[x][y].ph0
        var n1,n2,n3,n4,n5,n6,n7,n8 = null
        let o = -1
        try{n1=this.grids[x-1][y+1].ph;if(n1==undefined || n1<0)n1 = Infinity;else if(n1>0&&n1<alph)n1=(n1*e+(1-e)*this.grids[x-1][y+1].know)*1}catch{var n1 = Infinity;}
        try{n2=this.grids[x][y+1].ph;if(n2==undefined || n2<0)n2 = Infinity;else if(n2>0&&n1<alph)n2=n2*e+(1-e)*this.grids[x][y+1].know}catch{var n2 = Infinity;}
        try{n3=this.grids[x+1][y+1].ph;if(n3==undefined || n3<0)n3 = Infinity;else if(n3>0&&n1<alph)n3=(n3*e+(1-e)*this.grids[x+1][y+1].know)*1}catch{var n3 = Infinity;}
        try{n4=this.grids[x+1][y].ph;if(n4==undefined || n4<0)n4 = Infinity;else if(n4>0&&n1<alph)n4=n4*e+(1-e)*this.grids[x+1][y].know}catch{var n4 = Infinity;}
        try{n5=this.grids[x+1][y-1].ph;if(n5==undefined || n5<0)n5 = Infinity;else if(n5>0&&n1<alph)n5=(n5*e+(1-e)*this.grids[x+1][y-1].know)*1}catch{var n5 = Infinity;}
        try{n6=this.grids[x][y-1].ph;if(n6==undefined || n6<0)n6 = Infinity;else if(n6>0&&n1<alph)n6=n6*e+(1-e)*this.grids[x][y-1].know}catch{var n6 = Infinity;}
        try{n7=this.grids[x-1][y-1].ph;if(n7==undefined || n7<0)n7 = Infinity;else if(n7>0&&n1<alph)n7=(n7*e+(1-e)*this.grids[x-1][y-1].know)*1}catch{var n7 = Infinity;}
        try{n8=this.grids[x-1][y].ph;if(n8==undefined || n8<0)n8 = Infinity;else if(n8>0&&n1<alph)n8=n8*e+(1-e)*this.grids[x-1][y].know}catch{var n8 = Infinity;}
        if(n && n > n1) {n = n1; o=0}
        if(n && n > n2) {n = n2; o=1}
        if(n && n > n3) {n = n3; o=2}
        if(n && n > n4) {n = n4; o=3}
        if(n && n > n5) {n = n5; o=4}
        if(n && n > n6) {n = n6; o=5}
        if(n && n > n7) {n = n7; o=6}
        if(n && n > n8) {n = n8; o=7}
        
        let new_e = e
        let child = null 
        switch(o){
            case 0:
                child = this.grids[x-1][y+1]
                next[0]-=1
                next[1]+=1
                break
            case 1:
                child = this.grids[x][y+1]
                next[1]+=1
                break
            case 2:
                child = this.grids[x+1][y+1]
                next[0]+=1
                next[1]+=1
                break
            case 3:
                child = this.grids[x+1][y]
                next[0]+=1
                break
            case 4:
                child = this.grids[x+1][y-1]
                next[0]+=1
                next[1]-=1
                break
            case 5:
                child = this.grids[x][y-1]
                next[1]-=1
                break
            case 6:
                child = this.grids[x-1][y-1]
                next[0]-=1
                next[1]-=1
                break
            case 7:
                child = this.grids[x-1][y]
                next[0]-=1
                break
            default:
                child = this.grids[x][y]
                break
        } 
        if(this.know > e)
            new_e = e
        if(this.grids[x][y].ph0 > child.ph0)
            this.grids[x][y].know += e
        child.setpeople(this.grids[x][y].people, o)
        this.grids[x][y].people=-1
        this.grids[x][y].ph=this.grids[x][y].ph0
        this.grids[x][y].ore = -1
        return [o, this.grids[x][y].ph0, next[0], next[1], 481, new_e]
    }
    set_ext(ext){
        this.ext = ext
        if(ext < 100)
            this.child.forEach(function(e){
                if(e && e.ext>ext)
                    e.set_ext(ext+1)
            })
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
    setpeople(id, o){
        if(this.ph0 > 0){
            this.know *= 3 / 4
            this.people=id
            this.ph=-1
            this.ore = o
        }
        // let count = 0
        // for(var i=0;i<8;i++){
        //     if(this.child[i] && this.child[i].panic){
        //         this.panic += this.child[i].panic
        //         count++
        //     }
        // }
        // if(count > 0)
        //     this.panic /= count
    }
    nextstep(e){
        let m = Infinity
        let n = 8
        let next = this.pos
        // console.log(e)
        for(var i=0;i<8;i++){
            if(this.child[i] && this.child[i].ph >= 0 && this.child[i].ph0 < this.ph0){
                let ifl = i % 2 == 1 ? 0.95 : 1
                let phem = (this.child[i].ph0*e+(1-e)*this.child[i].know )* ifl
                // let phem = this.child[i].ph0*e
                if(phem < m){
                    m = phem
                    n = i
                    next = this.child[n].pos
                }else if(phem == m){
                    n = i % 2 > n % 2 ? i : n
                    next = this.child[n].pos
                }

            }
        }
        let new_e = e
        if(m == 0){
            this.people=-1
            this.ph=this.ph0
        }
        else if(n < 8){
            if(this.know > e)
                new_e = e
            if(this.ph0 > this.child[n].ph0)
                this.know += e
            this.child[n].setpeople(this.id)
            this.people=-1
            this.ph=this.ph0
        } 
        // console.log(n, next)
        return [n, this.ph0, next[0], next[1], 480, new_e]
    }
    // nextstep(e){
    //     let n = Infinity
    //     let next = this.pos
    //     let x = next[0]
    //     let y = next[1]
    //     console.log(this.parent.grids[0][x][y])
    //     let o = this.ore
    //     var n1,n2,n3,n4,n5,n6,n7,n8 = null
    //     switch(o){
    //         case 1:
    //             try{n8=this.parent.grids[0][x-1][y].ph;if(n8==undefined || n8<0)n8 = null;else if(n8>0) n8=(n8*e+(1-e)*this.parent.grids[0][x-1][y].know)*0.95}catch{var n8 = null;}
    //             if(n && n > n8) {n = n8; o=7}
    //             try{n1=this.parent.grids[0][x-1][y+1].ph;if(n1==undefined || n1<0)n1 = null;else if(n8>0)n1=n1*e+(1-e)*this.parent.grids[0][x-1][y+1].know}catch{var n1 = null;}   
    //             if(n && n > n1) {n = n1; o=0}
    //             try{n2=this.parent.grids[0][x][y+1].ph;if(n2==undefined || n2<0)n2 = null;else if(n8>0)n2=(n2*e+(1-e)*this.parent.grids[0][x][y+1].know)*0.95}catch{var n2 = null;}
    //             if(n && n > n2) {n = n2; o=1}
    //             break
    //         case 2:
    //             try{n1=this.parent.grids[0][x-1][y+1].ph;if(n1==undefined || n1<0)n1 = null;else if(n8>0)n1=(n1*e+(1-e)*this.parent.grids[0][x-1][y+1].know)*0.95}catch{var n1 = null;}
    //             if(n && n > n1) {n = n1; o=0}
    //             try{n2=this.parent.grids[0][x][y+1].ph;if(n2==undefined || n2<0)n2 = null;else if(n8>0)n2=n2*e+(1-e)*this.parent.grids[0][x][y+1].know}catch{var n2 = null;}
    //             if(n && n > n2) {n = n2; o=1}
    //             try{n3=this.parent.grids[0][x+1][y+1].ph;if(n3==undefined || n3<0)n3 = null;else if(n8>0)n3=(n3*e+(1-e)*this.parent.grids[0][x+1][y+1].know)*0.95}catch{var n3 = null;}
    //             if(n && n > n3) {n = n3; o=2}
    //             break
    //         case 3:
    //             try{n2=this.parent.grids[0][x][y+1].ph;if(n2==undefined || n2<0)n2 = null;else if(n8>0)n2=(n2*e+(1-e)*this.parent.grids[0][x][y+1].know)*0.95}catch{var n2 = null;}
    //             if(n && n > n2) {n = n2; o=1}
    //             try{n3=this.parent.grids[0][x+1][y+1].ph;if(n3==undefined || n3<0)n3 = null;else if(n8>0)n3=n3*e+(1-e)*this.parent.grids[0][x+1][y+1].know}catch{var n3 = null;}
    //             if(n && n > n3) {n = n3; o=2}
    //             try{n4=this.parent.grids[0][x+1][y].ph;if(n4==undefined || n4<0)n4 = null;else if(n8>0)n4=(n4*e+(1-e)*this.parent.grids[0][x+1][y].know)*0.95}catch{var n4 = null;}
    //             if(n && n > n4) {n = n4; o=3}
    //             break
    //         case 4:
    //             try{n3=this.parent.grids[0][x+1][y+1].ph;if(n3==undefined || n3<0)n3 = null;else if(n8>0)n3=(n3*e+(1-e)*this.parent.grids[0][x+1][y+1].know)*0.95}catch{var n3 = null;}
    //             if(n && n > n3) {n = n3; o=2}
    //             try{n4=this.parent.grids[0][x+1][y].ph;if(n4==undefined || n4<0)n4 = null;else if(n4>0)n4=n4*e+(1-e)*this.parent.grids[0][x+1][y].know}catch{var n4 = null;}
    //             if(n && n > n4) {n = n4; o=3}
    //             try{n5=this.parent.grids[0][x+1][y-1].ph;if(n5==undefined || n5<0)n5 = null;else if(n5>0)n5=(n5*e+(1-e)*this.parent.grids[0][x+1][y-1].know)*0.95}catch{var n5 = null;}
    //             if(n && n > n5) {n = n5; o=4}
    //             break
    //         case 5:
    //             try{n4=this.parent.grids[0][x+1][y].ph;if(n4==undefined || n4<0)n4 = null;else if(n4>0)n4=(n4*e+(1-e)*this.parent.grids[0][x+1][y].know)*0.95}catch{var n4 = null;}
    //             if(n && n > n4) {n = n4; o=3}
    //             try{n5=this.parent.grids[0][x+1][y-1].ph;if(n5==undefined || n5<0)n5 = null;else if(n5>0)n5=n5*e+(1-e)*this.parent.grids[0][x+1][y-1].know}catch{var n5 = null;}
    //             if(n && n > n5) {n = n5; o=4}
    //             try{n6=this.parent.grids[0][x][y-1].ph;if(n6==undefined || n6<0)n6 = null;else if(n6>0)n6=(n6*e+(1-e)*this.parent.grids[0][x][y-1].know)*0.95}catch{var n6 = null;}
    //             if(n && n > n6) {n = n6; o=5}
    //             break
    //         case 6:
    //             try{n5=this.parent.grids[0][x+1][y-1].ph;if(n5==undefined || n5<0)n5 = null;else if(n5>0)n5=(n5*e+(1-e)*this.parent.grids[0][x+1][y-1].know)*0.95}catch{var n5 = null;}
    //             if(n && n > n5) {n = n5; o=4}
    //             try{n6=this.parent.grids[0][x][y-1].ph;if(n6==undefined || n6<0)n6 = null;else if(n6>0)n6=n6*e+(1-e)*this.parent.grids[0][x][y-1].know}catch{var n6 = null;}
    //             if(n && n > n6) {n = n6; o=5}
    //             try{n7=this.parent.grids[0][x-1][y-1].ph;if(n7==undefined || n7<0)n7 = null;else if(n7>0)n7=(n7*e+(1-e)*this.parent.grids[0][x-1][y-1].know)*0.95}catch{var n7 = null;}
    //             if(n && n > n7) {n = n7; o=6}
    //             break
    //         case 7:
    //             try{n6=this.parent.grids[0][x][y-1].ph;if(n6==undefined || n6<0)n6 = null;else if(n6>0)n6=(n6*e+(1-e)*this.parent.grids[0][x][y-1].know)*0.95}catch{var n6 = null;}
    //             if(n && n > n6) {n = n6; o=5}
    //             try{n7=this.parent.grids[0][x-1][y-1].ph;if(n7==undefined || n7<0)n7 = null;else if(n7>0)n7=n7*e+(1-e)*this.parent.grids[0][x-1][y-1].know}catch{var n7 = null;}
    //             if(n && n > n7) {n = n7; o=6}
    //             try{n8=this.parent.grids[0][x-1][y].ph;if(n8==undefined || n8<0)n8 = null;else if(n8>0)n8=(n8*e+(1-e)*this.parent.grids[0][x-1][y].know)*0.95}catch{var n8 = null;}
    //             if(n && n > n8) {n = n8; o=7}
    //             break
    //         case 8:
    //             try{n7=this.parent.grids[0][x-1][y-1].ph;if(n7==undefined || n7<0)n7 = null;else if(n7>0)n7=(n7*e+(1-e)*this.parent.grids[0][x-1][y-1].know)*0.95}catch{var n7 = null;}
    //             if(n && n > n7) {n = n7; o=6}
    //             try{n8=this.parent.grids[0][x-1][y].ph;if(n8==undefined || n8<0)n8 = null;else if(n8>0)n8=n8*e+(1-e)*this.parent.grids[0][x-1][y].know}catch{var n8 = null;}
    //             if(n && n > n8) {n = n8; o=7}
    //             try{n1=this.parent.grids[0][x-1][y+1].ph;if(n1==undefined || n1<0)n1 = null;else if(n1>0)n1=(n1*e+(1-e)*this.parent.grids[0][x-1][y+1].know)*0.95}catch{var n1 = null;}
    //             if(n && n > n1) {n = n1; o=0}
    //             break
    //         default:
    //             try{n1=this.parent.grids[0][x-1][y+1].ph;if(n1==undefined || n1<0)n1 = null;else if(n1>0)n1=(n1*e+(1-e)*this.parent.grids[0][x-1][y+1].know)*0.95}catch{var n1 = null;}
    //             try{n2=this.parent.grids[0][x][y+1].ph;if(n2==undefined || n2<0)n2 = null;else if(n2>0)n2=n2*e+(1-e)*this.parent.grids[0][x][y+1].know}catch{var n2 = null;}
    //             try{n3=this.parent.grids[0][x+1][y+1].ph;if(n3==undefined || n3<0)n3 = null;else if(n3>0)n3=(n3*e+(1-e)*this.parent.grids[0][x+1][y+1].know)*0.95}catch{var n3 = null;}
    //             try{n4=this.parent.grids[0][x+1][y].ph;if(n4==undefined || n4<0)n4 = null;else if(n4>0)n4=n4*e+(1-e)*this.parent.grids[0][x+1][y].know}catch{var n4 = null;}
    //             try{n5=this.parent.grids[0][x+1][y-1].ph;if(n5==undefined || n5<0)n5 = null;else if(n5>0)n5=(n5*e+(1-e)*this.parent.grids[0][x+1][y-1].know)*0.95}catch{var n5 = null;}
    //             try{n6=this.parent.grids[0][x][y-1].ph;if(n6==undefined || n6<0)n6 = null;else if(n6>0)n6=n6*e+(1-e)*this.parent.grids[0][x][y-1].know}catch{var n6 = null;}
    //             try{n7=this.parent.grids[0][x-1][y-1].ph;if(n7==undefined || n7<0)n7 = null;else if(n7>0)n7=(n7*e+(1-e)*this.parent.grids[0][x-1][y-1].know)*0.95}catch{var n7 = null;}
    //             try{n8=this.parent.grids[0][x-1][y].ph;if(n8==undefined || n8<0)n8 = null;else if(n8>0)n8=n8*e+(1-e)*this.parent.grids[0][x-1][y].know}catch{var n8 = null;}
    //             if(n && n > n1) {n = n1; o=0}
    //             if(n && n > n2) {n = n2; o=1}
    //             if(n && n > n3) {n = n3; o=2}
    //             if(n && n > n4) {n = n4; o=3}
    //             if(n && n > n5) {n = n5; o=4}
    //             if(n && n > n6) {n = n6; o=5}
    //             if(n && n > n7) {n = n7; o=6}
    //             if(n && n > n8) {n = n8; o=7}
    //             break
    //     }
    //     let new_e = e
    //     let child = null 
    //     switch(o){
    //         case 0:
    //             child = this.parent.grids[0][x-1][y+1]
    //             next[0]-=1
    //             next[1]+=1
    //             break
    //         case 1:
    //             child = this.parent.grids[0][x][y+1]
    //             next[1]+=1
    //             break
    //         case 2:
    //             child = this.parent.grids[0][x+1][y+1]
    //             next[0]+=1
    //             next[1]+=1
    //             break
    //         case 3:
    //             child = this.parent.grids[0][x+1][y]
    //             next[0]+=1
    //             break
    //         case 4:
    //             child = this.parent.grids[0][x+1][y-1]
    //             next[0]+=1
    //             next[1]-=1
    //             break
    //         case 5:
    //             child = this.parent.grids[0][x][y-1]
    //             next[1]-=1
    //             break
    //         case 6:
    //             child = this.parent.grids[0][x-1][y-1]
    //             next[0]-=1
    //             next[1]-=1
    //             break
    //         case 7:
    //             child = this.parent.grids[0][x-1][y]
    //             next[0]-=1
    //             break
    //         default:
    //             child = this
    //             break
    //     } 
    //     if(this.know > e)
    //         new_e = e
    //     if(this.ph0 > child.ph0)
    //         this.know += e
    //     child.setpeople(this.id)
    //     child.ore = o
    //     this.people=-1
    //     this.ph=this.ph0
    //     this.ore = -1
    //     return [o, this.ph0, next[0], next[1], 481, new_e]
    // }
    // set_ext(ext){
    //     this.ext = ext
    //     if(ext < 100)
    //         this.child.forEach(function(e){
    //             if(e && e.ext>ext)
    //                 e.set_ext(ext+1)
    //         })
    // }
}