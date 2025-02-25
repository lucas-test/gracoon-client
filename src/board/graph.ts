import { Camera } from "./display/camera";
import { ClientVertex, ClientVertexData } from "./vertex";
import { CanvasCoord } from "./display/canvas_coord";
import { ClientLink, ClientLinkData } from "./link";
import { BasicGraph, Coord,  ORIENTATION, Vect, Option, linesIntersection, bezier_curve_point } from "gramoloss";
import { CanvasVect } from "./display/canvasVect";
import { drawCircle, drawHead } from "./display/draw_basics";
import { DOWN_TYPE } from "../interactors/interactor";
import { angleAround, auxCombMap, comparePointsByAngle, coordToSVGcircle, CrossMode, curvedStanchionUnder2, h2FromEdgeLength, hFromEdgeLength, pathStrToSVGPathClass, pathToSVGPath, QuarterPoint, segmentToSVGLine, TwistMode } from "./stanchion";
import { Color, getCanvasColor } from "./display/colors_v2";
import { ClientBoard, INDEX_TYPE, VERTEX_RADIUS } from "./board";
import { GridType } from "./display/grid";





export class ClientGraph extends BasicGraph<ClientVertexData, ClientLinkData> {
    vertices: Map<number, ClientVertex>;
    links: Map<number, ClientLink>;
    board: ClientBoard;

    constructor(board: ClientBoard) {
        super();
        this.board = board;
        this.vertices = new Map<number, ClientVertex>();
        this.links = new Map<number, ClientLink>()
    }


    set_vertex(index: number, vertexData: ClientVertexData): ClientVertex {
        const newVertex = new ClientVertex(index, vertexData, this.board);
        this.vertices.set(index, newVertex);
        return newVertex;
    }

    setLink(index: number, startIndex: number, endIndex: number, orientation: ORIENTATION, linkData: ClientLinkData): Option<ClientLink> {
        const startVertex = this.vertices.get(startIndex);
        const endVertex = this.vertices.get(endIndex);
        if (typeof startVertex === "undefined" || typeof endVertex === "undefined"){
            return undefined;
        }
        const newLink = new ClientLink(index, startVertex, endVertex, orientation, linkData, this.board);
        this.links.set(index, newLink);
        startVertex.setAutoWeightDivPos();
        endVertex.setAutoWeightDivPos();
        return newLink;
    }


    override deleteVertex(index: number){
        const vertex = this.vertices.get(index);
        if ( typeof vertex == "undefined") return;
        if (typeof vertex.data.weightDiv != "undefined"){
            vertex.data.weightDiv.remove();
        }
        for (const link of this.links.values()){
            if (link.startVertex.index == vertex.index || link.endVertex.index == vertex.index){
                if(typeof link.data.weightDiv != "undefined"){
                    link.data.weightDiv.remove()
                }
            }
        }
        super.deleteVertex(index);
    }

    compressToString(): string{
        let str = "";
        

        for (const link of this.links.values()){
            str += `${link.startVertex.index} ${link.endVertex.index}\n`
        }
        return str;
    }

    /**
     * Draw the graph on the context.
     */
    draw(){
        this.drawLinks(this.board.ctx);
        this.drawVertices(this.board.ctx);
    }

    /**
     * Draw the vertices of the graph.
     */
    drawVertices(ctx: CanvasRenderingContext2D){
        for (const v of this.vertices.values()) {
            v.draw(this.board);
        }
    }

    /**
     * Draw the links of the graph.
     */
    drawLinks(ctx: CanvasRenderingContext2D) {
        for (const link of this.links.values()) {
            link.draw(this.board);
        }
    }



    translate_by_canvas_vect(shift: CanvasVect, camera: Camera){
        for ( const vertex of this.vertices.values()){
            vertex.translate_by_canvas_vect(shift, camera);
        }
        for ( const link of this.links.values()){
            link.translate_cp_by_canvas_vect(shift, camera);
        }
    }

    translateByServerVect(shift: Vect, camera: Camera){
        for ( const vertex of this.vertices.values()){
            vertex.translate_by_server_vect(shift, camera);
        }
        for ( const link of this.links.values()){
            link.translateByServerVect(shift, camera);
        }
    }

    /**
     * Converts the graph into a ClientGraph.
     * It does not clone the elements.
     */
    static fromGraph(g: BasicGraph<ClientVertexData, ClientLinkData>, board: ClientBoard): ClientGraph{
        const newGraph = new ClientGraph(board);
        for( const [index, vertex] of g.vertices){
            newGraph.set_vertex(index, vertex.data);
        }
        for (const [index, link] of g.links){
            newGraph.setLink(index, link.startVertex.index, link.endVertex.index, link.orientation, link.data);
        }
        return newGraph;
    }

    // clone(): ClientGraph {
    //     const newGraph = new ClientGraph();
    //     for( const [index, vertex] of this.vertices){
    //         newGraph.set_vertex(index, vertex.clone());
    //     }
    //     for (const [index, link] of this.links){
    //         newGraph.setLink(index, link.clone());
    //     }
    //     return newGraph;
    // }



    deselect_all_vertices() {
        this.vertices.forEach(vertex => {
            vertex.data.is_selected = false;
        });
    }

    deselect_all_links() {
        this.links.forEach(link => {
            link.data.is_selected = false;
        });
    } 
    
    



    

    get_vertex_index_nearby(pos: CanvasCoord) {
        for (const [index, v] of this.vertices.entries()) {
            if (v.is_nearby(pos, 150)) {
                return index;
            }
        }
        return null;
    }


    select_vertices_in_rect(corner1: CanvasCoord, corner2: CanvasCoord) {
        for (const vertex of this.vertices.values()) {
            if (vertex.is_in_rect(corner1, corner2)) {
                vertex.data.is_selected = true;
            }
        }
    }

    select_links_in_rect(corner1: CanvasCoord, corner2: CanvasCoord) {
        for (const [index, link] of this.links.entries()) {
            if (link.is_in_rect(corner1, corner2)) {
                link.data.is_selected = true;
            }
        }
    }

    is_click_over_link(link_index: number, e: CanvasCoord, camera: Camera) {
        const link = this.links.get(link_index);
        if (typeof link == "undefined") return;
        const v = link.startVertex;
        const w = link.endVertex;
        const linkcp_canvas = link.data.cp_canvas_pos;
        const v_canvas_pos = v.data.canvas_pos;
        const w_canvas_pos = w.data.canvas_pos
        if (typeof linkcp_canvas != "string"){
            return e.is_nearby_beziers_1cp(v_canvas_pos, linkcp_canvas, w_canvas_pos);
        }
        else {
            // OPT dont need beziers as it is a straight line
            const middle = v_canvas_pos.middle(w_canvas_pos);
            return e.is_nearby_beziers_1cp(v_canvas_pos, middle, w_canvas_pos);
        }
    }

    /**
     * Update the index string of every vertex according to the indexType of board
     */
    compute_vertices_index_string() {
        this.vertices.forEach((vertex, index) => { 
            vertex.updateIndexString();
        })
    }

    // align_position
    // return a CanvasCoord near mouse_canvas_coord which aligned on other vertices or on the grid
    align_position(pos_to_align: CanvasCoord, excluded_indices: Set<number>, canvas: HTMLCanvasElement, camera: Camera): CanvasCoord {
        const aligned_pos = new CanvasCoord(pos_to_align.x, pos_to_align.y);
        if (this.board.is_aligning) {
            this.board.alignement_horizontal_y = undefined;
            this.board.alignement_vertical_x = undefined;
            this.vertices.forEach((vertex: ClientVertex, index) => {
                if (excluded_indices.has(index) == false) {
                    if (Math.abs(vertex.data.canvas_pos.y - pos_to_align.y) <= 15) {
                        aligned_pos.y = vertex.data.canvas_pos.y;
                        this.board.alignement_horizontal_y = camera.canvasCoordY(vertex.data.pos);
                        return;
                    }
                    if (Math.abs(vertex.data.canvas_pos.x - pos_to_align.x) <= 15) {
                        aligned_pos.x = vertex.data.canvas_pos.x;
                        this.board.alignement_vertical_x = camera.canvasCoordX(vertex.data.pos);
                        return;
                    }
                }
            })
        }
        if ( this.board.grid.type == GridType.GridRect ) {
            const grid_size = this.board.grid.grid_size;
            for (let x = camera.camera.x % grid_size; x < canvas.width; x += grid_size) {
                if (Math.abs(x - pos_to_align.x) <= 15) {
                    aligned_pos.x = x;
                    break;
                }
            }
            for (let y = camera.camera.y % grid_size; y < canvas.height; y += grid_size) {
                if (Math.abs(y - pos_to_align.y) <= 15) {
                    aligned_pos.y = y;
                    break;
                }
            }
        } else  if ( this.board.grid.type == GridType.GridVerticalTriangular ) {
            const grid_size = this.board.grid.grid_size;
            const h = grid_size*Math.sqrt(3)/2;

            // find the corners of the quadrilateral containing the point
            const px = ((pos_to_align.x-camera.camera.x)- (pos_to_align.y-camera.camera.y)/Math.sqrt(3))/grid_size;
            const py = (pos_to_align.y-camera.camera.y)/h;
            const i = Math.floor(px);
            const j = Math.floor(py);
            const corners = [
                new Coord(i*grid_size + j*grid_size/2, Math.sqrt(3)*j*grid_size/2), // top left
                new Coord((i+1)*grid_size + j*grid_size/2, Math.sqrt(3)*j*grid_size/2), // top right
                new Coord(i*grid_size + (j+1)*grid_size/2, Math.sqrt(3)*(j+1)*grid_size/2), // bottom left
                new Coord((i+1)*grid_size + (j+1)*grid_size/2, Math.sqrt(3)*(j+1)*grid_size/2) // bottom right
            ]
            
            // align on the corners if the point is near enough
            for (let corner of corners){
                corner = corner.add(camera.camera);
                if (Math.sqrt(corner.dist2(pos_to_align)) <= 2*15){
                    aligned_pos.x = corner.x;
                    aligned_pos.y = corner.y;
                    return aligned_pos;
                }
            }

            // projection on the \ diagonal starting at the top left corner
            const projection1 = pos_to_align.orthogonal_projection(corners[0], new Vect(1 , Math.sqrt(3))) ; 
            if (projection1.dist2(pos_to_align) <= 15*15){
                aligned_pos.x = projection1.x;
                aligned_pos.y = projection1.y;
            }

            // projection on the \ diagonal starting at the top right corner
            const projection2 = pos_to_align.orthogonal_projection(corners[1], new Vect(1 , Math.sqrt(3))) ; 
            if (projection2.dist2(pos_to_align) <= 15*15){
                aligned_pos.x = projection2.x;
                aligned_pos.y = projection2.y;
            }

            // projection on the / diagonal starting at the top right corner
            const projection = pos_to_align.orthogonal_projection(corners[1], new Vect(-1 , Math.sqrt(3))) ; 
            if (projection.dist2(pos_to_align) <= 15*15){
                aligned_pos.x = projection.x;
                aligned_pos.y = projection.y;
            }

            // align on the horizontal lines
            for (let k of [0,3]){ // 0 and 3 are the indices of the top left and bottom right corner
                // of the quadrilateral containing the point
                let y = corners[k].y;
                if (Math.abs(y - pos_to_align.y) <= 15) {
                    aligned_pos.y = y;
                    break;
                }
            }
            
        } else if (this.board.grid.type == GridType.GridPolar){
            const size = this.board.grid.grid_size;
            const center = CanvasCoord.fromCoord(this.board.grid.polarCenter, this.board.camera);
            const p = aligned_pos;

            let d = Math.sqrt(p.dist2(center));
            if (d != 0){
                const i = Math.floor(d/(2*size));
                let alignToCenter = false;
                if ( d - i*2*size <= 20){
                    if (i == 0) {
                        alignToCenter = true;
                    }
                    aligned_pos.x = center.x + (aligned_pos.x-center.x)*(i*2*size)/d;
                    aligned_pos.y = center.y + (aligned_pos.y-center.y)*(i*2*size)/d;
                } else if ( (i+1)*2*size - d <= 20){
                    aligned_pos.x = center.x + (aligned_pos.x-center.x)*((i+1)*2*size)/d;
                    aligned_pos.y = center.y + (aligned_pos.y-center.y)*((i+1)*2*size)/d;
                }
                
                if (alignToCenter == false){
                    for (let j = 0 ; j < this.board.grid.polarDivision; j ++){
                        const angle = 2*Math.PI*j/this.board.grid.polarDivision;
                        const end = new Vect(1,0);
                        end.rotate(angle);
                        const projection = aligned_pos.orthogonal_projection(center, end);
                        if ( Math.sqrt(aligned_pos.dist2(projection)) <= 20){
                            aligned_pos.x = projection.x;
                            aligned_pos.y = projection.y;
                        }
                    }
                }
            }
        }
        return aligned_pos;
    }

    get_selected_vertices(): Set<number> {
        const set = new Set<number>();
        this.vertices.forEach((v, index) => {
            if (v.data.is_selected) {
                set.add(index);
            }
        })
        return set;
    }



    /**
     * Est ce qu'on veut pas un AbstractGraph ?
     * Ah non peut être ça sert pour la copie d'un sous-graphe induit.
     */
    get_induced_subgraph_from_selection(camera: Camera): ClientGraph{
        const subgraph = new ClientGraph(this.board);
        for (const [index, v] of this.vertices.entries()) {
            if(v.data.is_selected){
                subgraph.set_vertex(index, new ClientVertexData(v.data.pos.x, v.data.pos.y, v.data.weight, camera, v.data.color))
            }
        }

        for (const [index, e] of this.links.entries()){
            const u = e.startVertex;
            const v = e.endVertex;
            if(u.data.is_selected && v.data.is_selected){
                subgraph.setLink(index, e.startVertex.index, e.endVertex.index, e.orientation, new ClientLinkData(e.data.cp, e.data.color, e.data.weight, camera ) );
            }
        }
        return subgraph;
    }

    



    clear_vertices(){
        for( const vertex of this.vertices.values()){
            if (vertex.data.weightDiv != null){
                vertex.data.weightDiv.remove();
            }
        }
        this.vertices.clear();
    }

    clear_links(){
        for( const link of this.links.values()){
            if (typeof link.data.weightDiv != "undefined"){
                link.data.weightDiv.remove();
            }
        }
        this.links.clear();
    }

    addVertex(vertexData: ClientVertexData): ClientVertex {
        const v = super.addVertex(vertexData);
        const v2 = new ClientVertex(v.index, vertexData, this.board);
        this.vertices.set(v.index, v2);
        return v2;
    }

    addDefaultVertexFromCoord(pos: Coord, camera: Camera): ClientVertex{
        const vData = new ClientVertexData( pos.x, pos.y, "", camera, Color.Neutral);
        const v = this.addVertex(vData);
        return v;
    }

    /**
     * Add a default vertex positioned at a position on the Canvas (e.g. the center of the screen)
     */
    addDefaultVertex(pos: CanvasCoord): ClientVertex{
        const p = pos.toCoord(this.board.camera);
        const vData = new ClientVertexData( p.x, p.y, "", this.board.camera, Color.Neutral);
        const v = this.addVertex(vData);
        return v;
    }

    addLink(startIndex: number, endIndex: number, orientation: ORIENTATION, data: ClientLinkData): Option<ClientLink> {
        const link = super.addLink(startIndex, endIndex, orientation, data);
        if (typeof link == "undefined") return undefined;
        const startVertex = new ClientVertex(link.startVertex.index, link.startVertex.data, this.board);
        const endVertex = new ClientVertex(link.endVertex.index, link.endVertex.data, this.board);
        const link2 = new ClientLink(link.index, startVertex, endVertex, orientation, data, this.board);
        this.links.set(link.index, link2);
        return link2;
    }

    addDefaultEdge(startIndex: number, endIndex: number){
        const linkData = new ClientLinkData(undefined, Color.Neutral, "", this.board.camera);
        this.addLink(startIndex, endIndex, ORIENTATION.UNDIRECTED, linkData);
    }

    addDefaultArc(startIndex: number, endIndex: number){
        const linkData = new ClientLinkData(undefined, Color.Neutral, "", this.board.camera);
        this.addLink(startIndex, endIndex, ORIENTATION.DIRECTED, linkData);
    }


    /**
     * Return a nearby link if there exists one.
     */
    nearbyLink(pos: CanvasCoord): Option<ClientLink>{
        for (const [linkIndex, link] of this.links){
            if (link.isPosNear(pos)){
                return link;
            }
        }
        return undefined
    }


    translate_vertex_by_canvas_vect(index: number, cshift: CanvasVect, camera: Camera){
        const vertex = this.vertices.get(index);
 
        if (typeof vertex != "undefined") {
            const previous_pos = vertex.data.pos.copy();
            vertex.translate_by_canvas_vect(cshift, camera);
            const new_pos = vertex.data.pos.copy();

            for (const [link_index, link] of this.links.entries()) {
                if ( typeof link.data.cp != "undefined"){
                    if (link.startVertex.index == index) {
                        link.transformCP(new_pos, previous_pos, link.endVertex.data.pos);
                        link.data.cp_canvas_pos = camera.create_canvas_coord(link.data.cp);
                    } else if (link.endVertex.index == index) {
                        link.transformCP(new_pos, previous_pos, link.startVertex.data.pos);
                        link.data.cp_canvas_pos = camera.create_canvas_coord(link.data.cp);
                    }
                }
            }
        }
    }


    getNeighbors(v: ClientVertex): Array<ClientVertex>{
        const neighbors = super.getNeighbors(v);
        const neighbors2 = new Array<ClientVertex>();
        for (const v of neighbors){
            neighbors2.push(v as ClientVertex);
        }
        return neighbors2;
    }




    getCombinatorialMap(h: number,  crossRatio: number, adaptToEdgeLength: boolean, twistValue: number, durete: number, twistMode: TwistMode){
        const quarterPoints = new Map<number, QuarterPoint>(); // quarter points data
        
        // We cannot assign the edgeAdj of the QPs at the time of their creation.
        // Therefore we create these two structures to gather enough information to assign them later.
        const adjQP = new Map<number, Array<QuarterPoint>>(); // array of QPs around a vertex
        const prepareEdgeAdj = new Map<number, number>();

        // The number of QP seen. They are treated 2 by 2 : around each vertex, for each edge.
        // The even QP is on the left, the odd on the right (starting from the vertex).
        let nbQP = 0;

        for ( const [vertexId, vertex] of this.vertices){
            const vertexQPadj = new Array();
            const baseQPnb = nbQP;

            const neighbors = this.getNeighbors(vertex);
            neighbors.sort((v1, v2) => comparePointsByAngle(vertex.getPos(), v1.getPos(), v2.getPos()));

            // We now create 2* neighbors.length QuarterPoints

            if (neighbors.length == 1){

                const neighbor = neighbors[0];
                const edgeDir = Vect.from_coords(vertex.getPos(), neighbor.getPos());
                let hh = (adaptToEdgeLength) ? hFromEdgeLength(edgeDir) : h; 
                edgeDir.setNorm(hh);
                edgeDir.rotate(Math.PI/2);

                const edgeDir2 = Vect.from_coords(vertex.getPos(), neighbor.getPos());
                edgeDir2.setNorm(1.4*hh);
                
                const qp1pos = vertex.getPos().copy();
                qp1pos.rtranslate(edgeDir);
                const cp1 = qp1pos.copy();
                cp1.rtranslate(edgeDir2);
                const qp2pos = vertex.getPos().copy();
                qp2pos.translate(edgeDir);
                const cp2 = qp2pos.copy();
                cp2.rtranslate(edgeDir2);

                // nbQP
                const qp1 = new QuarterPoint(nbQP, qp1pos, cp1, 
                    nbQP+1,
                    neighbor.index,
                    nbQP+1,
                    vertex );
                prepareEdgeAdj.set(nbQP,neighbor.index);
                vertexQPadj.push(qp1);

                // nbQP+1
                const qp2 = new QuarterPoint(nbQP+1, qp2pos, cp2, 
                    nbQP,
                    neighbor.index,
                    nbQP,
                    vertex );
                prepareEdgeAdj.set(nbQP+1, neighbor.index);
                vertexQPadj.push(qp2);

                // compute the edgeAdj if possible
                const neighborAdj = adjQP.get(neighbor.index);
                if (neighborAdj){
                    for (const neighborQP of neighborAdj){
                        if (prepareEdgeAdj.get(neighborQP.id) == vertex.index && neighborQP.id %2 == 1){
                            qp1.edgeAdj = neighborQP.id;
                            neighborQP.edgeAdj = qp1.id;
                            // draw_line(this.board.camera.create_canvas_coord(qp1.pos), this.board.camera.create_canvas_coord(neighborQP.pos), ctx, "gray" )
                        } else if (prepareEdgeAdj.get(neighborQP.id) == vertex.index && neighborQP.id %2 == 0){
                            qp2.edgeAdj = neighborQP.id;
                            neighborQP.edgeAdj = qp2.id;
                            // draw_line(this.board.camera.create_canvas_coord(qp2.pos), this.board.camera.create_canvas_coord(neighborQP.pos), ctx, "gray" )
                        }
                    }
                }

                quarterPoints.set(nbQP, qp1);
                quarterPoints.set(nbQP+1, qp2);
                nbQP += 2;

                adjQP.set(vertexId, vertexQPadj);
                continue;
            }


            for (let i = 0 ; i < neighbors.length; i ++){
                const neighbor = neighbors[i];
                const j =  i+1 >= neighbors.length ? 0 : i+1; 
                const nextNeighbor = neighbors[j];
                const k = i-1 < 0 ? neighbors.length-1 : i-1;
                const previousNeighbor = neighbors[k];

                const [qp0pos, cp0, qp1pos] = auxCombMap(vertex, previousNeighbor, neighbor, h, adaptToEdgeLength, durete);
                const [qp2pos, cp2, qp3pos] = auxCombMap(vertex, neighbor, nextNeighbor, h, adaptToEdgeLength, durete);

                // nbQP
                const qp1 = new QuarterPoint(nbQP, qp1pos, cp0, 
                    nbQP -1 < baseQPnb ? baseQPnb + 2*neighbors.length-1 : nbQP-1,
                    neighbor.index,
                    nbQP+1,
                    vertex );
                prepareEdgeAdj.set(nbQP, neighbor.index);
                vertexQPadj.push(qp1);

                // nbQP+1
                const qp2 = new QuarterPoint(nbQP+1, qp2pos, cp2, 
                    nbQP +2 >= baseQPnb + 2*neighbors.length ? baseQPnb : nbQP+2,
                    neighbor.index,
                    nbQP,
                    vertex );
                prepareEdgeAdj.set(nbQP+1, neighbor.index);
                vertexQPadj.push(qp2);

                

                // compute the edgeAdj if possible
                const neighborAdj = adjQP.get(neighbor.index);
                if (neighborAdj){
                    for (const neighborQP of neighborAdj){
                        if (prepareEdgeAdj.get(neighborQP.id) == vertex.index && neighborQP.id %2 == 1){
                            qp1.edgeAdj = neighborQP.id;
                            neighborQP.edgeAdj = qp1.id;
                        } else if (prepareEdgeAdj.get(neighborQP.id) == vertex.index && neighborQP.id %2 == 0){
                            qp2.edgeAdj = neighborQP.id;
                            neighborQP.edgeAdj = qp2.id;
                        }

                    }
                }

                quarterPoints.set(nbQP, qp1);
                quarterPoints.set(nbQP+1, qp2);
                nbQP += 2;
            }
            adjQP.set(vertexId, vertexQPadj);
        }
        
        // compute Edge Projection Points
        for (const qp of quarterPoints.values()){
            const qpJump = quarterPoints.get(qp.jumpAdj);
            const qpEdge = quarterPoints.get(qp.edgeAdj);
            if (typeof qpJump != "undefined" && typeof qpEdge != "undefined")
                qp.computeEdgePoint(qpJump, qpEdge);
        }

        // compute QuarterEdgePoints and MiddleEdgePoints
        for (const qp of quarterPoints.values()){
            const qpEdge = quarterPoints.get(qp.edgeAdj);
            if (typeof qpEdge != "undefined")
                qp.computeQuarterMiddlePoints(qpEdge, h, twistValue, crossRatio, twistMode);
        }

        return quarterPoints;
    }


    
    /**
     * TODO: adaptToEdgeLength
     */
    drawCombinatorialMap(file: string | undefined, ctx: CanvasRenderingContext2D, h: number, crossRatio: number, adaptToEdgeLength: boolean, twistValue: number, durete: number, width: number, twistMode: TwistMode, crossMode: CrossMode){
        console.log("drawCombiMap", crossMode);

        const drawOnBoard = (typeof file === "undefined");

        crossRatio = (crossMode == CrossMode.DoublePath) ? 1 : crossRatio;
        const quarterPoints = this.getCombinatorialMap( h,  crossRatio, adaptToEdgeLength, twistValue, durete, twistMode);

        let svgString = "";

        let minx = 0;
        let miny = 0;
        let maxx = 600;
        let maxy = 600;

        svgString += `<?xml version="1.0" standalone="yes"?>
        <svg
            width="100%"
            height="100%"
            viewBox="${minx} ${miny} ${maxx} ${maxy}"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg">
            `;
        
        
        
        svgString += 
        `
        <style>
            .crossBorder {
                fill: none;
                stroke-linejoin: round;
                stroke-linecap: butt;
                stroke-width: ${width*3};
                stroke: black;
            }
            .cycle0 {
                fill: none;
                stroke-linejoin: round;
                stroke-linecap: round;
                stroke-width: ${width};
                stroke: white;
            }
            .cycle1 {
                fill: none;
                stroke-linejoin: round;
                stroke-linecap: round;
                stroke-width: ${width};
                stroke: red;
            }
            .cycle2 {
                fill: none;
                stroke-linejoin: round;
                stroke-linecap: round;
                stroke-width: ${width};
                stroke: green;
            }
            .cycle3 {
                fill: none;
                stroke-linejoin: round;
                stroke-linecap: round;
                stroke-width: ${width};
                stroke: blue;
            }
        </style>

        <rect
        style="fill:#000000;fill-opacity:1; fill"
        id="rect0"
        width="600"
        height="600"
        x="0"
        y="0" />
        `

        // Draw graph in file
        svgString += `<g id="glinks">\n`;
        for (const link of this.links.values()){
            let d = `M ${link.startVertex.data.pos.x} ${link.startVertex.data.pos.y} L ${link.endVertex.data.pos.x} ${link.endVertex.data.pos.y}`;
            svgString += pathToSVGPath(d, width, "white" ) + "\n";
        }
        svgString += `</g>\n`;

        const colors = ["white", "red", "blue", "green"];
        let currentColor = 0;

        
        // For crossMode DoublePath
        const pathsByZ: Array<Array<string>> = new Array();
        for (let i = 0 ; i < 4 ; i ++){
            pathsByZ.push([]);
        }
        
        const paths: Array<Array<string>> = new Array(); // first index is the color, second the level
        for (let i = 0 ; i < colors.length ; i ++){
            paths.push(["", "", "", ""]);
        }

        let underPath = "";


        // Start a DFS to find all the cycles
        const visited = new Set<number>();
        
        for (const qp of quarterPoints.values()){
            if (visited.has(qp.id) == false){
                let currentQp = qp;
                let d = `M ${qp.pos.x} ${qp.pos.y}`;
                while (visited.has(currentQp.id) == false ){

                    visited.add(currentQp.id);

                    let nextQp = quarterPoints.get(currentQp.edgeAdj);
                    if (typeof nextQp == "undefined") { throw Error("bug");  };
                    nextQp = quarterPoints.get(nextQp.jumpAdj);
                    if (typeof nextQp == "undefined") { throw Error("bug");  };
                    visited.add(nextQp.id);
                    // if (adaptToEdgeLength){
                    //     const edgeDir = Vect.from_coords(currentQp.vertexAdj.getPos(), nextQp.vertexAdj.getPos());
                    //     const hh = hFromEdgeLength(edgeDir);
                    //     const hh2 = h2FromEdgeLength(edgeDir);
                    //     d += curvedStanchionUnder2(currentQp, nextQp, hh, hh2, crossRatio);
                    // } else {
                        this.board.drawLine(currentQp.pos, currentQp.quarterEdgePoint, colors[currentColor], width);
                        pathsByZ[3].push(pathStrToSVGPathClass(`M ${currentQp.pos.x} ${currentQp.pos.y} L ${currentQp.quarterEdgePoint.x} ${currentQp.quarterEdgePoint.y}`, `cycle${currentColor}` ));
                        paths[currentColor][3] += `M ${currentQp.pos.x} ${currentQp.pos.y} L ${currentQp.quarterEdgePoint.x} ${currentQp.quarterEdgePoint.y}`;
                        d += `L ${currentQp.quarterEdgePoint.x} ${currentQp.quarterEdgePoint.y}`;


                        if ( currentQp.id %2 == 1){
                            if (crossMode == CrossMode.DoublePath){
                                this.board.drawBezierCurve(ctx, currentQp.quarterEdgePoint, currentQp.quarterEdgeCP, nextQp.quarterEdgeCP, nextQp.quarterEdgePoint, colors[currentColor], width);
                            } else {
                                this.board.drawBezierCurve(ctx, currentQp.quarterEdgePoint, currentQp.quarterEdgeCP, currentQp.middleEdgeCP, currentQp.middleEdgePoint, colors[currentColor], width);
                                this.board.drawBezierCurve(ctx, nextQp.middleEdgePoint, nextQp.middleEdgeCP, nextQp.quarterEdgeCP, nextQp.quarterEdgePoint, colors[currentColor], width);
                            }
                            pathsByZ[0].push(pathStrToSVGPathClass(`M ${currentQp.quarterEdgePoint.x} ${currentQp.quarterEdgePoint.y} C ${currentQp.quarterEdgeCP.x} ${currentQp.quarterEdgeCP.y}, ${nextQp.quarterEdgeCP.x} ${nextQp.quarterEdgeCP.y}, ${nextQp.quarterEdgePoint.x} ${nextQp.quarterEdgePoint.y}`, `cycle${currentColor}` ));
                            paths[currentColor][0] += `M ${currentQp.quarterEdgePoint.x} ${currentQp.quarterEdgePoint.y} C ${currentQp.quarterEdgeCP.x} ${currentQp.quarterEdgeCP.y}, ${nextQp.quarterEdgeCP.x} ${nextQp.quarterEdgeCP.y}, ${nextQp.quarterEdgePoint.x} ${nextQp.quarterEdgePoint.y}`;

                            d += `C ${currentQp.quarterEdgeCP.x} ${currentQp.quarterEdgeCP.y}, ${currentQp.middleEdgeCP.x} ${currentQp.middleEdgeCP.y}, ${currentQp.middleEdgePoint.x} ${currentQp.middleEdgePoint.y}`;
                            d += `M ${nextQp.middleEdgePoint.x} ${nextQp.middleEdgePoint.y}`;
                            d += `C ${nextQp.middleEdgeCP.x} ${nextQp.middleEdgeCP.y}, ${nextQp.quarterEdgeCP.x} ${nextQp.quarterEdgeCP.y}, ${nextQp.quarterEdgePoint.x} ${nextQp.quarterEdgePoint.y}`;
                            
                        } else {
                            if (crossMode == CrossMode.DoublePath){
                                this.board.drawBezierCurve(ctx, currentQp.quarterEdgePoint, currentQp.quarterEdgeCP, nextQp.quarterEdgeCP, nextQp.quarterEdgePoint, "black", width*3);
                            }
                            this.board.drawBezierCurve(ctx, currentQp.quarterEdgePoint, currentQp.quarterEdgeCP, nextQp.quarterEdgeCP, nextQp.quarterEdgePoint, colors[currentColor], width);
                            pathsByZ[1].push(pathStrToSVGPathClass(`M ${currentQp.quarterEdgePoint.x} ${currentQp.quarterEdgePoint.y} C ${currentQp.quarterEdgeCP.x} ${currentQp.quarterEdgeCP.y}, ${nextQp.quarterEdgeCP.x} ${nextQp.quarterEdgeCP.y}, ${nextQp.quarterEdgePoint.x} ${nextQp.quarterEdgePoint.y}`, "crossBorder" ));
                            pathsByZ[2].push(pathStrToSVGPathClass(`M ${currentQp.quarterEdgePoint.x} ${currentQp.quarterEdgePoint.y} C ${currentQp.quarterEdgeCP.x} ${currentQp.quarterEdgeCP.y}, ${nextQp.quarterEdgeCP.x} ${nextQp.quarterEdgeCP.y}, ${nextQp.quarterEdgePoint.x} ${nextQp.quarterEdgePoint.y}`, `cycle${currentColor}` ));
                            underPath += `M ${currentQp.quarterEdgePoint.x} ${currentQp.quarterEdgePoint.y} C ${currentQp.quarterEdgeCP.x} ${currentQp.quarterEdgeCP.y}, ${nextQp.quarterEdgeCP.x} ${nextQp.quarterEdgeCP.y}, ${nextQp.quarterEdgePoint.x} ${nextQp.quarterEdgePoint.y}`;                   
                            paths[currentColor][2] += `M ${currentQp.quarterEdgePoint.x} ${currentQp.quarterEdgePoint.y} C ${currentQp.quarterEdgeCP.x} ${currentQp.quarterEdgeCP.y}, ${nextQp.quarterEdgeCP.x} ${nextQp.quarterEdgeCP.y}, ${nextQp.quarterEdgePoint.x} ${nextQp.quarterEdgePoint.y}`;

                            d += `C ${currentQp.quarterEdgeCP.x} ${currentQp.quarterEdgeCP.y}, ${nextQp.quarterEdgeCP.x} ${nextQp.quarterEdgeCP.y}, ${nextQp.quarterEdgePoint.x} ${nextQp.quarterEdgePoint.y}`;
                        }

                        this.board.drawLine(nextQp.quarterEdgePoint, nextQp.pos, colors[currentColor], width);
                        pathsByZ[3].push(pathStrToSVGPathClass(`M ${nextQp.quarterEdgePoint.x} ${nextQp.quarterEdgePoint.y} L ${nextQp.pos.x} ${nextQp.pos.y}`, `cycle${currentColor}` ));
                        paths[currentColor][3] += `M ${nextQp.quarterEdgePoint.x} ${nextQp.quarterEdgePoint.y} L ${nextQp.pos.x} ${nextQp.pos.y}`;
                        d += `L ${nextQp.pos.x} ${nextQp.pos.y}`;
                        
                    // }


                    // this.board.drawCircle(currentQp.cp, 3, "green", 1);
                    // if ( currentQp.id %2 == 0 ){
                    //     this.board.drawCircle(currentQp.pos, 3, "blue", 1);
                    // } else {
                    //     this.board.drawCircle(currentQp.pos, 3, "red", 1);
                    // }

                    currentQp = nextQp;

                    nextQp = quarterPoints.get(currentQp.interiorAdj);
                    if (typeof nextQp == "undefined") { throw Error("bug");  };
                    this.board.drawBezierCurve(ctx, currentQp.pos, currentQp.cp, nextQp.cp, nextQp.pos, "red", width);
                    // 3 level path
                    pathsByZ[3].push(pathStrToSVGPathClass(`M ${currentQp.pos.x} ${currentQp.pos.y} C ${currentQp.cp.x} ${currentQp.cp.y} ${nextQp.cp.x} ${nextQp.cp.y} ${nextQp.pos.x} ${nextQp.pos.y}`, `cycle${currentColor}` ));
                    paths[currentColor][3] += `M ${currentQp.pos.x} ${currentQp.pos.y} C ${currentQp.cp.x} ${currentQp.cp.y} ${nextQp.cp.x} ${nextQp.cp.y} ${nextQp.pos.x} ${nextQp.pos.y}`;

                    d += `C ${currentQp.cp.x} ${currentQp.cp.y} ${nextQp.cp.x} ${nextQp.cp.y} ${nextQp.pos.x} ${nextQp.pos.y}`;

                    // this.board.drawCircle(currentQp.cp, 3, "green", 1);
                    // if ( currentQp.id %2 == 0 ){
                    //     this.board.drawCircle(currentQp.pos, 3, "blue", 1);
                    // } else {
                    //     this.board.drawCircle(currentQp.pos, 3, "red", 1);
                    // }

                    currentQp = nextQp;
                }

                d += `M ${currentQp.pos.x} ${currentQp.pos.y}`;
                d += "Z";
                if (crossMode == CrossMode.Cut){
                    svgString += pathToSVGPath(d, width, colors[currentColor] );
                }
                currentColor = (currentColor + 1) % colors.length;
            }
        }

        if (crossMode == CrossMode.DoublePath){
           
            // for (let i = 0 ; i < pathsByZ.length ; i ++){
            //     svgString += `<!-- level ${i} -->`;
            //     for(const path of pathsByZ[i]){
            //         svgString += path + "\n";
            //     }
            // }
            for (let z = 0 ; z < 4 ; z ++){
                svgString += `<!-- z-level ${z} -->\n`;
                if (z == 1){
                    svgString += pathStrToSVGPathClass(underPath, "crossBorder");
                }
                for (let i = 0 ; i < colors.length ; i ++){
                    svgString += `<!-- path ${i} -->\n`;
                    svgString += pathStrToSVGPathClass(paths[i][z], `cycle${i}`) + "\n";
                }
            }
        }

        svgString += "</svg>";

        if (drawOnBoard == false){
            const a = document.createElement("a");
            a.href = window.URL.createObjectURL(new Blob([svgString], { type: "text/plain" }));
            a.download = "moebius_stanchions.svg";
            a.click();
        }
    }






        

}
