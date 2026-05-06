export const up = (pgm) => {
  pgm.createTable("application_logs", {
    id: {
      type: "uuid",
      primaryKey: true,
      notNull: true,
      default: pgm.func("gen_random_uuid()"),
    },

    level: {
      type: "text",
      notNull: true,
      check: "level IN ('debug', 'info', 'warn', 'error')",
    },

    event: {
      type: "text",
      notNull: true,
    },

    message: {
      type: "text",
    },

    request_id: {
      type: "uuid",
    },

    user_id: {
      type: "uuid",
    },

    method: {
      type: "text",
    },

    path: {
      type: "text",
    },

    status_code: {
      type: "integer",
    },

    context: {
      type: "jsonb",
    },

    metadata: {
      type: "jsonb",
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};
