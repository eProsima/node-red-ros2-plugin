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

These bridges were generated using [Integration-Service](https://integration-service.docs.eprosima.com/en/latest/) an [eProsima](https://www.eprosima.com/) open-source tool.


## Install

```text
How to install the component

Information about how to install the <Name of component> can be found at the corresponding section of the
[Installation & Administration Guide](docs/installationguide.md).

A `Dockerfile` is also available for your use - further information can be found [here](docker/README.md)

```

## Usage

```text
How to use the component

Information about how to use the <Name of component> can be found in the [User & Programmers Manual](docs/usermanual.md).

The following features are listed as [deprecated](docs/deprecated.md).
```

| :whale: [Docker Hub](https://hub.docker.com/r/link-to-docker) |
| ------------------------------------------------------------- |

## License

[MIT](LICENSE) © <TTE>
