module.exports = function(RED) {
    function PublisherNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', function(msg, send, done) {
            msg.payload = msg.payload.toLowerCase();
            send(msg);

            // done(err) on invalid msg
            done();
        });
        
        node.on('close', function(removed, done) {
            // tidy up any state
            // removed == true -> removed || disabled
            // done() can be used from callbacks
           
            if(removed)
            {
                node.log("node has been removed or disabled");
            }
            else
            {
                node.log("node has been restarted");
            }

            done()
        });
    }

    RED.nodes.registerType("FIWARE Publisher", PublisherNode);
}
