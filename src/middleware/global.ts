import Koa from 'koa';
import ipfsUtils from '../utils/ipfs'
import orbitUtils from '../utils/db'
import Classes from '../types/class'
process.setMaxListeners(0)
const Register = async (app: Koa) => {
    app.context.ipfs = await ipfsUtils.getIpfsInstance();
    let identity = await orbitUtils.getOribitDBIdentityFromWallet(null)
    app.context.orbitdb = await orbitUtils.getOrbitDBInstance(app.context.ipfs, identity);
}

export default Register;