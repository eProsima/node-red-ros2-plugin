module.exports = function(RED) {

    function FIWARESettingsNode(config) {
        RED.nodes.createNode(this, config);
        this.host = config.host;
        this.port = config.port;
    }

    RED.nodes.registerType("fiware-settings", FIWARESettingsNode);
}
