import {By, WebDriver, until} from "selenium-webdriver";
const timeout_ = 10000;
export async function waitElement(location : By, driver : WebDriver, timeout : number | undefined = undefined){
    let to = timeout || timeout_;
    try{await driver.wait(until.elementLocated(location), to);}catch(e){}
    let elem = await driver.findElement(location);
    await driver.wait(until.elementIsVisible(elem), to);
    return elem;
}