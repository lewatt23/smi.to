import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ShortLinkController, ShortLink } from './shortLinkController';
import { encode } from '../util/base62';
import { Collection, ObjectId } from 'mongodb';

// Mock MongoDB Collection
const mockCollection = <T extends {}>(): Partial<Collection<T>> => ({
    findOne: jest.fn(),
    insertOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    createIndex: jest.fn().mockResolvedValue('indexName'), // Mock createIndex
    deleteOne: jest.fn(),
    find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn(),
    }),
});

describe('ShortLinkController', () => {
    let controller: ShortLinkController;
    let mockShortLinks: Partial<Collection<ShortLink>>;
    let mockCounters: Partial<Collection<{ _id: string; seq: number }>>;

    beforeEach(async () => {
        controller = new ShortLinkController();
        mockShortLinks = mockCollection<ShortLink>();
        mockCounters = mockCollection<{ _id: string; seq: number }>();

        // Mock mongoClient and collections for the controller
        controller.mongoClient = {
            collection: jest.fn((name: string) => {
                if (name === 'shortLinks') {
                    return mockShortLinks as Collection<ShortLink>;
                }
                if (name === 'counters') {
                    return mockCounters as Collection<{ _id: string; seq: number }>;
                }
                throw new Error(`Unexpected collection name: ${name}`);
            }),
            db: jest.fn(), // Add other MongoClient properties if needed by Controller's init
            close: jest.fn(),
            connect: jest.fn(),
            startSession: jest.fn(),
            watch: jest.fn(),
            addListener: jest.fn(),
            emit: jest.fn(),
            eventNames: jest.fn(),
            getMaxListeners: jest.fn(),
            listenerCount: jest.fn(),
            listeners: jest.fn(),
            off: jest.fn(),
            on: jest.fn(),
            once: jest.fn(),
            prependListener: jest.fn(),
            prependOnceListener: jest.fn(),
            rawListeners: jest.fn(),
            removeAllListeners: jest.fn(),
            removeListener: jest.fn(),
            setMaxListeners: jest.fn()

        } as any; // Using 'any' for simplicity in mocking MongoClient

        // Mock counter initialization
        (mockCounters.findOne as jest.Mock).mockResolvedValueOnce(null); // Simulate counter doesn't exist initially
        (mockCounters.insertOne as jest.Mock).mockResolvedValueOnce({ acknowledged: true, insertedId: new ObjectId() });
        
        await controller.init();

        // Reset mocks for findOne and insertOne for counters after init
        (mockCounters.findOne as jest.Mock).mockReset();
        (mockCounters.insertOne as jest.Mock).mockReset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createShortLink', () => {
        it('should create a new short link successfully', async () => {
            const originalUrl = 'https://example.com/very/long/url';
            const nextSeq = 123;
            const expectedShortCode = encode(nextSeq);
            const mockInsertedId = new ObjectId();

            (mockShortLinks.findOne as jest.Mock).mockResolvedValue(null); // No existing link
            (mockCounters.findOneAndUpdate as jest.Mock).mockResolvedValue({ _id: 'shortLinkId', seq: nextSeq });
            (mockShortLinks.insertOne as jest.Mock).mockResolvedValue({ acknowledged: true, insertedId: mockInsertedId });

            const result = await controller.createShortLink(originalUrl);

            expect(mockShortLinks.findOne).toHaveBeenCalledWith({ originalUrl });
            expect(mockCounters.findOneAndUpdate).toHaveBeenCalledWith({ _id: 'shortLinkId' }, { $inc: { seq: 1 } }, expect.anything());
            expect(mockShortLinks.insertOne).toHaveBeenCalledWith(expect.objectContaining({
                originalUrl,
                shortCode: expectedShortCode,
                visits: 0,
            }));
            expect(result).toEqual(expect.objectContaining({
                originalUrl,
                shortCode: expectedShortCode,
                _id: mockInsertedId,
            }));
        });

        it('should return existing link if URL already shortened', async () => {
            const originalUrl = 'https://alreadyexists.com';
            const existingLink = { _id: new ObjectId(), originalUrl, shortCode: 'abc', createdAt: new Date(), visits: 5 };
            (mockShortLinks.findOne as jest.Mock).mockResolvedValue(existingLink);

            const result = await controller.createShortLink(originalUrl);

            expect(result).toEqual(existingLink);
            expect(mockCounters.findOneAndUpdate).not.toHaveBeenCalled();
            expect(mockShortLinks.insertOne).not.toHaveBeenCalled();
        });

        it('should throw an error for invalid URL format', async () => {
            const invalidUrl = 'not-a-url';
            await expect(controller.createShortLink(invalidUrl)).rejects.toThrow('Invalid URL format');
        });
        
        it('should handle getNextSequenceValue when counter needs initialization', async () => {
             // This scenario is partly covered by init, but an explicit test for getNextSequenceValue's upsert
            (mockCounters.findOneAndUpdate as jest.Mock)
                .mockResolvedValueOnce(null) // First call, counter doesn't exist
                .mockResolvedValueOnce({ _id: 'shortLinkId', seq: 1 }); // Hypothetical result of insertOne if findOneAndUpdate did upsert then fetch
            
            // To properly test getNextSequenceValue in isolation, it might need to be public or tested via createShortLink
            // For this test, we rely on createShortLink calling it.
            // The mock setup for findOneAndUpdate in this test will simulate the upsert behavior.
            // We also need to ensure insertOne is set up for the fallback within getNextSequenceValue if findOneAndUpdate result is not as expected.
             (mockCounters.insertOne as jest.Mock).mockResolvedValueOnce({ acknowledged: true, insertedId: new ObjectId() });


            const originalUrl = 'https://newcounter.com';
            await controller.createShortLink(originalUrl);

            expect(mockCounters.findOneAndUpdate).toHaveBeenCalledWith({_id: 'shortLinkId'}, {$inc: {seq: 1}}, expect.anything());
            // If findOneAndUpdate returns null, getNextSequenceValue calls insertOne for the counter.
            // This expect might need adjustment based on the exact flow if findOneAndUpdate truly returns null.
            // However, the current upsert:true should handle this.
            // The current logic in getNextSequenceValue is: if (!sequenceDocument || sequenceDocument.seq === null) { insertOne }
            // So if findOneAndUpdate with upsert:true *still* returns null (which is unlikely for a successful upsert), then insertOne gets called.
        });
    });

    describe('getOriginalUrl', () => {
        it('should retrieve and update visits for a short code', async () => {
            const shortCode = 'test1';
            const linkData = { _id: new ObjectId(), originalUrl: 'https://test.com', shortCode, createdAt: new Date(), visits: 0, lastVisitedAt: null };
            const updatedLinkData = { ...linkData, visits: 1, lastVisitedAt: expect.any(Date) };
            
            (mockShortLinks.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedLinkData);

            const result = await controller.getOriginalUrl(shortCode);

            expect(mockShortLinks.findOneAndUpdate).toHaveBeenCalledWith(
                { shortCode },
                { $inc: { visits: 1 }, $set: { lastVisitedAt: expect.any(Date) } },
                { returnDocument: 'after' }
            );
            expect(result).toEqual(updatedLinkData);
        });

        it('should return null if short code not found', async () => {
            (mockShortLinks.findOneAndUpdate as jest.Mock).mockResolvedValue(null);
            const result = await controller.getOriginalUrl('nonexistent');
            expect(result).toBeNull();
        });
    });

    describe('getLinkStats', () => {
        it('should retrieve stats for a short code', async () => {
            const shortCode = 'statscode';
            const linkData = { _id: new ObjectId(), originalUrl: 'https://stats.com', shortCode, createdAt: new Date(), visits: 10 };
            (mockShortLinks.findOne as jest.Mock).mockResolvedValue(linkData);

            const result = await controller.getLinkStats(shortCode);

            expect(mockShortLinks.findOne).toHaveBeenCalledWith({ shortCode });
            expect(result).toEqual(linkData);
        });

        it('should return null if short code not found for stats', async () => {
            (mockShortLinks.findOne as jest.Mock).mockResolvedValue(null);
            const result = await controller.getLinkStats('nostats');
            expect(result).toBeNull();
        });
    });

    describe('loadShortLinks', () => {
        it('should load all short links sorted by creation date', async () => {
            const mockLinks = [
                { _id: new ObjectId(), originalUrl: 'https://link1.com', shortCode: 'l1', createdAt: new Date(2023, 0, 1), visits: 0 },
                { _id: new ObjectId(), originalUrl: 'https://link2.com', shortCode: 'l2', createdAt: new Date(2023, 0, 2), visits: 0 },
            ];
            (mockShortLinks.find!().toArray as jest.Mock).mockResolvedValue(mockLinks);

            const result = await controller.loadShortLinks();
            expect(mockShortLinks.find).toHaveBeenCalledWith({});
            expect(mockShortLinks.find!().sort).toHaveBeenCalledWith({ createdAt: -1 });
            expect(result).toEqual(mockLinks);
        });
    });
    
    describe('deleteShortLinkById', () => {
        it('should delete a short link by its ObjectId', async () => {
            const linkId = new ObjectId();
            (mockShortLinks.deleteOne as jest.Mock).mockResolvedValue({ acknowledged: true, deletedCount: 1 });

            const result = await controller.deleteShortLinkById(linkId);

            expect(mockShortLinks.deleteOne).toHaveBeenCalledWith({ _id: linkId });
            expect(result).toEqual({ acknowledged: true, deletedCount: 1 });
        });

        it('should return { acknowledged: true, deletedCount: 0 } if link not found for deletion by id', async () => {
            const linkId = new ObjectId();
            (mockShortLinks.deleteOne as jest.Mock).mockResolvedValue({ acknowledged: true, deletedCount: 0 });
            
            const result = await controller.deleteShortLinkById(linkId);
            expect(mockShortLinks.deleteOne).toHaveBeenCalledWith({ _id: linkId });
            expect(result).toEqual({ acknowledged: true, deletedCount: 0 });

        });
    });

    describe('deleteShortLinkByShortCode', () => {
        it('should delete a short link by its shortCode', async () => {
            const shortCode = 'delcode';
            (mockShortLinks.deleteOne as jest.Mock).mockResolvedValue({ acknowledged: true, deletedCount: 1 });

            const result = await controller.deleteShortLinkByShortCode(shortCode);

            expect(mockShortLinks.deleteOne).toHaveBeenCalledWith({ shortCode: shortCode });
            expect(result).toEqual({ acknowledged: true, deletedCount: 1 });
        });
    });

}); 