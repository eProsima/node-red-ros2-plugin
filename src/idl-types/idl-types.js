// RED argument provides the module access to Node-RED runtime api
module.exports = function(RED)
{
    var execFile = require('child_process').execFile;
    var fs = require('fs');
    var is_web_api = require('/usr/lib/IS-Web-API/ros2_configuration');
    var home = process.env.HOME;

    /*
     * @function IDLType constructor
     * This node is defined by the constructor function IDLType,
     * which is called when a new instance of the node is created
     *
     * @param {Object} config - Contains the properties set in the flow editor
     */
    function IDLType(config)
    {
        // Initiliaze the features shared by all nodes
        RED.nodes.createNode(this, config);
        var node = this;

        let {color, message} = is_web_api.add_idl_type(config["idltype"], config["name"]);
        if (message && color)
        {
            node.status({ fill: color, shape: "dot", text: message});
        }

        // Event emitted when the deploy is finished
        RED.events.once('flows:started', function() {
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
        });
    }

    // The node is registered in the runtime using the name IDL Type
    RED.nodes.registerType("IDL Type", IDLType);
    RED.library.register("idl-type");

    /**
     * @brief Function that returns all the occurences of the substring in the main string
     * @param {String} substring - Contains the characters that want to be located
     * @param {String} string - Contains the main string
     * @returns
     */
    function locations (substring, string) {
        var a = [], i = -1;
        while ((i = string.indexOf(substring, i+1)) >= 0)
        {
            a.push(i);
        }
        return a;
    };

    /**
 * @brief Function to sort the type structures according to its dependencies
     * @param {Array} result - Array for storing the sort result
     * @param {Array} visited - Array containing the objects already visited
     * @param {Map} map - Map containing all the objects that need to be sorted
     * @param {Object} obj  - Current object
     */
     function sort_util(result, visited, map, obj){
        visited[obj[0]] = true;
        Object.entries(obj[1]).forEach(function(dep){
            if(!visited[dep[1]] && Object.keys(map).includes(dep[1])) {
                sort_util(result, visited, map, map[dep[1]]);
            }
        });
        result.push(obj);
    }

    // Function that parse the IDL Type defined by the user and returns the parsing result to the html
    RED.httpAdmin.get("/checkidl", RED.auth.needsPermission('IDL Type.read'), function(req,res)
    {
        console.log(req.query["idl"]);

        // Execute the command line xtypes validator with the idl set by the user
        execFile("xtypes_idl_validator", [String(req.query["idl"])], function(error, stdout, stderr)
        {
            var result = {};
            var type_dict = {};

            if (error)
            {
                var init_index = stdout.indexOf('PEGLIB_PARSER:');
                var end_index = stdout.indexOf('[DEBUG] RESULT:');
                if (init_index != -1 && end_index != -1)
                {
                    // If the validator returns an error it is passed to the html
                    result["error"] = stdout.substr(init_index, end_index - init_index);
                    res.json(result);
                }
                else
                {
                    var index = stdout.indexOf('[ERROR]');
                    if (index != -1)
                    {
                        // If the validator returns an error it is passed to the html
                        result["error"] = stdout.substr(index);
                        res.json(result);
                    }
                }
                return;
            }

            // Defined Structure Position
            stdout = stdout.substr(stdout.indexOf('Struct Name:'));
            console.log(stdout);
            var occurences = locations('Struct Name:', stdout);

            var i = 0;
            occurences.forEach( s_pos =>
            {
                var cpy_stdout = stdout;
                console.log("i", i);
                if (occurences.length > i + 1)
                {
                    cpy_stdout = stdout.substr(s_pos, occurences[i+1]);
                }
                else
                {
                    cpy_stdout = stdout.substr(s_pos);
                }

                var members = locations('Struct Member:', cpy_stdout);
                var struct_name = stdout.substr(s_pos + 12/*Struct Name:*/, members[0] - (12 + 1) /*\n*/);
                struct_name = struct_name.replace("\n", "");
                type_dict[struct_name] = {};

                // Check the ROS 2 naming convention
                var modules = locations("::", struct_name);
                console.log("Modules", modules);
                if (!Array.isArray(modules) || !modules.length || modules.length != 2)
                {
                    result["error"] =
                        "The type needs two modules to follow the ROS 2 naming convention: the package_name and msg/srv.";
                    res.json(result);
                    return;
                }
                else
                {
                    console.log("Checking ROS 2 naming convention");
                    var pkg_name = struct_name.substr(0, modules[0]);
                    var pkg_rgx = new RegExp("[a-z]+(([a-z0-9]*)_?[a-z0-9]+)+");
                    if (!pkg_rgx.test(pkg_name))
                    {
                        console.log("Error package name");
                        result["error"] = "The type package_name needs to follow the ROS 2 naming convention.";
                        res.json(result);
                        return;
                    }
                    var inner_module = struct_name.substr(modules[0] + 2, modules[1] - (modules[0] + 2));
                    if (inner_module != "msg" && inner_module != "srv")
                    {
                        console.log("Error msg");
                        result["error"] = "The second module must be msg or srv to follow the ROS 2 naming convention.";
                        res.json(result);
                        return;
                    }
                    var type_name = struct_name.substr(modules[1] + 2);
                    var type_rgx = new RegExp("[A-Z]([a-zA-Z0-9])*");
                    if (!type_rgx.test(type_name))
                    {
                        console.log("Error type name");
                        result["error"] = "The type name needs to follow the ROS 2 naming convention.";
                        res.json(result);
                        return;
                    }

                    members.forEach( pos => {
                        var init_pos = cpy_stdout.indexOf('[', pos);
                        var inner_name = cpy_stdout.substr(pos + 14/*Struct Member:*/, init_pos - (pos + 14));
                        if (inner_name == struct_name)
                        {
                            var member = cpy_stdout.substr(init_pos + 1, cpy_stdout.indexOf(']', pos) - init_pos - 1);
                            var data = member.split(',');
                            type_dict[inner_name][data[0]] = data[1];
                        }
                    });

                    i++;

                    console.log(type_dict);
                }
            });

            var map = {}; // Creates key value pair of name and object
            var result_array = []; // the result array
            var visited = {}; // takes a note of the traversed dependency

            Object.entries(type_dict).forEach( function(obj){ // build the map
                map[obj[0]]  = obj;
            });

            Object.entries(type_dict).forEach(function(obj){ // Traverse array
                if(!visited[obj[0]]) { // check for visited object
                    sort_util(result_array, visited, map, obj);
                }
            });

            if (!Object.keys(result).includes("error"))
            {
                // turn :: int backslashes as is ros2 convention
                result["name"] = result_array[result_array.length - 1][0];
                res.json(result);
                return;
            }
        });
    });
}

