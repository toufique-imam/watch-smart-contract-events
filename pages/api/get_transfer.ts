import clientPromise from "../../lib/mongodb";

import type { NextApiRequest, NextApiResponse } from 'next';

const DBName = "contract_transfer"
const DBCollection = "transfers"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    try {
        const client = await clientPromise;
        const db = client.db(DBName)

        const transfers = await db
            .collection(DBCollection)
            .find({})
            .limit(100)
            .toArray()

        res.status(200).json({"result" :transfers })
    } catch (e) {
        console.error(e)
        res.status(503).json(e)
    }
}