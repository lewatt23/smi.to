import { ObjectId, Collection } from "mongodb";
import { Controller } from "./controller";
import { encode } from "../util/base62";

/**
 * Interface for detailed information about each visit.
 */
export interface VisitDetail {
    /** Timestamp of the visit. */
    timestamp: Date;
    /** User agent of the visitor. */
    userAgent?: string;
    /** Referrer of the visit. */
    referrer?: string;
    // Add other details like IP address if necessary, considering privacy implications
}

/**
 * Interface representing a short link document in the database.
 */
export interface ShortLink {
    /** The unique identifier of the short link. */
    _id?: ObjectId;
    /** The original, long URL. */
    originalUrl: string;
    /** The generated short code for the URL. */
    shortCode: string;
    /** The date and time when the short link was created. */
    createdAt: Date;
    /** The number of times the short link has been visited. */
    visits: number;
    /** The date and time when the short link was last visited. */
    lastVisitedAt?: Date;
    /** Array storing details of each visit. */
    visitHistory?: VisitDetail[];
}

/**
 * Controller for managing short links.
 * Handles creation, retrieval, and statistics of short links.
 */
export class ShortLinkController extends Controller {
    /** MongoDB collection for storing short links. */
    shortLinkCollection!: Collection<ShortLink>;
    /** MongoDB collection for managing counters for ID generation. */
    private counterCollection!: Collection<{ _id: string; seq: number }>;

    /**
     * Initializes a new instance of the ShortLinkController.
     */
    constructor() {
        super();
    }

    /**
     * Initializes the controller, setting up database collections and indexes.
     * This method should be called before any other operations.
     */
    async init() {
        await super.init();
        if (this.mongoClient) {
            this.shortLinkCollection = this.mongoClient.collection<ShortLink>("shortLinks");
            this.counterCollection = this.mongoClient.collection<{ _id: string; seq: number }>("counters");
            // Ensure unique index on shortCode for quick lookups and to prevent collisions
            await this.shortLinkCollection.createIndex({ shortCode: 1 }, { unique: true });
            
            // Initialize counter if it doesn't exist
            const counter = await this.counterCollection.findOne({ _id: "shortLinkId" });
            if (!counter) {
                await this.counterCollection.insertOne({ _id: "shortLinkId", seq: 0 });
            }
        } else {
            console.error("MongoDB client is not initialized in ShortLinkController.init");
        }
    }

    /**
     * Retrieves the next sequence value for a given counter name.
     * Used for generating unique IDs for base62 encoding.
     * @param sequenceName The name of the counter (e.g., "shortLinkId").
     * @returns A promise that resolves to the next sequence number.
     */
    private async getNextSequenceValue(sequenceName: string): Promise<number> {
        if (!this.counterCollection) {
            // This should ideally not happen if init() was called and mongoClient was available.
            throw new Error("Counter collection is not initialized. Cannot get next sequence value.");
        }
        const sequenceDocument = await this.counterCollection.findOneAndUpdate(
            { _id: sequenceName },
            { $inc: { seq: 1 } },
            { returnDocument: 'after', upsert: true } // upsert:true ensures the counter is created if it doesn't exist.
        );
        
        // After upsert:true, sequenceDocument should not be null if the operation was successful.
        // However, sequenceDocument.value might be null if the document was just created by upsert 
        // and findOneAndUpdate was used with an older MongoDB driver version or specific config.
        // Modern drivers with returnDocument: 'after' should return the updated document.
        if (!sequenceDocument || sequenceDocument.seq === null || sequenceDocument.seq === undefined) {
            // Fallback or error for an unexpected state. 
            // If upsert worked, seq should be 1. If it truly failed to return, this is an issue.
            console.error('Failed to retrieve or initialize sequence document properly for:', sequenceName);
            // Attempt to recover by explicitly inserting if not found, though upsert should handle this.
            // This part might indicate a deeper issue or misunderstanding of findOneAndUpdate with upsert behavior in some edge cases.
            const existing = await this.counterCollection.findOne({_id: sequenceName});
            if(!existing || existing.seq === null || existing.seq === undefined){
                 await this.counterCollection.insertOne({ _id: sequenceName, seq: 1 });
                 return 1;
            }
            return existing.seq; // Should have a value now
        }
        return sequenceDocument.seq;
    }

    /**
     * Creates a new short link for the given original URL.
     * If the URL has already been shortened, returns the existing short link.
     * @param originalUrl The original URL to shorten.
     * @returns A promise that resolves to the created or existing ShortLink object, or null on failure.
     * @throws Error if the original URL format is invalid.
     */
    async createShortLink(originalUrl: string): Promise<ShortLink | null> {
        if (!this.shortLinkCollection) {
            console.error("shortLinkCollection is not initialized in createShortLink");
            return null;
        }
        
        // Validate URL format
        try {
            new URL(originalUrl);
        } catch (error) {
            console.error("Invalid URL format provided to createShortLink:", originalUrl);
            throw new Error("Invalid URL format");
        }

        // Check if URL already exists
        const existingLink = await this.shortLinkCollection.findOne({ originalUrl });
        if (existingLink) {
            return existingLink;
        }

        const nextId = await this.getNextSequenceValue("shortLinkId");
        const shortCode = encode(nextId);

        const newLink: ShortLink = {
            originalUrl,
            shortCode,
            createdAt: new Date(),
            visits: 0,
        };

        try {
            const result = await this.shortLinkCollection.insertOne(newLink);
            if (result.insertedId) {
                return { ...newLink, _id: result.insertedId };
            }
            console.error("Failed to insert new short link, insertOne returned no insertedId.");
            return null;
        } catch (error) {
            console.error("Error creating short link during insertOne:", error);
            // Unique index violation on shortCode is the most likely DB error here if IDs are not unique.
            // This would indicate a flaw in getNextSequenceValue or base62 encoding leading to collision.
            throw error;
        }
    }

    /**
     * Retrieves the original URL for a given short code and increments its visit count.
     * @param shortCode The short code to look up.
     * @returns A promise that resolves to the ShortLink object including the original URL, or null if not found.
     */
    async getOriginalUrl(shortCode: string): Promise<ShortLink | null> {
        if (!this.shortLinkCollection) {
            console.error("shortLinkCollection is not initialized in getOriginalUrl");
            return null;
        }
        const visitDetail: VisitDetail = {
            timestamp: new Date(),
            // userAgent: req.headers.get('user-agent') || undefined, // Requires request object
            // referrer: req.headers.get('referer') || undefined,    // Requires request object
        };
        const link = await this.shortLinkCollection.findOneAndUpdate(
            { shortCode },
            { 
                $inc: { visits: 1 },
                $set: { lastVisitedAt: new Date() },
                $push: { visitHistory: visitDetail as any } // Needs MongoDB typing for $push if not using 'as any'
            },
            { returnDocument: 'after' } // Return the updated document
        );
        return link; // findOneAndUpdate returns the document or null if not found
    }

    /**
     * Retrieves the original URL for a given short code, increments its visit count, and returns only the URL string.
     * Intended for use in redirection logic where only the URL is needed.
     * @param shortCode The short code to look up.
     * @returns A promise that resolves to the original URL string, or null if not found.
     */
    async redirectShortLink(shortCode: string): Promise<string | null> {
        if (!this.shortLinkCollection) {
            console.error("shortLinkCollection is not initialized in redirectShortLink");
            return null;
        }
        const visitDetail: VisitDetail = {
            timestamp: new Date(),
            // userAgent: req.headers.get('user-agent') || undefined, // Requires request object
            // referrer: req.headers.get('referer') || undefined,    // Requires request object
        };
        const link = await this.shortLinkCollection.findOneAndUpdate(
            { shortCode },
            { 
                $inc: { visits: 1 },
                $set: { lastVisitedAt: new Date() },
                $push: { visitHistory: visitDetail as any } // Needs MongoDB typing for $push if not using 'as any'
            },
            { returnDocument: 'after' } 
        );
        
        return link ? link.originalUrl : null;
    }

    /**
     * Retrieves statistics for a given short code.
     * @param shortCode The short code to look up.
     * @returns A promise that resolves to the ShortLink object containing statistics, or null if not found.
     */
    async getLinkStats(shortCode: string): Promise<ShortLink | null> {
        if (!this.shortLinkCollection) {
            console.error("shortLinkCollection is not initialized in getLinkStats");
            return null;
        }
        const link = await this.shortLinkCollection.findOne({ shortCode });
        return link;
    }
    
    /**
     * Deletes a short link by its short code.
     * @param shortCode The short code of the link to delete.
     * @returns A promise that resolves to the result of the delete operation.
     */
    async deleteShortLinkByShortCode(shortCode: string) {
        if (!this.shortLinkCollection) {
            console.error("shortLinkCollection is not initialized in deleteShortLinkByShortCode");
            return null;
        }
        return await this.shortLinkCollection.deleteOne({ shortCode: shortCode });
    }

    /**
     * Deletes a short link by its MongoDB ObjectId.
     * @param _id The ObjectId of the link to delete.
     * @returns A promise that resolves to the result of the delete operation.
     */
    async deleteShortLinkById(_id: ObjectId) {
        if (!this.shortLinkCollection) {
            console.error("shortLinkCollection is not initialized in deleteShortLinkById");
            return null;
        }
        return await this.shortLinkCollection.deleteOne({ _id: new ObjectId(_id) });
    }

    /**
     * Loads all short links from the database, sorted by creation date (newest first).
     * @returns A promise that resolves to an array of ShortLink objects.
     */
    async loadShortLinks(){
        if (!this.shortLinkCollection) {
            console.error("shortLinkCollection is not initialized in loadShortLinks");
            return [];
        }
        return await this.shortLinkCollection.find({
        }).sort({ createdAt: -1 }).toArray();
    }
} 