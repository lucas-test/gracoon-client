import { ClientBoard } from "../board/board";

export class Integer {
    name: string;
    value: number = 0;
    div: HTMLDivElement;
    min: number = Number.NaN;
    max: number = Number.NaN;
    input: HTMLInputElement;

    constructor(name: string, initValue: number, min?: number, max?: number) {
        this.name = name;
        this.value = initValue;
        if (typeof min !== 'undefined') { 
            this.min = min; 
        }
        if (typeof max !== 'undefined') { 
            this.max = max; 
        }

        this.div = document.createElement("div");

        const label = document.createElement("label");
        label.innerText = name + ": ";
        label.classList.add("attribute_label");

        this.div.appendChild(label);


        let newInput = document.createElement("input");
        newInput.classList.add("attr_integer");
        newInput.name = this.name;
        newInput.type = "number";
        if (typeof min !== 'undefined') { 
            newInput.min = min.toString(); 
        }
        if (typeof max !== 'undefined') { 
            newInput.max = max.toString(); 
        }
        newInput.value = String(this.value);
        newInput.onchange = (e) => { 
            this.updateValue();
        }
        this.input = newInput;
        this.div.appendChild(newInput);
    }

    updateValue() {
        const parsedValue = parseInt(this.input.value);
        if ( isNaN(parsedValue) || ( !isNaN(this.min) && parsedValue < this.min) || ( !isNaN(this.max) && parsedValue > this.max)){
            this.div.classList.add("invalid");
            this.value = 0;
        }else {
            this.div.classList.remove("invalid");
            this.value = parsedValue;
        }
    }

    reset_inputs(board: ClientBoard){
        this.div.classList.add("attribute_input");
    }
}

export class Percentage {
    name: string;
    value: number = 0.5;
    div: HTMLDivElement;
    input: HTMLInputElement;
    currentValueSpan: HTMLSpanElement;

    constructor(name: string, value?: number) {
        this.name = name;
        if (value){
            this.value = value;
        }
        this.div = document.createElement("div");

        const label = document.createElement("label");
        label.innerText = name + ": ";
        label.classList.add("attribute_label");
        this.div.appendChild(label);


        const newInput = document.createElement("input");
        newInput.classList.add("attr_percentage");
        newInput.name = this.name;
        newInput.type = "range";
        newInput.min = "0.";
        newInput.max = "100";
        newInput.step = "0.1";
        newInput.value = String(this.value*100);
        this.div.appendChild(newInput);
        this.input = newInput;

        const currentValue = document.createElement("span");
        currentValue.id = name+"_current_value";
        currentValue.classList.add("attribute_range_current_value");
        currentValue.innerText=String(this.value);
        this.currentValueSpan = currentValue;
        this.div.appendChild(currentValue);

        newInput.oninput = (e) => {
            this.value = parseFloat((parseFloat(newInput.value)/100).toFixed(4));
            // const current_value_span = document.getElementById(this.name+"_current_value");
            // if(current_value_span){
                currentValue.innerText = String(this.value);
            // }
        }
    }

    updateValue() {
        this.value = parseFloat((parseFloat(this.input.value)/100).toFixed(4));
        this.currentValueSpan.innerText = String(this.value);
    }

    reset_inputs(board: ClientBoard){
        this.div.classList.add("attribute_input");
    }
}

export enum AreaChoice {
    EVERYTHING = "Everything",
    INDUCED_GRAPH_BY_SELECTED_VERTICES = "Induced Selection"
}

export class AreaIndex {
    name: string;
    value: number | AreaChoice;
    div: HTMLDivElement;

    constructor(name: string) {
        this.name = name;
        this.div = document.createElement("div");
        this.value = AreaChoice.EVERYTHING;
    }

    reset_inputs(board: ClientBoard){
        this.div.innerHTML = "";
        this.div.classList.add("attribute_input");

        // Everything Radio Input
        Object.values(AreaChoice).forEach( (ugaf) => {
            const everythingInput = document.createElement("input");
            everythingInput.name = this.name;
            everythingInput.type = "radio";
            everythingInput.value = ugaf;
            everythingInput.onchange = (e) => {
                this.value = ugaf;
            }
            if (ugaf == this.value){
                everythingInput.checked = true;
            }
            const everythingLabel = document.createElement("label");
            everythingLabel.innerText = ugaf;
            everythingLabel.htmlFor = ugaf;
            everythingLabel.onclick = (e) => {
                everythingInput.checked = true;
                this.value = ugaf;
            }
            const everything_div = document.createElement("div");
            everything_div.appendChild(everythingInput);
            everything_div.appendChild(everythingLabel);
            this.div.appendChild(everything_div);
        })

        // for every area add a radio input
        for( const [index, area] of board.areas.entries()){
            const newInput = document.createElement("input");
            newInput.name = this.name;
            newInput.type = "radio";
            newInput.value = area.label;
            newInput.onchange = (e) => {
                this.value = index;
            }
            const newInput_label = document.createElement("label");
            newInput_label.innerText = area.label;
            newInput_label.htmlFor = area.label;
            newInput_label.onclick = (e) => {
                newInput.checked = true;
                this.value = index;
            }

            const newInput_div = document.createElement("div");
            newInput_div.appendChild(newInput);
            newInput_div.appendChild(newInput_label);
            this.div.appendChild(newInput_div);
        }
    }

}

// TODO realnumber


export class ListAttribute {
    name: string;
    value: string;
    div: HTMLDivElement;
    input: HTMLInputElement;

    constructor(name: string, initValue: string) {
        this.name = name;
        this.value = initValue;

        this.div = document.createElement("div");

        // Label
        const label = document.createElement("label");
        label.innerText = name + ": ";
        label.classList.add("attribute_label");
        this.div.appendChild(label);

        // Input
        this.input = document.createElement("input");
        this.input.classList.add("attr_list");
        this.input.name = this.name;
        this.input.type = "text";
        this.input.value = this.value;
        this.input.oninput = (e) => { 
            this.updateValue();
        }
        this.div.appendChild(this.input);
    }

    updateValue() {
        this.value = this.input.value;
    }

    reset_inputs(board: ClientBoard){
        this.div.classList.add("attribute_input");
    }
}



export interface AttributesArray extends Array<Integer | Percentage | AreaIndex | ListAttribute> { };
