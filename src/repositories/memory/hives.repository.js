export function createHivesRepository(initialHives = []) {
  const hives = [...initialHives]; 
  return {
    async findAll() {
      return [...hives];
    },

    async findBySite(siteId) {
      return hives.filter((h) => h.site_id === siteId);
    },

    // Renvoie la ruche, ou undefined si elle n'existe pas.
    async findById(id) {
      return hives.find((h) => h.id === id);
    },
  };
}
