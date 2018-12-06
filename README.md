# alertmanager-discord

Converts Prometheus Alertmanager webhook to Discord webhook.

## Usage

Put your Discord webhook URL in the environment variable `WEBHOOK`.

Rule example:
```yaml
alert: InstanceDown
expr: up == 0
for: 5m
labels:
  severity: critical
annotations:
  summary: "Instance {{$labels.instance}} down"
  description: "{{$labels.instance}} of job {{$labels.job}} has been down for more than 5 minutes."
```
