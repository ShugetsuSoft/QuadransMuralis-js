import { pathToRegexp, match, parse, compile } from 'path-to-regexp';
import Router from 'koa-router';
import getUserInfo from './getUserInfo';
import getUserIllusts from './getUserIllusts';

const RouterRegister = (router: Router) => {
    router.get('/user/:addr/illusts', getUserIllusts);
    router.get('/user/:addr', getUserInfo);
}

export default RouterRegister;