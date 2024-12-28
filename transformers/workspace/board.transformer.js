const Transformer = require("../../core/Transformer");
const ColumnTransformer = require("./column.transformer");
class BoardTransformer extends Transformer {
  response(instance) {
    return {
      id: instance.id,
      workspace_id: instance.workspace_id,
      columnOrderIds: instance.columnOrderIds,
      activities: instance.activities || [],
      columns: instance.columns
        ? instance.columns.map((column) => new ColumnTransformer(column))
        : [],
      title: instance.title,
      desc: instance.desc,
      type: instance.type,
      background: instance.background,
      created_at: instance.created_at,
      updated_at: instance.updated_at,
      deletedAt: instance.deleted_at,
    };
  }
}
module.exports = BoardTransformer;
