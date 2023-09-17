/*

INTERACTOR CONTROL POINT

Features :
- click on link: create a control point on the middle
- click and move on a control point: move it. With Control Key pressed: aligned on the mediatrice of the link
- right click on a control point: remove it

*/


import { Vect } from "gramoloss";
import { BoardElementType, ClientBoard } from "../../board/board";
import { CanvasVect } from "../../board/vect";
import { CanvasCoord } from "../../board/canvas_coord";
import { DOWN_TYPE } from "../../interactors/interactor";
import { down_coord, last_down, last_down_index, mouse_buttons } from "../../interactors/interactor_manager";
import { ORIENTATION_INFO } from "../element_side_bar";
import { InteractorV2 } from "../interactor_side_bar";


export function createControlPointInteractor(board: ClientBoard){

    const control_point_interactorV2 = new InteractorV2(board, "control_point", "Edit control points", "h", ORIENTATION_INFO.RIGHT, "control_point", "default", new Set([DOWN_TYPE.LINK, DOWN_TYPE.CONTROL_POINT]));

    let previous_shift: Vect = new Vect(0,0);
    let previous_canvas_shift = new CanvasVect(0,0);
    
    control_point_interactorV2.mousedown = ((board: ClientBoard, e: CanvasCoord) => {
        previous_shift = new Vect(0,0);
        previous_canvas_shift = new CanvasVect(0,0);
        switch (last_down) {
            case DOWN_TYPE.LINK:{
                const link = board.graph.links.get(last_down_index);
                if (typeof link.data.cp == "undefined"){
                    const v1 = link.startVertex;
                    const v2 = link.endVertex;
                    const new_cp = v1.data.pos.middle(v2.data.pos);
                    board.emit_update_element( BoardElementType.Link, last_down_index, "cp", new_cp);
                }
            }
            case DOWN_TYPE.CONTROL_POINT: {
                if (mouse_buttons == 2){
                    board.emit_update_element( BoardElementType.Link, last_down_index, "cp", "");
                }
            }
        }
    })
    
    control_point_interactorV2.mousemove = ((board: ClientBoard, e: CanvasCoord) => {
        switch (last_down) {
            case DOWN_TYPE.CONTROL_POINT:{
                if ( board.graph.links.has(last_down_index)){
                    const link = board.graph.links.get(last_down_index);
                    if ( board.keyPressed.has("Control") ){
                        const v1 = link.startVertex;
                        const v2 = link.endVertex;
    
                        const middle = v1.data.pos.middle(v2.data.pos);
                        const vect = Vect.from_coords(v1.data.pos, v2.data.pos);
                        const orthogonal = new Vect(-vect.y, vect.x);
                        const e_coord = board.view.create_server_coord(e);
                        const projection = e_coord.orthogonal_projection(middle, orthogonal);
                        const down_coord_server = board.view.create_server_coord(down_coord);
    
                        const shift = Vect.from_coords(down_coord_server, projection);
                        board.emit_translate_elements([[BoardElementType.ControlPoint, last_down_index]], shift.sub(previous_shift));
                        previous_shift.set_from(shift);
                    } else {
                        const shift = board.view.server_vect(CanvasVect.from_canvas_coords(down_coord,e));
                        board.emit_translate_elements([[BoardElementType.ControlPoint, last_down_index]], shift.sub(previous_shift));
                        previous_shift.set_from(shift);
                    }
                }
                return false;
            }
        }
        return false;
    })
    
    
    
    return control_point_interactorV2;    
}
