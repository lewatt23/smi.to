import { Db } from "mongodb";
import { connectToCluster } from "../mongoDB";

export class Controller {
    mongoClient: Db | null;
    

    constructor() {
        this.mongoClient = null;
    }

    async init(){
        if(this.mongoClient == null)
            this.mongoClient = await connectToCluster();
    }
}