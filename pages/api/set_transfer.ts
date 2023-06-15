import clientPromise from "../../lib/mongodb";

import type { NextApiRequest, NextApiResponse } from 'next';

const DBName = "contract_transfer"
const TransferCollection = "transfers"
const RanklistCollection = "reward_ranklist"

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
    try {
        let reward = Math.floor(Number(value) / 1000000000) //wei to gwei
        const client = await clientPromise;
        const db = client.db(DBName)
        const document = {
            from: from,
            to: to,
            value: value,
            transactionHash: transactionHash
        }
        const transferCollection = db.collection(TransferCollection)
        const ranklistCollection = db.collection(RanklistCollection)
        const hasDocument = await transferCollection.findOne(document)
        const hasReward = await ranklistCollection.findOne({
            userId: to
        })
        var operation1 = false
        var operation2 = false
        //document na thakle value increase korbo
        //thakle kisu korbo na
        if(hasDocument && hasReward){
            res.status(200).json({
                "success": true
            })
            return
        }
        if (!hasDocument) {
            //document not exist
            const insertionResult = await transferCollection.insertOne(document)
            if (insertionResult) {
                operation1 = true
            } else {
                res.status(503).json({
                    "error": "something went wrong"
                })
            }
        } else {
            operation1 = true
        }
        if (!hasReward) {
            //document not exist
            const insertionResult = await ranklistCollection.insertOne({
                userId: to,
                value: reward
            })
            if (insertionResult) {
                operation2 = true
            } else {
                res.status(503).json({
                    "error": "something went wrong"
                })
                return
            }
        } else {
            //document exist, only increase reward
            const updateResult = await ranklistCollection.updateOne({
                userId: to
            }, {
                $inc: {
                    value: reward
                }
            })
            if (updateResult) {
                operation2 = true
            } else {
                res.status(503).json({
                    "error": "something went wrong"
                })
                return;
            }
        }
        if (operation1 && operation2) {
            res.status(200).json({
                "result": true
            })
        }
    } catch (e) {
        console.error(e)
        res.status(503).json(e)
    }
}