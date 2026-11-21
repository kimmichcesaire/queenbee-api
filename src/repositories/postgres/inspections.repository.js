
const COLUMNS = `id, hive_id, author_id, inspected_at, colony_status, queen_present, observations`;

export function createInspectionsRepository(pool) {
  return {
    // L'auteur vient du service (l'utilisateur du jeton), jamais du client.
    async add(inspection) {
      const { rows } = await pool.query(
        `INSERT INTO inspections (id, hive_id, author_id, inspected_at, queen_present,
                                  colony_status, observations)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING ${COLUMNS}`,
        [
          inspection.id,
          inspection.hive_id,
          inspection.author_id,
          inspection.inspected_at,
          inspection.queen_present ?? null,
          inspection.colony_status,
          inspection.observations ?? null,
        ],
      );
      return rows[0];
    },

    async findById(id) {
      const { rows } = await pool.query(`SELECT ${COLUMNS} FROM inspections WHERE id = $1`, [id]);
      return rows[0] ?? null;
    },

 
    async findByHive(hiveId) {
      const { rows } = await pool.query(
        `SELECT ${COLUMNS} FROM inspections WHERE hive_id = $1 ORDER BY inspected_at DESC`,
        [hiveId],
      );
      return rows;
    },
  };
}
