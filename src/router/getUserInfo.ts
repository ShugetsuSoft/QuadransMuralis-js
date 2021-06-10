import Koa from 'koa';
import Classes from '../types/class'

const getUserInfo = async (ctx: Koa.Context) => {
    const addr = ctx.params.addr;
    let newUser = new Classes.QmUserStore(ctx.orbitdb, addr)
    ctx.body = ctx.user.profile;
}

export default getUserInfo;