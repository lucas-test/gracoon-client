import { SideBar } from "./side_bar";

import svgIcons from '../img/icons/*.svg';


export enum ORIENTATION_SIDE_BAR{
    VERTICAL = 1,
    HORIZONTAL = 2
}

export enum ORIENTATION_INFO{
    TOP = "TOP",
    BOTTOM = "BOTTOM",
    LEFT = "LEFT",
    RIGHT = "RIGHT"
}


export abstract class ElementSideBar{
    readonly id: string; 
    info: string; // The information of the tooltip // TODO
    shortcut: string; 
    initial_img_src: string; // The default src (do not change)
    img_dom : HTMLImageElement; 
    cursor_style: string;
    dom : HTMLElement;
    my_sidebar: SideBar; // The sidebar the element belongs
    rootSidebar: SideBar | undefined;
    orientation_info: ORIENTATION_INFO;



    constructor(id:string, info: string, shortcut: string, orientation_info: ORIENTATION_INFO, img_src: string, cursor_style: string,  sidebar?: SideBar, rootSidebar?: SideBar) {
        this.info = info;
        this.shortcut = shortcut;
        this.initial_img_src = img_src;
        this.cursor_style = cursor_style;
        this.id = id;
        this.orientation_info = orientation_info;
        if(sidebar !== undefined){
            this.my_sidebar = sidebar;
            this.render(sidebar);
            sidebar.add_elements(this);
        } else {
            this.my_sidebar = null;
        }
        if (rootSidebar !== undefined){
            this.rootSidebar = rootSidebar;
        } else {
            this.rootSidebar = undefined;
        }
       
    }

    /**
     * Change the src of the img tag. 
     * NOTE: it does NOT change the parameter img_src that needs to stay in case we have to reset the img
     * @param src path of the src image
     * @returns true iff the change was successful
     */
    update_img(src :string):boolean{
        try {
            this.img_dom.src = svgIcons[src]; 
            return true;
        } catch (error) {
            console.error("Image not loaded yet when you tried to update it. Dom is null.", error);
            return false;
        }
    }


    /**
     *  Reset the img to its original value (the one stored in img_src)
     * @returns true iff the image was successfully reset
     */
    reset_img():boolean{
        try {
            this.img_dom.src = svgIcons[this.initial_img_src]; 
            return true;
        } catch (error) {
            console.error("Image not loaded yet when you tried to update it. Dom is null.", error);
            return false;
        }
    }

    /**
     * Create and insert the HTMLElements of the element into the sidebar given in parameter
     * @param my_sidebar The sidebar the element belongs
     */
    render(my_sidebar:SideBar){
        this.my_sidebar = my_sidebar;
        this.dom = document.getElementById(this.id);
        if(this.dom != null){
            console.error(`Failing create Item ${this.id}. The id already exists.`);
            this.dom.innerHTML = "";
        }
        else{
            this.dom = document.createElement("div");
            this.dom.id = this.id;
        }
        this.dom.style.cursor = this.cursor_style;
        this.dom.classList.add("side_bar_element");

        this.img_dom = document.createElement("img");
        this.img_dom.src = svgIcons[this.initial_img_src];
        this.img_dom.id = this.id+'_img';
        this.img_dom.classList.add("side_bar_element_img");
        
        this.my_sidebar.dom.appendChild(this.dom);
        this.dom.appendChild(this.img_dom);

        // TODO: Remove -- just for debugging
        this.img_dom.onmouseover = () => {
            console.log(this.id);
        }


        // TODO: Just one div_recap for all elements
        const div_recap = document.createElement("div");
        div_recap.classList.add("interactor_recap");
        if ( this.shortcut != ""){
            div_recap.innerHTML = this.info + " <span class='shortcut'>" + this.shortcut + "</span>";
        }else {
            div_recap.innerHTML = this.info;
        }

        div_recap.id = "recap_" + this.id;
        div_recap.style.position = "absolute";
        div_recap.style.backfaceVisibility = "hidden";
        div_recap.style.zIndex = "10";
        document.body.appendChild(div_recap);
   
        this.img_dom.addEventListener("mouseenter", () => {
            div_recap.style.display = "block";
            const offsets = this.img_dom.getBoundingClientRect();

            switch(this.orientation_info){
                case(ORIENTATION_INFO.TOP):
                    div_recap.style.left = String(offsets.left) + "px"; 
                    div_recap.style.top = String(offsets.top - 60) + "px";
                    break;
                case(ORIENTATION_INFO.BOTTOM):
                    div_recap.style.left = String(offsets.left) + "px";
                    div_recap.style.top = String(offsets.top + 60) + "px";
                    break;
                case(ORIENTATION_INFO.LEFT):
                    
                    div_recap.style.left = String(offsets.left - div_recap.offsetWidth - 20) + "px";
                    div_recap.style.top = String(offsets.top) + "px";
                    break;
                case(ORIENTATION_INFO.RIGHT):
                    div_recap.style.left = String(offsets.left + 60) + "px";
                    div_recap.style.top = String(offsets.top) + "px";
                    break;
            }
        });

        

        this.img_dom.addEventListener("mouseleave", () => {
            // div_recap.hidden = true;
            div_recap.style.display = "none";
        });
    }

    unselect(b:boolean) {
        throw new Error("Method not implemented.");
    }

    abstract setRootSideBar(rootSideBar: SideBar);


}