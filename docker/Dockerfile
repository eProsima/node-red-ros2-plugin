FROM ros:foxy

# BEWARE: shared memory will not work by default with this Docker.
# Please run it with -v /dev/shm:/dev/shm option or compile the docker image with FastDDS with no SHM_DEFAULT=ON.

# Dependencies
RUN apt-get install -f
RUN apt-get update

# Install Integration Service dependencies
RUN apt-get install -y libyaml-cpp-dev
RUN apt-get install -y libboost-program-options-dev libboost-system-dev
RUN apt-get install -y libwebsocketpp-dev

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
RUN git clone https://github.com/eProsima/Integration-Service.git is -b feature/ros2_dynamic
RUN git clone https://github.com/eProsima/xtypes.git --recursive xtypes -b feature/ros2_sh_dynamic
RUN git clone https://github.com/eProsima/WebSocket-SH.git -b feature/node-red-support
RUN git clone https://github.com/eProsima/ROS2-SH.git -b feature/ros2_dynamic
WORKDIR /is_ws

# Compile the Integration Service
RUN . /opt/ros/foxy/setup.sh && \
    colcon build --cmake-args -DCMAKE_BUILD_TYPE=RELEASE -DIS_ROS2_SH_MODE=DYNAMIC --install-base /opt/is
RUN . /opt/is/local_setup.sh

# Install IS-Web-API
RUN mkdir -p /iswebapi_ws/
WORKDIR /iswebapi_ws/
RUN git clone https://github.com/eProsima/IS-Web-API.git -b feature/node-red-support
RUN mkdir -p /iswebapi_ws/IS-Web-API/build
WORKDIR /iswebapi_ws/IS-Web-API/build
RUN cmake .. && make

# Install node-red-plugin
RUN mkdir -p /nodered_ws/src
WORKDIR /nodered_ws/src
RUN git clone https://github.com/eProsima/node-red-ros2-plugin.git -b feature/ros2-connection
WORKDIR /usr/lib
RUN npm install /nodered_ws/src/node-red-ros2-plugin
