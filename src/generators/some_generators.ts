import { ORIENTATION } from "gramoloss";
import { View } from "../board/camera";
import { CanvasCoord } from "../board/canvas_coord";
import { ClientGraph } from "../board/graph";
import { ClientLink } from "../board/link";
import { ClientVertex } from "../board/vertex";

import { AreaIndex, Integer, Percentage } from "./attribute";
import { GraphGenerator } from "./generator";

// ----------------------------

 let generate_random_independent = new GraphGenerator("independent", [new Integer("n", 3)])

 generate_random_independent.generate = (pos: CanvasCoord, view: View) => {
    const graph = new ClientGraph();
    const n = generate_random_independent.attributes[0].value;
    if (typeof n == "string"){
        return graph;
    }
    const r = 50;
    const center = view.create_canvas_coord(pos);
    const cx = center.x; 
    const cy = center.y;
    for ( let i = 0 ; i < n ; i ++){
        const v = new ClientVertex(cx +  r*Math.cos( (2*Math.PI*i) /n), cy + r*Math.sin( (2*Math.PI*i) /n), "", view);
        graph.addVertex(v);
    }
    return graph;
}

// ----------------------------

 let random_clique = new GraphGenerator("clique", [new Integer("n", 3)])

 random_clique.generate = (pos: CanvasCoord, view: View) => {
    const graph = new ClientGraph();
    const n = random_clique.attributes[0].value;
    if (typeof n == "string"){
        return graph;
    }
    const r = 50;
    const center = view.create_canvas_coord(pos);
    const cx = center.x; 
    const cy = center.y;
    for ( let i = 0 ; i < n ; i ++){
        const v = new ClientVertex(cx +  r*Math.cos( (2*Math.PI*i) /n), cy + r*Math.sin( (2*Math.PI*i) /n), "", view);
        graph.addVertex(v);
        for ( let j = 0 ; j < i ; j ++ ){
            const startVertex = graph.vertices.get(j);
            const endVertex = graph.vertices.get(i);
            if (typeof startVertex !== "undefined"){
                if (typeof endVertex !== "undefined"){
                    const link =  new ClientLink(j,i, startVertex, endVertex,  "", ORIENTATION.UNDIRECTED, "black", "", view);
                    graph.addLink(link);
                }
            }
        }
    }
    return graph;
 }


 // ----------------------------

 let random_tournament = new GraphGenerator("random_tournament", [new Integer("n", 3)])

 random_tournament.generate = (pos: CanvasCoord, view: View) => {
    const graph = new ClientGraph();
    const n = random_tournament.attributes[0].value;
    if (typeof n == "string"){
        return graph;
    }
    const r = 50;
    const center = view.create_canvas_coord(pos);
    const cx = center.x; 
    const cy = center.y;
    for ( let i = 0 ; i < n ; i ++){
        const v = new ClientVertex(cx +  r*Math.cos( (2*Math.PI*i) /n), cy + r*Math.sin( (2*Math.PI*i) /n), "", view);
        graph.addVertex(v);
        for ( let j = 0 ; j < i ; j ++ ){
            if ( Math.random() < 0.5 ){
                const startVertex = graph.vertices.get(j);
                const endVertex = graph.vertices.get(i);
                if (typeof startVertex !== "undefined"){
                    if (typeof endVertex !== "undefined"){
                        const link =  new ClientLink(j,i, startVertex, endVertex,  "", ORIENTATION.DIRECTED, "black", "", view);
                        graph.addLink(link);
                    }
                }
            }else {
                const endVertex = graph.vertices.get(j);
                const startVertex = graph.vertices.get(i);
                if (typeof startVertex !== "undefined"){
                    if (typeof endVertex !== "undefined"){
                        const link =  new ClientLink(i,j, startVertex, endVertex,  "", ORIENTATION.DIRECTED, "black", "", view);
                        graph.addLink(link);
                    }
                }
            }
        }
    }
    return graph;
 }

 // ----------------------------

 let random_GNP = new GraphGenerator("gnp", [new Integer("n", 3), new Percentage("p")]);

 random_GNP.generate = (pos: CanvasCoord, view: View) => {
    const graph = new ClientGraph();
    const n = random_GNP.attributes[0].value;
    const p = random_GNP.attributes[1].value;
    if (typeof n == "string" || typeof p == "string"){
        return graph;
    }
    const center = view.create_canvas_coord(pos);
    const cx = center.x; 
    const cy = center.y;
    const r = 50;
    for ( let i = 0 ; i < n ; i ++){
        const v = new ClientVertex(cx +  r*Math.cos( (2*Math.PI*i) /n), cy + r*Math.sin( (2*Math.PI*i) /n), "", view);
        graph.addVertex(v);
        for ( let j = 0 ; j < i ; j ++ ){
            if ( Math.random() < p){
                const startVertex = graph.vertices.get(j);
                const endVertex = graph.vertices.get(i);
                if (typeof startVertex !== "undefined"){
                    if (typeof endVertex !== "undefined"){
                        const link =  new ClientLink(j,i, startVertex, endVertex,  "", ORIENTATION.UNDIRECTED, "black", "", view);
                        graph.addLink(link);
                    }
                }
            }
            
        }
    }

    return graph;
 }

// ----------------------------


let random_star = new GraphGenerator("star", [new Integer("n", 3)])

random_star.generate = (pos: CanvasCoord, view : View) => {
   const graph = new ClientGraph();
   const n = random_star.attributes[0].value;
   if (typeof n == "string"){
    return graph;
}
   const r = 50;
   const center = view.create_canvas_coord(pos);
   const cx = center.x; 
   const cy = center.y;

    if(n>0){
        const vcenter = new ClientVertex(cx, cy, "", view);
        graph.addVertex(vcenter);
        for ( let i = 0 ; i < n ; i ++){
            const v = new ClientVertex(cx +  r*Math.cos( (2*Math.PI*i) /(n-1)), cy + r*Math.sin( (2*Math.PI*i) /(n-1)), "", view);
            graph.addVertex(v);

            const startVertex = graph.vertices.get(0);
            const endVertex = graph.vertices.get(i);
            if (typeof startVertex !== "undefined"){
                if (typeof endVertex !== "undefined"){
                    const link =  new ClientLink(0,i, startVertex, endVertex,  "", ORIENTATION.UNDIRECTED, "black", "", view);
                    graph.addLink(link);
                }
            }
        }
    }

   return graph;
}

// ----------------------------

let complete_bipartite = new GraphGenerator("complete_bipartite", [new Integer("n",1),new Integer("m",1)]);

complete_bipartite.generate = (pos: CanvasCoord, view: View) => {
    const graph = new ClientGraph();
    const n = complete_bipartite.attributes[0].value;
    const m = complete_bipartite.attributes[1].value;
    if (typeof n == "string"){
        return graph;
    }
    const center = view.create_canvas_coord(pos);

    for ( let i = 0 ; i < n ; i ++){
        graph.add_default_client_vertex(center.x + i*30 , center.y, view);
    }
    for ( let j = 0 ; j < m ; j ++){
        graph.add_default_client_vertex(center.x + j*30 , center.y+100, view);
    }

    for ( let i = 0 ; i < n ; i ++){
        for ( let j = 0 ; j < m ; j ++){
            graph.add_edge(i,n+j,view);
        }
    }
    return graph;
}


// ----------------------------


// ----------------------------

let grid = new GraphGenerator("grid", [new Integer("n (column)",1),new Integer("m (row)",1)]);

grid.generate = (pos: CanvasCoord, view: View) => {
    const graph = new ClientGraph();
    const n = grid.attributes[0].value;
    const m = grid.attributes[1].value;
    if (typeof n == "string" || typeof m == "string"){
        return graph;
    }
    const center = view.create_canvas_coord(pos);
    
    for ( let i = 0 ; i < n ; i++){
        for ( let j = 0 ; j < m ; j ++){
            graph.add_default_client_vertex(center.x + i*30 , center.y+j*30, view);
        }
    }
   

    for ( let i = 0 ; i < n ; i ++){
        for ( let j = 0 ; j < m ; j ++){
            let current_index = i*m + j;
            if(j < m - 1){
                graph.add_edge(current_index, current_index + 1, view);
            }
            if(i<n-1){
                graph.add_edge(current_index, current_index+m, view);
            }
        }
    }
    return graph;
}


// ----------------------------



export let generators_available = new Array<GraphGenerator>();
generators_available.push(generate_random_independent);
generators_available.push(random_clique);
generators_available.push(random_GNP);
generators_available.push(random_star);
generators_available.push(complete_bipartite);
generators_available.push(grid);
generators_available.push(random_tournament);

