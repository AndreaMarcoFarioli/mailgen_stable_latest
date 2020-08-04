import { AntiCaptcha, IImageToTextTask, TaskTypes, IImageToTextTaskResult, AntiCaptchaError, ErrorCodes } from "anticaptcha";

export async function captchaSolverImageToText(body: string) {
    const AntiCaptchaAPI = new AntiCaptcha("fbc97aead89db25f4bee466c65e951fe"); // You can pass true as second argument to enable debug logs.

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
