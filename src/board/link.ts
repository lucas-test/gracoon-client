import { BasicLink, BasicLinkData, Coord, Option, ORIENTATION, Vect, Vertex } from "gramoloss";
import { BoardElementType } from "./board";
import { View } from "./camera";
import { CanvasVect } from "./vect";
import { ClientVertex, ClientVertexData } from "./vertex";
import { CanvasCoord } from "./canvas_coord";
import { initWeightDiv } from "./weightable";


export class LinkPreData extends BasicLinkData {
    startIndex: number;
    endIndex: number;
    orientation: ORIENTATION;

    constructor(startIndex: number, endIndex: number, orientation: ORIENTATION){
        super("", "black");
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.orientation = orientation;
    }
}

export class ClientLinkData extends BasicLinkData {
    cp_canvas_pos: CanvasCoord | string;
    is_selected: boolean;
    weightDiv: HTMLDivElement | undefined; // set to null until a non empty weight is used

    constructor(cp: Option<Coord>,  color: string, weight: string, view: View) {
        super(weight, color);
        if (typeof cp == "undefined"){
            this.cp_canvas_pos = "";
        } else {
            this.cp_canvas_pos = view.create_canvas_coord(cp);
        }
        this.is_selected = false;
        this.weightDiv = undefined;
    }
}




export class ClientLink extends BasicLink<ClientVertexData, ClientLinkData> {
    startVertex: ClientVertex;
    endVertex: ClientVertex;

   

    set_cp(new_cp: Coord, view: View){
        this.cp = new_cp;
        this.data.cp_canvas_pos = view.create_canvas_coord(new_cp);
    }

    is_in_rect(c1: CanvasCoord, c2: CanvasCoord) {
        //V1: is in rect if one of its extremities is in the rectangle
        //TODO: be more clever and select also when there is an intersection between the edge and the rectangle
        return this.startVertex.is_in_rect(c1, c2) || this.endVertex.is_in_rect(c1, c2);
    }

    update_after_view_modification(view: View){
        if ( typeof this.cp != "undefined"){
            this.data.cp_canvas_pos = view.create_canvas_coord(this.cp);
        }
        this.setAutoWeightDivPos();
    }

    /**
     * Sets the div pos according to the element.
     */
    setAutoWeightDivPos(){
        if ( typeof this.data.weightDiv !== "undefined" ){
            const posu = this.startVertex.data.canvas_pos; 
            const posv = this.endVertex.data.canvas_pos; 
            let middle = posu.middle(posv);
            if (typeof this.data.cp_canvas_pos != "string"){
                middle = this.data.cp_canvas_pos;
            }
            let weightPosition = middle.add(posu.sub(posv).normalize().rotate_quarter().scale(14));

            this.data.weightDiv.style.top = String(weightPosition.y - this.data.weightDiv.clientHeight/2) + "px";
            this.data.weightDiv.style.left = String(weightPosition.x- this.data.weightDiv.clientWidth/2) + "px";
        }
    }

    /**
     * 
     */
    afterSetWeight(){
        console.log("afterSetWeight");
        if (typeof this.data.weightDiv === "undefined"){
            initWeightDiv(this, BoardElementType.Link);
        } else {
            this.data.weightDiv.innerHTML = this.data.weight;
            // this.weightDiv.innerHTML = katex.renderToString(this.weight);
        }
        this.setAutoWeightDivPos();
    }

  


    translate_cp_by_canvas_vect(shift: CanvasVect, view: View){
            if ( typeof this.cp != "undefined" && typeof this.data.cp_canvas_pos != "string"){
                this.data.cp_canvas_pos.translate_by_canvas_vect(shift);
                this.cp.x += shift.x/view.zoom; 
                this.cp.y += shift.y/view.zoom;
            }
    }

    tikzify_link(start: ClientVertex, start_index: number, end: ClientVertex, end_index: number) {
        // TODO: ORIENTED CASE
        let labelCode = "";
        // if (showLabels)
        // labelCode = "node[midway, shift={(" + this.label.getExactLabelOffsetX() / 100 + "," + -this.label.getExactLabelOffsetY() / 100 + ")}, scale = \\scaleE] {" + this.label.text + "}";
        if (typeof this.cp != "undefined" ){
            return `\\draw[line width = \\scaleE, color = black] (${start.get_tikz_coordinate(start_index)}) .. controls (${Math.round(this.cp.x)/100}, ${Math.round(this.cp.y)/100}) .. (${end.get_tikz_coordinate(end_index)}) ${labelCode};`;
        } else {
            return ``; // TODO
        }
        
    }

    // init_weight_div(link_index: number){
    //     this.weight_div = document.createElement("div");
    //     this.weight_div.classList.add("weight_link");
    //     document.body.appendChild(this.weight_div);

    //     const link = this;
    //     this.weight_div.addEventListener("wheel", function (e) {
    //         const weight_value = parseInt(link.weight);
    //         if ( isNaN(weight_value) == false){
    //             if (e.deltaY < 0) {
    //                 local_board.emit_update_element( BoardElementType.Link, link_index, "weight", String(weight_value+1));
    //             }else {
    //                 local_board.emit_update_element(  BoardElementType.Link, link_index, "weight", String(weight_value-1));
    //             }
    //         }
    //     })

    //     this.weight_div.onclick = (e) => {
    //         if( interactor_loaded.id == text_interactorV2.id){
    //             validate_weight();
    //             display_weight_input(link_index, new CanvasCoord(this.weight_position.x, this.weight_position.y),DOWN_TYPE.LINK);
    //         }
    //     }
    // }

    // update_weight(value: string, link_index: number){
    //     this.weight = value;
    //     if ( this.weight_div == null){
    //         if ( value != ""){
    //             this.init_weight_div(link_index);
    //             this.weight_div.innerHTML = katex.renderToString(value);
    //         }
    //     }else {
    //         this.weight_div.innerHTML = katex.renderToString(value);
    //     }
    // }

    /**
     * Sets the weight of the link, then updates the WeightDiv.
     */
    setWeight(new_weight: string) {
        this.data.weight = new_weight;
        // this.afterSetWeight();
    }

    getIndex(): number{
        return this.index;
    }

    getWeight(): string{
        return this.data.weight;
    }

    getWeightDiv(){
        return this.data.weightDiv;
    }

    setWeightDiv(div: HTMLDivElement){
        this.data.weightDiv = div;
    }


    // clone(): ClientLink {
    //     if (typeof this.cp === "string"){
    //         const newLink = new ClientLink(this.start_vertex, this.end_vertex, this.startVertex, this.endVertex, this.cp, this.orientation, this.color, this.weight, local_board.view);
    //         return newLink; // TODO I think there are things to clone with the div
    //     } else {
    //         const newLink = new ClientLink(this.start_vertex, this.end_vertex, this.startVertex, this.endVertex, this.cp.copy(), this.orientation, this.color, this.weight, local_board.view);
    //         return newLink; // TODO I think there are things to clone with the div
    //     }
    // }


    translateByServerVect(shift: Vect, view: View) {
        if (typeof this.cp !== "undefined" && typeof this.data.cp_canvas_pos !== "string"){
            const canvas_shift = view.create_canvas_vect(shift);
            this.data.cp_canvas_pos.translate_by_canvas_vect(canvas_shift);
            this.cp.x += shift.x;
            this.cp.y += shift.y;
            // TODO: something with the weight_div
        }
    }


}
