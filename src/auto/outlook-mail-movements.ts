import { ProviderDriver, account, conf, inboxString, createAccount } from "../data/structure";
import { newDriver } from "..";
import { waitElement } from "../utils/seleniumUtilities";
import { WebElement, Key, WebDriver, until, By } from "selenium-webdriver";
import { sleep, randomDate, detectProvider, randomString } from "../utils/stringUtilities";
import fs from "fs";
import { join } from "path";
import { captchaSolverImageToText, INoCaptchaResolver } from "../utils/captchaUtils";
import { forProvider } from "./for-provider";

export class OutlookDriver implements ProviderDriver {
    account: account = { name: "", surname: "", email: "", password: "" };
    res: boolean = false;
    solved: boolean = false;
    error: boolean = false;
    errore = false;
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
        let img = await driver.findElement(By.tagName("img"))
        let img64 = await img.takeScreenshot();
        fs.writeFileSync(join(__dirname, "../../t.png"), img64)
        await this.setIdentityLastname(await waitElement(conf.uniqueStructure.outlook.register.lastName, driver));
        sleep(250)
        await this.setAge(driver);
        sleep(250)
        let k = await this.solveCaptcha(driver);
        sleep(250);
        if (this.solved && !this.error) {
            //await this.openOther(await waitElement(conf.uniqueStructure.outlook.inbox.mailLowImportanceIcon, driver), driver);
            //await this.openEmail(await waitElement(conf.uniqueStructure.outlook.inbox.mailIncome, driver), driver, false);
        }
        if (k)
            await this.validateAccount(driver);
        await driver.close();
        return { ac: account, res: this.res };
    };
    public inbox = async (account: account, inboxFor: inboxString) => {
        this.account = account;
        let driver = await newDriver();
        await driver.get(conf.links.outlook.login);
        let netError = false;
        let elem = await new Promise<WebElement>((res) => {
            waitElement(conf.uniqueStructure.outlook.inbox.email, driver).then((e) => {
                res(e);
            }).catch(() => {
                netError = true;
                res();
            })
        });

        if (netError) {
            await driver.close();
            return "";
        }

        await this.setUsername(elem, driver);
        sleep(3000);
        let current = await driver.getCurrentUrl();
        await this.setPassword(await waitElement(conf.uniqueStructure.outlook.inbox.password, driver));
        sleep(1000);
        while (true) {
            if ((await driver.getCurrentUrl()).includes("inbox")) {
                break;
            } else if ((await driver.getCurrentUrl()).includes("Abuse")) {
                this.errore = true;
                break;
            } else if ((await driver.getCurrentUrl()).includes("proofs")) {
                await this.validateAccount(driver, false);
            }
        };
        if (this.errore) {
            await driver.close()
            return "";
        }
        await new Promise(res=>{
            waitElement(conf.uniqueStructure.outlook.inbox.noBut, driver).then(e=>{
                e.click();
                res();
            }).catch(()=>{res()})
        })
        sleep(3000);
        await this.openOther(driver, inboxFor);

        if (this.errore) {
            await driver.close()
            return "";
        }
        sleep(1000);
        let elem3 = await new Promise<WebElement>(res => {
            waitElement(conf.uniqueStructure.outlook.inbox.mailIncome[inboxFor].activation, driver, 15000)
                .then(res)
                .catch(() => {
                    this.errore = true;
                    res();
                })
        })
        if (this.errore) {
            await driver.close()
            return "";
        }
        let codeValue = await this.openEmail(elem3, driver, inboxFor);
        return codeValue;
    };

    private setUsername = async (elem: WebElement, drive: WebDriver) => {
        let error = false;
        await new Promise(res => {
            elem.sendKeys(this.account.email, Key.ENTER).then(res).catch(() => {
                error = true;
                res();
            })
        })
        if (error) {
            await drive.close();
            process.exit();
        }

    }

    private setPassword = async (elem: WebElement) => {
        await elem.sendKeys(this.account.password);
        await elem.sendKeys(Key.ENTER);
    }

    private openOther = async (driver: WebDriver, forInbox: inboxString) => {
        let error = false;


        await new Promise((res) => {
            waitElement(conf.uniqueStructure.outlook.inbox.continue, driver, 11000).then(e => {
                e.click().then()
                    .catch()
                    .finally(res);
            }).catch(async () => {
                waitElement(conf.uniqueStructure.outlook.inbox.rating, driver, 1).then(e => {
                    e.click().then().catch()
                        .finally(res);
                }).catch(() => {
                    waitElement(conf.uniqueStructure.outlook.inbox.locked, driver, 1).catch(res).then(() => {
                        error = true; res();
                    });
                });
            });
        });

        sleep(1500);

        if (error) {
            await driver.close();
            return;
        }


        let firstMail = await new Promise((res) => {
            waitElement(conf.uniqueStructure.outlook.inbox.mailIncome[forInbox].activation, driver, 5000).then(res).catch(() => {
                res();
            })
        })
        if (firstMail) {
            return
        }
        let elem = await waitElement(conf.uniqueStructure.outlook.inbox.mailLowImportanceIcon, driver, 20000)
        await elem.click();

    }
    private openEmail = async (elem: WebElement, driver: WebDriver, forInbox: inboxString) => {
        await elem.click();
        let codeValue = "empty";
        if (forInbox === "proton") {
            let code = await waitElement(conf.uniqueStructure.outlook.inbox.activation.proton.code, driver);
            codeValue = (await code.getText());
        }
        else if (forInbox === "spotify") {
            let link = await waitElement(conf.uniqueStructure.outlook.inbox.activation.spotify.link, driver);
            let drive = await newDriver();
            await drive.get(await link.getAttribute("href"));
            await driver.wait(async function () {
                const readyState = await drive.executeScript('return document.readyState');
                return readyState === 'complete';
            }, 300000);
            await drive.close();
        }
        else if (forInbox === "outlookCrossVerification") {
            let code = await waitElement(conf.uniqueStructure.outlook.inbox.activation.outlookCrossVerification.code, driver);
            codeValue = await code.getText();
        } else if (forInbox === "restoreCaput") {
            let link = await waitElement(conf.uniqueStructure.outlook.inbox.activation.restoreCaput.link, driver);
            let drive = await newDriver();
            await drive.get(await link.getAttribute("href"));
            let res = await new Promise<WebElement|undefined>(res=>{
                waitElement(conf.uniqueStructure.outlook.inbox.activation.restoreCaput.dangerRestore, drive, 5000).
                    then(res).catch(()=>res(undefined));
            })
            if(res){
                let email = await waitElement(conf.uniqueStructure.outlook.inbox.activation.restoreCaput.email, drive, 20000);
                await email.sendKeys(this.account.email, Key.ENTER);
                let label_error = await new Promise<WebElement|undefined>(res=>{
                    waitElement(conf.uniqueStructure.outlook.inbox.activation.restoreCaput.label_error, drive, 5000).
                        then(res).catch(()=>{res(undefined)});
                });
                if(label_error){
                    codeValue = "ERROR_DISABLED";
                }else
                sleep(Number.MAX_SAFE_INTEGER);
            }else
                await reset_password();


            async function reset_password(){
                let cookie = By.id("onetrust-accept-btn-handler");
                new Promise(res=>{
                    waitElement(cookie, drive).then((w)=>{w.click().then(res)}).catch(res);
                })
                let _codeValue = randomString(10);
                let password = await waitElement(conf.uniqueStructure.outlook.inbox.activation.restoreCaput.password, drive);
                await password.sendKeys(_codeValue);
                let passwordC = await waitElement(conf.uniqueStructure.outlook.inbox.activation.restoreCaput.passwordC, drive);
                await passwordC.sendKeys(_codeValue);
                let res = await INoCaptchaResolver("https://www.spotify.com/it/password-reset/change/", "6LdaGwcTAAAAAJfb0xQdr3FqU4ZzfAc_QZvIPby5");
                console.log(res);
                if(res){
                    let G = await drive.findElement(By.id("g-recaptcha-response"));
                    await drive.executeScript("arguments[0].innerHTML = arguments[1]", G, res);
                    let M = await drive.findElement(conf.uniqueStructure.outlook.inbox.activation.restoreCaput.captcha_token);
                    await drive.executeScript("arguments[0].setAttribute('type', 'text')", M);
                    await M.sendKeys(res);
                    let submit = await waitElement(conf.uniqueStructure.outlook.inbox.activation.restoreCaput.submit, drive);
                    await submit.click();
                    
                    let n = 0, err = false;
                    while(true){
                        if(n >= 1200){
                            err = true;
                            break;
                        }else if((await drive.getCurrentUrl()).includes("success")){
                            break;
                        }
                        sleep(10);
                    }
                    if(!err)
                        codeValue = _codeValue;
                }
                console.log(codeValue);
            }

            await drive.close();
        }
        await driver.close();
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
            // let link = await elem.getAttribute("src");

            // //let get: string = await downloadPage(link);
            // await new Promise((resolve, reject) => {
            //     request(link).pipe(fs.createWriteStream("filename.jpeg")).on('close', () => {
            //         resolve();
            //     });
            // })
            let base64 = await elem.takeScreenshot();

            // let m = fs.createWriteStream(join(__dirname, "m.jpeg"));
            // get.pipe(m);
            //fs.writeFileSync(join(__dirname, "m.jpeg"), get);


            let m = await captchaSolverImageToText(base64);

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
            return true;
        } catch (e) { }
    }

    private validateAccount = async (driver: WebDriver, load: boolean = true) => {
        if (load)
            await driver.get("https://account.live.com/proofs/MarkLost");
        let elem = await waitElement(conf.uniqueStructure.outlook.register.selectProof, driver, 40000);
        await elem.sendKeys("un indirizzo");
        elem = await waitElement(conf.uniqueStructure.outlook.register.inputEmailProof, driver);
        let account = createAccount(fs.readFileSync(join(__dirname, "../../data/emailswork.txt")).toString("ascii"), undefined);
        await elem.sendKeys(account.email, Key.ENTER);
        let provider = detectProvider(account.email);
        if (provider !== undefined) {
            let code = await forProvider(provider).inbox(account, "outlookCrossVerification");
            let input = await waitElement(conf.uniqueStructure.outlook.register.inputCodeProof, driver);
            await input.sendKeys(code, Key.ENTER);
        }

        sleep(10000);
        this.account.recovery = account.email;
        this.account.activated = true;
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