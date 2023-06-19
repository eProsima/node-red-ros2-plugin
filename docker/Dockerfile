ARG ROS_DISTRO=humble

FROM eprosima/vulcanexus:$ROS_DISTRO

# Avoid interactuation with installation of some package that needs the locale.
ENV TZ=Europe/Madrid
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Avoids using interactions during building
ENV DEBIAN_FRONTEND=noninteractive

# Use a bash shell so it is possigle to run things like `source` (required for colcon builds)
SHELL ["/bin/bash", "-c"]

# Install Integration Service dependencies
RUN apt-get update && \
    apt-get install -y \
        cmake \
        curl \
        g++ \
        git \
        libasio-dev \
        libboost-dev \
        libboost-program-options-dev \
        libboost-system-dev \
        libcurl4-openssl-dev \
        libcurlpp-dev \
        libssl-dev \
        libwebsocketpp-dev \
        libyaml-cpp-dev \
        python3-pip \
        wget && \
    pip3 install -U \
        colcon-common-extensions \
        vcstool && \
    curl -sL https://deb.nodesource.com/setup_14.x -o nodesource_setup.bash && \
    chmod +x nodesource_setup.bash && \
    bash -c ./nodesource_setup.bash && \
    apt-get install -y nodejs

# Install eProsima Integration Service
WORKDIR /is_ws
RUN mkdir src && cd src && \
    git clone https://github.com/eProsima/Integration-Service.git is && \
    git clone https://github.com/eProsima/WebSocket-SH.git && \
    git clone https://github.com/eProsima/ROS2-SH.git && \
    git clone https://github.com/eProsima/FIWARE-SH.git && \
    source /opt/vulcanexus/$ROS_DISTRO/setup.bash && \
    colcon build --cmake-args -DIS_ROS2_SH_MODE=DYNAMIC --install-base /opt/is

# Install Node-RED and node-red-ros2-plugin
RUN npm install -g --unsafe-perm \
        node-red \
        node-red-ros2-plugin \
        node-red-contrib-keypress

# Enable overlay execution
WORKDIR /
COPY entrypoint.bash .
RUN chmod +x /entrypoint.bash

CMD [ "node", "/usr/bin/node-red" ]
ENTRYPOINT [ "/entrypoint.bash" ]
