import { ProviderDriver, account, inboxString } from "../data/structure";
import { waitElement } from "../utils/seleniumUtilities";
import {conf} from "../data/structure";
import { WebDriver, By } from "selenium-webdriver";
import { newDriver } from "..";
import { sleep } from "../utils/stringUtilities";
import request from "request";
import fs from "fs"
import { captchaSolverImageToText } from "../utils/captchaUtils";
import {writeString} from "./outlook-mail-movements"
export class YandexDriver implements ProviderDriver {
    account : account = { name: "", surname: "", email: "", password: "" };
    res : boolean = false;
    async register(account : account){
        account.email = account.email.replace(/[^0-9a-z@\.]/g, "");
        this.account = account;
        let driver = await newDriver();
        await driver.get(conf.links.yandex.register)
        await this.setName(driver);
        await this.setLastName(driver);
        await this.setUsername(driver);
        await this.setPassword(driver);
        let noPhone = await waitElement(conf.uniqueStructure.yandex.register.noPhone, driver);
        await noPhone.click();
        sleep(2500);
        await this.setQuestion(driver);
        let img = await waitElement(conf.uniqueStructure.yandex.register.captchaImg, driver, 15000);
        let link = await img.getAttribute("src");
        console.log(link);
        await new Promise((resolve, reject) => {
            request(link).pipe(fs.createWriteStream("filename.jpeg")).on('close', () => {
                resolve();
            });
        })
        let ma = fs.readFileSync("filename.jpeg");
        let res = await captchaSolverImageToText(ma.toString("base64"));
        console.log(res);
        let m = await waitElement(conf.uniqueStructure.yandex.register.captchaField, driver);
        if(res)
        await writeString(res.text, m);
        let elem = await waitElement(conf.uniqueStructure.yandex.register.submit, driver);
        await elem.click();
        sleep(1000);
        let policy = await waitElement(conf.uniqueStructure.yandex.register.parentPolicy, driver);
        let buttonPolicy = await policy.findElement(By.tagName("button"));
        await buttonPolicy.click();
        sleep(10000);
        return { ac: account, res: this.res };
    }
    inbox(account:account, inboxFor : inboxString){
        return "";
    }

    private async setName(driver : WebDriver){
        let name = await waitElement(conf.uniqueStructure.yandex.register.name, driver);
        await name.sendKeys(this.account.name);
    }

    private async setLastName(driver : WebDriver){
        let lastName = await waitElement(conf.uniqueStructure.yandex.register.lastname, driver);
        await lastName.sendKeys(this.account.surname);
    }

    private async setUsername(driver : WebDriver){
        let username = await waitElement(conf.uniqueStructure.yandex.register.username, driver);
        await username.sendKeys(this.account.email.split("@")[0]);
    }

    private async setPassword(driver : WebDriver){
        let password = await waitElement(conf.uniqueStructure.yandex.register.paswword, driver);
        let cpassword = await waitElement(conf.uniqueStructure.yandex.register.cpassword, driver);
        await password.sendKeys(this.account.password);
        await cpassword.sendKeys(this.account.password);
    }

    private async setQuestion(driver : WebDriver){
        let question = await waitElement(conf.uniqueStructure.yandex.register.recAnswer, driver);
        await question.sendKeys("Ciccio");
    }
}