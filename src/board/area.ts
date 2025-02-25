import { Camera } from "./display/camera";

import { CanvasCoord } from "./display/canvas_coord";
import { Area, Coord } from "gramoloss";
import { CanvasVect } from "./display/canvasVect";
import { BoardElementType, ClientBoard } from "./board";
import { setupLoadedParam } from "./area_div";


export enum AREA_CORNER {
    NONE = 0,
    TOP_LEFT = 1,
    TOP_RIGHT = 2,
    BOT_RIGHT = 3,
    BOT_LEFT = 4
}

export enum AREA_SIDE{
    NONE = 0,
    TOP = 1,
    RIGHT = 2,
    BOT = 3,
    LEFT = 4
}

export class ClientArea extends Area{
    canvas_corner_top_left : CanvasCoord;
    canvas_corner_bottom_left : CanvasCoord;
    canvas_corner_bottom_right : CanvasCoord;
    canvas_corner_top_right : CanvasCoord;
    paramsLoadedDiv: HTMLDivElement;
    paramsDivContainer: HTMLDivElement;

    constructor(label:string, c1:Coord, c2:Coord, color:string, board: ClientBoard, index: number){
        super(label, c1, c2, color, index);
        this.canvas_corner_top_left = board.camera.create_canvas_coord(this.top_left_corner());
        this.canvas_corner_bottom_left = board.camera.create_canvas_coord(this.bot_left_corner());
        this.canvas_corner_bottom_right = board.camera.create_canvas_coord(this.bot_right_corner());
        this.canvas_corner_top_right = board.camera.create_canvas_coord(this.top_right_corner());
        this.paramsLoadedDiv = document.createElement("div");
        this.paramsDivContainer = document.createElement("div");

        this.setupDOM(board);
    }

    setupDOM(board: ClientBoard){
        setupLoadedParam(board, this.paramsLoadedDiv, this);
    }


    clearDOM(){
        this.paramsLoadedDiv.remove();
    }


    is_on_label(pos:CanvasCoord, r?:number){ 
        // ____________________
        // |                   |
        // |__       KO        |
        // |OK|________________|
        if(r == undefined){
            r = 30;
        }
        const BL = this.canvas_corner_bottom_left;
        return pos.x >= BL.x && pos.x <= BL.x + r && pos.y >= BL.y - r && pos.y <= BL.y;
  


        // const BL = new CanvasCoord(this.corner_top_left.canvas_pos.x + 10, this.corner_bottom_right.canvas_pos.y - 10);
        // return BL.is_nearby(pos, r);
    }

    is_nearby_corner(pos:CanvasCoord, r?:number):AREA_CORNER{
        if(this.is_nearby_top_left_corner(pos, r)){
            return AREA_CORNER.TOP_LEFT;
        }

        if(this.is_nearby_top_right_corner(pos, r)){
            return AREA_CORNER.TOP_RIGHT;
        }

        if(this.is_nearby_bot_right_corner(pos, r)){
            return AREA_CORNER.BOT_RIGHT;
        }

        if(this.is_nearby_bot_left_corner(pos, r)){
            return AREA_CORNER.BOT_LEFT;
        }
        return AREA_CORNER.NONE;
    }

    is_nearby_side(pos:CanvasCoord, r?:number, avoid_corners?:boolean):AREA_SIDE{
        if(r == undefined){
            r = 5;
        }

        if(avoid_corners == undefined){
            avoid_corners = false;
        }
        let shift = avoid_corners?20:0;

        const c1canvas = this.canvas_corner_bottom_left;
        const c2canvas = this.canvas_corner_top_right;
        const minX = Math.min(c1canvas.x, c2canvas.x);
        const minY = Math.min(c1canvas.y, c2canvas.y);
        const maxX = Math.max(c1canvas.x, c2canvas.x);
        const maxY = Math.max(c1canvas.y, c2canvas.y);

        if(pos.x < maxX - shift && pos.x > minX + shift && Math.abs(pos.y - minY) < r){
            return AREA_SIDE.TOP;
        }
        if(pos.y < maxY - shift && pos.y > minY + shift && Math.abs(pos.x - maxX) < r){
            return AREA_SIDE.RIGHT;
        }
        if(pos.x < maxX - shift && pos.x > minX + shift && Math.abs(pos.y - maxY) < r){
            return AREA_SIDE.BOT;
        }
        if(pos.y < maxY - shift && pos.y > minY + shift && Math.abs(pos.x - minX) < r){
            return AREA_SIDE.LEFT;
        }

        return AREA_SIDE.NONE;
    }



    is_nearby_top_left_corner(pos:CanvasCoord, s?:number){      
        if(s == undefined){
            s = 20;
        }
        const TL = this.canvas_corner_top_left;
        return pos.x >= TL.x && pos.x <= TL.x + s && pos.y >= TL.y && pos.y <= TL.y + s;
    }

    is_nearby_top_right_corner(pos:CanvasCoord, s?:number){      
        if(s == undefined){
            s = 20;
        }
        const TR = this.canvas_corner_top_right;
        return pos.x <= TR.x && pos.x >= TR.x - s && pos.y >= TR.y && pos.y <= TR.y + s;
    }

    is_nearby_bot_left_corner(pos:CanvasCoord, s?:number){      
        if(s == undefined){
            s = 20;
        }
        const BL = this.canvas_corner_bottom_left;
        return pos.x >= BL.x && pos.x <= BL.x + s && pos.y >= BL.y - s && pos.y <= BL.y;
    }

    is_nearby_bot_right_corner(pos:CanvasCoord, s?:number){      
        if(s == undefined){
            s = 20;
        }
        const BR = this.canvas_corner_bottom_right;
        return pos.x <= BR.x && pos.x >= BR.x - s && pos.y >= BR.y - s && pos.y <= BR.y;
    }

    
    // supposing only CanvasCornerTopLeft and BotRight have been changed
    recompute_corners(camera: Camera){
        const c1 = this.canvas_corner_top_left.copy();
        const c2 = this.canvas_corner_bottom_right.copy();
        this.canvas_corner_top_left.x = Math.min(c1.x, c2.x);
        this.canvas_corner_top_left.y = Math.min(c1.y, c2.y);
        this.canvas_corner_bottom_right.x = Math.max(c1.x, c2.x);
        this.canvas_corner_bottom_right.y = Math.max(c1.y, c2.y);
        this.canvas_corner_bottom_left.x = Math.min(c1.x, c2.x);
        this.canvas_corner_bottom_left.y = Math.max(c1.y, c2.y);
        this.canvas_corner_top_right.x = Math.max(c1.x, c2.x);
        this.canvas_corner_top_right.y = Math.min(c1.y, c2.y);
        this.c1 = camera.create_server_coord(this.canvas_corner_top_left);
        this.c2 = camera.create_server_coord(this.canvas_corner_bottom_right);
    }
    




    resize_side_area(pos: CanvasCoord, opposite_coord: number, side_number:AREA_SIDE, camera: Camera){
        if (side_number == AREA_SIDE.TOP || side_number == AREA_SIDE.BOT){
            this.canvas_corner_top_right.y = Math.min(pos.y, opposite_coord);
            this.canvas_corner_top_left.y = Math.min(pos.y, opposite_coord);
            this.canvas_corner_bottom_right.y = Math.max(pos.y, opposite_coord);
            this.canvas_corner_bottom_left.y = Math.max(pos.y, opposite_coord);
        }
        if (side_number == AREA_SIDE.LEFT || side_number == AREA_SIDE.RIGHT){
            this.canvas_corner_top_right.x = Math.max(pos.x, opposite_coord);
            this.canvas_corner_top_left.x = Math.min(pos.x, opposite_coord);
            this.canvas_corner_bottom_right.x = Math.max(pos.x, opposite_coord);
            this.canvas_corner_bottom_left.x = Math.min(pos.x, opposite_coord);
        }
    }



    resize_corner_area(c1:CanvasCoord, c2:CanvasCoord, camera: Camera){
        this.canvas_corner_top_right.x = Math.max(c1.x, c2.x);
        this.canvas_corner_top_right.y = Math.min(c1.y, c2.y);
        this.canvas_corner_top_left.x = Math.min(c1.x, c2.x);
        this.canvas_corner_top_left.y = Math.min(c1.y, c2.y);
        this.canvas_corner_bottom_right.x = Math.max(c1.x, c2.x);
        this.canvas_corner_bottom_right.y = Math.max(c1.y, c2.y);
        this.canvas_corner_bottom_left.x = Math.min(c1.x, c2.x);
        this.canvas_corner_bottom_left.y = Math.max(c1.y, c2.y);
    }

    translate_by_canvas_vect(shift: CanvasVect, camera: Camera){
        // this.canvas_corner_bottom_left.translate_by_canvas_vect(shift);
        // this.canvas_corner_bottom_right.translate_by_canvas_vect(shift);
        // this.canvas_corner_top_left.translate_by_canvas_vect(shift);
        // this.canvas_corner_top_right.translate_by_canvas_vect(shift);
        // this.c1.translate(camera.server_vect(shift));
        // this.c2.translate(camera.server_vect(shift));
    }

    update_canvas_pos(camera: Camera){
        this.canvas_corner_top_left = camera.create_canvas_coord(this.top_left_corner());
        this.canvas_corner_bottom_left = camera.create_canvas_coord(this.bot_left_corner());
        this.canvas_corner_bottom_right = camera.create_canvas_coord(this.bot_right_corner());
        this.canvas_corner_top_right = camera.create_canvas_coord(this.top_right_corner());
    }

    update_after_camera_change(camera: Camera){
        this.canvas_corner_top_left = camera.create_canvas_coord(this.top_left_corner());
        this.canvas_corner_bottom_left = camera.create_canvas_coord(this.bot_left_corner());
        this.canvas_corner_bottom_right = camera.create_canvas_coord(this.bot_right_corner());
        this.canvas_corner_top_right = camera.create_canvas_coord(this.top_right_corner());
    }

    getType(): BoardElementType{
        return BoardElementType.Area;
    }


    // DRAW AREA
    draw(board: ClientBoard){


        board.ctx.beginPath();
        board.ctx.strokeStyle = this.color;
        board.ctx.lineWidth = 2;
        const c1canvas = this.canvas_corner_top_left;
        const c2canvas = this.canvas_corner_bottom_right;
        board.ctx.rect(c1canvas.x , c1canvas.y, c2canvas.x - c1canvas.x, c2canvas.y - c1canvas.y);
        board.ctx.stroke();

        board.ctx.globalAlpha = 0.07;
        board.ctx.fillStyle = this.color;
        board.ctx.fill();
        board.ctx.globalAlpha = 1;

        board.ctx.beginPath();
        board.ctx.font = "400 24px Arial";
        const measure = board.ctx.measureText(this.label);
        board.ctx.fillStyle = this.color;
        const text_canvas_pos = this.canvas_corner_bottom_left;
        board.ctx.rect(text_canvas_pos.x, text_canvas_pos.y - 29, measure.width + 10, 29);
        board.ctx.fill();

        
        board.ctx.beginPath();
        board.ctx.fillStyle = "white"; // TODO multicolor.contrast
        board.ctx.fillText(this.label, text_canvas_pos.x + 5, text_canvas_pos.y - 5);
        board.ctx.fill();



        if( board.interactorLoadedId === "area"){
            const top_left = this.canvas_corner_top_left;
            const top_right = this.canvas_corner_top_right;
            const bot_right = this.canvas_corner_bottom_right;

            const corner_side = 18;

            board.ctx.beginPath();
            board.ctx.strokeStyle = this.color;
            board.ctx.fillStyle = this.color;
            board.ctx.lineWidth = 2;
            board.ctx.rect(top_left.x, top_left.y, corner_side, corner_side);
            board.ctx.stroke();
            // ctx.fill();

            board.ctx.beginPath();
            board.ctx.strokeStyle = this.color;
            board.ctx.lineWidth = 2;
            board.ctx.rect(top_right.x-corner_side, top_right.y, corner_side, corner_side);
            board.ctx.stroke();

            board.ctx.beginPath();
            board.ctx.strokeStyle = this.color;
            board.ctx.lineWidth = 2;
            board.ctx.rect(bot_right.x-corner_side, bot_right.y-corner_side, corner_side, corner_side);
            board.ctx.stroke();
        }
    }

   
}




