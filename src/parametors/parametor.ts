import { ClientGraph } from "../board/graph";

export enum SENSIBILITY {
    GEOMETRIC = "GEOMETRIC", // Move of vertex/link
    COLOR = "COLOR", // Change of color for vertices/links
    ELEMENT = "ELEMENT", // Create/delete vertex/link
    WEIGHT = "WEIGHT"
}


function getSensibility(s: string){
    switch(s){
        case "ELEMENT":
            return SENSIBILITY.ELEMENT;
        case "GEOMETRIC":
            return SENSIBILITY.GEOMETRIC;
        case "COLOR":
            return SENSIBILITY.COLOR;
        case "WEIGHT":
            return SENSIBILITY.WEIGHT;
    }
}


export class Parametor {
    name: string;
    id:string;
    compute: (g: ClientGraph, verbose: boolean) => [string, any];
    showCertificate: (g: ClientGraph, certificate: any) => void;
    is_live:boolean;
    is_boolean:boolean;
    sensibility:Set<SENSIBILITY>;
    short_name:string;
    title:string;
    has_info:boolean;



    constructor(name: string, id:string, short_name:string, title:string, is_live:boolean, is_boolean:boolean, sensibility:Array<SENSIBILITY>, has_info:boolean) {
        this.name = name;
        this.id = id;
        this.short_name = short_name;
        this.title = title;
        this.is_live = is_live;
        this.is_boolean = is_boolean;
        this.sensibility = new Set(sensibility);
        this.has_info = has_info;
        this.compute = () => ["", undefined];
        this.showCertificate = () => {};
    }

    static from_function(f: (g: ClientGraph, verbose: boolean) => [string, any], name: string, id: string, short_name:string, title:string, is_live:boolean, is_boolean:boolean, sensibility:Array<SENSIBILITY>, has_info:boolean): Parametor {
        let param = new Parametor(name, id, short_name, title, is_live, is_boolean, sensibility, has_info);
        param.compute = f;
        return param;
    }

    is_sensible(s : Set<SENSIBILITY>){
        const intersection = new Set([...this.sensibility].filter(x=>s.has(x)));
        return intersection.size > 0;
    }

    get_parametor_html_id(area_id: number){
        return this.id + "_area_" + area_id;
    }
}

/*

# Note on Async:

To make sleeps in compute function : 
- Change compute to Promise<string>
- add "async" to all compute functions
then you can use "await new Promise(resolve => setTimeout(resolve, 100));"
in the compute functions
(get canvas and ctx with export from setup to call draw)

---

compute: (g: Graph, verbose: boolean) => Promise<string>;

paramDiameter.compute = ( async (g: Graph) =>{
    const FW = Floyd_Warhall(g, false);
    let diameter = 0;

    for(const v_index of g.vertices.keys()){
        g.vertices.get(v_index).color = "green";
        draw(canvas, ctx, g);
        await new Promise(resolve => setTimeout(resolve, 100)); 
        ...

*/
