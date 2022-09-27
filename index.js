const platform = require("platform");
const computers = require("setting.json");
const ioredis = require("ioredis");
const mysqlClient = require("promise-mysql");

const instancePool = platfrom.createPool(computers);

//valid_instance_amount: 9<number>
console.log(instancePool.valid_instance_amount);

const redis_environment = {
    foo: 123,
    bar: 456
};

const mysql_environment = {
    MYSQL_ROOT_PASSWORD:123456
};

const mysql_deploy_shell = ['docker pull mysql', "docker run --name mysql -p 3306:3306 -d mysql"];


//分配實體的資源
const redis_service_instance = instancePool.deploy({service: "redis", port: "6790"});


/**
 * instance: {
 *      host: string,
 *      port: number,
 *      ......
 * }
 */
console.log(redis_service_instance);

//初始化將要使用的model 可能也能透過npm 處理(?
redis_service_instance.setModel(ioredis);

//設定對方的environment
redis_service_instance.setEnv(redis_environment);


const mysql_service_instance = instancePool.deploy({service: "mysql", port: "3306"});
mysql_service_instance.setModel(mysqlClient);
mysql_service_instance.setEnv(mysql_environment);
mysql_service_instance.shell(mysql_deploy_shell);

// backend_service_instance_cluster = [backend_service_instance_01, backend_service_instance_02, backend_service_instance_03]
const backend_service_instance_cluster = instancePool.deployCluster({service: "backEnd", port: 3000, type:"Replia", size: 3});

// front_service_instance_cluster = front_service_instance_cluster_Shard
const front_service_instance_cluster = instancePool.deployCluster({service: "frontEnd", port: 3001, type:"Shard", size: 3});


instancePool.afterDeploy().then(() => {
    front_service_instance_cluster.set("backend", backend_service_instance_cluster);

    backend_service_instance_cluster.set("redis", redis_service_instance);
    backend_service_instance_cluster.set("mysql", mysql_service_instance);

    backend_service_instance_cluster.on("except", (backend_service_instance) => {
        console.log( backend_service_instance.error );
    });

});