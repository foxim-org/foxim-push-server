* aedes docs https://github.com/moscajs/aedes/blob/main/docs/Aedes.md
* mqtt topic best practices https://www.hivemq.com/blog/mqtt-essentials-part-5-mqtt-topics-best-practices

### publish 事件触发顺序

```mermaid
  flowchart
    authorizePublish ---> authorizeForward ---> on_publish
```
