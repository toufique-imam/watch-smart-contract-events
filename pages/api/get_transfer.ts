import clientPromise from "../../lib/mongodb";

import type { NextApiRequest, NextApiResponse } from 'next';

const DBName = "contract_transfer"
const TransferCollection = "transfers"
const RanklistCollection = "reward_ranklist"


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    try {
        const data = req.query
        var limit = Number(data.limit)
        if(!limit){
            limit = 1
        }

        const client = await clientPromise;
        const db = client.db(DBName)

        const transfers = await db
            .collection(RanklistCollection)
            .find({})
            .sort({ value: -1 })
            .limit(limit)
            .toArray()

        res.status(200).json({"result" :transfers })
    } catch (e) {
        console.error(e)
        res.status(503).json(e)
    }
}