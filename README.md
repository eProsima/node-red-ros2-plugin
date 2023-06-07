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

In order to test the plugin there are two options: follow the installation steps [above](#install) or run the
test container provided [here](./docker/README.md).

### Node-RED palette

The main concepts associated with Node-RED operation are explained [here](https://nodered.org/docs/user-guide/concepts).
The plugin nodes are displayed on the Node-RED palette as shown in the image. From there, they can be dragged into the
workspace.

![Palette layout](./docs/palette.jpg)

The palette is the pane on the left where all available nodes are classified by sections. Plugin ones appear under `ROS2`
and `FIWARE` (figure's red frame). The worksplace is the central pane where different flows are associated to the upper tabs.

> **_Note:_** the text that labels the node, changes from palette to workspace, and may change depending on the node
configuration.

### Definining a type

In order the publish or subscribe data we need first to specify the associated type. The plugin provides two options:

#### Choosing a predefined ROS2 type

<table>
    <tr>
        <td width="250"><img name="ROS2 Type" src="./docs/ROS2Type.png" height="auto"></td>
        <td> This node represents a specific ROS2 Builtin Type. Once in the workspace, its set up dialog can be opened by
             doble clicking over it.
        </td>
    </tr>
    <tr>
        <td><img name="ROS2 packages" src="./docs/packages.jpg" height="auto"/></td>
        <td> The dialog provides a Package drop-down control where all ROS2 msg packages are listed. </br>
             Once a package is selected the Message drop-down control allows selection of a package specific message.
             In this example the package selected is <tt>geometry_msgs</tt>.
             From this package the <tt>Point</tt> message is selected.
        </td>
    </tr>
    <td><img name="ROS2 Type label" src="./docs/ros2-type-name.png" height="auto"></td>
    <td> Once the dialog set up is saved, the node label changes to highligh the selected type in a <tt>package/message</tt> pattern.
    </td>
</table>

#### Defining a new type via IDL

<table>
    <tr>
        <td width="250"><img name="IDL Type" src="./docs/IDLType.png" height="auto"></td>
        <td> This node represents a type defined by means of an IDL.
             IDL is a language that allows unambiguous specification of the interfaces that may be used to define the
             data types. 
        </td>
    </tr>
    <tr>
        <td><img name="IDL definition" src="./docs/idl-definition.jpg" height="auto"/></td>
        <td> The dialog provides an edit box where the desired IDL can be introduced</br>
             Note that in order to use the type in ROS2 it must follow several conventions:
                <ul>
                    <li>There must be an outer module which should match the message package name.</li>
                    <li>There must be an inner module called <tt>msg</tt>.</li>
                    <li>The type name must follow PascalCase convention.</li>
                </ul>
             By default a dummy message that follows the above guidelines is provided.
        </td>
    </tr>
    <td><img name="IDL Type label" src="./docs/idl-type-name.jpg" height="auto"></td>
    <td> Once the dialog set up is saved, the node label changes to highligh the selected type in a <tt>package/message</tt> pattern.
    </td>
</table>

#### Injecting a type instance into the pipeline

Node-RED pipelines start in *source nodes*. The most popular one is the [inject
node](https://nodered.org/docs/user-guide/nodes#inject) which requires the user to manually defined each field
associated to the type. In order to simplify this a specific node is introduced:

<img name="ROS2 Inject node" src="./docs/ROS2Inject.png" width="250" height="auto">

This node mimics the inject node behaviour but automatically populates the input dialog with the fields associated with
any *type node* linked to it. For example, if we wire together a `ROS Inject` and a `ROS Type` or `IDL Type` nodes as
shown in the figure:

<table>
    <tr>
        <td width="500"><img name="ROS Type inject flow" src="./docs/ROS2InjectPackage.jpg" height="auto"></td>
        <td width="500"><img name="IDL Type inject flow" src="./docs/ROS2InjectIDL.jpg" height="auto"></td>
    </tr>
    <tr>
        <td width="500"><img name="ROS Type inject dialog" src="./docs/ROS2InjectPackageDialog.jpg" height="auto"></td>
        <td width="500"><img name="IDL Type inject dialog" src="./docs/ROS2InjectIDLDialog.jpg" height="auto"></td>
    </tr>
</table>

The associated dialogs are populated with the linked type fields and types.

### ROS2 nodes usage

In order to interact with a ROS2 environment we must specify the same [domain id](https://docs.ros.org/en/humble/Concepts/About-Domain-ID.html)
in use for that environment.

The *domain id* is a number in the range `[0, 166]` that provides isolation for ROS2 nodes.
It defaults to 0 and its main advantage is reduce the incomming traffic for each ROS2 node, discharging them and
speeding things up.

Another key concepts in the ROS2 environment are:

- [topic](https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Topics/Understanding-ROS2-Topics.html)
one. A *topic* is a text string ROS2 nodes use to notify all other nodes in which data they are interested.
When a ROS2 node wants to send or receive data it must specify:
 + Which type is the data they want receive. For example the `geometry_msgs/Pose` we introduced [above](#choosing-a-predefined-ros2-type).
 + Topic associated with the data. For example `/marker_pose`, but in ROS2 topics are often *decorated* using
namespaces to simplify identification, as in `/eProsima/buildings/E3g1/room/F2h3/marker/4Rg1/pose`.

- [Quality of Service (QoS)](https://docs.ros.org/en/humble/Concepts/About-Quality-of-Service-Settings.html). Those are
  policies that allow fine tunning of the communication between nodes. For example:
  + *History QoS* allows to discard messages if only the most recent one is meaningful for our purposes.
  + *Reliable QoS* enforces message reception by resending it until the receiver acknowledges it.
  + *Durability QoS* assures messages published before the receiver node creation would be delivered.

> **_Note:_** ROS2 nodes can only communicate if their respective QoS are compatible. Information on QoS compatibility
  is available [here](https://docs.ros.org/en/humble/Concepts/About-Quality-of-Service-Settings.html#qos-compatibilities).

#### ROS2 configuration node

A [Node-RED config node](https://nodered.org/docs/user-guide/concepts#config-node) is provided to set up the domain ID,
which is a global selection:

![ROS Config Node](./docs/ROS2ConfigNode.jpg)

> **_Note:_** The ROS2 default domain value is 0

#### ROS2 Publisher

<table>
    <tr>
        <td width="250"><img name="ROS2 Publisher" src="./docs/ROS2Publisher.jpg" height="auto"></td>
        <td>This node represents a ROS2 publisher. It is able to publish messages on a specific topic with specific QoS</td>
    </tr>
    <tr>
        <td><img name="ROS2 Publisher Dialog" src="./docs/ROS2PublisherDialog.jpg" height="auto"/></td>
        <td>The dialog provides controls to configure:
            <dl>
                <dt>Topic</dt><dd>Note that the backslash <tt>/</tt> typical of ROS2 topics is not necessary</dd>
                <dt>Domain ID</dt><dd>Selected globally via the configuration node explained
                <a href="#ros2-configuration-node">above</a></dd>
                <dt>QoS</dt><dd>The <tt>+add</tt> button at the bottom adds new combo-boxes to the control where the
                available options for each policy can be selected</dd>
            </dl>
        </td>
    </tr>
</table>

#### ROS2 Subscriber

<table>
    <tr>
        <td width="250"><img name="ROS2 Subscriber" src="./docs/ROS2Subscriber.jpg" height="auto"></td>
        <td>This node represents a ROS2 subscriber. It is able to subscribe on a specific topic and receive all messages
        published for it.</td>
    </tr>
    <tr>
        <td><img name="ROS2 Subscriber Dialog" src="./docs/ROS2PublisherDialog.jpg" height="auto"/></td>
        <td>The dialog provides controls to configure:
            <dl>
                <dt>Topic</dt><dd>Note that the backslash <tt>/</tt> typical of ROS2 topics is not necessary</dd>
                <dt>Domain ID</dt><dd>Selected globally via the configuration node explained
                <a href="#ros2-configuration-node">above</a></dd>
                <dt>QoS</dt><dd>The <tt>+add</tt> button at the bottom adds new combo-boxes to the control where the
                available options for each policy can be selected</dd>
            </dl>
        </td>
    </tr>
</table>

#### ROS2 Basic Publication Example

Let's show how to use a custom type.

1. Launch docker compose as explained [here](./docker/README.md).
1. Create and wire the following nodes:
    + An `IDL Type` node. Open the associated dialog and introduce the following idl:

    ```c
    module custom_msgs {
        module msg {
            struct Message {
                string text;
                uint64 value;
            };
        };
    };
    ```
    + A `ROS Publisher` node. Open the associated dialog and set up the publisher:

        `Topic`
        : hope

        `Domain`
        : 42

    + A `ROS Inject` node. Open the associated dialog and fill in the fields:

        `text`
        : Hello World!

        `value`
        : 42

1. Deploy the flow pressing the corresponding button. Once deployed, the custom type has been registered in the ROS2 distro.

1. Let's launch a subscriber from the
[ROS2 cli](https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Topics/Understanding-ROS2-Topics.html#id7).

```bash
$ docker exec -ti --env ROS_DOMAIN_ID=42 docker-visual-ros-1 /ros_entrypoint.sh ros2 topic echo /hope custom_msgs/msg/Message
```
1. Now click on the inject node button within the editor and see how the terminal receives the data.

> **_Note:_** In the example the ROS2 domain value selected is 42, different from the default value of 0.

![ROS2 Publisher](./docs/ROS2Publisher.gif)

#### ROS2 Basic Subscription Example

In this case, a builtin ROS2 type (`geometry_msgs/Point`) will be used.

1. Launch docker compose as explained [here](./docker/README.md).
1. Create and wire the following nodes:
    + A `ROS2 Type` node. Open the associated dialog and select:
        
        `Package`
        : geometry_msgs

        `Message`
        : Point

    + A `ROS2 Subscriber` node. Open the associated dialog and set up the subscriber:

        `Topic`
        : hope

        `Domain`
        : 17

    + A `debug` node from the `common` palette section. Open the associated dialog and set it up to show the x
    coordinate of the point:

        `Output`
        : `msg.x`

1. Deploy the flow pressing the corresponding button.
1. Publish a message on that topic from the ROS2 cli. In this example we launch a new container connected to the same
network using the standard `ros:humble` image.

```bash
$ docker run --rm -ti --env ROS_DOMAIN_ID=17 --network docker_visualros ros:humble \
         ros2 topic pub /hope geometry_msgs/msg/Point "{ x: 42, y: 0, z: 0 }"
```

![turtlesim](./docs/ROS2Subscriber.gif)

#### ROS2 Mandatory Turtlesim Example

[Turtlesim](https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Introducing-Turtlesim/Introducing-Turtlesim.html)
is an *ad hoc* package that ROS2 provides as GUI node example.

##### Set up

Unlike the previous examples turtlesim cannot work on terminal mode. There are several ways to workaround this:
1. Run GUI application in a docker container as shown [here](https://www.howtogeek.com/devops/how-to-run-gui-applications-in-a-docker-container/).
1. Share the container network stack with the host.
1. Run Node-RED backend directly in your host (see [installation steps](#install)).

Here we favour the second option as the most simple. This only requires:
+ A ROS2 installation in the host.  Follow the [official ROS2 installation guide](https://docs.ros.org/en/humble/Installation.html)
  for the distro of choice.
+ Launch the Visual-ROS container sharing host network stack:

```bash
    node-red-ros2-plugin/docker$ docker build --build-arg ROS_DISTRO=humble -t visualros:humble .
    $ docker run -ti --name turtledemo --network host --ipc host visualros:humble /node_entrypoint.sh node-red
```

##### Demo steps

1. Launch `turtlesim` on the host by doing:

```bash
    $ . /opt/ros/humble/setup.sh
    $ ros2 run turtlesim turtlesim_node
```
   A window should appear with a turtle in the middle.

1. Open a web browser on [http://localhost:1880](http://localhost:1880).

1. Create and wire the following nodes:
   + A `ROS2 Type` node. In the associated dialog set up the turtlesim pose type: `geometry_msgs/Twist`.
   + A couple of `ROS2 Inject` nodes: one to move the turtle forward and another to spin it.
     Wire both nodes to the `ROS2 Type`. Open the associated dialogs and take into account that:
     - mover forward means `linear.x = 1`
     - spin means `angular.z = 1`
   + A `ROS2 Publisher` node. Wire it to the `ROS2 Type` node. Open the associated dialog and set up as:
     - Topic the `turtle/cmd_vel`.
     - Use the default ROS2 domain 0.

1. Click the `Deploy` button.

![turtlesim](./docs/turtlesim.gif)

Now click on the inject nodes buttons within the editor and see how the turtle moves.

This [json file](./docs/turtlesim.json) can be imported to Node-RED in order to reproduce the flow.

### FIWARE nodes usage

The [FIWARE Context Broker](https://fiwaretourguide.readthedocs.io/en/latest/core/introduction/) uses a REST API to
provide information. This interface do not exactly follows a Publisher/Subscriber model but can be adapted to do so:
- Broker entities are mapped as Publisher/Subscriber topics.
- Types are described using IDL which works as a subset of the NGSI type system.

#### FIWARE configuration node

A [Node-RED config node](https://nodered.org/docs/user-guide/concepts#config-node) is provided to set up the FIWARE
Context Broker IPv4 address which is a global selection.

![FIWARE Config Node](./docs/FIWAREsettings.jpg)

***

<img src="./docs/eu_flag.jpg" alt="eu_flag" height="45" align="left" >

This project (DIH² - A Pan‐European Network of Robotics DIHs for Agile Production) has received funding from the
European Union’s Horizon 2020 research and innovation programme under grant agreement No 824964
