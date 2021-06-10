import Koa from 'koa';
import Router from 'koa-router';

import Headers from './middleware/headers';
import RouterRegister from './router/index';
import GlobalVariablesRegister from './middleware/global'

// Constellation

const app = new Koa();
const router = new Router();
RouterRegister(router);
app.use(Headers);
app.use(router.routes());

GlobalVariablesRegister(app).then(() => {
    console.log("App start, listening at :8000")
    app.listen(8000);
})