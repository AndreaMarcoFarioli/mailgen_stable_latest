import { randomLinePick } from "./fileUtilities";
import { join } from "path";
import { conf, Providers, jProviders } from "../data/structure";
import request from "request";
import { Stream } from "request/node_modules/form-data";

const charset_const = "abcdefghijklmnopqrstuvwxyz1234567890?";
export function randomString(len : number = 8, charset : string = charset_const){
    let returned : string = "";
    for(let i = 0; i < len; i++){
        let char = charset.charAt(Math.floor(Math.random()*charset.length));
        if(randomBool())
            char = char.toUpperCase();
        returned += char;
    }
    return returned;
}

export function randomBool(){
    return Math.random() > 0.5;
}

export function shuffleOrder<T>(...args : T[]){
    arrayShuffle(args);
    return args;
}

export function arrayShuffle(array : any[]){
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

export function randomFirstName(){
    return randomLinePick(join(__dirname, "/../../data/names.txt"));
}

export function randomLastName(){
    return randomLinePick(join(__dirname, "/../../data/lastnames.txt"));
}

export function randomWorkEmail(){
    return randomLinePick(join(__dirname, "/../../data/emailswork.txt"));
}

export function randomArrayPick(array: any[]){
    let index = Math.floor(Math.random() * (array.length)) % array.length;
    return array[index];
}

export function detectProvider(email : string){
    let _ : {[id: string]: any} = conf.pattern;
    let keys : Providers[] = Object.keys(_);
    let returned : jProviders | undefined = undefined;
    for(let i = 0; i < keys.length; i++){
        let m = (_[keys[i]]);
        if(m !== undefined){
            let pattern : RegExp[] | RegExp = m;
            if(Array.isArray(pattern))
                for(let e = 0; e < pattern.length; e++){
                    if(pattern[e].test(email)){
                        returned = <jProviders>keys[i];
                        break;
                    }
                }
            else
                if(pattern.test(email))
                    returned = <jProviders>keys[i];
            if(returned !== undefined)
                break;
        }
    }
    return returned;
}

export function sleep(milliseconds : number) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }

const months = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const maxs = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31,30,31];
export function randomDate(){
    let randomYear = (Math.floor(Math.random() * 50) + 1950)+"";
    let e;
    let randomMonth = months[e = Math.floor(Math.random()*(months.length-1))]
    let randomDay = (Math.floor(Math.random()*(maxs[e]-1))+1)+"";
    return {
        day: randomDay,
        month: randomMonth,
        year: randomYear
    }
}

export function downloadPage(url : string) {
    return new Promise<string>((resolve, reject) => {
        request.get(url, (error : string, response, body : string) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
            }
            resolve(body);
        });
    });
}

export function base64_encode(bitmap : string) {
    // read binary data
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}