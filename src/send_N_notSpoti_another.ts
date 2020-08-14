import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb+srv://admin:admin@cluster0.vlznh.mongodb.net/kebotest?retryWrites=true&w=majority");
client.connect().then((db) => {
    // let dbo = db.db("kebotdb");
    // let col = dbo.collection("accounts");
    // col.find({"subs": {$exists: false}}).limit(10).toArray().then(data=>{
    //     let dba = db.db("kebotest");
    //     let cola = dba.collection("accounts1");
    //     cola.insertMany(data).then(result=>{
            
    //     });
    // });
    let dba = db.db("kebotest");
    let cola = dba.collection("accounts1");
    cola.find({}).toArray().then(res=>{
        console.log(res);
    })
}); 