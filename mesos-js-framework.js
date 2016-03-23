"use strict";
var java = require("java");
var path = require("path");

// Configure classpath
java.classpath.push(path.join(__dirname, "./libs/mesos-0.27.2.jar"));
java.classpath.push(path.join(__dirname, "./libs/protobuf-java-2.5.0.jar"));

// Check if MESOS_ZK_CONNECTION is present
if (!process.env.MESOS_ZK_CONNECTION || !process.env.LIBPROCESS_IP) {
    console.log("Please specify the MESOS_ZK_CONNECTION and LIBPROCESS_IP environment variables!");
    console.log("MESOS_ZK_CONNECTION: " + process.env.MESOS_ZK_CONNECTION);
    console.log("LIBPROCESS_IP: " + process.env.LIBPROCESS_IP);
    process.exit(1);
}

// Catch shutdown signal
process.on("SIGTERM", function () {
    // Graceful shutdown
    process.exit();
});

// Imports
var Protos = java.import("org.apache.mesos.Protos");
var MesosSchedulerDriver = java.import("org.apache.mesos.MesosSchedulerDriver");

// Get ExampleScheduler interface implementation
var scheduler = require("./lib/Scheduler")(java);

// Get FrameworkInfo builder
var frameworkBuilder = Protos.FrameworkInfo.newBuilderSync();

// Configure FrameworkBuilder
frameworkBuilder.setNameSync("mesos-js-framework");
frameworkBuilder.setUserSync("root");
frameworkBuilder.setFailoverTimeoutSync(0);
frameworkBuilder.setPrincipalSync("mesos-js");
frameworkBuilder.setHostnameSync(process.env.LIBPROCESS_IP);
frameworkBuilder.setWebuiUrlSync("172.17.8.101:8888");

// Configure driver
var driver = new MesosSchedulerDriver(scheduler, frameworkBuilder.buildSync(), process.env.MESOS_ZK_CONNECTION);

// Start driver
var status = driver.run() === Protos.Status.DRIVER_STOPPED ? 0 : 1;
