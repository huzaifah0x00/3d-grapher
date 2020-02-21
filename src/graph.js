import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import * as THREE from './node_modules/three/build/three.module.js';

var scene, renderer, camera, controls;
var x_axis_line, y_axis_line, z_axis_line

const VertexShader = `
    varying vec3 vColor;
    uniform float z_max;
    uniform float z_min;

    // Smooth HSV to RGB conversion 
    vec3 hsv2rgb_smooth( in vec3 c )
    {
        vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
        rgb = rgb*rgb*(3.0-2.0*rgb); // cubic smoothing 
        return c.z * mix( vec3(1.0), rgb, c.y);
    }
    vec3 hsv2rgb( in vec3 c )
    {
        vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
        return c.z * mix( vec3(1.0), rgb, c.y);
    }
    void main()
    {
        vec3 top = vec3(1.0, 0.0, 0.0); //red
        vec3 middle = vec3(0.0, 1.0, 0.0); //green
        vec3 bottom = vec3(0.0, 0.0, 1.0); //blue

        float h = 1.0/3.0;
        float h2 = 2.0/3.0;
        vec3 black = vec3(0.0, 0.0, 0.0);


        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vColor = vec3(1,1,1);

        // vec3 hsl = vec3()
        if (worldPosition.y > (z_max-abs(z_min))/2.0 ){
            vColor = mix(middle, top, ((worldPosition.y/(z_max))));
        }

        else if (worldPosition.y < (z_max-abs(z_min))/2.0 ){
            vColor = mix(middle, bottom, -((worldPosition.y/(z_max))));
        }
        else if (worldPosition.y == (z_max-abs(z_min))/2.0 ){
            vColor = mix(middle, middle, -((worldPosition.y/(z_max))));
        }
        else{
            vColor = black;
        }

        gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
`;
const FragmentShader = `
    precision mediump float;
    varying vec3 vColor;
    void main()
    {
        gl_FragColor = vec4(vColor, 1.0);
    }
`

function createGraph(data_points_arr)
{
    /*takes a list(e.g from multiple functions) of "data_points"(in format [[x,y,z],...]) */

    var graphMeshes = [];
    data_points_arr.forEah(function(data_points){
        graphMeshes.push(
            create_graphmesh_from_datapoints(data_points)
        );

    })
    return graphMeshes
}

export function make_and_add_graph_to_scene(data_points)
{
    // this function assumes that the data_points is a list of points in the [x,y,z] format sorted by x (important)
    var vertices = [];
    var faces = [];
    var faces_row = [];
    var edgeloop_prev = [];
    var edgeloop_cur = [];
    var x,z,y;  //
    var last_x = data_points[0][0];
    var y_max = data_points[0][1]; //set y_max to a random point in the dataset
    var y_min = data_points[0][1]; //set y_max to a random point in the dataset

    var scale_vec = new THREE.Vector3(1, 1, 1) // TODO: 

    data_points.forEach(function(point){
        // add every point on graphmesh
        if (last_x != point[0]){
            edgeloop_prev = edgeloop_cur;
            edgeloop_cur = []
        }

        if (point[1] > y_max){ // there's probably a better way of doing this.without polluting the for loop
            y_max = point[1];
        }
        if (point[1] < y_min){
            y_min = point[1];
        }

        edgeloop_cur.push(vertices.length||0);
        vertices.push( new THREE.Vector3(...point))
        last_x = point[0];

        if (edgeloop_prev.length > 0){
            faces_row = createFaces( edgeloop_prev, edgeloop_cur );
            faces.push(...faces_row) ;
        }
    })

    console.log("range:")
    console.log(y_max, y_min);

    var resolution = new THREE.Vector2(window.innerWidth,window.innerHeight);
    console.log(resolution);
    console.log("y_max"+y_max);
    console.log("y_min"+y_min);
    var uniforms = {
        iResolution: {value: resolution},
        z_max : {value : y_max},
        z_min : {value : y_min},
    }
    var graphMaterial = new THREE.ShaderMaterial(
    {
        uniforms : uniforms,
        vertexShader: VertexShader,
        fragmentShader: FragmentShader,
        side: THREE.DoubleSide,
    }
    )

    var graphGeometry = new THREE.Geometry();
    graphGeometry.vertices.push(...vertices);
    graphGeometry.faces.push(...faces);
    graphGeometry.computeBoundingBox();
    graphGeometry.computeFaceNormals();
    graphGeometry.computeVertexNormals();

    var graphMesh = new THREE.Mesh( graphGeometry, graphMaterial);

    // SHOW POINTS ON GRPAH
    // var pointsmaterial = new THREE.PointsMaterial({color:"rgb(255,0,0)", size:5})
    // var pointsmesh = new THREE.Points(graphGeometry.clone(), pointsmaterial);
    // scene.add(pointsmesh);
    // SHOW POINTS ON GRPAH

    // var indexesMode1 = 0 // face    //  mode: 0 nothing, 1 vertex, 2 face, 3 vertex & face
    // size = 0.1;
    // color = "rgb(255,0,0)";

    // var vertexFaceNumbersHelper1 = new vertexFaceNumbersHelper( graphMesh, indexesMode1, size, color );
    // vertexFaceNumbersHelper1.update( indexesMode1 );
    // var graphMesh = create_mesh_object( vertices, [], faces, y_max, y_min)

    // WIREFRAME
    var wireframe = new THREE.WireframeGeometry( graphGeometry );
    var line = new THREE.LineSegments( wireframe);
    line.material.color = new THREE.Color("rgb(0,0,0)");
    line.material.depthTest = false;
    line.material.opacity = 0.05;
    line.material.transparent = true;
    scene.add( line );
    // WIREFRAME



    

    // graphMesh.doubleSided = true;
    // var loader = new THREE.FontLoader();
    // loader.load( 'static/fonts/helvetiker_regular.typeface.json', function ( font ) {
    //     var textmeshes = []
    //     var total = vertices.length
    //     for (var i = vertices.length - 1; i >= 0; i--) {
    //         var cords = vertices[i].x+", "+vertices[i].y+", "+vertices[i].z;
            
    //         var textgeometry = new THREE.TextGeometry( cords, {
    //             font: font,
    //             size: 0.1,
    //             height: 0,
    //             depth: 0.1,
    //         } );
    //         var textmesh = new THREE.Mesh(textgeometry);
    //         textmesh.position.set(...vertices[i].toArray())
    //         textmeshes.push(textmesh);
    //         graphMesh.add(textmesh)
    //     }
    // } );

    scene.add(graphMesh)
    return graphMesh;
}


function createFaces(vertIdx1, vertIdx2, closed=false, flipped=false){
    var faces = []
    // console.log(vertIdx1, vertIdx2);
    if (! vertIdx1 || ! vertIdx2){
        return [];
    }

    if (vertIdx1.length < 2 && vertIdx2.length < 2){
        return [];
    }

    var fan = false  ;  // what is this ?
    if (vertIdx1.length != vertIdx2.length){
        if (vertIdx1.length == 1 && vertIdx2.length > 1){
            fan = true;
        }
        else{
            return [];
        }
    }

    var total = vertIdx2.length;

    // Bridge the rest of the faces
    for (var num=0;num<total-1;num++){
        if(flipped){
            if (fan){
                var face = new THREE.Face3(vertIdx2[num], vertIdx1[0], vertIdx2[num+1] );
                faces.push(face) ; 
            }
            else{
                var face_1 = new THREE.Face3( vertIdx1[num], vertIdx1[num+1], vertIdx2[num]  )
                var face_2 = new THREE.Face3( vertIdx2[num+1], vertIdx2[num], vertIdx1[num+1]  )
                faces.push(...[face_1, face_2]);
            }
        }
        else{
            if ( fan ){
                var face = new THREE.Face3(vertIdx1[0], vertIdx2[num], vertIdx2[num+1] );
                faces.push(face) ; 
            }
            else{
                var face_1 = new THREE.Face3( vertIdx1[num], vertIdx1[num+1], vertIdx2[num]  )
                var face_2 = new THREE.Face3( vertIdx2[num+1], vertIdx2[num], vertIdx1[num+1]  )
                faces.push(...[face_1, face_2]);
            }
        }
    }
    return faces;
}

function axes_lines(){
    // var axes_size_start  = 0;
    // var axes_size_end  = ( camera.position.x + camera.position.y + camera.position.z ) / 3.0;
    var axes_size_start  = -10;
    var axes_size_end  = 100;

    var line_width = 200 ;

    var x_axis_material = new THREE.LineBasicMaterial( 
    { 
        color: 0xff0000,
        linewidth: line_width,
    } 
    );
    x_axis_material.depthWrite = false;
    var x_axis_geometry = new THREE.Geometry();

    x_axis_geometry.vertices.push( new THREE.Vector3( axes_size_start, 0, 0 ))
    x_axis_geometry.vertices.push( new THREE.Vector3( axes_size_end, 0, 0 ))
    var x_axis_line = new THREE.Line( x_axis_geometry, x_axis_material );

    var y_axis_material = new THREE.LineBasicMaterial( 
    { 
        color: 0x00ff00,
        linewidth: line_width,
    } 
    );
    y_axis_material.depthWrite = false;
    var y_axis_geometry = new THREE.Geometry();

    y_axis_geometry.vertices.push( new THREE.Vector3( 0, axes_size_start, 0 ))
    y_axis_geometry.vertices.push( new THREE.Vector3( 0, axes_size_end, 0 ))
    var y_axis_line = new THREE.Line( y_axis_geometry, y_axis_material );

    var z_axis_material = new THREE.LineBasicMaterial( 
    { 
        color: 0x0000ff,
        linewidth: line_width,
    } 
    );
    z_axis_material.depthWrite = false;
    var z_axis_geometry = new THREE.Geometry();

    z_axis_geometry.vertices.push( new THREE.Vector3( 0, 0, axes_size_start ))
    z_axis_geometry.vertices.push( new THREE.Vector3( 0, 0, axes_size_end ))
    var z_axis_line = new THREE.Line( z_axis_geometry, z_axis_material );

    return [x_axis_line, y_axis_line, z_axis_line];
}

function setup_scene(canvas=null){
    if (!canvas){
        var canvas = document.querySelector('#threejs_canvas')
    }
    var computedStyle = getComputedStyle(canvas);
    var canvasHeight = canvas.clientHeight;  // height with padding
    var canvasWidth = canvas.clientWidth;   // width with padding

    canvasWidth -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    canvasHeight -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);

    var scene = new THREE.Scene();
    var FOV = 75;
    var ASPECT_RATIO = canvasWidth / canvasHeight;
    // var camera = new THREE.PerspectiveCamera( FOV, ASPECT_RATIO, 0.1, 1000)
    // var camera = new THREE.OrthographicCamera( -100,100,100,-100, 0.1, 1000 );
    var camera = new THREE.OrthographicCamera( 5000 / - 2, 5000 / 2, 5000 / 2, 5000 / - 2, -100, 10000 );
    camera.zoom = 500.5;
    camera.updateProjectionMatrix();

    var renderer = new THREE.WebGLRenderer({canvas: canvas});
    renderer.setSize( canvasWidth, canvasHeight);
    // renderer.setSize( window.innerWidth, window.innerHeight);
    // renderer.domElement.className = 'col-sm-8';
    // document.body.appendChild( renderer.domElement );

    // things that don't belong here...

    var axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );

    var controls = new OrbitControls( camera, renderer.domElement );
    // controls.mouseButtons.RIGHT = null;  // disable pan
    controls.enableDamping = true ;
    return [scene, camera, renderer, controls]

}


var onCameraChange = function(){
        // console.log("camera changed " + camera.position);
        // x_axis_line.geometry.vertices[1].x = camera.position.x;
        // y_axis_line.geometry.vertices[1].y = camera.position.y;
        // z_axis_line.geometry.vertices[1].z = camera.position.z;

        // x_axis_line.geometry.verticesNeedUpdate = true;
        // y_axis_line.geometry.verticesNeedUpdate = true;
        // z_axis_line.geometry.verticesNeedUpdate = true;


}
function init(){
    [scene, camera, renderer, controls] = setup_scene();
    controls.addEventListener("change", onCameraChange);
    // [x_axis_line, y_axis_line, z_axis_line] = axes_lines();

    camera.position.set(5, 5, 5);
    camera.lookAt( 0, 0, 0 );

    // scene.add( x_axis_line );
    // scene.add( y_axis_line );
    // scene.add( z_axis_line );

    var size = 10;
    var divisions = 10;
    var gridHelper = new THREE.GridHelper( size, divisions );
    scene.add( gridHelper );

}


function animate(){
    requestAnimationFrame( animate );
    controls.update();
    renderer.render( scene, camera );
}

init();
animate();
