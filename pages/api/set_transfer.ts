import clientPromise from "../../lib/mongodb";

import type { NextApiRequest, NextApiResponse } from 'next';

const DBName = "contract_transfer"
const TransferCollection = "transfers"
// const RanklistCollection = "reward_ranklist"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { from, to, value, transactionHash } = req.body
    if (!from || !to || !value) {
        res.status(405).json("request format error")
        return
    }
    if (to === "0x7F568433F1BD0865Cb8B14314F6f7C278660De5d") {
        res.status(200).json({
            "success": true
        })
        return
    }

    const client = await clientPromise;
    const session = client.startSession();
    try {
        let reward = Math.floor(Number(value) / 1000000000) //wei to gwei
        await session.withTransaction(async () => {
            const db = client.db(DBName)
            const document = {
                to: to,
                value: reward,
                transactionHash: transactionHash
            }
            const transferCollection = db.collection(TransferCollection)
            const hasDocument = await transferCollection.findOne(document)
            if (!hasDocument) {
                //document not exist
                await transferCollection.insertOne(document, { session })
            }
        })
    } catch (e) {
        console.error(e)
        res.status(503).json(e)
    } finally {
        session.endSession();
        res.status(200).json({
            "success": true
        })
    }
}