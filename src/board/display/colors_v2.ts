

export enum Color {
    Neutral = "Neutral",
    Gray = "Gray",
    Blue = "Blue",
    Red = "Red",
    Green = "Green",
    Pink = "Pink",
    Purple = "Purple",
    Yellow = "Yellow",
    Orange = "Orange",
    Brown = "Brown"
}

export function getColor(i: number): Color{
    if (i == 0){
        return Color.Neutral;
    } else if (i == 1){
        return Color.Gray;
    } else if (i == 2){
        return Color.Blue
    } else if (i == 3){
        return Color.Red
    }  else if (i == 4){
        return Color.Green
    }  else if (i == 5){
        return Color.Pink
    }  else if (i == 6){
        return Color.Purple
    } else if (i == 7){
        return Color.Yellow
    } else if (i == 8){
        return Color.Orange
    } else if (i == 9){
        return Color.Brown
    } else {
        return Color.Neutral
    }
}


export class ColorData {
    dark: string;
    light: string;
    constructor(dark: string, light: string){
        this.dark = dark;
        this.light = light;
    }
}

export const colorsData  = new Map<Color, ColorData>();
colorsData.set(Color.Neutral, new ColorData("#ffffff", "#000000"));
colorsData.set(Color.Gray, new ColorData("#929191",  "#7B7B7B"))
colorsData.set(Color.Blue, new ColorData("#56B4E9", "#56B4E9"));
colorsData.set(Color.Red, new ColorData("red", "#dd0000"));
colorsData.set(Color.Green, new ColorData("#08D454", "#08D454"));
colorsData.set(Color.Pink, new ColorData("#EC95C6", "#EC95C6"));
colorsData.set(Color.Purple, new ColorData("#CB46F7", "#AB38D2"));
colorsData.set(Color.Yellow, new ColorData("#F1D943", "#f3d411"));
colorsData.set(Color.Orange, new ColorData("#E66700", "#E66700"));
colorsData.set(Color.Brown, new ColorData("#8C3F04", "#8C3F04"));

 export function getCanvasColor(color: Color, darkMode: boolean): string{
    const colorData = colorsData.get(color);
    if (typeof colorData == "undefined"){
        console.log(`Error: cannot get colorData of ${color}`);
        return "#000000";
    } 
    if (darkMode) return colorData.dark;
    else return colorData.light;
}

