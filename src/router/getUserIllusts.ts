import Koa from 'koa';
import Classes from '../types/class'


const getUserIllusts = async (ctx: Koa.Context) => {
    const addr = ctx.params.addr
    if (ctx.usersCache[addr]) {
        if (ctx.usersCache[addr].illustsState) {
            console.log(ctx.usersCache[addr].illusts)
            ctx.body = ctx.usersCache[addr].illusts
        }else{
            ctx.body = "Mo"
        }
    } else {
        ctx.body = "User NotFound"
    }
}



export default getUserIllusts;