module.exports = function(RED) {

    var is_web_api = require('/usr/lib/IS-Web-API/fiware_configuration');

    /*
     * @function PublisherNode constructor
     * This node is defined by the constructor function PublisherNode,
     * which is called when a new instance of the node is created
     *
     * @param {Object} config - Contains the properties set in the flow editor
     */
    function PublisherNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.ready = false;

        if(config.broker)
        {
            // modify the global borker
            var broker = RED.nodes.getNode(config.broker);
            is_web_api.set_fiware_host(broker.host);
            is_web_api.set_fiware_port(broker.port);
        }

        let {color, message} = is_web_api.add_publisher(config['id'], config['topic'], config['selectedtype']);
        if (message && color)
        {
            node.status({ fill: color, shape: "dot", text: message});
        }

        // Event emitted when the deploy is finished
        RED.events.once('flows:started', function()
        {
            let {color, message} = is_web_api.launch(config['id']);
            if (message && color)
            {
                node.status({ fill: color, shape: "dot", text: message});
            }
        });

        var event_emitter = is_web_api.get_event_emitter();
        if (event_emitter)
        {
            // Event emitted when the WebSocket Client is connected correctly
            event_emitter.on('websocket_client_connected', function()
            {
                node.ready = true;
                node.status({ fill: null, shape: null, text: null});
            });
            event_emitter.on('websocket_client_connection_failed', function()
            {
                node.status({ fill: "red", shape: "dot", text: "Error while launching Visual-ROS. Please deploy the flow again."});
            });
        }

        node.on('input', function(msg, send, done) {

            if (node.ready)
            {
                node.status({ fill: "green", shape: "dot", text: "Message Published"});

                // Passes the message to the next node in the flow
                send(msg);
                is_web_api.send_message(config['topic'], msg);

                done();
            }
            else
            {
               done("node was not ready to process flow data");
            }
        });
        
        node.on('close', function(removed, done) {

            // Stops the IS execution and resets the yaml
            is_web_api.new_config();
            is_web_api.stop();
            node.status({ fill: null, shape: null, text: null});
            done()
        });
    }

    RED.nodes.registerType("FIWARE Publisher", PublisherNode);
}
