import fs from "fs";
import { randomArrayPick } from "./stringUtilities";
export function randomLinePick(filename: string) {
    if (!fs.existsSync(filename))
        throw "File does not exists\n"+filename;
    let result = fs.readFileSync(filename);
    let returned: string;
    let lines = result.toString("ascii").split(/\r?\n\r?/g);
    returned = randomArrayPick(lines);
    return returned;
}