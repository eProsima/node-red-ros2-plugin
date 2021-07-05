const { send } = require('process');

// RED argument provides the module access to Node-RED runtime api
module.exports = function(RED)
{
    var events = require('events');
    var fs = require('fs');
    var is_web_api = require('/usr/lib/IS-Web-API/configuration');
    /*
     * @function SubscriberNode constructor
     * This node is defined by the constructor function SubscriberNode,
     * which is called when a new instance of the node is created
     *
     * @param {Object} config - Contains the properties set in the flow editor
     */
    function SubscriberNode(config)
    {
        // Initiliaze the features shared by all nodes
        RED.nodes.createNode(this, config);
        this.props = config.props;
        var node = this;

        let {color, message} = is_web_api.add_subscriber(config['id'], config["topic"], config['selectedtype'],
            config['props']);
        if (message && color)
        {
            node.status({ fill: color, shape: "dot", text: message });
        }

        // Event emitted when the deploy is finished
        RED.events.once('flows:started', function() {
            let {color, message, event_emitter} = is_web_api.launch(config['id']);
            if (message && color)
            {
                node.status({ fill: color, shape: "dot", text: message});
            }
            if (event_emitter)
            {
                // Event emitted when a new message is received
                event_emitter.on(config["topic"] + '_data', function(msg_json)
                {
                    node.status({ fill: "green", shape: "dot", text: "Message Received" });
                    // Passes the message to the next node in the flow
                    node.send(msg_json['msg']);
                });
                event_emitter.on('websocket_client_connection_failed', function()
                {
                    node.status({ fill: "red", shape: "dot", text: "Error while launching Visual-ROS. Please deploy the flow again."});
                });
                event_emitter.on('websocket_client_connection_closed', function()
                {
                    node.status({ fill: "red", shape: "dot", text: "Error procuced during the execution. Please deploy the flow again."});
                });
            }
        });

        // Called when there is a re-deploy or the program is closed
        node.on('close', function()
        {
            // Stops the IS execution and resets the yaml
            is_web_api.new_config();
            is_web_api.stop();
        });
    }

    // The node is registered in the runtime using the name Subscriber
    RED.nodes.registerType("Subscriber", SubscriberNode);

    //Function that sends to the html file the qos descriptions read from the json file
    RED.httpAdmin.get("/subqosdescription", RED.auth.needsPermission('Subscriber.read'), function(req,res)
    {
        var description_path = __dirname + "/../qos-description.json";
        var rawdata  = fs.readFileSync(description_path);
        let json = JSON.parse(rawdata);
        res.json(json);
    });
}