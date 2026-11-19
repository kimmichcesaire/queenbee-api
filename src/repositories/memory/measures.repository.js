// Repository des mesures, en mémoire.
export function createMeasuresRepository(initialMeasures = []) {
  const measures = [...initialMeasures];

  return {
    async add(measure) {
      measures.push(measure);
      return measure;
    },

    // Une page de mesures d'une ruche, de la plus récente à la plus ancienne.
    async findByHive(hiveId, { limit, offset }) {
      return measures
        .filter((m) => m.hive_id === hiveId)
        .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
        .slice(offset, offset + limit);
    },
  };
}
