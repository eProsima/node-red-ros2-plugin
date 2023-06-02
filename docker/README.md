## How to build an image

The [Dockerfile](./Dockerfile) associated with this repository can
be used to build a docker image:

```console
docker build -t node-red-ros2-plugin .
```

## How to use the plugin

- First run the already created docker image:

```console
docker run --rm --net=host -ti node-red-ros2-plugin
```
- Execute the [Integration Service](https://github.com/eProsima/soss) bash script
```console
. /opt/is/setup.bash
```
- Run Node-RED using `/data/` as user directory:

```console
node-red -u /data
```

- Open a browser and go to [http://localhost:1880/](http://localhost:1880/)
