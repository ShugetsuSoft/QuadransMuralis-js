import OrbitDB from 'orbit-db';
import OrbitDBIdentities from 'orbit-db-identity-provider';
import ethers from 'ethers';

const getWalletFromPrivKey = async (key) => {
    let wallet = new ethers.Wallet(key)
    return wallet
}

const getOribitDBIdentityFromWallet = async (wallet) => {
    let identity = await OrbitDBIdentities.createIdentity({
        type: 'ethereum',
        wallet: wallet
    })
    return identity
}

const getOrbitDBInstance = async (ipfsInstance, identity) => {
    let orbitdb = await OrbitDB.createInstance(ipfsInstance, {
        identity: identity
    })
    return orbitdb
}

export default {
    getWalletFromPrivKey,
    getOribitDBIdentityFromWallet,
    getOrbitDBInstance
}