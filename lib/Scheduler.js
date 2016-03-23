// Implementation of org.apache.mesos.Scheduler
module.exports = function (java) {

    var Protos = java.import("org.apache.mesos.Protos");
    var taskIDGenerator = java.newInstanceSync("java.util.concurrent.atomic.AtomicInteger");
    var pendingInstances = java.newInstanceSync("java.util.ArrayList");
    var runningInstances = java.newInstanceSync("java.util.ArrayList");
    var imageName = "tobilg/mini-webserver";
    var desiredInstances = 3;

    return java.newProxy('org.apache.mesos.Scheduler', {
        registered: function (schedulerDriver, frameworkID, masterInfo) {
            var address = masterInfo.getAddressSync();
            console.log("registered at master=" + address.getIpSync() + ":" + address.getPortSync() + " framework=" + frameworkID);
        },
        reregistered: function (schedulerDriver, masterInfo) {
            console.log("reregistered");
        },
        resourceOffers: function (schedulerDriver,  offers) {

            console.log("Resource Offers -----------");
            console.log("offers: " + offers.sizeSync());
            console.log("runningInstances: " + runningInstances.sizeSync());
            console.log("pendingInstances: " + pendingInstances.sizeSync());

            for (var i= 0; i < offers.sizeSync(); i++) {

                var tasks = java.newInstanceSync("java.util.ArrayList");
                var offer = offers.getSync(i);

                if (runningInstances.sizeSync() + pendingInstances.sizeSync() < desiredInstances) {

                    // generate a unique task ID
                    var nextTaskId = taskIDGenerator.incrementAndGetSync();
                    var taskIdBuilder = Protos.TaskID.newBuilderSync();
                    taskIdBuilder.setValueSync(nextTaskId.toString());
                    var taskId = taskIdBuilder.buildSync();

                    console.log("Launching task " + taskId.getValueSync());
                    pendingInstances.addSync(taskId.getValueSync());

                    // Overwrite port settings of Docker image (we're using HOST networking!)
                    var envParameterBuilder = Protos.Parameter.newBuilderSync();
                    envParameterBuilder.setKeySync("env");
                    envParameterBuilder.setValueSync("SERVER_PORT=8888");
                    var envParameters = envParameterBuilder.buildSync();

                    // docker image info
                    var dockerInfoBuilder = Protos.ContainerInfo.DockerInfo.newBuilderSync();
                    dockerInfoBuilder.setImageSync(imageName);
                    dockerInfoBuilder.setNetworkSync(Protos.ContainerInfo.DockerInfo.Network.HOST);
                    dockerInfoBuilder.addParametersSync(envParameters);
                    var dockerInfo = dockerInfoBuilder.buildSync();

                    // container info
                    var containerInfoBuilder = Protos.ContainerInfo.newBuilderSync();
                    containerInfoBuilder.setTypeSync(Protos.ContainerInfo.Type.DOCKER);
                    containerInfoBuilder.setDockerSync(dockerInfo);
                    var containerInfo = containerInfoBuilder.buildSync();

                    // CPU num
                    var cpuNumBuilder = Protos.Value.Scalar.newBuilderSync();
                    cpuNumBuilder.setValueSync(0.2);
                    var cpuNum = cpuNumBuilder.buildSync();

                    // CPU info
                    var cpuInfoBuilder = Protos.Resource.newBuilderSync();
                    cpuInfoBuilder.setNameSync("cpus");
                    cpuInfoBuilder.setTypeSync(Protos.Value.Type.SCALAR);
                    cpuInfoBuilder.setScalarSync(cpuNum);
                    var cpuInfo = cpuInfoBuilder.buildSync();

                    // Mem num
                    var memNumBuilder = Protos.Value.Scalar.newBuilderSync();
                    memNumBuilder.setValueSync(128);
                    var memNum = memNumBuilder.buildSync();

                    // Mem info
                    var memInfoBuilder = Protos.Resource.newBuilderSync();
                    memInfoBuilder.setNameSync("mem");
                    memInfoBuilder.setTypeSync(Protos.Value.Type.SCALAR);
                    memInfoBuilder.setScalarSync(memNum);
                    var memInfo = memInfoBuilder.buildSync();

                    // Command info
                    var commandInfoBuilder = Protos.CommandInfo.newBuilderSync();
                    commandInfoBuilder.setShellSync(false);
                    var commandInfo = commandInfoBuilder.buildSync();

                    // Slave id
                    var slaveId = offer.getSlaveIdSync();

                    // Create task to run
                    var taskBuilder = Protos.TaskInfo.newBuilderSync();
                    taskBuilder.setNameSync("task " + taskId.getValueSync());
                    taskBuilder.setTaskIdSync(taskId);
                    taskBuilder.setSlaveIdSync(slaveId);
                    taskBuilder.addResourcesSync(cpuInfo);
                    taskBuilder.addResourcesSync(memInfo);
                    taskBuilder.setContainer(containerInfo);
                    taskBuilder.setCommandSync(commandInfo);
                    var task = taskBuilder.buildSync();

                    // Add task to task list
                    tasks.addSync(task);

                }

                if (tasks.sizeSync() > 0) {

                    var filtersBuilder = Protos.Filters.newBuilderSync();
                    filtersBuilder.setRefuseSecondsSync(5);
                    var filters =filtersBuilder.buildSync();

                    var offerId = offer.getIdSync();

                    schedulerDriver.launchTasksSync(offerId, tasks, filters);

                }

            }

        },
        offerRescinded: function (schedulerDriver, offerID) {
            console.log("offerRescinded");
        },
        statusUpdate: function (driver, taskStatus) {

            var taskId = taskStatus.getTaskIdSync().getValueSync();

            console.log("statusUpdate() task " + taskId + " is in state " + taskStatus.getStateSync());

            switch (taskStatus.getStateSync().toString()) {
                case "TASK_RUNNING":
                    pendingInstances.removeSync(taskId);
                    runningInstances.addSync(taskId);
                    console.log("RUNNING -----------");
                    console.log("runningInstances: " + runningInstances.sizeSync());
                    console.log("pendingInstances: " + pendingInstances.sizeSync());
                    break;
                case "TASK_FAILED":
                    pendingInstances.removeSync(taskId);
                    console.log("FINISHED -----------");
                    console.log("runningInstances: " + runningInstances.sizeSync());
                    console.log("pendingInstances: " + pendingInstances.sizeSync());
                    break;
                case "TASK_ERROR":
                    break;
                case "TASK_FINISHED":
                    pendingInstances.removeSync(taskId);
                    runningInstances.removeSync(taskId);
                    console.log("FINISHED -----------");
                    console.log("runningInstances: " + runningInstances.sizeSync());
                    console.log("pendingInstances: " + pendingInstances.sizeSync());
                    break;
            }

            console.log("Number of instances: pending=" + pendingInstances.sizeSync() + ", running=" + runningInstances.sizeSync());
        },
        frameworkMessage: function (schedulerDriver, executorID, slaveID, bytes) {
            console.log("frameworkMessage");
        },
        disconnected: function (schedulerDriver) {
            console.log("disconnected");
        },
        slaveLost: function (schedulerDriver, slaveID) {
            console.log("slaveLost");
        },
        executorLost: function (schedulerDriver, executorID, slaveID, i) {
            console.log("executorLost");
        },
        error: function (schedulerDriver, error) {
            console.log("error: " + error);
        }
    });

};
