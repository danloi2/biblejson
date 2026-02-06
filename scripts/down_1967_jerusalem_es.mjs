import { Bible } from 'biblia-de-jerusalen';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BIBLE_METADATA } from './lib/bible_metadata.mjs';
import { createBibleJson } from './lib/json_structure.mjs';
import { saveBibleExtractionLog } from './lib/log_md.mjs';
import { Logger } from './lib/logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

Logger.header(import.meta.url);

async function downloadBible() {
  const bible = new Bible();
  const books = bible.getAllBooks();
  const outputDir = path.resolve(__dirname, '..', 'bible_json', '1967_jerusalem_es');
  const logFile = path.join(path.dirname(outputDir), '1967_jerusalem_es_log.md');

  const logger = new Logger(import.meta.url, 'Jerusalén (1967)', books.length);
  logger.start();

  const INFO = {
    versio: 'Jerusalén (1967)',
    lingua: 'es-ES',
    licentia: 'Copyright Desclée de Brouwer',
    fons: 'https://www.npmjs.com/package/biblia-de-jerusalen',
  };

  await fs.mkdir(outputDir, { recursive: true });

  let totalBooks = 0;
  let totalChapters = 0;
  let totalVerses = 0;
  const tableRows = [];

  try {
    for (const bookName of books) {
      try {
        const bookContent = bible.getBook(bookName);

        // Find matching metadata by name (handling variations in 1/I and accents)
        const normalizedQuery = bookName
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/^I\b/, '1')
          .replace(/^II\b/, '2')
          .replace(/^III\b/, '3')
          .toLowerCase()
          .trim();

        const metadata =
          BIBLE_METADATA.find((m) => {
            const normalizedMeta = m.nomen_es
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/^I\b/, '1')
              .replace(/^II\b/, '2')
              .replace(/^III\b/, '3')
              .toLowerCase()
              .trim();
            return (
              normalizedMeta === normalizedQuery || m.nomen_la.toLowerCase() === normalizedQuery
            );
          }) || BIBLE_METADATA[books.indexOf(bookName)]; // Fallback to index if not found

        logger.bookStart(metadata.id, metadata.nomen_es);

        const { chapters } = bookContent;
        const capitula = chapters.map((ch) => ({
          numerus: parseInt(ch.chapter || ch.num),
          ctd_versus: ch.ctd_verses || (ch.verses ? Object.keys(ch.verses).length : 0),
          versus: ch.verses,
        }));

        logger.found(capitula.length, 'chapters');
        const bookVerses = capitula.reduce((acc, c) => acc + c.ctd_versus, 0);
        logger.found(bookVerses, 'verses');

        // Reconstruct with exact order using helper
        const enrichedContent = createBibleJson(
          metadata,
          INFO.versio,
          INFO.licentia,
          INFO.fons,
          INFO.lingua,
          capitula
        );

        totalBooks++;
        totalChapters += enrichedContent.capitula.length;
        totalVerses += bookVerses;

        const versesPerChapter = enrichedContent.capitula.map((c) => c.ctd_versus);

        const indexStr = metadata.id;
        tableRows.push(
          `| ${indexStr} | ${metadata.acronymum_la} | ${metadata.acronymum_es} | ${enrichedContent.capitula.length} | ${bookVerses} | ${versesPerChapter.join(', ')} |`
        );

        // Save JSON with naming convention: ID_Acr_es.json
        const safeAcr = metadata.acronymum_es.replace(/\s+/g, '_');
        const filePath = path.join(outputDir, `${indexStr}_${safeAcr}_es.json`);
        await fs.writeFile(filePath, JSON.stringify(enrichedContent, null, 2), 'utf-8');
        logger.bookSaved(indexStr, metadata.nomen_es);
      } catch (error) {
        logger.error(`Error processing ${bookName}: ${error.message}`);
      }
    }

    // Generate Markdown Log
    await saveBibleExtractionLog(
      logFile,
      'Log de Extracción Biblia de Jerusalén (1967)',
      INFO,
      { totalBooks, totalChapters, totalVerses },
      tableRows
    );

    logger.summary({
      totalBooks,
      totalChapters,
      totalVerses,
      logFile,
      outputDir,
    });
  } catch (error) {
    logger.error(`Error in extractiōne Jerusalén: ${error.message}`);
  }
}

downloadBible();
