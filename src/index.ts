import { Builder, WebDriver, Key, until } from "selenium-webdriver";
import { randomString, randomFirstName, randomLastName, detectProvider, downloadPage, sleep } from "./utils/stringUtilities";
import { createAccount, account, getRoutinesLength } from "./data/structure";
import { forProvider } from "./auto/for-provider";
import { Options } from "selenium-webdriver/chrome";
import { Worker, workerData } from "worker_threads";
import { join, format, } from "path";
import { Database } from "./data/database";
import fs from "fs";
import { conf } from "./data/structure"
//@ts-ignore
import ua from "fake-useragent"
import { randomLinePick } from "./utils/fileUtilities";
let drivers: WebDriver[] = [];
let maxRoutine = getRoutinesLength();
let counter = 0;
let res: boolean = true;
let d = new Database();
let cont = "";
let worker: Worker;
export async function start() {
    let error: boolean = false;
    let e = createAccount(randomFirstName(), randomLastName());
    // let e : account = {email: "fagiolo1234@outlook.it", password: "adasdasdasd", name: "dasfdas", surname:"asdasd"}
    console.log(e);
    sleep(3000);
    let provider = detectProvider(e.email);
    let result = await new Promise<{ res: boolean, ac: account }>((res) => {
        if (!provider)
            process.exit();
        (<Promise<{ res: boolean, ac: account }>>forProvider(provider).register(e)).then(res).catch(async () => {
            error = true;
            res();
        })
    })
    await closeDrivers();
    console.log(error);
    if (error)
        process.exit();
    res = result.res;
    if (!result.res) {
        process.exit();
    }
    let line: string = result.ac.email + ":" + result.ac.password;
    fs.appendFileSync(join(__dirname, "../data/mailGenerated.txt"), "\n" + line);
    fs.writeFileSync(join(__dirname, "../data/emailswork.txt"), line);
    await d.addUser({ ...result.ac, country: cont });
    console.log(line);
}

export async function newDriver() {
    let options = new Options();
    let k = ua();
    options.addArguments("--incognito", "--lang=en");
    let m = await new Builder().withCapabilities({
        'browserName': "chrome",
        userAgent: k,
        "user-agent": k
    }).setChromeOptions(options).build();
    console.log(k);
    await m.manage().deleteAllCookies();
    drivers.push(m);
    return m;
}

export function closeDriver(driver: WebDriver) {
    drivers.splice(drivers.indexOf(driver), 1);
}

export async function closeDrivers(n: number = 0) {
    let error = false;
    await new Promise(res => {
        drivers[n].close().then(res).catch(() => { res(); error = true });
    })
    closeDriver(drivers[n])
    if (drivers[++n] !== undefined)
        await closeDrivers(n);

}

process.on("beforeExit", async () => {
    if (drivers.length > 0)
        closeDrivers();
})

async function vpn() {
    if (!res)
        return;
    counter++;
    // cont = randomLinePick(join(__dirname, "../countries.txt"))
    cont = "it";
    worker = new Worker(join(__dirname, "/workers/vpn_thread.js"), {
        workerData: {
            country: cont
        }
    });


    worker.once("exit", () => {
        console.log("Routine terminata")
        if (conf.confirm_spotify)
            process.exit();
        if (counter >= maxRoutine)
            process.exit();
        else {
            sleep(5000);
            vpn();
        }
    });
    await new Promise((res, rej) => {

        worker.on("message", async (data) => {
            if (data === "start") {
                if (conf.confirm_spotify) await confirmSpoti();
                else {
                    await start();

                    // let w1 = new Worker(join(__dirname, "workers/thread.js"));
                    // let w2 = new Worker(join(__dirname, "workers/thread.js"));
                    // let close1 = false;
                    // let close2 = false;
                    // w1.on("exit", ()=>{
                    //     close1 = true;
                    //     if(close2 === close1)
                    //         worker.postMessage("exit");
                    // })

                    // w2.on("exit", ()=>{
                    //     close2 = true;
                    //     if(close2 === close1)
                    //         worker.postMessage("exit");
                    // })
                };
                res();
            }
        });
    })
    //await start();
    worker.postMessage("exit");

}

startDB();
async function startDB() {
    await d.start();
    console.log("Database connected");
    await vpn();
}

async function confirmSpoti() {
    let list = fs.readFileSync(join(__dirname, "../data/mailSpotifyToConfirm.txt"));
    let lines = list.toString("ascii").split(/\r?\n\r?/g);
    console.log(lines);
    let line = lines.pop();
    fs.unlinkSync(join(__dirname, "../data/mailSpotifyToConfirm.txt"));
    lines.forEach(e => {
        fs.appendFileSync(join(__dirname, "../data/mailSpotifyToConfirm.txt"), "\n"+ e )
    });

    console.log(line);
    if (line && !line.includes("proton")) {
        let account = createAccount(line, undefined)
        let provider = detectProvider(account.email);
        if (provider) {
            console.log(account)
            await forProvider(provider).inbox(account, "spotify");
        }
        fs.appendFileSync(join(__dirname, "../data/mailSpotifyUsed.txt"), line + "\n");
    }else {process.exit()}
}






// let k = fs.readFileSync(join(__dirname, "../data/mailGenerated.txt"));
// let m = k.toString("ascii").split(/\n/g);
// m.forEach(e=>{
//     fs.appendFileSync(join(__dirname, "../data/mailFelix.txt"), e.split(":")[0]+"\n");
// });