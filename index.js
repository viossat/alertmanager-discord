const Koa = require('koa');
const parser = require('koa-bodyparser');
const request = require('request-promise-native');

if (!process.env.WEBHOOK || !process.env.WEBHOOK.startsWith || !process.env.WEBHOOK.startsWith('https://')) {
  console.error('The environment variable WEBHOOK must be the Discord webhook URL');
  process.exit(1);
}

const app = new Koa();
app.use(parser({
  enableTypes: ['json'],
  extendTypes: {
    json: ['*/*'],
  },
  onerror: (err, ctx) => {
    ctx.throw(400);
  },
}));

app.use(async function(ctx) {
  if (ctx.request.body && Array.isArray(ctx.request.body.alerts)) {
    const data = {embeds: []};

    ctx.request.body.alerts.forEach(alert => {
      if (alert.annotations && (alert.annotations.summary || alert.annotations.description)) {
        data.embeds.push({
          title: alert.annotations.summary,
          description: alert.annotations.description,
          color: alert.status === 'resolved' ? 0x00c853 : 0xd50000,
        });
      }
    });

    if (data.embeds.length) {
      await request({
        url: process.env.WEBHOOK,
        method: 'POST',
        json: data,
      }).then(() => {
        ctx.status = 200;
        console.log(data.embeds.length + ' alerts sent');
      }).catch(err => {
        ctx.status = 500;
        console.error(err);
      });
    } else {
      ctx.status = 400;
    }
  } else {
    ctx.status = 400;
  }
});

const port = process.env.PORT || 9094;
app.listen(port, (err) => {
  if (err) {
    return console.error(err);
  }

  console.info('listening on port ' + port);
});
