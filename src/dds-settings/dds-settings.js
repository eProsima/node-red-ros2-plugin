module.exports = function(RED) {

    function ddsSettingsNode(n) {
        RED.nodes.createNode(this,n);
        this.domain = RED.settings.visualRosDomain || n.domain;
    }

    // If the domain value is enforce via settings don't allow the user to modify it
    let settings = null;
    if (RED.settings.visualRosDomain)
    {
        settings = {
            settings: {
                ddsSettingsForceDomain : {
                    value: RED.settings.visualRosDomain || 0,
                    exportable:true
                }
            }
        };
    }

    RED.nodes.registerType("dds-settings",ddsSettingsNode, settings);
}
