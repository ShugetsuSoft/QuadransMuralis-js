import Koa from 'koa';
import Classes from '../types/class'


const getUserInfo = async (ctx: Koa.Context) => {
    const addr = ctx.params.addr
    if (ctx.usersCache[addr]) {
        if (ctx.usersCache[addr].state) {
            ctx.body = JSON.stringify(ctx.usersCache[addr].profile)
        }else{
            ctx.body = "Mo"
        }
    } else {
        let newUser = new Classes.QmUserStore(ctx.orbitdb, addr)
        console.log(await newUser.load())
        ctx.usersCache[addr] = newUser
        ctx.body = "User Loaded."
    }
}



export default getUserInfo;