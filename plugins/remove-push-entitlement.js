const { withEntitlementsPlist } = require("expo/config-plugins");

module.exports = function withRemovePushEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults["aps-environment"];
    return config;
  });
};
