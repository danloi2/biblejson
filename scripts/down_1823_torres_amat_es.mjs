import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { Agent } from 'undici';
import { BIBLE_METADATA } from './lib/bible_metadata.mjs';
import { createBibleJson } from './lib/json_structure.mjs';
import { saveBibleExtractionLog } from './lib/log_md.mjs';
import { Logger } from './lib/logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

Logger.header(import.meta.url);

const INFO = {
  versio: 'Torres Amat (1823)',
  lingua: 'es-ES',
  licentia: 'Dominio Público',
  fons: 'https://www.credobiblestudy.com/es/read',
};

/* =========================
   HTTP keep-alive
========================= */
const agent = new Agent({
  keepAliveTimeout: 10_000,
  keepAliveMaxTimeout: 10_000,
});

/* =========================
   CONCURRENCY HELPER
========================= */
async function mapLimit(items, limit, asyncFn) {
  const results = [];
  const executing = [];

  for (const item of items) {
    const p = Promise.resolve().then(() => asyncFn(item));
    results.push(p);

    if (limit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

/* =========================
   URLS y capítulos
========================= */
const BOOK_URL_SLUGS = {
  '01': 'sagrada-biblia-felix-amat-ot/genesis',
  '02': 'sagrada-biblia-felix-amat-ot/exodus',
  '03': 'sagrada-biblia-felix-amat-ot/leviticus',
  '04': 'sagrada-biblia-felix-amat-ot/numbers',
  '05': 'sagrada-biblia-felix-amat-ot/deuteronomy',
  '06': 'sagrada-biblia-felix-amat-ot/joshua',
  '07': 'sagrada-biblia-felix-amat-ot/judges',
  '08': 'sagrada-biblia-felix-amat-ot/ruth',
  '09': 'sagrada-biblia-felix-amat-ot/1-samuel',
  10: 'sagrada-biblia-felix-amat-ot/2-samuel',
  11: 'sagrada-biblia-felix-amat-ot/1-kings',
  12: 'sagrada-biblia-felix-amat-ot/2-kings',
  13: 'sagrada-biblia-felix-amat-ot/1-chronicles',
  14: 'sagrada-biblia-felix-amat-ot/2-chronicles',
  15: 'sagrada-biblia-felix-amat-ot/ezra',
  16: 'sagrada-biblia-felix-amat-ot/nehemiah',
  17: 'sagrada-biblia-felix-amat-ot/tobit',
  18: 'sagrada-biblia-felix-amat-ot/judith',
  19: 'sagrada-biblia-felix-amat-ot/esther',
  20: 'sagrada-biblia-felix-amat-ot/1-maccabees',
  21: 'sagrada-biblia-felix-amat-ot/2-maccabees',
  22: 'sagrada-biblia-felix-amat-ot/job',
  23: 'sagrada-biblia-felix-amat-ot/psalms',
  24: 'sagrada-biblia-felix-amat-ot/proverbs',
  25: 'sagrada-biblia-felix-amat-ot/ecclesiastes',
  26: 'sagrada-biblia-felix-amat-ot/song-of-solomon',
  27: 'sagrada-biblia-felix-amat-ot/wisdom',
  28: 'sagrada-biblia-felix-amat-ot/sirach',
  29: 'sagrada-biblia-felix-amat-ot/isaiah',
  30: 'sagrada-biblia-felix-amat-ot/jeremiah',
  31: 'sagrada-biblia-felix-amat-ot/lamentations',
  32: 'sagrada-biblia-felix-amat-ot/baruch',
  33: 'sagrada-biblia-felix-amat-ot/ezekiel',
  34: 'sagrada-biblia-felix-amat-ot/daniel',
  35: 'sagrada-biblia-felix-amat-ot/hosea',
  36: 'sagrada-biblia-felix-amat-ot/joel',
  37: 'sagrada-biblia-felix-amat-ot/amos',
  38: 'sagrada-biblia-felix-amat-ot/obadiah',
  39: 'sagrada-biblia-felix-amat-ot/jonah',
  40: 'sagrada-biblia-felix-amat-ot/micah',
  41: 'sagrada-biblia-felix-amat-ot/nahum',
  42: 'sagrada-biblia-felix-amat-ot/habakkuk',
  43: 'sagrada-biblia-felix-amat-ot/zephaniah',
  44: 'sagrada-biblia-felix-amat-ot/haggai',
  45: 'sagrada-biblia-felix-amat-ot/zechariah',
  46: 'sagrada-biblia-felix-amat-ot/malachi',
  47: 'sagrada-biblia-felix-amat-nt/matthew',
  48: 'sagrada-biblia-felix-amat-nt/mark',
  49: 'sagrada-biblia-felix-amat-nt/luke',
  50: 'sagrada-biblia-felix-amat-nt/john',
  51: 'sagrada-biblia-felix-amat-nt/acts-of-apostles',
  52: 'sagrada-biblia-felix-amat-nt/romans',
  53: 'sagrada-biblia-felix-amat-nt/1-corinthians',
  54: 'sagrada-biblia-felix-amat-nt/2-corinthians',
  55: 'sagrada-biblia-felix-amat-nt/galatians',
  56: 'sagrada-biblia-felix-amat-nt/ephesians',
  57: 'sagrada-biblia-felix-amat-nt/philippians',
  58: 'sagrada-biblia-felix-amat-nt/colossians',
  59: 'sagrada-biblia-felix-amat-nt/1-thessalonians',
  60: 'sagrada-biblia-felix-amat-nt/2-thessalonians',
  61: 'sagrada-biblia-felix-amat-nt/1-timothy',
  62: 'sagrada-biblia-felix-amat-nt/2-timothy',
  63: 'sagrada-biblia-felix-amat-nt/titus',
  64: 'sagrada-biblia-felix-amat-nt/philemon',
  65: 'sagrada-biblia-felix-amat-nt/hebrews',
  66: 'sagrada-biblia-felix-amat-nt/james',
  67: 'sagrada-biblia-felix-amat-nt/1-peter',
  68: 'sagrada-biblia-felix-amat-nt/2-peter',
  69: 'sagrada-biblia-felix-amat-nt/1-john',
  70: 'sagrada-biblia-felix-amat-nt/2-john',
  71: 'sagrada-biblia-felix-amat-nt/3-john',
  72: 'sagrada-biblia-felix-amat-nt/jude',
  73: 'sagrada-biblia-felix-amat-nt/revelation',
};

const CHAPTER_COUNTS = {
  '01': 50,
  '02': 40,
  '03': 27,
  '04': 36,
  '05': 34,
  '06': 24,
  '07': 21,
  '08': 4,
  '09': 31,
  10: 24,
  11: 22,
  12: 25,
  13: 29,
  14: 36,
  15: 10,
  16: 13,
  17: 14,
  18: 16,
  19: 10,
  20: 16,
  21: 15,
  22: 42,
  23: 150,
  24: 31,
  25: 12,
  26: 8,
  27: 19,
  28: 51,
  29: 66,
  30: 52,
  31: 5,
  32: 6,
  33: 48,
  34: 12,
  35: 14,
  36: 3,
  37: 9,
  38: 1,
  39: 4,
  40: 7,
  41: 3,
  42: 3,
  43: 3,
  44: 2,
  45: 14,
  46: 4,
  47: 28,
  48: 16,
  49: 24,
  50: 21,
  51: 28,
  52: 16,
  53: 16,
  54: 13,
  55: 6,
  56: 6,
  57: 4,
  58: 4,
  59: 5,
  60: 3,
  61: 6,
  62: 4,
  63: 3,
  64: 1,
  65: 13,
  66: 5,
  67: 5,
  68: 3,
  69: 5,
  70: 1,
  71: 1,
  72: 1,
  73: 22,
};

const BASE_URL = 'https://www.credobiblestudy.com/es/read';

/* =========================
   FETCH CAPÍTULO
========================= */
async function fetchChapter(slug, chapterNum) {
  const url = `${BASE_URL}/${slug}/chapter-${chapterNum}`;
  try {
    const response = await fetch(url, { dispatcher: agent });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseChapterHTML(await response.text());
  } catch (error) {
    return null;
  }
}

/* =========================
   PARSE HTML CAPÍTULO
========================= */
function parseChapterHTML(html) {
  const $ = cheerio.load(html);
  const versus = {};
  let verseCount = 0;

  $('.cbs-bibleview-versetext').each((_, el) => {
    const $el = $(el);
    const verseNum = $el.find('[name]').attr('name');
    if (!verseNum) return;

    const $clone = $el.clone();
    $clone.find('.cbs-reference-icon').remove();
    $clone.find('.cbs-artwork-icon').remove();
    $clone.find('.cbs-bible-panel').remove();

    let fullText = $clone.text().replace(/\s+/g, ' ').trim();

    if (verseNum !== '1') {
      fullText = fullText.replace(new RegExp(`^${verseNum}\\s*`), '');
    }

    if (fullText) {
      // Normalizar primera palabra si está en mayúsculas (ej: EN -> En)
      fullText = fullText.replace(/^([A-ZÁÉÍÓÚÑ]{2,})(\b)/, (match, word, boundary) => {
        return word.charAt(0) + word.slice(1).toLowerCase() + boundary;
      });
      versus[verseNum] = fullText;
      verseCount++;
    }
  });

  return { ctd_versus: verseCount, versus };
}

/* =========================
   MAIN OPTIMIZADO Y ORDENADO
========================= */
async function downloadTorresAmat() {
  const outputDir = path.resolve(__dirname, '..', 'bible_json', '1823_torres_amat_es');
  const logFile = path.join(path.dirname(outputDir), '1823_torres_amat_es_log.md');

  await fs.mkdir(outputDir, { recursive: true });

  const logger = new Logger(import.meta.url, 'Torres Amat (1823)', BIBLE_METADATA.length);
  logger.start();

  const CHAPTER_CONCURRENCY = 16;
  let totalBooks = 0;
  let totalChapters = 0;
  let totalVerses = 0;

  // Mantener orden de libros
  const booksData = [];

  try {
    for (const metadata of BIBLE_METADATA) {
      const bookId = metadata.id;
      const slug = BOOK_URL_SLUGS[bookId];
      const chapterCount = CHAPTER_COUNTS[bookId];
      if (!slug) continue;

      logger.bookStart(bookId, metadata.nomen_es);

      const capitula = await mapLimit(
        Array.from({ length: chapterCount }, (_, i) => i + 1),
        CHAPTER_CONCURRENCY,
        async (c) => {
          const data = await fetchChapter(slug, c);
          if (data && data.ctd_versus) {
            return { numerus: c, ctd_versus: data.ctd_versus, versus: data.versus };
          }
          return null;
        }
      );

      const validChapters = capitula.filter(Boolean);
      const bookVerses = validChapters.reduce((sum, c) => sum + c.ctd_versus, 0);

      logger.found(validChapters.length, 'chapters');
      logger.found(bookVerses, 'verses');

      totalBooks++;
      totalChapters += validChapters.length;
      totalVerses += bookVerses;

      const versesPerChapter = validChapters.map((c) => c.ctd_versus).join(', ');

      const safeAcr = metadata.acronymum_es.replace(/\s+/g, '_');
      const filePath = path.join(outputDir, `${bookId}_${safeAcr}_es.json`);

      await fs.writeFile(
        filePath,
        JSON.stringify(
          createBibleJson(
            metadata,
            INFO.versio,
            INFO.licentia,
            INFO.fons,
            INFO.lingua,
            validChapters
          ),
          null,
          2
        ),
        'utf-8'
      );
      logger.bookSaved(bookId, metadata.nomen_es);

      // Guardar para tabla MD
      booksData.push({
        bookId,
        acronymLa: metadata.acronymum_la,
        acronymEs: metadata.acronymum_es,
        chapterCount: validChapters.length,
        bookVerses,
        versesPerChapter,
      });
    }

    // Generar tabla en orden numérico
    const tableRows = booksData
      .sort((a, b) => Number(a.bookId) - Number(b.bookId))
      .map(
        (b) =>
          `| ${b.bookId} | ${b.acronymLa} | ${b.acronymEs} | ${b.chapterCount} | ${b.bookVerses} | ${b.versesPerChapter} |`
      );

    // Generate Markdown Log
    await saveBibleExtractionLog(
      logFile,
      'Log de Extracción Biblia Torres Amat',
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
    logger.error(`Error in extractiōne Torres Amat: ${error.message}`);
  }
}

downloadTorresAmat();
