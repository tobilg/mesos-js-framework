# mesos-js-framework
The project is a proof-of-concept implementation of a Mesos framework in Javascript via the fabulous [node-java](https://github.com/joeferner/node-java) Java bridge.

## Installation
    
### Clone the Vagrant CoreOS Mesos cluster and start the cluster

    git clone https://github.com/tobilg/coreos-mesos-cluster.git && cd coreos-mesos-cluster && vagrant up 

### Clone the project and install dependencies

    git clone https://github.com/tobilg/mesos-js-framework.git && cd mesos-js-framework && npm install
    
## Running
You can test this via Vagrant and the [tobilg/coreos-mesos-cluster](https://github.com/tobilg/coreos-mesos-cluster) project, which starts a three node CoreOS cluster with ZooKeeper 3.4.6, Mesos 0.27.0 (masters and slaves) and Marathon.

This will expose the adresses `172.17.8.101`, `172.17.8.102` and `172.17.8.103`. To connect the framework to the cluster, you can use the Mesos master URL `zk://172.17.8.101:2181,172.17.8.102:2181,172.17.8.103:2181/mesos`. 

### Running the framework locally
You need to make sure that the `LIBPROCESS_IP` is set to a reachable IP address on you local machine, e.g. on Mac OS via

    export LIBPROCESS_IP=$(ipconfig getifaddr en0)
    
where `en0` is the respective interface.

To start the framework, use the following command:

    MESOS_ZK_CONNECTION=zk://172.17.8.101:2181,172.17.8.102:2181,172.17.8.103:2181/mesos node mesos-js-framework.js
    
This framework will start three [tobilg/docker-mini-webserver](https://github.com/tobilg/docker-mini-webserver) Docker images. Each will be reachable on port `8888` on the Mesos slaves, e.g. [http://172.17.8.102:8888/status](http://172.17.8.102:8888/status).  
    
You should then see the framework in the Mesos master's framework page.

### Running the framework via Marathon

```bash
curl -XPOST 'http://172.17.8.102:8080/v2/apps' -H 'Content-Type: application/json' -d '{
  "id": "mesos-js-framework",
  "env": {
      "MESOS_ZK_CONNECTION": "zk://172.17.8.101:2181,172.17.8.102:2181,172.17.8.103:2181/mesos"
  },
  "container": {
    "type": "DOCKER",
    "docker": {
      "network": "HOST",
        "image": "tobilg/mesos-js-framework",
        "forcePullImage": true
    }
  },
  "cpus": 0.5,
  "mem": 256,
  "instances": 1
}'
```