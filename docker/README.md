## Plugin testing using docker containers

Testing the plugin capabilities requires access to some services: FIWARE context broker and its associated database.

That makes direct use of the docker `cli` cumbersome. In order to simplify the setup a docker compose file is
[provided](./compose.yaml). The compose file will set up the FIWARE services and launch `Node-RED` as a server.

- Run the compose file:

```bash
$ docker compose up
```

- Open a browser and go to [http://localhost:1880/](http://localhost:1880/)
