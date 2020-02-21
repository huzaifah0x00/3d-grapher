var eq_input_count = 0
import  './node_modules/evaluatex/dist/evaluatex.min.js'

import  {make_and_add_graph_to_scene} from './graph.js'

var func = evaluatex('x^2+1^2');
console.log(func({x:1, y:2}));

function change_to_asciimath(){
    return
    if (this.value[0] != '`'){
        this.value = '`'+this.value+'`';
    }
}


export function create_equation_form() {
    var _disable_enter = function(event) {
      if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("make_graph_btn").click();
      }
    }

    if (! document.querySelector('#equations_form')){
        var equations_form = document.createElement('form');
        equations_form.id = "equations_form" ;
        equations_form.className = "col-sm-3" ;
        equations_form.addEventListener("keydown", _disable_enter);
        var main_row_div = document.querySelector('#main_row_div');

        main_row_div.insertBefore(equations_form, main_row_div.firstChild);
        // main_row_div.appendChild(equations_form);
        // document.body.appendChild(equations_form);
    }
    else{
        var equations_form = document.querySelector("#equations_form");
    }

    make_graph_btn = equations_form.querySelector('#make_graph_btn') ; 
    if (! make_graph_btn) {
        var make_graph_btn = document.createElement('button');
        // make_graph_btn.type = "submit";
        make_graph_btn.type = "button";
        make_graph_btn.className = "btn btn-primary";
        make_graph_btn.id = "make_graph_btn";
        
        make_graph_btn.addEventListener("click", make_graph, false);
        // make_graph_btn.onclick = "alert();";
        make_graph_btn.textContent = "Graph";
        equations_form.appendChild(make_graph_btn); // put it into the DOM
    }
    {
        var equation_div = document.createElement("div");
        equation_div.className = "form-group row";

        var equation_input = document.createElement("input");
        equation_input.type = "text";
        equation_input.className = "col-sm form-control"; // set the CSS class
        equation_input.name = "equation_" + eq_input_count;
        equation_input.id = "equation_input" + eq_input_count;
        equation_input.placeholder="f(x,y,z)"

        // equation_input.onchange = change_to_asciimath
        eq_input_count += 1 ;


        var equation_label = document.createElement("label");
        equation_label.textContent = eq_input_count+":";
        equation_label.for = equation_input.name ;
        equation_label.className = "col-sm-2 col-form-label"
        
        equation_div.appendChild(equation_label);
        equation_div.appendChild(equation_input);
        equations_form.insertBefore(equation_div, make_graph_btn); // put it into the DOM
    }
}


var evaluatex_funcs = [];

var make_graph = function(){
    // TODO: GET THESE VALUES FROM AN INPUT ON THE WEBAPP
    var start_x=-5, end_x=5, start_z=-5, end_z=5;
    var x_step=0.1, z_step=0.1;

    var input_equations = document.querySelectorAll('input[id^="equation_input"')
    for (var i = input_equations.length - 1; i >= 0; i--) 
    {
        if(input_equations[i].value){
            evaluatex_funcs.push(
                evaluatex(input_equations[i].value)  // assumes x,y variables TODO: FIX THIS..
            ); 

        }
    }
    var data_points

    evaluatex_funcs.forEach(function(ex_func){
        data_points = create_data_points(ex_func, start_x, end_x, start_z, end_z, x_step, z_step)
        console.log("pltotting func: " + ex_func);
        make_and_add_graph_to_scene(data_points)
    })
}

function create_data_points(
        f,
        start_x, end_x, start_z, end_z,  // start and end input numbers
        x_step, z_step,  // steps to take from start_ to end_  (increase this for higher resolution graph.)
        variables={x:null,z:null}  // variables for evaluatex
    )
{
    var data_points = [] // a 2d array of [x,y,z] values i.e: [[x1,y1,z1],[x2,y2,z2]...]
    var y_max = 0, y_min=0;
    var x,y,z;
    var data_points = [];

    for (var x = start_x; x <= end_x; x += x_step){
        for (var z = start_z; z<= end_z; z += z_step){
            y = f({x:x, z:z});
            data_points.push([x,y,z]);
        }
    }
    return data_points;
}

