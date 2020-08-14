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
import { ObjectID, Db } from "mongodb";
import { create } from "domain";
import { getBalance } from "./utils/captchaUtils";
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

async function vpn() {
    if (!res)
        return;
    // await loopback();
    async function loopback() {
        await caput();
    }
    // return;
    counter++;
    cont = randomLinePick(join(__dirname, "../countries.txt"))
    worker = new Worker(join(__dirname, "/workers/vpn_thread.js"), {
        workerData: {
            country: "it"
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
                else if (conf.caput) await caput();
                else {
                    await start();
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
    await getBalance();
    await d.start();
    console.log(`Machine id: ${d._id}`)
    console.log("Database connected");
    await vpn();
}

async function caput() {
    let caput = await d.getCaputUser();
    // console.log(caput)
    if (!caput)
        return;
    let line = `${caput.email}:${caput.password}`;
    let account = createAccount(line, undefined);
    let provider = detectProvider(account.email);
    if (provider) {
        let res = await forProvider(provider).inbox(account, "restoreCaput");
        console.log(res);
        if (res === "empty") {
            console.log("not found mail")
        } else if (res !== "ERROR_DISABLED") {
            await d.setPasswordAccount(new ObjectID(caput._id), res, caput.subs.spotify.password);
        }
    }
    await d.setAccountPick(new ObjectID(caput._id));
    process.exit();
}

async function confirmSpoti() {
    let line, db: any;
    if (!conf.from_db) {
        let list = fs.readFileSync(join(__dirname, "../data/mailSpotifyToConfirm.txt"));
        let lines = list.toString("ascii").split(/\r?\n\r?/g);
        console.log(lines);
        line = lines.pop();
        fs.unlinkSync(join(__dirname, "../data/mailSpotifyToConfirm.txt"));
        lines.forEach(e => {
            fs.appendFileSync(join(__dirname, "../data/mailSpotifyToConfirm.txt"), "\n" + e)
        });
    } else {
        db = await d.getUserForConfirm();
        if (db) {
            line = db.email + ":" + db.password;
            await d.setUserInUsed(new ObjectID(db._id));
            process.on("beforeExit", async () => {
                console.log("test");
                //@ts-ignore
                await d.setUserInUsed(new ObjectID(db._id), false);
            });
        }
    }
    console.log(db)
    console.log(line);
    if (line && !line.includes("proton") && db) {
        let account;
        account = createAccount(line, undefined);
        let provider = detectProvider(account.email);
        if (provider) {
            console.log(account)
            await forProvider(provider).inbox(account, "spotify");
        }
        if (!conf.from_db)
            fs.appendFileSync(join(__dirname, "../data/mailSpotifyUsed.txt"), line + "\n");
        else {
            await d.setSpotifyConfirmed(new ObjectID(db._id));
            await d.setUserInUsed(new ObjectID(db._id), false)
        }
    } else { process.exit() }
}






// let k = fs.readFileSync(join(__dirname, "../data/mailGenerated.txt"));
// let m = k.toString("ascii").split(/\n/g);
// m.forEach(e=>{
//     fs.appendFileSync(join(__dirname, "../data/mailFelix.txt"), e.split(":")[0]+"\n");
// });