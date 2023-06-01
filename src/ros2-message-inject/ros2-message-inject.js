// RED argument provides the module access to Node-RED runtime api
module.exports = function(RED)
{
    var execFile = require('child_process').execFile;
    var cron = require('cron');
    var fs = require('fs');
    var home = process.env.HOME;
    var idl_path = "";
    var ros2_home = '/opt/ros/' + process.env.ROS_DISTRO;
    if (process.env.IS_ROS2_PATH)
    {
        ros2_home = process.env.IS_ROS2_PATH;
    }
    var is_web_api = require('IS-Web-API').ros2;

    /*
     * @function ROS2InjectNode constructor
     * This node is defined by the constructor function ROS2InjectNode,
     * which is called when a new instance of the node is created
     *
     * @param {Object} n - Contains the properties set in the flow editor
     */
    function ROS2InjectNode(n) {
        RED.nodes.createNode(this, n);

        this.props = n.props;
        this.repeat = n.repeat;
        this.crontab = n.crontab;
        this.once = n.once;
        this.onceDelay = (n.onceDelay || 0.1) * 1000;
        this.interval_id = null;
        this.cronjob = null;
        var node = this;

        node.status({fill: null, shape: null, text: ""});

        if (node.repeat > 2147483) {
            node.error(RED._("inject.errors.toolong", this));
            delete node.repeat;
        }

        node.repeaterSetup = function () {
            if (this.repeat && !isNaN(this.repeat) && this.repeat > 0) {
                this.repeat = this.repeat * 1000;
                if (RED.settings.verbose) {
                    this.log(RED._("inject.repeat", this));
                }
                this.interval_id = setInterval(function() {
                    node.emit("input", {});
                }, this.repeat);
            } else if (this.crontab) {
                if (RED.settings.verbose) {
                    this.log(RED._("inject.crontab", this));
                }
                this.cronjob = new cron.CronJob(this.crontab, function() { node.emit("input", {}); }, null, true);
            }
        };

        if (this.once) {
            this.onceTimeout = setTimeout( function() {
                node.emit("input",{});
                node.repeaterSetup();
            }, this.onceDelay);
        } else {
            node.repeaterSetup();
        }

        var event_emitter = is_web_api.get_event_emitter();
        if (event_emitter)
        {
            // Event emitted if the integration server failed
            event_emitter.on('IS-ERROR', function(status)
            {
                node.status(status);
            });
        }

        this.on("input", function(msg, send, done) {
            var errors = [];

            this.props.forEach(p => {
                var property = p.p;
                var value = p.v ? p.v : '';
                var valueType = p.vt ? p.vt : 'str';

                if (!property) return;

                try {
                    RED.util.setMessageProperty(msg,property,RED.util.evaluateNodeProperty(value, valueType, this, msg),true);
                } catch (err) {
                    errors.push(err.toString());
                }
            });

            if (errors.length) {
                done(errors.join('; '));
            } else {
                send(msg);
                done();
            }
        });
    }

    // The node is registered in the runtime using the name ROS2 Inject
    RED.nodes.registerType("ROS2 Inject", ROS2InjectNode);

    ROS2InjectNode.prototype.close = function() {
        if (this.onceTimeout) {
            clearTimeout(this.onceTimeout);
        }
        if (this.interval_id != null) {
            clearInterval(this.interval_id);
            if (RED.settings.verbose) { this.log(RED._("ROS2 Inject.stopped")); }
        } else if (this.cronjob != null) {
            this.cronjob.stop();
            if (RED.settings.verbose) { this.log(RED._("ROS2 Inject.stopped")); }
            delete this.cronjob;
        }
    };

    function updateNodeProps(node, props) {
        node.props = JSON.parse(props);
    }


    RED.httpAdmin.post("/inject/:id/:props", RED.auth.needsPermission("ROS2 Inject.write"), function(req,res) {
        var node = RED.nodes.getNode(req.params.id);
        if (node != null) {
            try {
                updateNodeProps(node, req.params.props);
                node.receive();
                res.sendStatus(200);
            } catch(err) {
                res.sendStatus(500);
                node.error(RED._("ROS2 Inject.failed",{error:err.toString()}));
            }
        } else {
            res.sendStatus(404);
        }
    });

    /**
     * @brief Function that returns all the occurences of the substring in the main string
     * @param {String} substring - Contains the characters that want to be located
     * @param {String} string - Contains the main string
     * @returns
     */
    function locations (substring, string) {
        var a = [],i = -1;
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

    // Function that returns the IDL associated with the selected message type
    RED.httpAdmin.get("/getidl", RED.auth.needsPermission("ROS2 Inject.write"), function(req,res)
    {
        var idl = "";
        if (req.query['idl'])
        {
            idl = req.query['idl'];
        }
        else
        {
            var msg_path = ros2_home + "/share/" + req.query['package'] + "/msg/" + req.query['msg'] + ".idl";

            idl = fs.readFileSync(msg_path).toString();
        }

        var type_dict = {};

        // Executes the xtypes command line validator to get the type members
        execFile("xtypes_idl_validator", [String(idl)], function(error, stdout, stderr) {
            // Defined Structure Position
            stdout = stdout.substr(stdout.indexOf('Struct Name:'));
            console.log(stdout);
            var occurences = locations('Struct Name:', stdout);

            var i = 0;
            occurences.forEach( s_pos =>
            {
                var members = locations('Struct Member:', stdout);
                var struct_name = stdout.substr(s_pos + 12/*Struct Name:*/, members[i] - (s_pos + 12 + 1) /*\n*/);
                type_dict[struct_name] = {};

                members.forEach( pos => {
                    var init_pos = stdout.indexOf('[', pos);
                    var inner_name = stdout.substr(pos + 14/*Struct Member:*/, init_pos - (pos + 14));
                    if (inner_name == struct_name)
                    {
                        var member = stdout.substr(init_pos + 1, stdout.indexOf(']', pos) - init_pos - 1);
                        var data = member.split(',');
                        type_dict[inner_name][data[0]] = data[1];
                        i++;
                    }
                });
            });

            var map = {}; // Creates key value pair of name and object
            var result = []; // the result array
            var visited = {}; // takes a note of the traversed dependency

            Object.entries(type_dict).forEach( function(obj){ // build the map
                map[obj[0]]  = obj;
            });

            Object.entries(type_dict).forEach(function(obj){ // Traverse array
                if(!visited[obj[0]]) { // check for visited object
                    sort_util(result, visited, map, obj);
                }
            });

            console.log(result);
            res.json(result);
        });
    });
}
