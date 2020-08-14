import { MongoClient, ObjectID } from "mongodb";
import { account } from "./structure";
import { readFileSync } from "fs";
import { join } from "path";
const db = "kebotest", collection = "accounts1";
export class Database {
    public _id : ObjectID = new ObjectID(readFileSync(join(__dirname, "../../session.ses")).toString("ascii"));
    private client = new MongoClient("mongodb+srv://admin:admin@cluster0.vlznh.mongodb.net/kebotdb?retryWrites=true&w=majority", { useUnifiedTopology: true });
    private isConnected_ = false;
    public get isConnected() { return this.isConnected_ }
    private set isConnectedSet(value: boolean) { this.isConnected_ = value };
    public async start() {
        return await new Promise((res, rej) => this.client.connect((err) => {
            if (err)
                rej();
            else {
                this.isConnectedSet = true;
                res();
            }
        }));
    }
    public async getUserForConfirm() {
        if (!this.isConnected)
            return;
        return await
            this.client.db(db).collection(collection).findOne({ $and: [{ "subs.spotify": { $exists: true } }, { "subs.spotify.verified": false }] });
    }
    public async setUserInUsed(_id: ObjectID, inUsed: boolean = true) {
        return await this.client.db(db).collection(collection).updateOne({ _id: _id }, { $set: { inUsed: inUsed } })
    }
    public async setSpotifyConfirmed(_id: ObjectID) {
        return await this.client.db(db).collection(collection).updateOne({ _id: _id }, { $set: { "subs.spotify.verified": true } });
    }
    public async addUser(account: any) {
        if (this.isConnected) {
            await new Promise((res, rej) => {
                this.client.db(db).collection(collection).insertOne(account, (err, stat) => {
                    if (err) rej(err);
                    else res(stat);
                });
            });
        }
    }

    public async getCaputUser(machine_id:ObjectID = this._id) {
        if (!this.isConnected)
            return;
        return await this.client.db(db).collection(collection).findOne({ "subs.spotify.caput": true, $or: [{historyPick: {$exists:false}},{historyPick: {$not:{$all: [machine_id]}}}] });
    }

    public async setPasswordAccount(_id: ObjectID, newPassword: string, prev: string, target: string = "spotify") {
        if (!this.isConnected)
            return;
        return await this.client.db(db).collection(collection).updateOne({ _id: _id },
            {
                $set: {
                    "subs.spotify.caput": false,
                    "subs.spotify.password": newPassword,
                },
                $push: { "subs.spotify.historyPassword": prev }
            });
    }

    public async accountsWithPasswordRestored(machine_id:ObjectID = this._id){
        if(!this.isConnected)
            return;
        return this.client.db(db).collection(collection).find({"subs.spotify.historyPassword": {$exists: true}}).toArray();
    }

    public async setAccountPick(_id:ObjectID, machine_id:ObjectID = this._id){
        if(!this.isConnected)
            return;
        return this.client.db(db).collection(collection).updateOne({_id}, {$push: {historyPick: machine_id}});
    }
}