import {parentPort, workerData} from "worker_threads";
import { spawn } from "child_process";
import {randomArrayPick } from "../utils/stringUtilities";
import fs from "fs";
let countries = ["."]
let vpn = spawn("sudo-vpn", [workerData.country]);
let out = setTimeout(()=>{
    console.log("VPN non utilizzabile");
    vpn.kill();
    process.exit();
}, 10000);
vpn.stdout.on("data", (data : Buffer)=>{
    //console.log(data.toString("ascii"));
    if(data.toString("ascii").toLowerCase().includes("sequence completed")){
        console.log("VPN Attivata in: "+ workerData.country)
        clearTimeout(out);
        parentPort?.postMessage("start");
    }
});

parentPort?.on("message", (m)=>{
    if(m === "exit"){
        vpn.kill();
        process.exit();
    }
})