import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { BIBLE_METADATA } from './lib/bible_metadata.mjs';
import { createBibleJson } from './lib/json_structure.mjs';
import { saveBibleExtractionLog } from './lib/log_md.mjs';
import { Logger } from './lib/logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://la.wikisource.org/wiki/Vulgata_Clementina/';
const OUTPUT_DIR = path.resolve(__dirname, '..', 'bible_json', '1592_vulgata_clementina_la');
const LOG_FILE = path.join(path.dirname(OUTPUT_DIR), '1592_vulgata_clementina_la_log.md');

const INFO = {
  versio: 'Vulgata Clementina (1592)',
  lingua: 'la',
  licentia: 'Public Domain',
  fons: 'https://la.wikisource.org/wiki/Vulgata_Clementina/',
};

// Mapping based on extracted URLs
const BOOK_SLUGS = {
  '01': 'Liber_Genesis',
  '02': 'Liber_Exodus',
  '03': 'Liber_Leviticus',
  '04': 'Liber_Numeri',
  '05': 'Liber_Deuteronomii',
  '06': 'Liber_Josue',
  '07': 'Liber_Judicum',
  '08': 'Liber_Ruth',
  '09': 'Liber_I_Regum',
  10: 'Liber_II_Regum',
  11: 'Liber_III_Regum',
  12: 'Liber_IV_Regum',
  13: 'Liber_I_Paralipomenon',
  14: 'Liber_II_Paralipomenon',
  15: 'Liber_I_Esdrae',
  16: 'Liber_II_Esdrae', // Nehemiah often linked as II Esdrae or separate
  17: 'Liber_Tobiae',
  18: 'Liber_Judith',
  19: 'Liber_Esther',
  20: 'Liber_I_Machabaeorum',
  21: 'Liber_II_Machabaeorum',
  22: 'Liber_Job',
  23: 'Liber_Psalmorum',
  24: 'Liber_Proverbiorum',
  25: 'Liber_Ecclesiastes',
  26: 'Canticum_Canticorum',
  27: 'Liber_Sapientiae',
  28: 'Liber_Ecclesiasticus',
  29: 'Prophetia_Isaiae',
  30: 'Prophetia_Jeremiae',
  31: 'Lamentationes',
  32: 'Prophetia_Baruch',
  33: 'Prophetia_Ezechielis',
  34: 'Prophetia_Danielis',
  35: 'Prophetia_Osee',
  36: 'Prophetia_Joel',
  37: 'Prophetia_Amos',
  38: 'Prophetia_Abdiae',
  39: 'Prophetia_Jona',
  40: 'Prophetia_Michaeae',
  41: 'Prophetia_Nahum',
  42: 'Prophetia_Habacuc',
  43: 'Prophetia_Sophoniae',
  44: 'Prophetia_Aggaei',
  45: 'Prophetia_Zachariae',
  46: 'Prophetia_Malachiae',
  47: 'Evangelium_Secundum_Matthaeum',
  48: 'Evangelium_Secundum_Marcum',
  49: 'Evangelium_Secundum_Lucam',
  50: 'Evangelium_Secundum_Joannem',
  51: 'Acta_Apostolorum',
  52: 'Pauli_Epistola_ad_Romanos',
  53: 'Pauli_Epistola_ad_Corinthios_I',
  54: 'Pauli_Epistola_ad_Corinthios_II',
  55: 'Pauli_Epistola_ad_Galatas',
  56: 'Pauli_Epistola_ad_Ephesios',
  57: 'Pauli_Epistola_ad_Philippenses',
  58: 'Pauli_Epistola_ad_Colossenses',
  59: 'Pauli_Epistola_ad_Thessalonicenses_I',
  60: 'Pauli_Epistola_ad_Thessalonicenses_II',
  61: 'Pauli_Epistola_ad_Timotheum_I',
  62: 'Pauli_Epistola_ad_Timotheum_II',
  63: 'Pauli_Epistola_ad_Titum',
  64: 'Pauli_Epistola_ad_Philemonem',
  65: 'Pauli_Epistola_ad_Hebraeos',
  66: 'Jacobi_Epistola',
  67: 'Petri_Epistola_I',
  68: 'Petri_Epistola_II',
  69: 'Joannis_Epistola_I',
  70: 'Joannis_Epistola_II',
  71: 'Joannis_Epistola_III',
  72: 'Juda_Epistola',
  73: 'Apocalypsis',
};

Logger.header(import.meta.url);

function parseBook(html, bookId) {
  const $ = cheerio.load(html);
  const capitula = [];

  // Wikisource Vulgata formatting varies, but usually:
  // Chapters: <h3>...Caput I...</h3> or similar, or just headers.
  // Verses: often <span class="versenum">...</span> followed by text.

  // Strategy: Flatten the text and look for chapter headers / verse numbers.
  // Inspection required: let's try a standard loop over 'div.mw-parser-output > *'

  // Simpler approach for Wikisource which works often:
  // Look for headings (h3, h4) for chapters.
  // Look for verse numbers (often sup or b or span) and collect text.

  // Refined Strategy based on typical MediaWiki structure:
  // We'll traverse the main content area.

  // Regex to detect "Caput [Roman/Number]"
  const chapterRegex = /Caput\s+([IVXLCDM\d]+)/i;

  const content = $('.mw-parser-output');
  const textDiv = content.find('div.text').length ? content.find('div.text') : content;

  let currentChapter = null;
  let chapterMap = new Map();

  function romanToInt(s) {
    if (!s) return 0;
    if (/^\d+$/.test(s)) return parseInt(s);
    const romans = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let num = 0;
    for (let i = 0; i < s.length; i++) {
      const curr = romans[s[i].toUpperCase()];
      if (!curr) continue;
      const next = romans[s[i + 1]?.toUpperCase()];
      if (next > curr) num -= curr;
      else num += curr;
    }
    return num;
  }

  // Iterate all elements looking for chapters and verses
  textDiv.find('*').each((i, el) => {
    const $el = $(el);
    const tagName = el.tagName.toLowerCase();
    const text = $el.text().trim();

    // Check for Chapter Header (h2, h3, h4 or div.mw-heading)
    if (['h2', 'h3', 'h4'].includes(tagName) || $el.hasClass('mw-heading')) {
      const match = text.match(chapterRegex);
      if (match) {
        const chapNum = romanToInt(match[1]).toString();
        currentChapter = { numerus: chapNum, ctd_versus: 0, versus: {} };
        chapterMap.set(chapNum, currentChapter);
        return;
      }
    }

    if (!currentChapter) return;

    // Inside paragraphs or other elements, look for verse markers
    // Wikisource uses <span id="1"><sup>1</sup></span> or similar
    if (
      tagName === 'sup' ||
      $el.hasClass('versenum') ||
      ($el.attr('id') && /^\d+$/.test($el.attr('id')))
    ) {
      const vNum = $el.text().trim() || $el.attr('id');
      if (vNum && /^\d+$/.test(vNum)) {
        // The text follows this marker. We need to grab the next text node.
        // However, the current splitting logic might still be more robust if multiple verses are in one paragraph.
      }
    }
  });

  // Re-implementing the splitting logic on paragraphs but making it respect the chapterMap
  chapterMap.clear();
  currentChapter = null;

  textDiv.find('h2, h3, h4, p, div.mw-heading').each((i, el) => {
    const $el = $(el);
    const text = $el.text().trim();

    if (['h2', 'h3', 'h4'].includes(el.tagName.toLowerCase()) || $el.hasClass('mw-heading')) {
      const match = text.match(chapterRegex);
      if (match) {
        const chapNum = romanToInt(match[1]).toString();
        currentChapter = { numerus: chapNum, ctd_versus: 0, versus: {} };
        chapterMap.set(chapNum, currentChapter);
        return;
      }
    }

    if (currentChapter && el.tagName.toLowerCase() === 'p') {
      const fullText = $el.text().replace(/\n/g, ' ').trim();
      const verseParts = fullText.split(/(?:^|\s)(\d+)\s+/);
      if (currentChapter.numerus === '1' && verseParts.length < 2) {
        // console.log(`DEBUG: [Chap ${currentChapter.numerus}] Split failed for P: "${fullText.substring(0, 50)}"`);
      }
      for (let k = 1; k < verseParts.length; k += 2) {
        const vNum = verseParts[k];
        const vText = verseParts[k + 1].trim();
        if (vText && /^\d+$/.test(vNum)) {
          if (currentChapter.versus[vNum]) {
            currentChapter.versus[vNum] += ' ' + vText;
          } else {
            currentChapter.versus[vNum] = vText;
          }
        }
      }
    }
  });

  // Convert map to array
  for (const [key, val] of chapterMap) {
    val.ctd_versus = Object.keys(val.versus).length;
    capitula.push(val);
  }

  return capitula;
}

async function run() {
  const logger = new Logger(import.meta.url, 'Vulgata Clementina (1592)', 73);
  logger.start();

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  let totalBooks = 0;
  let totalChapters = 0;
  let totalVerses = 0;
  const tableRows = [];

  const bookIds = Object.keys(BOOK_SLUGS).sort((a, b) => parseInt(a) - parseInt(b));

  try {
    for (const id of bookIds) {
      const slug = BOOK_SLUGS[id];
      const metadata = BIBLE_METADATA.find((m) => m.id === id);

      if (!metadata) {
        logger.error(`Missing metadata for ID ${id}`);
        continue;
      }

      logger.bookStart(id, metadata.nomen_la);

      try {
        const url = `${BASE_URL}${slug}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${slug}`);
        const html = await response.text();

        const parsedChapters = parseBook(html, id);
        const capitula = parsedChapters.map((ch) => ({
          numerus: parseInt(ch.numerus),
          ctd_versus: ch.ctd_versus,
          versus: ch.versus,
        }));

        // Post-processing
        const bookVerses = capitula.reduce((acc, c) => acc + c.ctd_versus, 0);

        logger.found(capitula.length, 'chapters');
        logger.found(bookVerses, 'verses');

        // Enriched Content
        const enrichedContent = createBibleJson(
          metadata,
          INFO.versio,
          INFO.licentia,
          INFO.fons,
          INFO.lingua,
          capitula
        );

        totalBooks++;
        totalChapters += capitula.length;
        totalVerses += bookVerses;

        const versesPerChapter = capitula.map((c) => c.ctd_versus);
        tableRows.push(
          `| ${id} | ${metadata.acronymum_la} | ${metadata.acronymum_es} | ${capitula.length} | ${bookVerses} | ${versesPerChapter.join(', ')} |`
        );

        const safeAcr = metadata.acronymum_la.replace(/\s+/g, '_');
        const savePath = path.join(OUTPUT_DIR, `${id}_${safeAcr}_la.json`);
        await fs.writeFile(savePath, JSON.stringify(enrichedContent, null, 2), 'utf-8');
        logger.bookSaved(id, metadata.nomen_la);
      } catch (err) {
        logger.error(`Error processing ${slug}: ${err.message}`);
      }

      // Nice delay
      await new Promise((r) => setTimeout(r, 200));
    }

    // Generate Markdown Log
    await saveBibleExtractionLog(
      LOG_FILE,
      'Log de Extracción Vulgata Clementina (1592)',
      INFO,
      { totalBooks, totalChapters, totalVerses },
      tableRows
    );

    logger.summary({
      totalBooks,
      totalChapters,
      totalVerses,
      logFile: LOG_FILE,
      outputDir: OUTPUT_DIR,
    });
  } catch (error) {
    logger.error(`Error in extractiōne Vulgata Clementina: ${error.message}`);
  }
}

run();
