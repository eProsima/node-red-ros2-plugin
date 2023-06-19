#!/bin/bash

# Setup ROS 2  environment
source /opt/vulcanexus/${ROS_DISTRO}/setup.bash
source /opt/is/setup.bash
export NODE_PATH=/usr/lib/node_modules
exec "$@"