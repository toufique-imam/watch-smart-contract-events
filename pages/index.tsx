import clientPromise from '../lib/mongodb'
import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'
import { getLatestBuyer, registerTransferListener, postToMongoDB, parseServerResponse, getFromMongoDB } from "../context/EthersContexts"
import { useEffect, useState } from 'react'
import { Db } from 'mongodb'
type ConnectionStatus = {
  isConnected: boolean,
  latestBuyer: string,
}

const DBName = "contract_transfer"
const DBCollection = "transfers"

export const getServerSideProps: GetServerSideProps<
  ConnectionStatus
> = async () => {
  try {
    await clientPromise
    const x = await getLatestBuyer()
    return {
      props: { isConnected: true, latestBuyer: String(x) },
    }
  } catch (e) {
    console.error(e)
    return {
      props: { isConnected: false, latestBuyer: "" },
    }
  }
}

export default function Home({
  isConnected, latestBuyer
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  async function transferCallback(data: any) {
    console.log("OK", data)
    let address = String(data[0])
    let from = String(data[1])
    let to = String(data[2])
    let value = String(data[3])

    console.log(`1 Reward Transferred! Address: ${address} From: ${from}, To: ${to}, Amount: ${value}`);
    const response = await postToMongoDB(from, to, value, address)
    const responseMessage = await parseServerResponse(response)
    console.log(responseMessage)
  }
  const [events, setEvents] = useState<any>([]);

  async function getTransferList() {
    const response = await getFromMongoDB()
    const responseData = await parseServerResponse(response)
    console.log(responseData)
    setEvents(responseData)
  }
  useEffect(() => {
    registerTransferListener(transferCallback)
    // transfer_check_realtime()
  }, []);

  return (
    <div className="container">
      {isConnected ? <p>Connected to Mongodb</p>
        : <p>Not connected to mongodb</p>}

      <p>
        {latestBuyer}
      </p>
      <button onClick={getTransferList}>Click me</button>
      <table>
        <thead>
          <tr>
            <td> From </td> |
            <td> TO </td> |
            <td>TX Hash</td> |
            <td>value</td> |
          </tr>
        </thead>
        <tbody>
          {events.map((e: any) => (
            <tr key={e._id}>
              <td>{e.from}</td> 
              <td>{e.to}</td> 
              <td>{e.address}</td> 
              <td>{e.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
