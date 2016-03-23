#!/bin/bash

# Expose MESOS_IP as LIBPROCESS_IP (HOST networking only!)
export LIBPROCESS_IP=${MESOS_IP}

exec node /app/mesos-js-framework.js