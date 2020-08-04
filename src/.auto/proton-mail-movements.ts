import { account, conf, createAccount } from "../data/structure";
import { ProviderDriver } from "../data/structure"
import { newDriver } from "..";
import { waitElement } from "../utils/seleniumUtilities";
import { WebElement, WebDriver, By, Key } from "selenium-webdriver";
import { randomWorkEmail, detectProvider, sleep } from "../utils/stringUtilities";
import { forProvider } from "./for-provider";

export class ProtonDriver implements ProviderDriver {
    account: account = { name: "", surname: "", email: "", password: "" };
    res: boolean = false;
    found: boolean = false;
    public register = async (account: account) => {
        this.account = account;
        let driver = await newDriver();
        if (conf.links.proton !== undefined && conf.links.proton.register !== undefined) {
            await driver.get(conf.links.proton.register);
            if (conf.uniqueStructure.proton?.register?.password) {
                await this.setPassword(await waitElement(conf.uniqueStructure.proton?.register?.password, driver));
                await this.setPassword(await waitElement(conf.uniqueStructure.proton.register.confirmPassword, driver));
                await this.setUsername(conf.uniqueStructure.proton.register.email, driver);
                await this.confirmWithout(conf.uniqueStructure.proton.register.confirmWithoutRecovery, driver);
                let elem = await new Promise<WebElement>((res, rej) => {
                    waitElement(conf.uniqueStructure.proton.register.signupRadio, driver).then((e) => { 
                        this.found = true; res(e); 
                    }).catch(res)
                });
                if (this.found)
                    await this.signupRadio(elem, driver)
            }
            else
                throw "Register link not provided";
        }

        return { ac: account, res: true };
    };

    private setPassword = async (elem: WebElement) => {
        await elem.sendKeys(this.account.password);
    }

    private setUsername = async (elem: By, driver: WebDriver) => {
        let frame = await waitElement(conf.uniqueStructure.proton.register.frames.userFrame, driver);
        await driver.switchTo().frame(frame);
        let userField = await waitElement(elem, driver);
        await userField.sendKeys(this.account.email.split("@")[0]);
        await userField.sendKeys(Key.ENTER);
    }

    private confirmWithout = async (elem: By, driver: WebDriver) => {
        await driver.switchTo().defaultContent();
        await waitElement(elem, driver);
        //let button = await driver.switchTo().activeElement();
        let button = await waitElement(conf.uniqueStructure.proton.register.confirmButtonRecovery, driver);
        await button.click();
    }

    private signupRadio = async (elem: WebElement, driver: WebDriver) => {
        await elem.click();
        let active = await driver.findElement(conf.uniqueStructure.proton.register.emailConfirm);
        let account = createAccount(randomWorkEmail(), undefined);
        let _provider = detectProvider(account.email);
        if(!_provider)
            return;
        let provider = forProvider(_provider);
        await active.sendKeys(account.email);
        await active.sendKeys(Key.ENTER);
        let e = await provider.inbox(account, "proton");
        console.log(e);
        await (await driver.switchTo().activeElement()).sendKeys(e);
        await (await driver.switchTo().activeElement()).sendKeys(Key.ENTER);
        this.res = true;
        await new Promise((res, rej) => {
            driver.wait(async () => {
                return await driver.getCurrentUrl() === "https://mail.protonmail.com/inbox?welcome=true"
            }, 40 * 1000).then(res).catch(res);
        });
    }

    public inbox = (account: account) => {
        this.account = account;
        return "";
    };
}