# Node-RED ROS 2 Plugin 

[![License: MIT](https://img.shields.io/github/license/ramp-eu/TTE.project1.svg)](https://opensource.org/licenses/MIT)

This project is part of [DIH^2](http://www.dih-squared.eu/). The main goal is provide [Node-RED](https://nodered.org/docs/) interoperability with
[ROS2](https://docs.ros.org/) and [FIWARE](https://fiware-orion.readthedocs.io/en/master/). The plugin introduces in the
Node-RED palette new nodes dealing with:

### Type definition

In order to transmit information it is necessary to precisely define the composition of the data delivered.

Node-RED approach is based on [JSON](https://www.json.org/json-en.html) which is versatile and user friendly
but cannot be used to interoperate with industrial protocols that require language-independent type Description.

In order to provide this interoperability ROS2 introduced [IDL](https://www.omg.org/spec/IDL/4.2/About-IDL). Which is
a data type and interfaces descriptive language customary in industrial applications.

The new nodes make both: IDL type descriptions and well known ROS2 types available.

### ROS2 Publisher-Subscriber interface

Publisher and Subscriber nodes are provided to directly access its ROS2
counterparts.

Different topics and QoS can be selected. Also a global configuration node allows to select the ROS domain to enforce.

### FIWARE Context Broker Publisher-Subscriber interface

The Context Broker doesn't provide a Publisher-Subscriber
interface (works more like a database) but a translation can be easily performed if:

- Entities are understood as topics.
- Creating or setting an entry is understood as publishing.
- Notification callbacks on an entity are understood as subscribtion callbacks.

## Contents

-   [Background](#background)
-   [Install](#install)
-   [Usage](#usage)
-   [API](#api)
-   [Testing](#testing)
-   [License](#license)

## Background

The interoperability between the pluging and the ROS2 and FIWARE Broker environments is achieved using [WebSocket](https://websockets.spec.whatwg.org//)
bridges to them. This was the natural choice given that Node-RED relies on WebSocket for front-end/back-end
communication.

These bridges were generated using [Integration-Service](https://integration-service.docs.eprosima.com/en/latest/) an
[eProsima](https://www.eprosima.com/) open-source tool.

Using Integration-Service directly from the plugin was possible, but it was considered a better choice to create another
Node.js library ([IS-Web-API](https://github.com/eProsima/IS-Web-API), to abstract the bridge operation. This way:
 + The plugin can rely on any other bridge technology.
 + Development is simplified by enforcing separation of concerns.
 + Any other Node.js project (besides the plugin) can profit from the bridge library.

## Install

A [Dockerfile](./docker/Dockerfile) is provided to exemplify the set up on an argument provided ROS2 distro.

### Dependencies

Some of the following installation steps can be skipped if the target system already fulfils some of the requirements:

1. ROS2 installation. Follow the [official ROS2 installation guide](https://docs.ros.org/en/humble/Installation.html)
   for the distro of choice. The Dockerfile is based on a ROS2 image, so this is not exemplified.

1. Install Node.js. The usual OS package managers (like `apt` on Ubuntu or `winget/chocolatey` on windows) provide it.
   An exhaustive list is available [here](https://nodejs.org/en/download/package-manager).
   Some package managers constrain the user to a specific version of Node.js. The Node.js [site](https://nodejs.org/en/download)
   hints on how to install specific versions.

   For example, in `apt` is possible to add via location configuration file a new remote repository where all Node.js
   versions are available. This is the strategy that the Dockerfile uses:

   ```bash
   $ curl -sL https://deb.nodesource.com/setup_14.x -o nodesource_setup.sh
   $ chmod +x nodesource_setup.sh && sudo sh -c ./nodesource_setup.sh
   $ sudo apt-get install -y nodejs
   ```
1. Install Node-RED. Follow the [official Node-RED installation guide](https://nodered.org/docs/getting-started/local).
   The Dockerfile favors the easiest procedure which relies on `npm` (default Node.js package manager) which is
   available after Node.js installation step:

   ```bash
   $ npm install -g node-red
   ```

1. Install Integration-Service. Follow the [Integration-Service installation manual](https://integration-service.docs.eprosima.com/en/latest/installation_manual/installation_manual.html#installation-manual).
   This is exemplified in the Dockerfile, basically it is build from sources downloaded from github. Dependencies
   associated with the build and bridge environments are required:

   ```bash
   $ apt-get update
   $ apt-get install -y libyaml-cpp-dev libboost-program-options-dev libwebsocketpp-dev \
                      libboost-system-dev libboost-dev libssl-dev libcurlpp-dev \
                      libasio-dev libcurl4-openssl-dev git
   $ mkdir -p /is_ws/src && cd "$_"
   $ git clone https://github.com/eProsima/Integration-Service.git is
   $ git clone https://github.com/eProsima/WebSocket-SH.git
   $ git clone https://github.com/eProsima/ROS2-SH.git
   $ git clone https://github.com/eProsima/FIWARE-SH.git

   $ . /opt/ros/humble/setup.sh # customize the ROS2 distro: foxy, galactic, humble ...
   $ colcon build --cmake-args -DIS_ROS2_SH_MODE=DYNAMIC --install-base /opt/is
   ```

   Note that it uses the ROS2 build tool: [colcon](https://colcon.readthedocs.io)
   As ROS2 it is necessary to source and
   [overlay](https://colcon.readthedocs.io/en/released/developer/environment.html).
   In order to simplify sourcing `/opt/is` was chosen as deployment dir. The overlay can be then sourced as:

   ```bash
   $ . /opt/is/setup.bash
   ```
   It will automatically load the ROS2 overlay too. After the overlay is sourced it must be possible to access the
   integration-service help as:

   ```bash
   $ integration-service --help
   ```

### Plugin installation

Once all the dependencies are available we can deploy the plugin via npm:
+ From npm repo:

   ```bash
   $ npm install -g node-red-ros2-plugin
   ```
+ From sources. `npm` allows direct deployment from github repo:

   ```bash
   $ npm install -g https://github.com/eProsima/node-red-ros2-plugin
   ```

   Or, as in the Dockerfile, from a local sources directory. The docker favors this approach to allow tampering with the
   sources.

   ```bash
   $ git clone https://github.com/eProsima/node-red-ros2-plugin.git plugin_sources
   $ npm install -g  ./plugin_sources

   ```

## Usage

```bash
$ docker build --no-cache --build-arg ROS_DISTRO=humble -f  Dockerfile_updated -t visualros:humble .
```

```text
How to use the component

Information about how to use the <Name of component> can be found in the [User & Programmers Manual](docs/usermanual.md).

The following features are listed as [deprecated](docs/deprecated.md).
```

| :whale: [Docker Hub](https://hub.docker.com/r/link-to-docker) |
| ------------------------------------------------------------- |

## License

[MIT](LICENSE) © <TTE>
