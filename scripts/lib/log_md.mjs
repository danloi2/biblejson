import fs from 'node:fs/promises';

/**
 * Generates and saves a Markdown log file for the extraction process.
 *
 * @param {string} logFile - Path to the log file to save.
 * @param {string} title - Title of the log.
 * @param {Object} info - Information about the source (versio, lingua, licentia, fons).
 * @param {Object} stats - Summary statistics (totalBooks, totalChapters, totalVerses).
 * @param {Array<string>} tableRows - Rows for the detail table.
 */
export async function saveBibleExtractionLog(logFile, title, info, stats, tableRows) {
  const logContent = `# ${title}

## Información de la Fuente
- **Versión:** ${info.versio}
- **Idioma:** ${info.lingua}
- **Licencia:** ${info.licentia}
- **Fuente:** ${info.fons}

## Resumen General
- **Libros descargados:** ${stats.totalBooks}
- **Capítulos totales:** ${stats.totalChapters}
- **Versículos totales:** ${stats.totalVerses}

## Detalle por Libro

| # | Acr (LA) | Acr (ES) | Cap. | Vers. | Detalle por Cap. |
|---|----------|----------|------|-------|------------------|
${tableRows.join('\n')}
`;

  await fs.writeFile(logFile, logContent, 'utf-8');
}
