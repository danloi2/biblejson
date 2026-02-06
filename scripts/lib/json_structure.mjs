/**
 * Centralized Bible JSON structure builder.
 * Ensures all extractors produce the exact same JSON format.
 *
 * @param {Object} metadata - The metadata object from bible_data.mjs (containing id, names, etc.)
 * @param {string} versio - The specific version name (e.g. 'CEE (2010)')
 * @param {string} licentia - The license string (e.g. 'Copyright CEE/BAC (no libre)')
 * @param {string} fons - The source URL
 * @param {string} lingua - The ISO language code ('es-ES' or 'la')
 * @param {Array} capitula - The array of chapter objects
 * @returns {Object} The standardized JSON object
 */
export function createBibleJson(metadata, versio, licentia, fons, lingua, capitula) {
  // Calculate total verses from the structured capitula
  const totalVersus = capitula.reduce((acc, c) => acc + (c.ctd_versus || 0), 0);

  return {
    id: metadata.id,
    lingua: lingua,
    testamentum_la: metadata.testamentum_la,
    testamentum_es: metadata.testamentum_es,
    typus_la: metadata.typus_la,
    typus_es: metadata.typus_es,
    acronymum_la: metadata.acronymum_la,
    acronymum_es: metadata.acronymum_es,
    nomen_la: metadata.nomen_la,
    nomen_es: metadata.nomen_es,
    versio: versio,
    licentia: licentia,
    fons: fons,
    ctd_capitula: capitula.length,
    ctd_versus: totalVersus,
    capitula: capitula,
  };
}
