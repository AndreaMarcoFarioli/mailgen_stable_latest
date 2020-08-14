import { AntiCaptcha, IImageToTextTask, TaskTypes, IImageToTextTaskResult, AntiCaptchaError, ErrorCodes, INoCaptchaTaskProxyless, INoCaptchaTaskProxylessResult } from "anticaptcha";

export async function captchaSolverImageToText(body: string) {
    const AntiCaptchaAPI = new AntiCaptcha("e8efed696ff4ba6d76dce1f442e777bd"); // You can pass true as second argument to enable debug logs.

    try {
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

export async function INoCaptchaResolver(url: string, key:string) {
    const AntiCaptchaAPI = new AntiCaptcha("e8efed696ff4ba6d76dce1f442e777bd"); // You can pass true as second argument to enable debug logs.

    try {
        let taskId = await AntiCaptchaAPI.createTask<INoCaptchaTaskProxyless>({
            type: TaskTypes.NOCAPTCHA_PROXYLESS,
            websiteKey: key,
            websiteURL: url
        });

        // Waiting for resolution and do something
        const response = await AntiCaptchaAPI.getTaskResult<INoCaptchaTaskProxylessResult>(taskId);
        return response.solution.gRecaptchaResponse;
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

export async function getBalance(){
    const AntiCaptchaAPI = new AntiCaptcha("e8efed696ff4ba6d76dce1f442e777bd"); // You can pass true as second argument to enable debug logs.
    console.log(await AntiCaptchaAPI.getBalance());
}