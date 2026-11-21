
const SELECT_MEASURE = `
  SELECT m.hive_id, h.site_id, m.measured_at AS timestamp,
         m.lat AS position_lat, m.lon AS position_lon,
         m.weight_kg, m.temp_internal_c, m.temp_external_c, m.humidity_pct,
         m.acoustic_activity_score, m.battery_pct
    FROM measures m
    JOIN hives h ON h.id = m.hive_id`;

export function createMeasuresRepository(pool) {

  async function findOne(hiveId, timestamp) {
    const { rows } = await pool.query(
      `${SELECT_MEASURE} WHERE m.hive_id = $1 AND m.measured_at = $2`,
      [hiveId, timestamp],
    );
    return rows[0] ?? null;
  }

  return {
   
    async add(measure) {
      const { rowCount } = await pool.query(
        `INSERT INTO measures (hive_id, measured_at, weight_kg, temp_internal_c, temp_external_c,
                               humidity_pct, acoustic_activity_score, battery_pct, lat, lon)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (hive_id, measured_at) DO NOTHING`,
        [
          measure.hive_id,
          measure.timestamp,                      
          measure.weight_kg,
          measure.temp_internal_c ?? null,
          measure.temp_external_c ?? null,
          measure.humidity_pct ?? null,
          measure.acoustic_activity_score ?? null,
          measure.battery_pct ?? null,
          measure.position_lat ?? null,            
          measure.position_lon ?? null,            
        ],
      );
      // rowCount vaut 1 si la ligne a été insérée, 0 si elle existait déjà.
      return { measure: await findOne(measure.hive_id, measure.timestamp), created: rowCount === 1 };
    },

    // Une page de mesures, la plus récente d'abord. site_id vient de la ruche (jointure).
    async findByHive(hiveId, { limit, offset }) {
      const { rows } = await pool.query(
        `${SELECT_MEASURE}
          WHERE m.hive_id = $1
          ORDER BY m.measured_at DESC
          LIMIT $2 OFFSET $3`,
        [hiveId, limit, offset],
      );
      return rows;
    },
  };
}
