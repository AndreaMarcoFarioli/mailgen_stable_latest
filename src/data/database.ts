import { MongoClient, ObjectID } from "mongodb";
import { account } from "./structure";

export class Database {

    private client = new MongoClient("mongodb+srv://admin:admin@cluster0.vlznh.mongodb.net/accounts_list?retryWrites=true&w=majority", { useUnifiedTopology: true });
    private isConnected_ = false;
    public get isConnected() { return this.isConnected_ }
    private set isConnectedSet(value: boolean) { this.isConnected_ = value };
    public async start() {
        return await new Promise((res, rej) => this.client.connect((err) => {
            if(err)
                rej();
            else {
                this.isConnectedSet = true;
                res();
            }
        }));
    }
    public async getUserForConfirm(){
        if(!this.isConnected)
            return;
        return await
            this.client.db("kebotdb").collection("accounts").findOne({$and: [{"subs.spotify": {$exists: true}}, {"subs.spotify.verified": false}]});  
    }
    public async setUserInUsed(_id : ObjectID, inUsed : boolean = true){
        return await this.client.db("kebotdb").collection("accounts").updateOne({_id: _id}, {$set: {inUsed: inUsed}})
    }
    public async setSpotifyConfirmed(_id : ObjectID){
        return await this.client.db("kebotdb").collection("accounts").updateOne({_id: _id}, {$set: {"subs.spotify.verified": true}});
    }
    public async addUser(account : any){
        if(this.isConnected){
            await new Promise((res, rej)=>{
                this.client.db("accounts_list").collection("userlist").insertOne(account, (err,stat)=>{
                    if(err) rej(err);
                    else res(stat);
                });
            });
        }
    }
}