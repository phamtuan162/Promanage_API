const Transformer = require("../../core/Transformer");

class DeviceTransformer extends Transformer {
  response(instance) {
    return {
      id: instance.id,
      user_id: instance.user_id,
      browser: instance.browser,
      system: instance.system,
      login_time: instance.login_time,
      active_time: instance.active_time,
      status: instance.status,
      ip: instance.ip,
      createdAt: instance.created_at,
      updatedAt: instance.updated_at,
    };
  }
}
module.exports = DeviceTransformer;
