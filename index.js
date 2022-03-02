// Simple Discord webhook proxy for Alertmanager

const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const axios = require('axios');

const port = process.env.PORT || 5001;
const hook = process.env.DISCORD_WEBHOOK;
const hookRegExp = new RegExp('https://discord(?:app)?.com/api/webhooks/[0-9]{18}/[a-zA-Z0-9_-]+')
const colors = {firing: 0xd50000, resolved: 0x00c853}

async function handleIndex(ctx) {
  if (ctx.request.body && Array.isArray(ctx.request.body.alerts)) {
    const data = {embeds: []};

    ctx.request.body.alerts.forEach(alert => {
      if (alert.annotations && (alert.annotations.summary || alert.annotations.description)) {
        data.embeds.push({
          title: alert.annotations.summary,
          description: alert.annotations.description,
          color: alert.status === 'resolved' ? colors.resolved : colors.firing,
        });
      }
    });

    if (data.embeds.length) {
      await axios.post(
        hook,
        data,
      ).then(() => {
        ctx.status = 200;
        console.log(data.embeds.length + ' alerts sent');
      }).catch(err => {
        ctx.status = 500;
        console.error(err);
      });
    } else {
      ctx.status = 400;
      console.warn('No data to write to embeds');
    }
  } else {
    ctx.status = 400;
    console.error('Unexpected request from Alertmanager:', ctx.request.body);
  }
}

async function handleHealthcheck(ctx) {
  await axios.get(hook)
    .then(() => {
      ctx.status = 200;
      ctx.body = {uptime: process.uptime()};
    }).catch(err => {
      ctx.status = 503;
      if (err.response && err.response.data) {
        console.error(err.response.data);
      } else {
        console.error(err);
      }
    });
}

const router = new Router();
router.post('/',
  bodyParser({
    enableTypes: ['json'],
    extendTypes: {
      json: ['*/*'],
    },
    onerror: (err, ctx) => {
      console.warn(err);
      ctx.throw(400);
    },
  }),
  handleIndex,
).get('/health',
  handleHealthcheck,
);

if (require.main === module) {
  if (!hook || !hook.startsWith || !hookRegExp.test(hook)) {
    console.error('The environment variable DISCORD_WEBHOOK must be the Discord webhook URL');
    process.exit(1);
  }

  const app = new Koa();
  app.use(router.routes());
  app.listen(port, (err) => {
    if (err) {
      return console.error(err);
    }

    console.info('Listening on port ' + port);
  });
}
