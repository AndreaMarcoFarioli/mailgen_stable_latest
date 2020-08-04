import { MongoClient } from "mongodb";

export class Database {

    private client = new MongoClient("mongodb+srv://admin:admin@cluster0.vlznh.mongodb.net/accounts_list?retryWrites=true&w=majority", { useUnifiedTopology: true });
    private isConnected_ = false;
    public get isConnected() { return this.isConnected_ }
    private set isConnectedSet(value: boolean) { this.isConnected_ = value };
    public async start() {
        return await new Promise((res, rej) => this.client.connect((err) => {
            if(err)
                rej(err);
            else {
                this.isConnectedSet = true;
                res();
            }
        }));
    }

    public async addUser(account : any){
        if(this.isConnected){
            await new Promise((res, rej)=>{
                this.client.db("kebotdb").collection("accounts").insertOne(account, (err,stat)=>{
                    if(err) rej(err);
                    else res(stat);
                });
            });
        }
    }
}