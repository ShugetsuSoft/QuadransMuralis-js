const IpfsClient = require('ipfs-http-client')
const IPFS = require('ipfs')

const getIpfsInstance = async () => {
    //const ipfs = IpfsClient.create({
    //    "url": "http://localhost:5001/api/v0",
    //})
    const ipfs = await IPFS.create({ repo: "./ipfs" })
    return ipfs
}


export default {
    getIpfsInstance
}