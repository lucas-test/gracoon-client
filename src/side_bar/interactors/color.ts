import { BoardElementType } from "../../board/board";
import { ClientGraph } from "../../board/graph";
import { CanvasCoord } from "../../board/canvas_coord";
import { DOWN_TYPE } from "../../interactors/interactor";
import { key_states, last_down, last_down_index } from "../../interactors/interactor_manager";
import { local_board } from "../../setup";
import { ORIENTATION_INFO } from "../element_side_bar";
import { InteractorV2 } from "../interactor_side_bar";
import BASIC_COLORS from '../../basic_colors.json';

export const color_interactorV2 = new InteractorV2("color", "Edit colors", "c", ORIENTATION_INFO.RIGHT, "color", 'url("../img/cursors/color.svg"), auto', new Set([DOWN_TYPE.VERTEX, DOWN_TYPE.LINK, DOWN_TYPE.STROKE]));

// Local variables
export let color_selected = "gray";
const colors_available = new Array();

for ( const name in BASIC_COLORS){
    colors_available.push(name)
}

// Color picker HTML div
const color_picker_div = document.createElement("div");
color_picker_div.id = "color_picker";
document.body.appendChild(color_picker_div);

// Color picker input HTML input
const color_picker_input = document.createElement("input");
color_picker_input.classList.add("color_picker_input");
color_picker_input.type = "color";
color_picker_input.onchange = (() => {
    color_selected = color_picker_input.value;
    colors_available.push(color_selected);
    add_available_color(color_selected);
    update_selected_available_color();
});
color_picker_div.onmouseleave = ((e) => {
    move_back_color_picker_div();
});
//color_picker_div.appendChild(color_picker_input); // color_picker_input DISABLED

for (const basic_color of colors_available) {
    add_available_color(basic_color);
}
update_selected_available_color()

function turn_on_color_picker_div() {
    color_picker_div.style.display = "block";
    color_picker_div.style.opacity = "1";
}

function turn_off_color_picker_div() {
    color_picker_div.style.opacity = "0";
    setTimeout(() => { color_picker_div.style.display = "none" }, 200);
}

function move_back_color_picker_div() {
    const color_interactor_div = document.getElementById(color_interactorV2.id);
    const offsets = color_interactor_div.getBoundingClientRect();
    color_picker_div.style.top = String(offsets.top) + "px";
    color_picker_div.style.left = "70" + "px";
}


function add_available_color(color_name) {
    const color_div = document.createElement("div");
    color_div.id = "color_choice_" + color_name;
    color_div.classList.add("color_choice");
    color_div.style.backgroundColor = BASIC_COLORS[color_name].dark;
    color_div.onclick = () => {
        color_selected = color_name;
        update_selected_available_color();
        move_back_color_picker_div();
    }
    color_picker_div.appendChild(color_div);
}

function update_selected_available_color() {
    Array.from(document.getElementsByClassName("color_choice")).forEach(color_div => {
        if (color_div instanceof HTMLElement) {
            if (color_div.id == "color_choice_" + color_selected) {
                color_div.classList.add("selected");
            }
            else {
                color_div.classList.remove("selected");
            }
        }
    });
}

function select_next_color() {
    for (let i = 0; i < colors_available.length; i++) {
        const color = colors_available[i];
        if (color == color_selected) {
            if (i == colors_available.length - 1) {
                color_selected = colors_available[0];
            }
            else {
                color_selected = colors_available[i + 1];
            }
            update_selected_available_color()
            return;
        }
    }
}

function select_previous_color() {
    for (let i = 0; i < colors_available.length; i++) {
        const color = colors_available[i];
        if (color == color_selected) {
            if (i == 0) {
                color_selected = colors_available[colors_available.length-1];
            }
            else {
                color_selected = colors_available[i - 1];
            }
            update_selected_available_color()
            return;
        }
    }
}


// Interactors methods

color_interactorV2.trigger = (mouse_pos: CanvasCoord) => {
    turn_on_color_picker_div();
    move_back_color_picker_div();
    if (color_picker_div.style.display == "block") {
        if (key_states.get("Shift")){
            select_previous_color();
        } else {
            select_next_color();
        }
       
    }
}

color_interactorV2.onleave = () => {
    turn_off_color_picker_div();
}


color_interactorV2.mousedown = (( canvas, ctx, g: ClientGraph, e: CanvasCoord) => {
    if (last_down == DOWN_TYPE.VERTEX) {
        if ( g.vertices.has(last_down_index) && g.vertices.get(last_down_index).data.color != color_selected){
            // const data_socket = new Array();
            // data_socket.push({ type: "vertex", index: last_down_index, color: color_selected });
            local_board.emit_update_element( BoardElementType.Vertex, last_down_index, "color", color_selected);
        }
    }
    else if (last_down == DOWN_TYPE.LINK){
        if ( g.links.has(last_down_index) && g.links.get(last_down_index).data.color != color_selected){
            local_board.emit_update_element( BoardElementType.Link,last_down_index, "color", color_selected);
        }
    }
    else if (last_down == DOWN_TYPE.STROKE){
        if ( local_board.strokes.has(last_down_index) && local_board.strokes.get(last_down_index).color != color_selected){
            local_board.emit_update_element( BoardElementType.Stroke,last_down_index, "color", color_selected);
        }
    }
})


color_interactorV2.mousemove = ((canvas, ctx, g: ClientGraph, e: CanvasCoord) => {
    if (last_down != null) {
        const elt = local_board.get_element_nearby(e, color_interactorV2.interactable_element_type);
        if (elt.type == DOWN_TYPE.VERTEX) {
            if ( g.vertices.has(elt.index) && g.vertices.get(elt.index).data.color != color_selected){
                local_board.emit_update_element( BoardElementType.Vertex, elt.index, "color", color_selected);

            }
            return true;
        }
        else if (elt.type == DOWN_TYPE.LINK) {
            if ( g.links.has(elt.index) && g.links.get(elt.index).data.color != color_selected){
                local_board.emit_update_element( BoardElementType.Link, elt.index, "color", color_selected);
            }
            return true;
        }
        else if (elt.type == DOWN_TYPE.STROKE){
            if ( local_board.strokes.has(elt.index) && local_board.strokes.get(elt.index).color != color_selected){
                local_board.emit_update_element( BoardElementType.Stroke, elt.index, "color", color_selected);
            }
        }
        return false;
    }
})


