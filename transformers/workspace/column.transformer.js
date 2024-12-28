const Transformer = require("../../core/Transformer");
const CardTransformer = require("./card.transformer");
class ColumnTransformer extends Transformer {
  response(instance) {
    return {
      id: instance.id,
      board_id: instance.board_id,
      title: instance.title,
      cardOrderIds: instance.cardOrderIds,
      order: instance.order,
      cards: instance.cards || [],
      created_at: instance.created_at,
      updated_at: instance.updated_at,
    };
  }
}
module.exports = ColumnTransformer;
