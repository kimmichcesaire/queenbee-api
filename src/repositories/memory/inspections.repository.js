// Repository des inspections, en mémoire.
export function createInspectionsRepository(initialInspections = []) {
  const inspections = [...initialInspections];

  return {
    async add(inspection) {
      inspections.push(inspection);
      return inspection;
    },

    // Renvoie l'inspection, ou undefined si elle n'existe pas.
    async findById(id) {
      return inspections.find((i) => i.id === id);
    },

    // Les inspections d'une ruche, de la plus récente à la plus ancienne.
    async findByHive(hiveId) {
      return inspections
        .filter((i) => i.hive_id === hiveId)
        .sort((a, b) => Date.parse(b.inspected_at) - Date.parse(a.inspected_at));
    },
  };
}
