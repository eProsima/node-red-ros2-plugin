ARG ROS_DISTRO=foxy

FROM ros:$ROS_DISTRO

# BEWARE: shared memory will not work by default with this Docker.
# Please run it with -v /dev/shm:/dev/shm option or compile the docker image with FastDDS with no SHM_DEFAULT=ON.

# Dependencies
RUN apt-get install -f
RUN apt-get update

# Install Integration Service dependencies
RUN apt-get install -y libyaml-cpp-dev
RUN apt-get install -y libboost-program-options-dev
RUN apt-get install -y libwebsocketpp-dev libboost-system-dev
RUN apt install -y libboost-dev libssl-dev libcurlpp-dev libasio-dev libcurl4-openssl-dev

# Install node.js
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_14.x -o nodesource_setup.sh
RUN chmod +x nodesource_setup.sh && sudo sh -c ./nodesource_setup.sh
RUN apt-get install -y nodejs

# Install Node-RED
RUN npm install -g --unsafe-perm node-red

# Prepare Integration Service workspace
RUN apt-get install -y git
RUN mkdir -p /is_ws/src
WORKDIR /is_ws/src
RUN git clone https://github.com/eProsima/Integration-Service.git is -b feature/node-fiware-support
RUN git clone https://github.com/eProsima/WebSocket-SH.git
RUN git clone https://github.com/eProsima/ROS2-SH.git -b feature/ros2_dynamic
RUN git clone https://github.com/eProsima/FIWARE-SH.git --branch bugfix/advertise
WORKDIR /is_ws

# Compile the Integration Service
RUN . /opt/ros/$ROS_DISTRO/setup.sh && \
    colcon build --cmake-args -DCMAKE_BUILD_TYPE=DEBUG -DIS_ROS2_SH_MODE=DYNAMIC --install-base /opt/is

# Install IS-Web-API
RUN mkdir -p /iswebapi_ws/
WORKDIR /iswebapi_ws/
RUN git clone https://github.com/eProsima/IS-Web-API.git -b feature/node-fiware-support
WORKDIR /usr/lib
RUN npm install -g /iswebapi_ws/IS-Web-API

# Install node-red-plugin
RUN mkdir -p /nodered_ws/src
WORKDIR /nodered_ws/src
RUN git clone https://github.com/eProsima/node-red-ros2-plugin.git -b feature/node-fiware-support
WORKDIR /usr/lib
RUN npm install -g /nodered_ws/src/node-red-ros2-plugin

# Enable overlay execution
RUN printf '#!/bin/bash\n set -e\n \n # setup ros2 environment\n source "/opt/is/setup.sh" --\n NODE_PATH=/usr/lib/node_modules exec "$@"' > /node_entrypoint.sh \
    && chmod ugo+wrx /node_entrypoint.sh
