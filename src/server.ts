import * as Koa from 'koa';
import * as Router from 'koa-router';
import { pathToRegexp, match, parse, compile } from 'path-to-regexp';

const app = new Koa();
const router = new Router();

router.get("/:id", async (ctx) => {
    ctx.body = 'Hello World!';
});

app.use(router.routes());

app.listen(8000);