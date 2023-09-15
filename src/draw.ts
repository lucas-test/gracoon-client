const SELECTION_COLOR = 'green' // avant c'était '#00ffff'
export let COLOR_BACKGROUND = "#1e1e1e";
export const GRID_COLOR = '#777777';
export const VERTEX_RADIUS = 8;
const COLOR_ALIGNEMENT_LINE = "#444444";
export let COLOR_BORDER_VERTEX = "#ffffff";
export let COLOR_INNER_VERTEX_DEFAULT = "#000000";


import { User, users } from './user';
import { ClientGraph } from './board/graph';
import { ClientStroke } from './board/stroke';
import { ClientArea } from './board/area';
import { interactor_loaded } from './interactors/interactor_manager';
import { clamp } from './utils';
import { Multicolor } from './multicolor';
import { local_board } from './setup';
import { drawRoundRect, drawLine} from './draw_basics';
import { graph_clipboard } from './clipboard';
import { CanvasCoord } from './board/canvas_coord';
import { getCanvasColor } from './colors_v2';

export function toggle_dark_mode(enable:boolean){
    const action_DOM = document.getElementById("actions");
    const interactor_DOM = document.getElementById("interaction_mode_selector");
    const border_DOM = document.getElementById("border"); // TODO: Change border color and check if someone is followed first
    if(enable){
        COLOR_BACKGROUND = "#1e1e1e";
        // COLOR_INDEX = "#ffffff";
        COLOR_BORDER_VERTEX = "#ffffff";
        document.documentElement.style.setProperty(`--background_color_div`, "#ffffff"); 
        document.documentElement.style.setProperty(`--color_div`, "#000000"); 
        document.documentElement.style.setProperty(`--background_color_page`, COLOR_BACKGROUND); 
        
        const action_svgs = action_DOM.getElementsByTagName('img');
        for(const svg of action_svgs){
            svg.style.filter = "";
        }

        const interactor_svgs = interactor_DOM.getElementsByTagName('img');
        for(const svg of interactor_svgs){
            svg.style.filter = "";
        }
        // action_DOM.style.backgroundColor = "#fff";
    }
    else{
        COLOR_BACKGROUND = "#fafafa";
        // COLOR_INDEX = "#ffffff";
        COLOR_BORDER_VERTEX = "#000000";
        
        document.documentElement.style.setProperty(`--background_color_div`, "#202124"); 
        document.documentElement.style.setProperty(`--color_div`, "#ffffff"); 
        document.documentElement.style.setProperty(`--background_color_page`, COLOR_BACKGROUND); 
 
        const action_svgs = action_DOM.getElementsByTagName('img');
        for(const svg of action_svgs){
            svg.style.filter = "invert(100%) sepia(0%) saturate(2%) hue-rotate(115deg) brightness(102%) contrast(100%)";
            console.log(svg.style);
        }

        const interactor_svgs = interactor_DOM.getElementsByTagName('img');
        for(const svg of interactor_svgs){
            svg.style.filter = "invert(100%) sepia(0%) saturate(2%) hue-rotate(115deg) brightness(102%) contrast(100%)";
        }
    }
}



export function resizeCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, g: ClientGraph) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // view.window_height = window.innerHeight;
    // view.window_width = window.innerWidth;
    requestAnimationFrame(function () { draw(canvas, ctx, g) })
}




export function draw_background(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.fillStyle = COLOR_BACKGROUND;
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();

    if (local_board.view.grid_show) {
        draw_grid(canvas, ctx);
    }
}


function draw_user_label(x:number, y:number, label:string, multicolor:Multicolor, timer_refresh:number, ctx: CanvasRenderingContext2D){
    
    // We set up a two second delay before starting to fade
    if(Date.now() - timer_refresh > 2000){
        ctx.globalAlpha = Math.max(0, 1 - (Date.now() - timer_refresh - 2000 )/2000);
    }
    else{
        ctx.globalAlpha = 1;
    }

    ctx.font = "400 17px Arial";
    const text = ctx.measureText(label);
    ctx.strokeStyle = multicolor.color;
    ctx.fillStyle = multicolor.color;
    // Rectangle 
    drawRoundRect(ctx, x, y, text.width + 10, 21, 5, multicolor.color, multicolor.color);

    // username
    ctx.beginPath();
    ctx.fillStyle = multicolor.contrast;
    ctx.fillText(label,  x + 5, y + 16);
    ctx.fill();

    ctx.globalAlpha = 1;
}


function draw_user_arrow(user: User, ctx: CanvasRenderingContext2D){
    if ( typeof user.canvas_pos == "undefined") return;
    
    // Background
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = user.multicolor.darken;
    ctx.moveTo(user.canvas_pos.x - 2, user.canvas_pos.y + 1);
    ctx.lineTo(user.canvas_pos.x - 2, user.canvas_pos.y + 21);
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    ctx.globalAlpha = 1;

    //Arrow
    ctx.beginPath();
    ctx.fillStyle = user.multicolor.color;
    ctx.moveTo(user.canvas_pos.x, user.canvas_pos.y);
    ctx.lineTo(user.canvas_pos.x + 13, user.canvas_pos.y + 13);
    ctx.lineTo(user.canvas_pos.x + 5, user.canvas_pos.y + 13);
    ctx.lineTo(user.canvas_pos.x, user.canvas_pos.y + 20);
    ctx.closePath();
    ctx.fill();

    // Bright sides
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = user.multicolor.lighten;
    ctx.moveTo(user.canvas_pos.x, user.canvas_pos.y);
    ctx.lineTo(user.canvas_pos.x + 13, user.canvas_pos.y + 13);
    ctx.lineTo(user.canvas_pos.x + 5, user.canvas_pos.y + 13);
    ctx.lineTo(user.canvas_pos.x, user.canvas_pos.y + 20);
    ctx.stroke();
}


export function draw_user(user: User, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    if ( typeof user.canvas_pos == "undefined") return;
    
    if(user.canvas_pos.x > canvas.width || user.canvas_pos.x < 0 || user.canvas_pos.y > canvas.height  || user.canvas_pos.y < 0 ){
        const x = clamp(user.canvas_pos.x, 0, canvas.width);
        const y = clamp(user.canvas_pos.y, 0, canvas.height);

        ctx.beginPath();
        ctx.fillStyle = user.multicolor.color;
        ctx.arc(x, y, 10, 0, 2*Math.PI);
        ctx.fill();

        ctx.font = "400 17px Arial";
        const text = ctx.measureText(user.label);

        let shift_x = 0;
        let shift_y = 0;
        if(user.canvas_pos.x > canvas.width){
            shift_x = - text.width - 23 ;
            shift_y = -10;
        }
        if(user.canvas_pos.x < 0){
            shift_x = 13 ;
            shift_y = -10;
        }
        if(user.canvas_pos.y > canvas.height){
            shift_x = - text.width/2 - 5;
            shift_y = - 34 ;

            if(user.canvas_pos.x < 0){
                shift_x = 10;
            }
            if(user.canvas_pos.x > canvas.width){
                shift_x = - text.width - 13;
            }
        }
        if(user.canvas_pos.y < 0){
            shift_x = - text.width/2 - 5;
            shift_y = 13 ;

            if(user.canvas_pos.x < 0){
                shift_x = 10;
            }
            if(user.canvas_pos.x > canvas.width){
                shift_x = - text.width - 13;
            }
        }

        // Date.now() is to prevent the label to fade when shown on the side of the screen
        // TODO: Change this.
        draw_user_label(x + shift_x, y + shift_y, user.label, user.multicolor, Date.now(), ctx);
        

    }
    else{
        // DRAW USERNAME 
        draw_user_label(user.canvas_pos.x + 10, user.canvas_pos.y + 17, user.label, user.multicolor, user.timer_refresh, ctx);
    

        // DRAW ARROW
        draw_user_arrow(user, ctx);
    }
    
}


function draw_rectangular_selection(ctx: CanvasRenderingContext2D) {
    if (local_board.view.is_rectangular_selecting) {
        ctx.beginPath();
        ctx.strokeStyle = SELECTION_COLOR;
        ctx.rect(local_board.view.selection_corner_1.x, local_board.view.selection_corner_1.y, local_board.view.selection_corner_2.x - local_board.view.selection_corner_1.x, local_board.view.selection_corner_2.y - local_board.view.selection_corner_1.y);
        ctx.stroke();

        ctx.globalAlpha = 0.07;
        ctx.fillStyle = SELECTION_COLOR;
        ctx.fill();

        ctx.globalAlpha = 1;
    }
}

function draw_grid(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    const grid_size = local_board.view.grid_size;

    for (let i = local_board.view.camera.x % grid_size; i < canvas.width; i += grid_size) {
        ctx.beginPath();
        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = 1;
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }

    for (let i = local_board.view.camera.y % grid_size; i < canvas.height; i += grid_size) {
        ctx.beginPath();
        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = 1;
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}


// DRAW USERS
function draw_users(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    users.forEach(user => {
        draw_user(user, canvas, ctx);
    });
}


function draw_following(ctx: CanvasRenderingContext2D){
    if(local_board.view.following !== null){
        const following_user = users.get(local_board.view.following);
        if(following_user){
            ctx.beginPath();
            ctx.strokeStyle = following_user.multicolor.color;
            ctx.lineWidth = 10;
            ctx.rect(0,0,1000,1000);
            ctx.stroke();
        }
        else{
            local_board.view.following = null;
        }
    }
}







function draw_alignements(ctx: CanvasRenderingContext2D) {
    if (local_board.view.alignement_horizontal) {
        drawLine(new CanvasCoord(0, local_board.view.alignement_horizontal_y), new CanvasCoord(window.innerWidth, local_board.view.alignement_horizontal_y), ctx, COLOR_ALIGNEMENT_LINE, 3);
    }
    if (local_board.view.alignement_vertical) {
        drawLine(new CanvasCoord(local_board.view.alignement_vertical_x, 0), new CanvasCoord(local_board.view.alignement_vertical_x, window.innerHeight), ctx, COLOR_ALIGNEMENT_LINE, 3);
    }

}

// DRAW STROKES
function draw_stroke(ctx: CanvasRenderingContext2D, s:ClientStroke){
    if(s.positions.length > 0){ 
        if(s.is_selected){
            const tlcanvas = s.canvas_corner_top_left;
            const brcanvas = s.canvas_corner_bottom_right;
            ctx.beginPath();
            ctx.strokeStyle = SELECTION_COLOR;
            ctx.lineWidth = 1;
            
            ctx.rect(tlcanvas.x - 3 ,tlcanvas.y - 3, brcanvas.x - tlcanvas.x + 6, brcanvas.y - tlcanvas.y + 6);
            ctx.stroke();

            
            let position_canvas = s.canvas_positions[0];
            ctx.beginPath();
            ctx.lineWidth = s.width + 4;
            ctx.moveTo(position_canvas.x, position_canvas.y);
            for(let i = 1; i<s.positions.length; i++){
                position_canvas = s.canvas_positions[i];
                ctx.lineTo(position_canvas.x, position_canvas.y);
            }
            ctx.stroke();
        }

        let position_canvas = s.canvas_positions[0];
        ctx.beginPath();
        ctx.strokeStyle = getCanvasColor(s.color, local_board.view.dark_mode);
        ctx.lineWidth = s.width;
        ctx.moveTo(position_canvas.x, position_canvas.y);
        for(let i = 1; i<s.positions.length; i++){
            position_canvas = s.canvas_positions[i];
            ctx.lineTo(position_canvas.x, position_canvas.y);
        }
        ctx.stroke();
    }
}


function draw_strokes(ctx: CanvasRenderingContext2D){
    local_board.strokes.forEach(s => {
        draw_stroke(ctx, s);
    });
}


// DRAW AREA
function draw_area(ctx: CanvasRenderingContext2D, a:ClientArea){


    ctx.beginPath();
    ctx.strokeStyle = a.color;
    ctx.lineWidth = 2;
    const c1canvas = a.canvas_corner_top_left;
    const c2canvas = a.canvas_corner_bottom_right;
    ctx.rect(c1canvas.x , c1canvas.y, c2canvas.x - c1canvas.x, c2canvas.y - c1canvas.y);
    ctx.stroke();

    ctx.globalAlpha = 0.07;
    ctx.fillStyle = a.color;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.font = "400 24px Arial";
    const measure = ctx.measureText(a.label);
    ctx.fillStyle = a.color;
    const text_canvas_pos = a.canvas_corner_bottom_left;
    ctx.rect(text_canvas_pos.x, text_canvas_pos.y - 29, measure.width + 10, 29);
    ctx.fill();

    
    ctx.beginPath();
    ctx.fillStyle = "white"; // TODO multicolor.contrast
    ctx.fillText(a.label, text_canvas_pos.x + 5, text_canvas_pos.y - 5);
    ctx.fill();



    if(interactor_loaded && interactor_loaded.id === "area"){
        const top_left = a.canvas_corner_top_left;
        const top_right = a.canvas_corner_top_right;
        const bot_right = a.canvas_corner_bottom_right;

        const corner_side = 18;

        ctx.beginPath();
        ctx.strokeStyle = a.color;
        ctx.fillStyle = a.color;
        ctx.lineWidth = 2;
        ctx.rect(top_left.x, top_left.y, corner_side, corner_side);
        ctx.stroke();
        // ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = a.color;
        ctx.lineWidth = 2;
        ctx.rect(top_right.x-corner_side, top_right.y, corner_side, corner_side);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = a.color;
        ctx.lineWidth = 2;
        ctx.rect(bot_right.x-corner_side, bot_right.y-corner_side, corner_side, corner_side);
        ctx.stroke();
    }
}


function draw_areas(ctx:CanvasRenderingContext2D)
{
    local_board.areas.forEach(a => {
        draw_area(ctx, a);
    });
}

function draw_interactor(ctx: CanvasRenderingContext2D)
{
    if (local_board.view.is_drawing_interactor){
       interactor_loaded.draw(ctx)
    }
}

function draw_graph_generated(ctx: CanvasRenderingContext2D){
    if ( graph_clipboard != null){
        graph_clipboard.draw(ctx);
    }
}

export function draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, g: ClientGraph) {
    draw_background(canvas, ctx);
    
    local_board.draw(ctx);

    draw_areas(ctx);
    draw_alignements(ctx);
    draw_strokes(ctx);
    g.draw(ctx);
    draw_users(canvas, ctx);
    draw_rectangular_selection(ctx);
    draw_interactor(ctx);
    draw_graph_generated(ctx);
    // draw_following(ctx);
}

