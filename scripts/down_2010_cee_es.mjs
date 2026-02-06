import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BIBLE_METADATA } from './lib/bible_metadata.mjs';
import { createBibleJson } from './lib/json_structure.mjs';
import { saveBibleExtractionLog } from './lib/log_md.mjs';
import * as cheerio from 'cheerio';
import { Logger } from './lib/logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

Logger.header(import.meta.url);

const INFO = {
  versio: 'CEE (2010)',
  lingua: 'es-ES',
  licentia: 'Copyright Conferencia Episcopal Española',
  fons: 'https://www.conferenciaepiscopal.es/biblia/',
};

// URL mapping for CEE website
const CEE_URLS = {
  '01': 'genesis',
  '02': 'exodo',
  '03': 'levitico',
  '04': 'numeros',
  '05': 'deuteronomio',
  '06': 'josue',
  '07': 'jueces',
  '08': 'rut',
  '09': '1-samuel',
  10: '2-samuel',
  11: '1-reyes',
  12: '2-reyes',
  13: '1-cronicas',
  14: '2-cronicas',
  15: 'esdras',
  16: 'nehemias',
  17: 'tobias',
  18: 'judit',
  19: 'ester',
  20: '1-macabeos',
  21: '2-macabeos',
  22: 'job',
  23: 'salmos',
  24: 'proverbios',
  25: 'eclesiastes',
  26: 'cantar',
  27: 'sabiduria',
  28: 'eclesiastico',
  29: 'isaias',
  30: 'jeremias',
  31: 'lamentaciones',
  32: 'baruc',
  33: 'ezequiel',
  34: 'daniel',
  35: 'oseas',
  36: 'joel',
  37: 'amos',
  38: 'abdias',
  39: 'jonas',
  40: 'miqueas',
  41: 'nahun',
  42: 'habacuc',
  43: 'sofonias',
  44: 'ageo',
  45: 'zacarias',
  46: 'malaquias',
  47: 'mateo',
  48: 'marcos',
  49: 'lucas',
  50: 'juan',
  51: 'hechos',
  52: 'romanos',
  53: '1-corintios',
  54: '2-corintios',
  55: 'galatas',
  56: 'efesios',
  57: 'filipenses',
  58: 'colosenses',
  59: '1-tesalonicenses',
  60: '2-tesalonicenses',
  61: '1-timoteo',
  62: '2-timoteo',
  63: 'tito',
  64: 'filemon',
  65: 'hebreos',
  66: 'santiago',
  67: '1-pedro',
  68: '2-pedro',
  69: 'juan-cartas', // Shared URL for 1, 2, 3 Juan
  70: 'juan-cartas',
  71: 'juan-cartas',
  72: 'judas',
  73: 'apocalipsis',
};

const BASE_URL = 'https://www.conferenciaepiscopal.es/biblia';

async function fetchBook(url, bookName, logger) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    return parseBookHTML(html, bookName);
  } catch (error) {
    logger.error(`Error fetching ${bookName}: ${error.message}`);
    return [];
  }
}

function parseBookHTML(html, defaultBookName) {
  const $ = cheerio.load(html);
  const versus = [];

  // Iterate over div.capitulo
  $('div.capitulo').each((_, capituloDiv) => {
    const $capDiv = $(capituloDiv);

    // Get chapter number
    const chapterTextRaw = $capDiv.find('span.numcap').first().text().trim();
    if (!chapterTextRaw) return;

    let currentBook = defaultBookName;
    let chapterNumber = 0;

    // Special logic for Juan's letters
    if (chapterTextRaw.includes('2Carta')) {
      currentBook = '2 Juan';
      chapterNumber = 1;
    } else if (chapterTextRaw.includes('3Carta')) {
      currentBook = '3 Juan';
      chapterNumber = 1;
    } else if (chapterTextRaw.includes('1Carta')) {
      currentBook = '1 Juan';
      const match = chapterTextRaw.match(/(\d+)/);
      chapterNumber = match ? parseInt(match[1], 10) : 1;
    } else {
      // Extract number
      const match = chapterTextRaw.match(/(\d+)/);
      if (match) {
        chapterNumber = parseInt(match[1], 10);
      }
    }

    if (chapterNumber === 0) return;

    // Get verses
    const versSpan = $capDiv.find('span.versiculos').first();
    if (versSpan.length > 0) {
      const nums = versSpan.find('span.numvers');
      const conts = versSpan.find('span.contenido');

      // Iterate through verse numbers and content
      nums.each((i, el) => {
        if (i >= conts.length) return;

        const txtNum = $(el).text().trim();
        const txtCont = $(conts[i]).text().trim();

        const matchVers = txtNum.match(/(\d+)/);
        if (matchVers) {
          const verseNum = parseInt(matchVers[1], 10);
          if (verseNum > 0) {
            const cleanText = txtCont.replace(/\|/g, '').trim();
            versus.push({
              book: currentBook,
              chapter: chapterNumber,
              verse: verseNum,
              text: cleanText,
            });
          }
        }
      });
    }
  });

  return versus;
}

async function downloadCEE() {
  const outputDir = path.resolve(__dirname, '..', 'bible_json', '2010_cee_es');
  const logFile = path.join(path.dirname(outputDir), '2010_cee_es_log.md');

  await fs.mkdir(outputDir, { recursive: true });

  const logger = new Logger(import.meta.url, 'CEE (2010)', BIBLE_METADATA.length);
  logger.start();

  let totalBooks = 0;
  let totalChapters = 0;
  let totalVerses = 0;
  const tableRows = [];

  // Cache for shared URLs (Juan's letters)
  const urlCache = new Map();

  try {
    for (const metadata of BIBLE_METADATA) {
      const bookId = metadata.id;
      const ceeUrl = CEE_URLS[bookId];

      if (!ceeUrl) {
        logger.warn(`No CEE URL for book ${bookId}`);
        continue;
      }

      logger.bookStart(bookId, metadata.nomen_es);

      const url = `${BASE_URL}/${ceeUrl}/`;

      // Fetch or use cache
      let allVerses;
      if (urlCache.has(url)) {
        allVerses = urlCache.get(url);
      } else {
        allVerses = await fetchBook(url, metadata.nomen_es, logger);
        urlCache.set(url, allVerses);

        // Small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Filter if necessary (Juan's letters share URL)
      let filteredVerses;
      if (ceeUrl === 'juan-cartas') {
        filteredVerses = allVerses.filter((v) => v.book === metadata.nomen_es);
      } else {
        filteredVerses = allVerses;
      }

      if (filteredVerses.length === 0) {
        logger.warn(`No verses found for ${metadata.nomen_es}`);
      } else {
        // Build capitula array
        const chapterMap = new Map();
        for (const v of filteredVerses) {
          if (!chapterMap.has(v.chapter)) {
            chapterMap.set(v.chapter, {});
          }
          chapterMap.get(v.chapter)[v.verse] = v.text;
        }

        const capitula = [];
        for (const [chNum, vsObj] of chapterMap.entries()) {
          capitula.push({
            numerus: parseInt(chNum),
            ctd_versus: Object.keys(vsObj).length,
            versus: vsObj,
          });
        }

        logger.found(capitula.length, 'chapters');
        logger.found(filteredVerses.length, 'verses');

        const bookVerses = filteredVerses.length;
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
          `| ${bookId} | ${metadata.acronymum_la} | ${metadata.acronymum_es} | ${capitula.length} | ${bookVerses} | ${versesPerChapter.join(', ')} |`
        );

        const safeAcr = metadata.acronymum_es.replace(/\s+/g, '_');
        const filePath = path.join(outputDir, `${bookId}_${safeAcr}_es.json`);
        await fs.writeFile(filePath, JSON.stringify(enrichedContent, null, 2), 'utf-8');
        logger.bookSaved(bookId, metadata.nomen_es);
      }
    }

    // Generate Markdown Log
    await saveBibleExtractionLog(
      logFile,
      'Log de Extracción Biblia CEE',
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
    logger.error(`Error in extractiōne CEE: ${error.message}`);
  }
}

downloadCEE();
