import { Area, Board, Coord, Option, TextZone, Vect } from "gramoloss";
import { COLOR_ALIGNEMENT_LINE, COLOR_BACKGROUND, drawClipboardGraph, drawUsers, GRID_COLOR, SELECTION_COLOR, VERTEX_RADIUS } from "../draw";
import { DOWN_TYPE, INTERACTOR_TYPE, RESIZE_TYPE } from "../interactors/interactor";
import { GraphModifyer } from "../modifyers/modifyer";
import { socket } from "../socket";
import { ClientArea } from "./area";
import { View } from "./camera";
import { ClientGraph } from "./graph";
import { ClientLink, ClientLinkData, LinkPreData } from "./link";
import { ClientRectangle } from "./rectangle";
import { ClientRepresentation } from "./representations/client_representation";
import { is_click_over, resize_type_nearby, translate_by_canvas_vect } from "./resizable";
import { ClientStroke } from "./stroke";
import { ClientTextZone } from "./text_zone";
import { CanvasVect } from "./vect";
import { ClientVertex, ClientVertexData } from "./vertex";
import { CanvasCoord } from "./canvas_coord";
import { Var, VariableNumber, VariableBoolean } from "./variable";
import { drawBezierCurve, drawLine, draw_circle } from "../draw_basics";
import { Color } from "../colors_v2";
import { interactor_loaded } from "../interactors/interactor_manager";
import { Self, users } from "../user";
import { InteractorV2 } from "../side_bar/interactor_side_bar";


export enum BoardElementType {
    Vertex = "Vertex",
    Link = "Link",
    ControlPoint = "ControlPoint",
    TextZone = "TextZone",
    Area = "Area",
    Stroke = "Stroke",
    Rectangle = "Rectangle",
    Representation = "Representation"
}

// These constants must correspond to the API of the server

export enum SocketMsgType {
    ADD_ELEMENT = "add_element",
    DELETE_ELEMENTS = "delete_elements",
    UPDATE_ELEMENT = "update_element",
    TRANSLATE_ELEMENTS = "translate_elements",
    RESIZE_ELEMENT = "resize_element",
    MERGE_VERTICES = "vertices_merge",
    PASTE_GRAPH = "paste_graph",
    APPLY_MODIFYER = "apply_modifyer",
    UNDO = "undo",
    REDO = "redo",
    LOAD_JSON = "load_json",
    GET_JSON = "get_json",
    SUBDIVIDE_LINK = "subdivide_link"
}



export class ClientBoard extends Board<ClientVertexData, ClientLinkData, ClientStroke, ClientArea, ClientTextZone, ClientRepresentation, ClientRectangle> {
    view: View;
    graph: ClientGraph;
    variables: Map<string, Var>;
    variablesDiv: HTMLDivElement;
    elementOver: undefined | ClientVertex | ClientLink | ClientStroke | ClientRectangle;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    selfUser: Self;
    colorSelected: Color;
    keyPressed: Set<string>;
    interactorLoaded: Option<InteractorV2>;
    interactorLoadedId: Option<INTERACTOR_TYPE>;

    constructor(){
        super();

        this.selfUser = new Self();
        this.colorSelected = Color.Neutral;
        this.keyPressed = new Set<string>();
        this.interactorLoaded = undefined;
        this.interactorLoadedId = undefined;

        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);
        this.canvas.id = "main";
        const ctx = this.canvas.getContext('2d');
        if (ctx == null) throw Error("Cannot get context 2d of canvas");
        this.ctx = ctx; 
        

        this.graph = new ClientGraph(this);
        this.view = new View();
        
        this.elementOver = undefined;

        this.variables = new Map();
        this.variablesDiv = document.createElement("div");
        this.variablesDiv.id = "variablesDiv";
        document.body.appendChild(this.variablesDiv);

        // this.addVariable("h", 0, 20, 50, 0.1, () => {
        //     this.afterVariableChange()
        // });
        // this.addVariable("h2", 0, 20, 50, 0.1, () => {
        //     this.afterVariableChange()
        // });
        // this.addVariableBoolean("adaptToEdgeLength", false, () => {
        //     this.afterVariableChange()
        // });
        // this.addVariableBoolean("middleOfEdge", false, () => {
        //     this.afterVariableChange()
        // });
        // this.addVariable("ratio", 0, 0.5, 1, 0.01, () => {
        //     this.afterVariableChange()
        // });
        // this.addVariable("durete", 0, 10, 100, 0.1, () => {
        //     this.afterVariableChange()
        // });
        // this.addVariable("crossRatio", 0, 0.4, 0.5, 0.01, () => {
        //     this.afterVariableChange()
        // });
        // this.addVariable("width", 0, 3, 50, 0.1, () => {
        //     this.afterVariableChange();
        // })

    }

    afterVariableChange(){
        // const canvas = document.getElementById('main') as HTMLCanvasElement;
        // const ctx = canvas.getContext('2d');
        // const h = this.getVariableValue("h");
        // const h2 = this.getVariableValue("h2");
        // const adaptToEdgeLength = this.getVariableValue("adaptToEdgeLength");
        // const ratio = this.getVariableValue("ratio");
        // const durete = this.getVariableValue("durete");
        // const crossRatio = this.getVariableValue("crossRatio");
        // const width = this.getVariableValue("width");

        // this.draw();
        // if (typeof width == "number" && typeof crossRatio == "number" && typeof durete == "number" && typeof h == "number" && typeof h2 == "number" && typeof adaptToEdgeLength == "boolean" && typeof ratio == "number"){
        //     this.graph.drawCombinatorialMap(undefined, ctx, h, h2, crossRatio, adaptToEdgeLength, ratio, durete, width);
        // }
    }

    addVariable(id: string, min: number, value: number, max: number, step: number, onchangeHandler: () => void ){
        const variable = new VariableNumber(id, min, value, max, step, onchangeHandler);
        this.variablesDiv.appendChild(variable.div);
        this.variables.set(id, variable);
    }

    addVariableBoolean(id: string, value: boolean, onchangeHandler: () => void ){
        const variable = new VariableBoolean(id, value, onchangeHandler);
        this.variablesDiv.appendChild(variable.div);
        this.variables.set(id, variable);
    }

    getVariableValue(id: string): Option<number | boolean>{
        const v = this.variables.get(id);
        if (v){
            return v.getValue();
        } else {
            return undefined
        }
    }

    /**
     * Draw a Bezier Curve with 2 control points (therefore it is a cubic curve).
     */
    drawBezierCurve(ctx: CanvasRenderingContext2D, p1: Coord, c1: Coord, c2: Coord, p2: Coord, color: string, width: number){
        const canvasp1 = this.view.create_canvas_coord(p1);
        const canvasc1 = this.view.create_canvas_coord(c1);
        const canvasc2 = this.view.create_canvas_coord(c2);
        const canvasp2 = this.view.create_canvas_coord(p2);
        const scaledWidth = width*this.view.zoom;
        drawBezierCurve(ctx, canvasp1, canvasc1, canvasc2, canvasp2, color, scaledWidth);
    }

    drawLine(ctx: CanvasRenderingContext2D, p1: Coord, p2: Coord, color: string, width: number){
        const canvasP1 = this.view.create_canvas_coord(p1);
        const canvasP2 = this.view.create_canvas_coord(p2);
        const scaledWidth = width*this.view.zoom;
        drawLine(canvasP1, canvasP2, ctx, color, scaledWidth);
    }

    drawCircle(ctx: CanvasRenderingContext2D, center: Coord, radius: number, color: string){
        const canvasCenter = this.view.create_canvas_coord(center);
        draw_circle(canvasCenter, color, radius, 1, ctx)
    }
    

    /**
     * For the moment only everything in the graph.
     * TODO: select also all the other elements?
     * TODO: select only the vertices or only the links?
     * (depending on a board variable)
     */
    selectEverything() {
        for (const vertex of this.graph.vertices.values()){
            vertex.data.is_selected = true;
        } 
        for (const link of this.graph.links.values()){
            link.data.is_selected = true;
        }
    }


    /**
     * Draw a triangular grid. 
     * The length of the equilateral triangle is `grid_size` of view.
     * @param canvas The sidebar the item belongs
     * @param ctx The ctx of the canvas
     */
    drawTriangularGrid() {
        const grid_size = this.view.grid_size;
        const h = grid_size*Math.sqrt(3)/2;

        //   \ diagonals
        for (let x = (this.view.camera.x - this.view.camera.y/Math.sqrt(3)) % grid_size - Math.floor((this.canvas.width+this.canvas.height)/grid_size)*grid_size; x < this.canvas.width; x += grid_size) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = GRID_COLOR;
            this.ctx.lineWidth = 1;
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x + this.canvas.height , this.canvas.height*Math.sqrt(3));
            this.ctx.stroke();
        }

        //   / diagonals
        for (let x = (this.view.camera.x + this.view.camera.y/Math.sqrt(3)) % grid_size + Math.floor((this.canvas.width+this.canvas.height)/grid_size)*grid_size; x > 0 ; x -= grid_size) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = GRID_COLOR;
            this.ctx.lineWidth = 1;
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x - this.canvas.height , this.canvas.height*Math.sqrt(3));
            this.ctx.stroke();
        }

        // horizontal lines
        for (let y = this.view.camera.y % h; y < this.canvas.height; y += h) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = GRID_COLOR;
            this.ctx.lineWidth = 1;
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // debugging : draw the quadrilateral containing the point

        // for (let i = 0 ; i < 10 ; i ++){
        //     for (let j = 0 ; j < 10 ; j ++){
        //         let pos = new Coord(i*grid_size + j*grid_size/2, Math.sqrt(3)*j*grid_size/2);
        //         pos = pos.add(this.view.camera);
        //         let cpos = new CanvasCoord(pos.x, pos.y);
        //         draw_circle(cpos, "red", 10, 1, ctx);
        //     }
        // }


        // const px = ((mouse_pos.x - this.view.camera.x) - (mouse_pos.y - this.view.camera.y)/Math.sqrt(3))/grid_size;
        // const py = (mouse_pos.y - this.view.camera.y)/h;
        // const i = Math.floor(px);
        // const j = Math.floor(py);

        // let pos = new Coord(i*grid_size + j*grid_size/2, Math.sqrt(3)*j*grid_size/2);
        // pos = pos.add(this.view.camera);
        // let cpos = new CanvasCoord(pos.x, pos.y);
        // draw_circle(cpos, "blue", 10, 1, ctx);

        // let pos2 = new Coord((i+1)*grid_size + (j+1)*grid_size/2, Math.sqrt(3)*(j+1)*grid_size/2);
        // pos2 = pos2.add(this.view.camera);
        // let cpos2 = new CanvasCoord(pos2.x, pos2.y);
        // draw_circle(cpos2, "blue", 10, 1, ctx);


    }

    /**
     * The alignement lines with other vertices.
     */
    drawAlignements() {
        if (this.view.alignement_horizontal) {
            drawLine(new CanvasCoord(0, this.view.alignement_horizontal_y), new CanvasCoord(window.innerWidth, this.view.alignement_horizontal_y), this.ctx, COLOR_ALIGNEMENT_LINE, 3);
        }
        if (this.view.alignement_vertical) {
            drawLine(new CanvasCoord(this.view.alignement_vertical_x, 0), new CanvasCoord(this.view.alignement_vertical_x, window.innerHeight), this.ctx, COLOR_ALIGNEMENT_LINE, 3);
        }
    }


    drawInteractor() {
        if (this.view.is_drawing_interactor){
            interactor_loaded.draw(this)
        }
    }


    drawRectangularSelection() {
        if (this.view.is_rectangular_selecting) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = SELECTION_COLOR;
            this.ctx.rect(this.view.selection_corner_1.x, this.view.selection_corner_1.y, this.view.selection_corner_2.x - this.view.selection_corner_1.x, this.view.selection_corner_2.y - this.view.selection_corner_1.y);
            this.ctx.stroke();

            this.ctx.globalAlpha = 0.07;
            this.ctx.fillStyle = SELECTION_COLOR;
            this.ctx.fill();

            this.ctx.globalAlpha = 1;
        }
    }

    drawFollowing(){
        if( typeof this.selfUser.following != "undefined"){
            const following_user = users.get(this.selfUser.following);
            if(following_user){
                this.ctx.beginPath();
                this.ctx.strokeStyle = following_user.multicolor.color;
                this.ctx.lineWidth = 10;
                this.ctx.rect(0,0,1000,1000);
                this.ctx.stroke();
            }
            else{
                this.selfUser.following = undefined;
            }
        }
    }

    draw() {
        this.drawBackground();
        if ( this.view.display_triangular_grid ) this.drawTriangularGrid();
        this.representations.forEach(rep => rep.draw(this.ctx, this.view));
        this.rectangles.forEach(rectangle => rectangle.draw());
        this.strokes.forEach(stroke => stroke.draw(this));
        this.areas.forEach(area => area.draw(this));
        this.drawAlignements();
        this.graph.draw();

        drawUsers(this.canvas, this.ctx);
        this.drawRectangularSelection();
        this.drawInteractor();
        drawClipboardGraph();
    }

    /**
     * Only request a draw.
     */
    requestDraw(){
        const board = this;
        requestAnimationFrame(function () { board.draw() })
    }
    

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // view.window_height = window.innerHeight;
        // view.window_width = window.innerWidth;
        const board = this;
        requestAnimationFrame(function () { board.draw() })
    }

    drawBackground() {
        this.ctx.beginPath();
        this.ctx.fillStyle = COLOR_BACKGROUND;
        this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fill();
    
        if (this.view.grid_show) {
            this.drawRectangularGrid();
        }
    }



    drawRectangularGrid() {
        const grid_size = this.view.grid_size;

        for (let i = this.view.camera.x % grid_size; i < this.canvas.width; i += grid_size) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = GRID_COLOR;
            this.ctx.lineWidth = 1;
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }

        for (let i = this.view.camera.y % grid_size; i < this.canvas.height; i += grid_size) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = GRID_COLOR;
            this.ctx.lineWidth = 1;
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
    }



    /**
     * Return true if an element has been erased.
     * Emit delete_elements alone.
     */
    eraseAt(e: CanvasCoord, eraseDistance: number) : boolean{
        for (const [index, s] of this.strokes.entries()) {
            if (s.is_nearby(e, this.view) !== false) {
                this.emit_delete_elements([[BoardElementType.Stroke, index]]);
                return true;
            }
        }
        for (const [index, vertex] of this.graph.vertices.entries()) {
            if (vertex.is_nearby(e, Math.pow(eraseDistance + VERTEX_RADIUS, 2))) {
                this.emit_delete_elements([[BoardElementType.Vertex, index]]);
                return true;
            }
        }
        for (const index of this.graph.links.keys()) {
            if (this.graph.is_click_over_link(index, e, this.view)) {
                this.emit_delete_elements([[BoardElementType.Link, index]]);
                return true;
            }
        }
        for(const [index,area] of this.areas.entries()){
            if( is_click_over(area,e) ){
                this.emit_delete_elements([[BoardElementType.Area, index]]);
                return true;
            }
        }
        return false;
    }


    clear() {
        for( const text_zone of this.text_zones.values()){
            text_zone.div.remove();
        }
        this.text_zones.clear();
    }

    update_after_camera_change(){
        for (const stroke of this.strokes.values()){
            stroke.update_after_camera_change(this.view);
        }
        for ( const text_zone of this.text_zones.values()){
            text_zone.update_after_camera_change(this.view);
        }
        for (const rep of this.representations.values()){
            rep.update_after_camera_change(this.view);
        }
        for (const rect of this.rectangles.values()){
            rect.update_after_camera_change(this.view);
        }
        for (const area of this.areas.values()){
            area.update_after_camera_change(this.view);
        }
    }

    select_elements_in_rect(corner1: CanvasCoord, corner2: CanvasCoord) {
        this.graph.select_vertices_in_rect(corner1, corner2);
        this.graph.select_links_in_rect(corner1, corner2);

        for (const stroke of this.strokes.values()){
            if (stroke.is_in_rect(corner1,corner2)){
                stroke.is_selected = true;   
            }
        }
    }


    create_text_zone(canvas_pos: CanvasCoord): number{
        let index = 0;
        while (this.text_zones.has(index)) {
            index += 1;
        }
        const pos = this.view.create_server_coord(canvas_pos);
        const text_zone = new ClientTextZone(pos, 200, "salut", this, index);
        this.text_zones.set(index, text_zone);
        return index;
    }

    
    /**
     * Return true if this.elementOver has changed.
     */
    updateElementOver(pos: CanvasCoord): boolean {
        const before = this.elementOver;
        this.elementOver = undefined;
        
        for (const rectangle of this.rectangles.values()){
            if (is_click_over(rectangle, pos)){
                this.elementOver = rectangle;
                break;
            }
        }

        for (const link of this.graph.links.values()){
            if (link.isPosNear(pos)){
                this.elementOver = link;
                break;
            }
        }
        for (const stroke of this.strokes.values()){
            if (stroke.is_nearby(pos, this.view)){
                this.elementOver = stroke;
                break;
            }
        }
        for (const vertex of this.graph.vertices.values()){
            if (vertex.is_nearby(pos, 150)){
                this.elementOver = vertex;
                break;
            }
        }
        return before !== this.elementOver;
    }


    get_element_nearby(pos: CanvasCoord, interactable_element_type: Set<DOWN_TYPE>) {

        if (interactable_element_type.has(DOWN_TYPE.REPRESENTATION_ELEMENT)){
            for (const [index, rep] of this.representations.entries()){
                const resize_type = resize_type_nearby(rep, pos, 10);
                if (typeof resize_type != "number"){
                    return {type: DOWN_TYPE.RESIZE, element_type: "Representation", element: rep, index: index,  resize_type: resize_type};
                }
                const r = rep.click_over(pos, this.view);
                if (typeof r != "string"){
                    return { type: DOWN_TYPE.REPRESENTATION_ELEMENT, element_type: "Representation",  element: rep, index: index, element_index: r};
                }
            }
        }

        if (interactable_element_type.has(DOWN_TYPE.REPRESENTATION)){
            for (const [index, rep] of this.representations.entries()){
                if ( is_click_over(rep, pos)){
                    return { type: DOWN_TYPE.REPRESENTATION,  element: rep, index: index};
                }
            }
        }

        if (interactable_element_type.has(DOWN_TYPE.RECTANGLE)){
            for (const [index, rect] of this.rectangles.entries()){
                const resize_type = resize_type_nearby(rect, pos, 10);
                if (typeof resize_type != "number"){
                    return {type: DOWN_TYPE.RESIZE, element_type: "Rectangle", element: rect, index: index,  resize_type: resize_type};
                }
            }
            
            for (const [index, rect] of this.rectangles.entries()){
                if ( is_click_over(rect, pos)){
                    return { type: DOWN_TYPE.RECTANGLE,  element: rect, index: index};
                }
            }

        }

        if (interactable_element_type.has(DOWN_TYPE.VERTEX)) {
            for (const [index, v] of this.graph.vertices.entries()) {
                if (v.is_nearby(pos, 150)) {
                    return { type: DOWN_TYPE.VERTEX, index: index };
                }
            }
        }
       
        for (const [index, link] of this.graph.links.entries()) {
            if (interactable_element_type.has(DOWN_TYPE.CONTROL_POINT) && typeof link.data.cp_canvas_pos != "string" && link.data.cp_canvas_pos.is_nearby(pos, 150)) {
                return { type: DOWN_TYPE.CONTROL_POINT, index: index };
            }
            if (interactable_element_type.has(DOWN_TYPE.LINK) && this.graph.is_click_over_link(index, pos, this.view)) {
                return { type: DOWN_TYPE.LINK, index: index };
            }
        }

        if(interactable_element_type.has(DOWN_TYPE.RESIZE)){
            for (const [index, area] of this.areas.entries()){
                const resize_type = resize_type_nearby(area, pos, 10);
                if (typeof resize_type != "number"){
                    return {type: DOWN_TYPE.RESIZE, element_type: "Area", element: area, index: index,  resize_type: resize_type};
                }
            }
        }        

        for(const [index,a] of this.areas.entries()){
            if(interactable_element_type.has(DOWN_TYPE.AREA) && is_click_over(a,pos)){
                return{ type: DOWN_TYPE.AREA, element: a, index: index };
            }
        }

        if (interactable_element_type.has(DOWN_TYPE.STROKE)) {
            for(const [index,s] of this.strokes.entries()){
                if(typeof s.is_nearby(pos, this.view) == "number"){     
                    return { type: DOWN_TYPE.STROKE, index: index };
                }
            }
        }

        if ( interactable_element_type.has(DOWN_TYPE.TEXT_ZONE)){
            for (const [index, text_zone] of this.text_zones.entries()){
                if ( text_zone.is_nearby(pos)){
                    return {type: DOWN_TYPE.TEXT_ZONE, index: index};
                }
            }
        }

        return { type: DOWN_TYPE.EMPTY, index: null };
    }

    deselect_all_strokes() {
        this.strokes.forEach(s => {
            s.is_selected = false;
        });
    }


    clear_all_selections() {
        this.graph.deselect_all_vertices();
        this.graph.deselect_all_links();
        this.deselect_all_strokes();
    }

    update_canvas_pos(view: View) {
        for (const v of this.graph.vertices.values()) {
            v.update_after_view_modification(view);
        }
        for (const link of this.graph.links.values()) {
            link.update_after_view_modification(view);
            
        }
        // for (const area of this.areas.values()){
        //     area.update_canvas_pos(view);
        // }
        for( const stroke of this.strokes.values()){
            stroke.update_canvas_pos(view);
        }
    }

    translate_area(shift: CanvasVect, areaIndex: number, verticesContained: Set<number>){
        const area = this.areas.get(areaIndex);
        if( typeof area != "undefined" ){
            this.graph.vertices.forEach((vertex, vertexIndex) => {
                if (verticesContained.has(vertexIndex)){
                    vertex.translate_by_canvas_vect(shift, this.view);
                }
            })
            for( const link of this.graph.links.values()){
                if ( typeof link.data.cp != "undefined"){
                    const v1 = link.startVertex;
                    const v2 = link.endVertex;
                    if(verticesContained.has(link.startVertex.index) && verticesContained.has(link.endVertex.index)){
                        link.translate_cp_by_canvas_vect(shift, this.view);
                    }
                    else if(verticesContained.has(link.startVertex.index)){ // and thus not v2
                        const newPos = v1.data.pos;
                        const previousPos = this.view.create_server_coord_from_subtranslated(v1.data.canvas_pos, shift);
                        const fixedPos = v2.data.pos;
                        link.transformCP(newPos, previousPos, fixedPos);
                        link.data.cp_canvas_pos = this.view.create_canvas_coord(link.data.cp);
                    }else if(verticesContained.has(link.endVertex.index)) { // and thus not v1
                        const newPos = v2.data.pos;
                        const previousPos = this.view.create_server_coord_from_subtranslated(v2.data.canvas_pos, shift);
                        const fixedPos = v1.data.pos;
                        link.transformCP(newPos, previousPos, fixedPos);
                        link.data.cp_canvas_pos = this.view.create_canvas_coord(link.data.cp);
                    }
                }
            }
            translate_by_canvas_vect(area, shift, this.view);
        }
    }


    emitSubdivideLink(linkIndex: number, pos: Coord, weight: string, color: Color, callback: (response: number) => void) {
        socket.emit(SocketMsgType.SUBDIVIDE_LINK, linkIndex, pos, weight, color, callback);
    }

    emit_redo() {
        socket.emit(SocketMsgType.REDO);
    }

    emit_undo() {
        socket.emit(SocketMsgType.UNDO);
    }

    emit_translate_elements(indices: Array<[BoardElementType,number]>, shift: Vect){
        socket.emit(SocketMsgType.TRANSLATE_ELEMENTS, indices, shift);
    }

    emit_delete_elements(indices: Array<[BoardElementType,number]>){
        socket.emit(SocketMsgType.DELETE_ELEMENTS, indices);
    }

    emit_update_element(type: BoardElementType, index: number, attribute: string, value: any){
        socket.emit(SocketMsgType.UPDATE_ELEMENT, type, index, attribute, value);
    }

    emit_vertices_merge(index1: number, index2: number){
        socket.emit(SocketMsgType.MERGE_VERTICES, index1, index2);
    }

    emit_paste_graph(graph: ClientGraph){
        console.log([...graph.links.entries()]);
        socket.emit(SocketMsgType.PASTE_GRAPH, [...graph.vertices.entries()], [...graph.links.entries()]);
    }

    emit_resize_element(type: BoardElementType, index: number, pos: Coord, resize_type: RESIZE_TYPE){
        socket.emit(SocketMsgType.RESIZE_ELEMENT, type, index, pos.x, pos.y, resize_type);
    }

    emit_apply_modifyer(modifyer: GraphModifyer){
        const attributes_data = new Array<string | number>();
        for (const attribute of modifyer.attributes){
            attributes_data.push(attribute.value);
        }
        socket.emit(SocketMsgType.APPLY_MODIFYER, modifyer.name, attributes_data);
    }

    // Note: sometimes element is a server class, sometimes a client
    // Normally it should be only server
    // TODO: improve that
    emit_add_element(element: ClientVertexData | LinkPreData | ClientStroke | Area | TextZone, callback: (response: number) => void  ){
        switch(element.constructor){
            case ClientVertexData: {
                const vertexData = element as ClientVertexData;
                socket.emit(SocketMsgType.ADD_ELEMENT, BoardElementType.Vertex, {pos: vertexData.pos, color: vertexData.color, weight: vertexData.weight}, callback);
                break;
            }
            case LinkPreData: {
                const data = element as LinkPreData;
                socket.emit(SocketMsgType.ADD_ELEMENT, BoardElementType.Link, {start_index: data.startIndex, end_index: data.endIndex, orientation: data.orientation, weight: data.weight, color: data.color}, callback);
                break;
            }
            case ClientStroke: {
                const stroke = element as ClientStroke;
                socket.emit(SocketMsgType.ADD_ELEMENT , BoardElementType.Stroke, {points: [... stroke.positions.entries()], color: stroke.color, width: stroke.width}, callback);
                break;
            }
            case TextZone: {
                const text_zone = element as TextZone;
                socket.emit(SocketMsgType.ADD_ELEMENT, BoardElementType.TextZone, {pos: text_zone.pos}, callback);
                break;
            }
            case Area: {
                const area = element as Area;
                socket.emit(SocketMsgType.ADD_ELEMENT, BoardElementType.Area, {c1: area.c1, c2: area.c2, label: area.label, color: area.color }, callback);
                break;
            }
        }
    }

    // method change_camera -> update_canvas_pos de tous les éléments
}