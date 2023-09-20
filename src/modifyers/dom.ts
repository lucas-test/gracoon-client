import { ClientBoard } from "../board/board";
import { createPopup } from "../popup";
import { removeRandomLinks, intoTournament } from "./implementations/into_tournament";
import { GraphModifyer } from "./modifyer";

// --- Modifyers available ---
const modifyers_available = new Array<GraphModifyer>(
    intoTournament,
    removeRandomLinks
    );




export function setup_modifyers_div(board: ClientBoard) {
    createPopup("modifyers_div", "Modifyers");
    const popup_content = document.getElementById("modifyers_div_content");
    if (popup_content == null) return;
    popup_content.style.display = "flex";
    popup_content.classList.add("scrolling_y","non_scrolling_bar");

    // List of the modifyers on the left
    const modifyers_list = document.createElement("div");
    modifyers_list.id = "modifyers_list";
    popup_content.appendChild(modifyers_list);
    
    // Search input
    const search_input = document.createElement("input");
    search_input.classList.add("search_filter");
    search_input.type = "text";
    search_input.id = "modifyer_search_input";
    search_input.onkeyup = filterList;
    search_input.placeholder = "Search for names..";
    modifyers_list.appendChild(search_input);
    

    const modifyer_activated_div = document.createElement("div");
    modifyer_activated_div.id = "modifyer_configuration";
    popup_content.appendChild(modifyer_activated_div);

    // create list of modifyers
    for (const mod of modifyers_available) {
        const text = document.createElement("div");
        text.classList.add("modifyer_item");
        text.innerHTML = mod.humanName;
        text.onclick = () => {
            activate_modifyer_div(board, mod);
        }
        modifyers_list.appendChild(text)
    }
}

function turn_off_modifyers_div() {
    const div = document.getElementById("modifyers_div");
    if (div == null) return;
    div.style.display = "none";
}

export function turn_on_modifyers_div() {
    const div = document.getElementById("modifyers_div");
    if (div == null) return;
    div.style.display = "block";
}

function activate_modifyer_div(board: ClientBoard, mod: GraphModifyer) {
    const div = document.getElementById("modifyer_configuration");
    if (div == null) return;
    div.innerHTML = ""; // TODO clear better ??

    // Title
    const title = document.createElement("h2");
    title.innerText = mod.humanName;
    div.appendChild(title);

    // Description
    const description = document.createElement("p");
    description.innerText = mod.description;
    div.appendChild(description);

    // Attributes
    for (const attribute of mod.attributes) {
        attribute.reset_inputs(board);
        const attribute_div = document.createElement("div");
        const label = document.createElement("label");
        label.innerText = attribute.name + ": ";
        attribute_div.appendChild(label);
        attribute_div.appendChild(attribute.div);
        div.appendChild(attribute_div);
    }

    // Button
    const modify_button = document.createElement("button");
    modify_button.textContent = "Apply";
    modify_button.onclick = (e) => {
        for( const attribute of mod.attributes.values() ){
            if( attribute.div.classList.contains("invalid")){
                return;
            }
        }
        board.emit_apply_modifyer(mod);
        turn_off_modifyers_div();
    }
    div.appendChild(modify_button);
}



function filterList() {
    const input = <HTMLInputElement>document.getElementById('modifyer_search_input');
    const filter = input.value.toUpperCase();
    const contentDiv = document.getElementById("modifyers_div_content");
    const elementsList = <HTMLCollectionOf<HTMLDivElement>>contentDiv.getElementsByClassName('modifyer_item');

    for (let i = 0; i < elementsList.length; i++) {
        const txtValue = elementsList[i].innerHTML;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            elementsList[i].style.display = "";
        } else {
            elementsList[i].style.display = "none";
        }
    }
}