import { ObjectId } from "mongodb";
import { Controller } from "./controller";

export class ShortCodeController  extends Controller{
    shortcodeCollection: any;

    constructor() {
        super();
    }

    async init(){
        await super.init()
        this.shortcodeCollection = this.mongoClient?.collection("shortcode");
    }

    async loadShortcodes(){
        return await this.shortcodeCollection?.find({
        }).toArray()
    }

    async createShortcode(data: {email: string}){
        return await this.shortcodeCollection.insertOne({...data, subcribedAt: new Date()})
    }


    async deleteShortcode(_id: ObjectId){
        return await this.shortcodeCollection.deleteOne({_id: new ObjectId(_id)})
    }
   
}