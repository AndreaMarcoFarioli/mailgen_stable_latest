import { Key, By } from "selenium-webdriver";
import { shuffleOrder, randomString, randomArrayPick } from "../utils/stringUtilities";
import { type } from "os";

const outlook_extensions = ["outlook.it", "outlook.com", "hotmail.com"]

const extension_subscribing = [outlook_extensions[Math.floor(Math.random() * outlook_extensions.length)]];
export function getRoutinesLength(){
    return extension_subscribing.length;
}
export type jProviders = ("gmail" | "outlook" | "yandex" | "proton")
export type Providers = jProviders | string;


type LinkInterface = {
    login?: string,
    inbox?: string,
    register?: string
}

export interface Structure {
    pattern: {
        [K in jProviders]?: RegExp[] | RegExp
    },
    links: {
        [K in jProviders]?: LinkInterface
    },
    uniqueStructure: any
}


export let conf = {
    confirm_spotify: false,
    crossVerification: {
        forProviders: ["outlook"],
        value: true
    },
    pattern: {
        gmail: /.*@gmail.com/,
        outlook: [
            /.*@outlook.com/,
            /.*@hotmail.it/,
            /.*@hotmail.com/,
            /.*@outlook.it/
        ],
        proton: /.*@protonmail.com/,
        yandex: /.*@yandex.com/
    },
    links: {
        proton: {
            register: "https://mail.protonmail.com/create/new"
        },
        outlook: {
            login: "https://login.live.com/login.srf?wa=wsignin1.0&rpsnv=13&ct=1594037845&rver=7.0.6737.0&wp=MBI_SSL&wreply=https%3a%2f%2foutlook.live.com%2fowa%2f%3fRpsCsrfState%3d878f3ed6-1007-05de-b41f-7f6a7f82da70&id=292841&aadredir=1&CBCXT=out&lw=1&fl=dob%2cflname%2cwld&cobrandid=90015",
            register: "https://signup.live.com/signup?wa=wsignin1.0&wp=MBI_SSL&wreply=https:%2F%2Foutlook.live.com%2Fowa%2F&uiflavor=web",
            profile: "https://account.microsoft.com/profile/",
            loginBlank: "https://login.live.com/login.srf"
        },
        yandex: {
            login: "",
            register: "https://passport.yandex.com/registration?from=mail",
            success: "https://passport.yandex.com/profile"
        },
        tiscali: {
            register: "https://mail.tiscali.it/?_action=plugin.tiscali_registrazione"
        }
    },
    uniqueStructure: {
        proton: {
            register: {
                email: By.xpath('//*[@id="username"]'),
                password: By.xpath('//*[@id="password"]'),
                confirmPassword: By.xpath('//*[@id="passwordc"]'),
                recoveryMail: By.xpath('//*[@id="notificationEmail"]'),
                confirmWithoutRecovery: By.xpath('//*[@id="signup"]/div[1]/form'),
                confirmButtonRecovery: By.xpath('//*[@id="confirmModalBtn"]'),
                signupRadio: By.css('[for="id-signup-radio-email"]'),
                emailConfirm: By.css(".codeVerificator-email-input"),
                frames: {
                    userFrame: By.xpath('//*[@id="mainContainer"]/div/div/div[1]/form/div[1]/div[1]/div/div/div[2]/iframe'),
                    recoveryFrame: By.xpath('//*[@id="mainContainer"]/div/div/div[1]/form/div[2]/section/div/div[2]/iframe')
                }
            },
            inbox: {
                email: By.xpath('//*[@id="username"]'),
                password: By.xpath('//*[@id="password"]'),
                buttonLogin: By.xpath('//*[@id="login_btn"]')
            }
        },
        outlook: {
            inbox: {
                email: By.css("[name='loginfmt'][type='email']"),
                password: By.css("[name='passwd'][type='password']"),
                mailLowImportanceIcon: By.css('[data-icon-name="MailLowImportance"]'),
                mailIncome: {
                    proton: {
                        activation: By.css("[role='listbox'] [tabindex][aria-label*='da leggere proton' i]")
                    },
                    spotify: {
                        activation: By.css("[role='listbox'] [tabindex][aria-label*='podcast' i][aria-label*='da leggere' i]")
                    },
                    outlookCrossVerification: {
                        activation: By.css("[role='listbox'] [tabindex][aria-label*='*@' i]")
                    }
                },

                continue: By.css('.ms-Button--primary'),
                locked: By.css("#StartAction"),
                activation: {
                    proton: {
                        code: By.css("code")
                    },
                    spotify: {
                        link: By.css("a[href][target='_blank'].x_call-to-action-button")
                    },
                    outlookCrossVerification: {
                        code: By.css("span[style*='#2a2a2a']")
                    }
                }
            },
            verification: {
                buttonUploadProfileIcon: By.xpath('//*[@id="edit-picture-save"]')
            },
            register: {
                email: By.xpath('//*[@id="MemberName"]'),
                password: By.xpath('//*[@id="PasswordInput"]'),
                name: By.xpath('//*[@id="FirstName"]'),
                lastName: By.xpath('//*[@id="LastName"]'),
                day: By.xpath('//*[@id="BirthDay"]'),
                month: By.xpath('//*[@id="BirthMonth"]'),
                year: By.xpath('//*[@id="BirthYear"]'),
                captcha: By.css('img.text-body'),
                captchaField: By.css('input'),
                sendBut: By.xpath('//*[@id="iSignupAction"]'),
                number: By.css('[countryphonecode="+93"]'),
                error: By.css(".alert.alert-error.floatLeft:nth-child(3)"),
                extensionParent: By.xpath('//*[@id="CredentialsInputPane"]/fieldset/div[1]/div[3]/div[2]/div/div'),
                extension: By.xpath('//*[@id="LiveDomainBoxList"]'),
                selectProof: By.xpath('//*[@id="iProofOptions"]'),
                inputEmailProof: By.xpath('//*[@id="EmailAddress"]'),
                inputCodeProof: By.xpath('//*[@id="iOttText"]')
            }
        },
        yandex: {
            register: {
                name: By.xpath('//*[@id="firstname"]'),
                lastname: By.xpath('//*[@id="lastname"]'),
                username: By.xpath('//*[@id="login"]'),
                paswword: By.xpath('//*[@id="password"]'),
                cpassword: By.xpath('//*[@id="password_confirm"]'),
                recQuestion: By.xpath('//*[@id="hint_question_id"]'),
                recAnswer: By.xpath('//*[@id="hint_answer"]'),
                captchaField: By.xpath('//*[@id="captcha"]'),
                captchaImg: By.xpath('//*[@id="root"]/div/div[2]/div/main/div/div/div/form/div[3]/div/div[2]/div[2]/div/div[1]/img'),
                submit: By.xpath('//*[@id="root"]/div/div[2]/div/main/div/div/div/form/div[4]/span/button'),
                policy: By.xpath('//*[@id="root"]/div/div[2]/div/main/div/div/div/form/div[4]/div/div[2]/div/button'),
                errorCaptcha: By.xpath('//*[@id="root"]/div/div[2]/div/main/div/div/div/form/div[3]/div/div[2]/div[1]/div/div/div'),
                noPhone: By.xpath('//*[@id="root"]/div/div[2]/div/main/div/div/div/form/div[3]/div/div[2]/div/div[1]'),
                parentPolicy: By.xpath('//*[@id="root"]/div/div[2]/div/main/div/div/div/form/div[4]/div')
            }
        },
        tiscali: {
            register: {
                name: By.xpath('//*[@id="regis_nome"]'),
                lastname: By.xpath('//*[@id="regis_cognome"]'),

            }
        }
    }
}


export interface account {
    name: string,
    surname: string,
    email: string,
    password: string,
    extension?: string,
    activated?: boolean
}

export type inboxString = "proton" | "spotify" | "outlookCrossVerification"

export function createAccount(name: string, surname: string | undefined): account {
    let account_cre: account;

    if (surname !== undefined) {
        name = name.toLowerCase();
        name = name.replace(/[^a-z@]/g, "")
        surname = surname.toLowerCase();
        surname = surname.replace(/[^a-z]/g, "");
        let order = shuffleOrder(name, surname);
        let number = shuffleOrder(randomString(3, "1234567890"), "")
        let extension = extension_subscribing.shift();
        account_cre = {
            name: name,
            surname: surname,
            email: order[0] + randomString(1, ".-_") + number[1] + order[1] + number[0] + "@" + extension,
            password: randomString(10),
            extension: extension
        }
    } else {
        let splitted = name.split(':');
        console.log(splitted)
        if (splitted.length !== 2)
            throw "Line pattern must be /< email >:< password >/"
        account_cre = {
            name: "",
            surname: "",
            email: name.split(':')[0],
            password: name.split(':')[1],
        }
    }

    return {...account_cre, activated: false };
}

export interface ProviderDriver {
    register: (account: account) => { ac: account, res: boolean } | Promise<{ ac: account, res: boolean }>,
    inbox: (account: account, inboxFor: inboxString) => string | Promise<string>,
    crossValidation?: (account: account, accountForValidation : account) => boolean | Promise<boolean>;
    account: account
}