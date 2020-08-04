import { ProviderDriver, account, conf, inboxString } from "../data/structure";
import { newDriver, closeDriver } from "..";
import { waitElement } from "../utils/seleniumUtilities";
import { WebElement, Key, WebDriver, until, By } from "selenium-webdriver";
import { sleep, randomDate, downloadPage, base64_encode } from "../utils/stringUtilities";
import {
    AntiCaptcha,
    AntiCaptchaError,
    INoCaptchaTaskProxyless,
    INoCaptchaTaskProxylessResult,
    QueueTypes,
    TaskTypes,
    IImageToTextTask,
    ErrorCodes,
    IImageToTextTaskResult
} from "anticaptcha"

import fs, { copyFileSync } from "fs";
import { join } from "path";
import { Stream } from "request/node_modules/form-data";
import request from "request";
export class OutlookDriver implements ProviderDriver {
    account: account = { name: "", surname: "", email: "", password: "" };
    res: boolean = false;
    solved: boolean = false;
    error: boolean = false;
    public register = async (account: account) => {
        this.account = account;
        let driver = await newDriver();
        await driver.get(conf.links.outlook.register);
        await this.setEmailReg(await waitElement(conf.uniqueStructure.outlook.register.email, driver), driver);
        sleep(250)
        await this.setPasswordReg(await waitElement(conf.uniqueStructure.outlook.register.password, driver));
        sleep(250)
        await this.setIdentityName(await waitElement(conf.uniqueStructure.outlook.register.name, driver));
        sleep(250)
        await this.setIdentityLastname(await waitElement(conf.uniqueStructure.outlook.register.lastName, driver));
        sleep(250)
        await this.setAge(driver);
        sleep(250)
        await this.solveCaptcha(driver);
        sleep(250);
        if (this.solved && !this.error) {
            //await this.openOther(await waitElement(conf.uniqueStructure.outlook.inbox.mailLowImportanceIcon, driver), driver);
            //await this.openEmail(await waitElement(conf.uniqueStructure.outlook.inbox.mailIncome, driver), driver, false);
        }
        return { ac: account, res: this.res };
    };
    public inbox = async (account: account, inboxFor: inboxString) => {
        this.account = account;
        let driver = await newDriver();
        await driver.get(conf.links.outlook.login);
        await this.setUsername(await waitElement(conf.uniqueStructure.outlook.inbox.email, driver));
        sleep(1000);
        await this.setPassword(await waitElement(conf.uniqueStructure.outlook.inbox.password, driver));
        let current = await driver.getCurrentUrl();
        sleep(1000);
        while (current !== await driver.getCurrentUrl()) { };
        await driver.wait(until.elementLocated(conf.uniqueStructure.outlook.inbox.mailLowImportanceIcon), 90000);
        await this.openOther(driver, inboxFor);
        sleep(1000);
        let no = false;
        let elem = await new Promise<WebElement>(res=>{
            waitElement(conf.uniqueStructure.outlook.inbox.mailIncome[inboxFor].activation, driver).then(res).catch(()=>{no = true; res()})
        })
        let codeValue = "";
        if(!no)
            codeValue = await this.openEmail(elem, driver, inboxFor);
        return codeValue;
    };

    private setUsername = async (elem: WebElement) => {
        await elem.sendKeys(this.account.email);
        await elem.sendKeys(Key.ENTER);
    }

    private setPassword = async (elem: WebElement) => {
        await elem.sendKeys(this.account.password);
        await elem.sendKeys(Key.ENTER);
    }

    private openOther = async (driver: WebDriver, forInbox: inboxString) => {
        let firstMail = await new Promise<WebElement>(res=>{waitElement(conf.uniqueStructure.outlook.inbox.mailIncome[forInbox].activation, driver, 5000).then(res).catch(()=>res(undefined))});
        console.log(firstMail);
        if (!firstMail) {
            let elem = await waitElement(conf.uniqueStructure.outlook.inbox.mailLowImportanceIcon, driver, 20000)
            await elem.click();
        }
    }
    private openEmail = async (elem: WebElement, driver: WebDriver, forInbox: inboxString) => {
        await elem.click();
        let codeValue = "";
        let error = false;
        if (forInbox === "proton") {
            let code = await waitElement(conf.uniqueStructure.outlook.inbox.activation.proton.code, driver);
            codeValue = (await code.getText());
        }
        else if (forInbox === "spotify") {
            let link = await new Promise<WebElement>(res=>{
                waitElement(conf.uniqueStructure.outlook.inbox.activation.spotify.link, driver, 5000).then(res).catch(()=>{error = true; res()});
            }) 
            if (!error) {
                let drive = await newDriver();
                await drive.get(await link.getAttribute("href"));
                await driver.wait(async function () {
                    const readyState = await driver.executeScript('return document.readyState');
                    return readyState === 'complete';
                });
                closeDriver(drive);
                await drive.close();
            }
        }
        if (!error) {
            let k = await elem.findElement(By.css(".ms-Icon.root-32.css-52.ms-Button-icon.icon-47"));
            await k.click();
        }
        return codeValue;
    }

    private setEmailReg = async (elem: WebElement, driver: WebDriver) => {
        await new Promise((res, rej) => {
            elem.sendKeys(this.account.email).then(res).catch(() => {
                //process.exit();
            });
        });

        await waitElement(conf.uniqueStructure.outlook.register.extensionParent, driver);
        let sele = driver.findElement(conf.uniqueStructure.outlook.register.extension);
        //@ts-ignore
        await sele.sendKeys(this.account.extension);
        await elem.sendKeys(Key.ENTER);
    }

    private setPasswordReg = async (elem: WebElement) => {
        await elem.sendKeys(this.account.password, Key.ENTER);
    }

    private setIdentityName = async (elem: WebElement) => {
        await elem.sendKeys(this.account.name);
    }

    private setIdentityLastname = async (elem: WebElement) => {
        await elem.sendKeys(this.account.surname, Key.ENTER);
    }

    private setAge = async (driver: WebDriver) => {
        let elem = await waitElement(conf.uniqueStructure.outlook.register.day, driver);
        let date = randomDate();
        console.log(date);
        await elem.sendKeys(date.day);
        elem = await waitElement(conf.uniqueStructure.outlook.register.month, driver);
        await elem.sendKeys(date.month);
        elem = await waitElement(conf.uniqueStructure.outlook.register.year, driver);
        await elem.sendKeys(date.year);
        elem = await waitElement(conf.uniqueStructure.outlook.register.sendBut, driver);
        await elem.click();
        sleep(5000);
    }

    private solveCaptcha = async (driver: WebDriver) => {
        try {
            let elem = await waitElement(conf.uniqueStructure.outlook.register.captcha, driver);
            let link = await elem.getAttribute("src");

            //let get: string = await downloadPage(link);
            await new Promise((resolve, reject) => {
                request(link).pipe(fs.createWriteStream("filename.jpeg")).on('close', () => {
                    resolve();
                });
            })
            let ma = fs.readFileSync("filename.jpeg");

            // let m = fs.createWriteStream(join(__dirname, "m.jpeg"));
            // get.pipe(m);
            //fs.writeFileSync(join(__dirname, "m.jpeg"), get);
            let base64 = (ma.toString("base64"));
            console.log(link);
            let m = await this.captchaSolverImageToText(base64);
            console.log("solvente");
            if (m === undefined)
                throw "no";
            let l = m.text.replace(" ", "");
            let la = await waitElement(conf.uniqueStructure.outlook.register.captchaField, driver);
            await writeString(l, la);
            await (await waitElement(conf.uniqueStructure.outlook.register.sendBut, driver)).click();
            await new Promise((res, rej) => {
                driver.wait(async () => {
                    return !(await (await driver.findElement(conf.uniqueStructure.outlook.register.error)).getAttribute("style")).toLowerCase().includes("none")
                }, 10000).then(() => {
                    this.error = true;
                    res();
                }).catch(() => {
                    this.error = false;
                    res()
                })
            });

            console.log(this.solved);
            if (this.error)
                return;
            await new Promise((res, rej) => {
                driver.wait(until.elementLocated(conf.uniqueStructure.outlook.register.number), 10000).then(() => {
                    this.solved = false;
                    res();
                }).catch(() => {
                    this.solved = true;
                    res()
                })
            });
            console.log(this.solved);
            if (!this.solved)
                return;
            let timeout = setTimeout(() => {
                throw "error";
            }, 120000);
            await driver.wait(function () {
                return driver.executeScript('return document.readyState').then(function (readyState) {
                    return readyState === 'complete';
                });
            });
            clearTimeout(timeout);
            await new Promise((res, rej) => {
                driver.wait(async () => {
                    return await (await driver.getCurrentUrl()).includes("https://outlook.live.com/mail/0/inbox")
                }, 80000).then(() => { res(); this.res = true }).catch(() => res());
            })
        } catch (e) { }
    }

    async captchaSolverImageToText(body: string) {
        const AntiCaptchaAPI = new AntiCaptcha("fbc97aead89db25f4bee466c65e951fe"); // You can pass true as second argument to enable debug logs.

        try {
            if (!(await AntiCaptchaAPI.isBalanceGreaterThan(10))) {
                // You can dispatch a warning using mailer or do whatever.
                console.warn("Take care, you're running low on money !");
            }
            let taskId = await AntiCaptchaAPI.createTask<IImageToTextTask>({
                type: TaskTypes.IMAGE_TO_TEXT,
                body: body
            });

            // Waiting for resolution and do something
            const response = await AntiCaptchaAPI.getTaskResult<IImageToTextTaskResult>(taskId);
            return response.solution;
        } catch (e) {
            if (
                e instanceof AntiCaptchaError &&
                e.code === ErrorCodes.ERROR_IP_BLOCKED
            ) {
                console.log(e);
            }
            console.log(e);
            return undefined;
        }
    }
}

export async function writeString(string: string, elem: WebElement) {
    let m = string.substr(1, string.length - 1);
    if (string.length > 0) {
        await elem.sendKeys(string.charAt(0));
        sleep(100);
        if (m.length > 0)
            await writeString(m, elem);
    }
}