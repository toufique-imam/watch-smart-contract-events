import clientPromise from '../lib/mongodb'
import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'
import { getLatestBuyer, registerTransferListener, postToMongoDB, parseServerResponse, getTransfersFromMongoDB, getMaxRewardFromMongoDB } from "../context/EthersContexts"
import { useEffect, useState } from 'react'
import 'bootstrap/dist/css/bootstrap.css'

type ConnectionStatus = {
  isConnected: boolean,
  latestBuyer: string,
}


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
      props: { isConnected: false, latestBuyer: String("") },
    }
  }
}

export default function Home({
  isConnected, latestBuyer
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  async function transferCallback(data: any) {
    console.log("OK", data)
    let transactionHash = String(data[0])
    let from = String(data[1])
    let to = String(data[2])
    let value = String(data[3])

    console.log(`1 Reward Transferred! Address: ${transactionHash} From: ${from}, To: ${to}, Amount: ${value}`);
    if (isConnected) {
      try {
        const response = await postToMongoDB(from, to, value, transactionHash)
        await parseServerResponse(response)
      } catch (e) {
        console.log(e)
      }
    }
  }
  const [events, setEvents] = useState<any>([]);
  const [topRankUser, setTopRankUser] = useState<any>(null);
  const [hasEvents, setHasEvents] = useState<boolean>(false);

  async function getTransferList() {
    const response = await getTransfersFromMongoDB()
    const responseData: Array<any> = await parseServerResponse(response)
    if (responseData.length > 0) {
      setHasEvents(true)
    } else {
      setHasEvents(false)
    }
    setEvents(responseData)
  }
  async function getMaxTransferList() {
    const response = await getMaxRewardFromMongoDB()
    const responseData: Array<any> = await parseServerResponse(response)
    if (responseData.length > 0) {
      setTopRankUser(responseData[0])
    } else {
      setTopRankUser(null)
    }
  }
  useEffect(() => {
    registerTransferListener(transferCallback)
    // transfer_check_realtime()
  }, []);

  return (
    <div className="container">
      <div className='card m-2 p-2 w-20'>
        <div className="card-header">
          MongoDB Connection Status
        </div>
        <div className='card-body'>
          <p className='card-title'>
            {isConnected ?  "Connected" : "Not Connected"}
          </p>
        </div>
      </div>
      
      <div className='card  m-2 p-2'>
        <div className="card-header">
          Latest Buyer
        </div>
        <div className='card-body'>
          <p className='card-title'>Address: {latestBuyer}</p>
        </div>
      </div>
      <div>
        <button className='btn btn-primary  m-2 p-2' onClick={getTransferList}>Click me For list</button>
        <button className='btn btn-success  m-2 p-2' onClick={getMaxTransferList}>Click me For Top user</button>
      </div>
      {topRankUser ?
        <div className='card  m-2 p-2'>
          <div className="card-header">
            Top Ranked User
          </div>
          <div className='card-body'>
            <p className='card-title'>Address: {topRankUser.userId}</p>
            <p className='card-text'>Amount: {topRankUser.value}</p>
          </div>
        </div>
        : <></>
      }
      {hasEvents ?
        <table className='table  m-2 p-2'>
          <thead>
            <tr>
              <td scope='col'> User </td>
              <td scope='col'>value</td>
            </tr>
          </thead>
          <tbody>
            {events.map((e: any) => (
              <tr key={e._id}>
                <td>{e.userId}</td>
                <td>{e.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        : <></>
      }
    </div>
  )
}
