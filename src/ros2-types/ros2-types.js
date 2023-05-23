// RED argument provides the module access to Node-RED runtime api
module.exports = function(RED)
{
    var fs = require('fs');
    var path = require('path');
    var is_web_api = require('/usr/lib/IS-Web-API/ros2_configuration');
    var home = process.env.HOME;
    var ros2_home = '/opt/ros/' + process.env.ROS_DISTRO;
    if (process.env.IS_ROS2_PATH)
    {
        ros2_home = process.env.IS_ROS2_PATH;
    }

    var util = require('util');

    /*
     * @function ROS2Types constructor
     * This node is defined by the constructor function ROS2Types,
     * which is called when a new instance of the node is created
     *
     * @param {Object} config - Contains the properties set in the flow editor
     */
    function ROS2Types(config)
    {
        // Initiliaze the features shared by all nodes
        RED.nodes.createNode(this, config);
        var node = this;

        let {color, message} = is_web_api.add_ros2_type(config.ros2pkg, config.ros2message, config.wires[0]);
        if (message && color)
        {
            node.status({ fill: color, shape: "dot", text: message});
            node.emit("error", message);
        }

        // Event emitted when the deploy is finished
        RED.events.once("flows:started", function() {
            let {color, message} = is_web_api.launch(config['id']);
            if (message && color)
            {
                node.status({ fill: color, shape: "dot", text: message});
            }
        });

	    // Registers a listener to the input event,
        // which will be called whenever a message arrives at this node
        node.on('input', function(msg)
        {
            // Passes the message to the next node in the flow
            node.send(msg);
        });

        // Called when there is a re-deploy or the program is closed
        node.on('close', function()
        {
            // Stops the IS execution and resets the yaml
            is_web_api.stop();
            is_web_api.new_config();
        });
    }

    // The node is registered in the runtime using the name publisher
    RED.nodes.registerType("ROS2 Type", ROS2Types);

    // Function that pass the IS ROS 2 compiled packages to the html file
    RED.httpAdmin.get("/ros2packages", RED.auth.needsPermission('ROS2 Type.read'), function(req,res)
    {
        var files = fs.readdirSync(ros2_home + "/share/");

        // Check if it is a msg package
        files.forEach( function(value)
        {
            if (!fs.existsSync(ros2_home + "/share/" + value + "/msg"))
            {
                files = files.filter(f => f != value);
            }
        });

        res.json(files);
    });

    // Function that pass the IS ROS 2 package compiled msgs to the html file
    RED.httpAdmin.get("/ros2msgs", RED.auth.needsPermission('ROS2 Type.read'), function(req,res)
    {
        var msgs_path = ros2_home + "/share/" + req.query["package"] + "/msg/";

        var files = fs.readdirSync(msgs_path);

        // Check that it is a file with .idl
        files.forEach( function(filename)
        {
            if (path.extname(filename) != ".idl")
            {
                files = files.filter(f => f != filename);
            }
        });

        files.forEach( function(filename, index)
        {
            files[index] = path.parse(filename).name;
        })

        res.json(files);
    });

    // Function that pass the selected message idl and msg codes
    RED.httpAdmin.get("/msgidl", RED.auth.needsPermission('ROS2 Type.read'), function(req,res)
    {
        if (req.query['msg'])
        {
            var json_data = {}
            // IDL
            var msg_path = ros2_home + "/share/" + req.query['package'] + "/msg/" + req.query['msg'];

            var idl = fs.readFileSync(msg_path + ".idl").toString();
            json_data["idl"] = idl;

            // MSG
            if (fs.existsSync(msg_path + ".msg"))
            {
                var msg = fs.readFileSync(msg_path + ".msg").toString();
                json_data["msg"] = msg;
            }
            else
            {
                json_data["msg"] = "";
            }
            res.json(json_data);
        }
    });
}
