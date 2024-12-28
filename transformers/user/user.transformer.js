const Transformer = require("../../core/Transformer");

class UserTransformer extends Transformer {
  response(instance) {
    return {
      id: instance.id,
      name: instance.name,
      phone: instance.phone,
      background: instance.background,
      email: instance.email,
      status: instance.status,
      avatar: instance.avatar,
      providerId: instance.provider_id,
      workspace_id_active: instance.workspace_id_active,
      isOnline: instance.isOnline,
      created_at: instance.created_at,
      updated_at: instance.updated_at,
      role: instance.role,
    };
  }
}
module.exports = UserTransformer;
