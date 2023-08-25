import {
    FileLoader,
    Group,
    InstancedMesh,
    LoadingManager,
    Matrix4,
    Vector3,
    MeshLambertMaterial
} from "./three/build/three";
import {ZipLoader} from "./ziploader";
import {GLTFLoader} from "./three/examples/jsm/loaders/GLTFLoader";
import $ from "jquery"
// import smatrix from '../config/smatrix.json'
// import structdesc from '../config/structdesc.json'
// window.smatrix=smatrix
// window.structdesc=structdesc
import matrixList from '../config/matrixList.json'

import {DynamicLoading}from "./DynamicLoading"
export class SceneManager{
    constructor(viewer){
        this.shell=[3465,2804,3547,2839,2949,3546,2816,3548,2500,2504,2488,3533,3097,3475,2795,2803,2951,3474,3539,3480,3489,2518,2515,2950,2896,2957,2806,2893,2805,2818,2807,2964,2815,2819,2895,2810,2812,2817,2828,2809,2808,2869,2892,2871,2880,2829,2830,2870,2833,2894,2814,2847,2963,2848,2859,2860,2813,2827,2811,2849,2842,2841,2822,2952,2889,2259,2858,3132,2883,2888,2891,2820,2543,2826,2887,2884,2879,3013,2890,2882,2821,2838,2886,2885,2876,2824,2881,2825,3014,2874,2835,3576,3485,2865,2878,2897,2868,2832,2831,2823,2877,3574,2875,2959,2520,2872,3575,2930,2873,730,2529,2113,3098,2854,3134,2396,2837,2834,2864,2836,2904,2846,2863,2903,3544,3541,2866,2845,3551,3550,2905,3133,3560,3120,2590,2519,3498,2502,2576,2867,3557,738,2962,3555,2565,3486,2486,3552,732,743,2397,741,2506,2899,2840,2045,2498,3534,3549,3559,2261,2857,2898,728,729,2852,3537,3131,3553,745,2900,2862,2861,2932,3490,2853,3122,2855,3556,744,3558,2538,3554,2494,3476,3112,2850,2499,3497,2041,2107,3542,2851,2941,2801,2843,2342,3492,2091,2561,2501,3535,726,2249,3506,3124,2484,2928,2910,2489,2105,2844,3527,3479,2907,2115,2487,2562,2856,2398,2938,2341,2415,2906,2935,2496,3543,2911,2539,2340,2505,2920,3287,2411,2559,3488,2575,2796,3477,2679,2585,2532,2921,2924,3123,2558,3536,3562,890,2038,737,2915,3005,2083,2082,3012,2516,2914,2037,2587,2100,2084,747,2925,2006,2594,2995,2112,3003,3487,2503,3011,3026,2598,829,2595,789,2584,2507,2572,380,2094,2522,2106,2909,2258,3028,2526,2416,3128,3419,1979,3318,2448,3006,2531,2262,3500,2940,2953,2797,2799,2410,2447,2544,3055,2931,3545,3507,3121,2521,2637,3505,3041,2276,2564,3572,3130,3418,2305,2749,2678,725,2497,2525,3129,2492,2939,3483,2567,2996,3481,1888,2103,2362,821,734,2104,2308,3275,2798,1651,2095,2509,173,2917,2523,2524,697,2927,2533,2948,2263,803,2441,748,3515,378,379,736,2220,167,2070,2937,1630,2101,3504,2569,2493,1195,2427,1231,2071,381,2215,2639,724,2298,2219,367,3540,1225,3001,3117,2517,2278,2216,154,3087,2093,2528,2668,1220,2926,2080,2154,2449,2264,2495,2912,3452,3493,2085,2087,2114,2636,2958,2536,2485,2578,2153,2975,3567,1978,826,2802,371,1232,2968,3276,2102,3127,3457,2946,2913,1163,2990,2291,1980,3569,3076,2908,805,3482,2748,196,176,698,2591,3564,2943,1557,3524,1161,2036,602,3259,3499,2542,1961,50,2638,3090,2344,1199,3088,181,2574,2954,2057,3263,2976,2944,2111,3484,2110,1893,827,2560,2527,2902,2982,2991,2148,3538,3563,175,3568,2156,2690,2765,3528,699,2597,824,1257,2936,2947,2423,2404,2424,2433,2403,840,3514,2425,2414,2432,2934,2439,2413,2431,2440,2409,2992,2092,2339,2557,2412,3102,2640,3532,2945,1477,3460,2033,3459,2260,2155,695,2275,2933,2360,1975,2086,2918,2783,2270,2784,1153,370,3561,164,2352,1049,2579,197,714,3513,2421,2435,2436,2406,3571,2420,2437,760,2407,3573,778,2438,2408,700,596,2401,2371,3496,2372,2426,2369,194,2363,2399,2430,2389,1991,2343,2929,1139,178,2742,2534,2566,2081,2117,3501,148,165,2667,2490,2422,2405,2434,1086,2011,2267,3526,128,3125,2442,2443,3570,2942,2956,2547,2955,2510,2993,1063,1138,259,1058,2483,2099,2400,2090,2381,2535,162,3126,376,2563,2054,2966,2923,3100,1223,897,2418,1930,475,2680,3432,712,3478,3525,2513,1159,1074,1171,1157,491,25,2108,1145,186,388,80,2361,2530,2568,2916,2596,2919,1586,2785,3079,790,3431,3454,3060,2035,2961,2012,751,2541,2789,882,557,2193,360,2007,2479,1077,1178,2469,3512,1147,158,592,77,2967,749,3022,2922,2277,1897,1166,2149,785,825,2271,1898,2089,123,510,2269,177,198,243,155,188,3508,115,2152,613,3021,1162,1007,3529,2994,1894,1988,2792,701,1054,2480,180,195,1191,163,2279,365,2008,185,390,3503,1955,3509,2116,2118,1227,2382,2097,1245,2464,1084,876,172,2014,2454,1896,1900,2465,2455,828,2021,2491,3530,2475,1174,2345,2205,532,1840,921,2009,19,199,29,368,1168,382,693,114,189,1966,3502,3511,3531,156,127,117,2350,120,124,2573,2370,2395,2062,2098,615,2986,614,842,735,595,1935,2419,525,174,2379,603,1925,2775,1889,2001,575,2508,64,883,135,1156,1920,911,166,169,484,159,1886,2031,1852,1921,694,1884,2476,2023,1969,361,385,1176,1964,1905,1971,78,2349,2348,860,2055,2359,2540,2385,2043,215,2050,2980,2383,716,2537,715,713,32,3104,3244,1611,938,1229,777,761,2088,1708,1899,2581,3347,2462,1902,711,1140,157,2478,2681,2452,168,3029,879,2446,1890,1881,2461,2477,576,874,1685,2460,2451,1433,2545,2472,1151,387,2450,1158,3083,2471,2470,129,145,1078,559,568,685,2032,1142,3510,182,214,233,896,1977,106,2473,2482,3002,3494,184,366,742,2218,203,1949,1970,132,2351,2337,83,386,2347,2056,480,2571,2047,147,372,2393,2392,2063,2384,1589,389,2096,1249,1218,1228,3491,3103,752,3238,3427,3428,3319,759,2620,567,844,843,1363,1202,601,779,1604,1605,1164,696,3046,1750,1587,3348,1976,1754,1928,1951,1172,2137,535,2109,266,873,2196,2474,160,3032,1892,3039,1895,2244,582,2512,273,1683,1144,1974,1836,121,2280,1903,566,1923,1146,1071,1774,1659,2030,1924,1887,3135,2481,1075,1148,1169,1883,1957,1967,3137,877,839,3138,1992,126,2787,179,498,3081,383,558,887,597,248,171,1179,538,539,1154,617,3267,1141,1185,1983,544,1878,490,241,804,1170,1048,2000,562,3520,891,1950,1175,2346,191,3495,1960,200,834,1972,364,201,2338,202,27,2017,2691,2356,369,2354,2355,2586,1331,1990,2367,130,2364,612,373,781,2394,2380,2019,2375,2378,2977,2049,2387,2388,2390,1579,1505,616,1251]
		

    	this.viewer = viewer
        this.projectName = window.projectName
        this.scene = window.scene
        this.camera = window.camera
        this.instanceGroup = new Group()
        this.scene.add(this.instanceGroup)
        this.matrixWorld = null

        this.visibleModelList = []

        
        this.loadingModelList = []
        this.toLoadModelList = []
        this.loadedModelList = []

        this.loaded_mesh = {}

        this.loadlimit = 20
        this.loading = false
        this.httping = false
        this.pre_camera_position = new Vector3()

        this.mesText1 = document.createElement("p")
        document.body.appendChild(this.mesText1)
        this.mesText1.style.position = "fixed"
        this.mesText1.style.left = 20+"px"
        this.mesText1.style.top = 0+"px"
        this.mesText1.style.fontSize = window.innerHeight/60+"px"
        // this.op = 1
        window.server_ip = "http://47.103.21.207"
        if(window.projectName==="HaiNing"){
            window.server_ip += ":4010"
            this.id = 1
        }else if(window.projectName==="KaiLiNan"){
            window.server_ip += ":4011"
            this.id = 2
        }else if(window.projectName==="LanQiao"){
            window.server_ip += ":4012"
            this.id = 3
        }else if(window.projectName==="QinLaiLi"){
            window.server_ip += ":4013"
            this.id = 4
        }else if(window.projectName==="RenFuYiYuan"){
            window.server_ip += ":4014"
            this.id = 5
        }else if(window.projectName==="XinYu"){
            window.server_ip += ":4015"
            this.id = 6
        }else if(window.projectName==="YunXi"){
            window.server_ip += ":4016"
            this.id = 7
        }
       

        // $.get(window.server_ip+"/matrixWorld",(data,status)=>{
        //     let m = JSON.parse(data)
        //     this.matrixWorld = new Matrix4().set(
        //         m[0],m[4],m[8],m[12],
        //         m[1],m[5],m[9],m[13],
        //         m[2],m[6],m[10],m[14],
        //         m[3],m[7],m[11],m[15])
        //     this.instanceGroup.applyMatrix4(this.matrixWorld)
        //     console.log(this.instanceGroup)
        // })

        this.matrixWorld = new Matrix4(); 
        this.matrixWorld.set( 
                0.017926,0,0,0,
                0, 0.017926,0,0,
                0,0,0.017926,0,
                22026.806641,2149.515381,224.10112,1
                );
        this.matrixWorld.transpose ()
        this.instanceGroup.applyMatrix4(this.matrixWorld)

        const self=this
        new DynamicLoading({
            "loading":i=>{
                self.loadModelZip(i)
            },
            "camera":window.camera,
            "meshes":this.loaded_mesh
        })
    }

    processLoadList(load_list){
        if(this.loading){
	  // 若还在加载中，更新待加载列表
            let new_to_load_list = []
            for(let i=0; i<load_list.length; i++){
                let ind = load_list[i]
                if(!this.loadingModelList.includes(ind) && !this.loadedModelList.includes(ind)){
                    new_to_load_list.push(ind)
                }
            }
            this.toLoadModelList = new_to_load_list
        }else{              // 若加载结束，更新加载列表和待加载列表
            let new_to_load_list = []
            for(let i=0; i<load_list.length; i++){
                let ind = load_list[i]
                if(i<this.loadlimit){
                    this.loadingModelList.push(ind)
                }else{
                    new_to_load_list.push(ind)
                }
            }
            this.toLoadModelList = new_to_load_list
            this.loading = true
            for(let i=0; i<this.loadingModelList.length; i++){
                this.loadModelZip(this.loadingModelList[i])
            }
        }
    }
    loadModelZip(index){
        if(!this.request)this.request={}
        if(this.request[index])return
        else this.request[index]=true
        var self = this
        var url = "assets/models/"+self.projectName+"/output"+index+".zip"
        var loader = new LoadingManager()
        new Promise(function(resolve,reject){
            new ZipLoader().load(url,()=>{
            },()=>{
                console.log("模型加载失败："+index)
                setTimeout(()=>{
                    self.loadModelZip(index)
                },1000*(0.5*Math.random()+1))
            }).then((zip)=>{
                loader.setURLModifier(zip.urlResolver)
                resolve(zip.find( /\.(gltf|glb)$/i ))
            })
        }).then(function(fileUrl){
            // new FileLoader(loader).load("blob:assets/models/"+self.projectName+"/matrix"+index+".json",json=>{
                // var matrix = JSON.parse(json)
                
                // const name=structdesc[index][0].n;
                // const it=smatrix[name].it

                const matrix=matrixList[index]//it//[]
                new GLTFLoader(loader).load(fileUrl[0], (gltf)=>{
                    var mesh = gltf.scene.children[0].children[0]
                    self.addInsModel(matrix,mesh)
                })
            // })
        })
    }
    addInsModel(matrix,mesh){
        if(this.loaded_mesh[index])return
        let index = mesh.name
        matrix.push([1,0,0,0,0,1,0,0,0,0,1,0])
        let matrix4List = []
        for(let j=0; j<matrix.length; j++){
            let mat = matrix[j]
            matrix4List.push(new Matrix4().set(
                mat[0], mat[1], mat[2], mat[3],
                mat[4], mat[5], mat[6], mat[7],
                mat[8], mat[9], mat[10], mat[11],
                0, 0, 0, 1))
        }
        mesh.material.transparent = false//true
        // console.log(mesh.material.side)
        mesh.material.side = 0//2
        let instance_mesh = processMesh(mesh,matrix4List)
        window.instanceGroup=this.instanceGroup
        this.instanceGroup.add(instance_mesh)
        this.loaded_mesh[index] = instance_mesh

        instance_mesh.isShell=false
		for(let ii0000=0;ii0000<this.shell.length&&ii0000<250;ii0000++)
			if(this.shell[ii0000]===index)
                instance_mesh.isShell=true
				
    }
}

function processMesh(mesh,matrixList){
    // return mesh
    const material=new MeshLambertMaterial()
    material.side=0
    material.transparent=false
    material.color=mesh.material.color
    mesh.material=material
    mesh.geometry.computeVertexNormals()
    var instancedMesh = new InstancedMesh(mesh.geometry, mesh.material, matrixList.length)
    instancedMesh.geometry.clearGroups()
    // instancedMesh.geometry.addGroup(0, mesh.geometry.index.array.length)
    instancedMesh.instanceMatrix.needsUpdate=true
    for(let i=0; i<matrixList.length; i++){
        var instanceMatrix = matrixList[i]
        instancedMesh.setMatrixAt(i, instanceMatrix)
    }
    return instancedMesh
}
class Test{
    constructor(){
        this.test1()
    }
    test1(){
        const matrixList=[]
        for(let index=0;index<structdesc.length;index++){
            const name=structdesc[index][0].n;
            const it=smatrix[name].it
            matrixList.push(it)
        }
        this.saveJson(matrixList,"matrixList.json")
    }
    saveJson(data,name){
        const jsonData = JSON.stringify(data);//JSON.stringify(data, null, 2); // Convert JSON object to string with indentation
        
        const myBlob = new Blob([jsonData], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(myBlob)
        link.download = name
        link.click()
    }
}
// new Test()