import fs from "fs";
import { join } from "path";
import { ObjectID } from "mongodb";

fs.writeFileSync(join(__dirname, "../session.ses"), new ObjectID().toHexString())