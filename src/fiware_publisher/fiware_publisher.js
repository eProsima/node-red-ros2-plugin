module.exports = function(RED) {

    var is_web_api = require('IS-Web-API').fiware;

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
        node.ready = true;

        node.status({fill: "yellow", shape: "dot", text: "Wait until Visual-ROS is ready to be used."});

        if(config.broker)
        {
            // modify the global borker
            node.broker = RED.nodes.getNode(config.broker);
            is_web_api.set_fiware_host(node.broker.host);
            is_web_api.set_fiware_port(node.broker.port);
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
            // Event emitted if the integration server failed
            event_emitter.on('IS-ERROR', function(status)
            {
                node.ready = false;
                node.status(status);
            });

            event_emitter.on('FIWARE_connected', function()
            {
                node.ready = true;
                node.status({ fill: null, shape: null, text: null});
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
            node.status({ fill: null, shape: null, text: ""});
            done()
        });
    }

    RED.nodes.registerType("FIWARE Publisher", PublisherNode);
}
