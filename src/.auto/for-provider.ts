import { jProviders, ProviderDriver } from "../data/structure";
import { ProtonDriver } from "./proton-mail-movements";
import { OutlookDriver } from "./outlook-mail-movements";
import { YandexDriver } from "./yandex-mail-movements";

export function forProvider(providerName : jProviders){
    let returned : ProviderDriver | undefined = undefined;
    switch(providerName){
        case "proton":
            returned = new ProtonDriver();
        break;
        case "outlook":
            returned = new OutlookDriver();
        break;
        case "yandex":
            returned = new YandexDriver();
        break;
    }
    if(returned === undefined)
        throw "Provider Driver not found";
    return returned;
}
