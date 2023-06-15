import clientPromise from "../../lib/mongodb";

import type { NextApiRequest, NextApiResponse } from 'next';

const DBName = "contract_transfer"
const DBCollection = "transfers"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { from, to, value, address } = req.body
    if (!from || !to || !value) {
        res.status(405).json("request format error")
        return
    }
    console.log("got add request ", from, to, value, address)
    try {
        const client = await clientPromise;
        const db = client.db(DBName)
        const document = {
            from: from,
            to: to,
            value: value,
            address: address
        }
        const collection = db.collection(DBCollection)
        const hasDocument = await collection.findOne(document)
        if (!hasDocument) {
            const insertionResult = await db.collection(DBCollection)
                .insertOne(document)
            if (insertionResult.acknowledged) {
                res.status(200).json({
                    "result": "success"
                })
            } else {
                res.status(503).json({
                    "error": "something went wrong"
                })
            }
        }else{
            res.status(200).json({
                "result": "already added"
            })
        }
    } catch (e) {
        console.error(e)
        res.status(503).json(e)
    }
}