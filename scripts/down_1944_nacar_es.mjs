import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import { BIBLE_METADATA } from './lib/bible_metadata.mjs';
import { createBibleJson } from './lib/json_structure.mjs';
import { saveBibleExtractionLog } from './lib/log_md.mjs';
import { Logger } from './lib/logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

Logger.header(import.meta.url);

const DOCX_URL =
  'https://essoterico.wordpress.com/wp-content/uploads/2019/12/biblia-nacar-colunga-3.docx';
const OUTPUT_DIR = path.join(__dirname, '../bible_json/1944_nacar_es/');
const LOG_FILE = path.join(path.dirname(OUTPUT_DIR), '1944_nacar_es_log.md');

const INFO = {
  versio: 'Nácar-Colunga (1944)',
  lingua: 'es-ES',
  licentia: 'Copyright BAC',
  fons: 'https://essoterico.wordpress.com/wp-content/uploads/2019/12/biblia-nacar-colunga-3.docx',
};

const BIBLE_BOOKS = [
  { name: 'GÉNESIS', abbr: 'GEN', id: '01' },
  { name: 'ÉXODO', abbr: 'EX', id: '02' },
  { name: 'LEVÍTICO', abbr: 'LEV', id: '03' },
  { name: 'NÚMEROS', abbr: 'Nº', id: '04' },
  { name: 'DEUTERONOMIO', abbr: 'DEUT', id: '05' },
  { name: 'JOSUÉ', abbr: 'JOS', id: '06' },
  { name: 'JUECES', abbr: 'JUE', id: '07' },
  { name: 'RUT', abbr: 'RUT', id: '08' },
  { name: '1 SAMUEL', abbr: '1 SAM', id: '09' },
  { name: '2 SAMUEL', abbr: '2 SAM', id: '10' },
  { name: '1 REYES', abbr: '1 RE', id: '11' },
  { name: '2 REYES', abbr: '2 RE', id: '12' },
  { name: '1 PARALIPÓMENOS', abbr: '1 PAR', id: '13' },
  { name: '2 PARALIPÓMENOS', abbr: '2 PAR', id: '14' },
  { name: 'ESDRAS', abbr: 'ESD', id: '15' },
  { name: 'NEHEMÍAS', abbr: 'NEH', id: '16' },
  { name: 'TOBÍAS', abbr: 'TOB', id: '17' },
  { name: 'JUDIT', abbr: 'JDT', id: '18' },
  { name: 'ESTER', abbr: 'EST', id: '19' },
  { name: '1 MACABEOS', abbr: '1 MAC', id: '20' },
  { name: '2 MACABEOS', abbr: '2 MAC', id: '21' },
  { name: 'JOB', abbr: 'JOB', id: '22' },
  { name: 'SALMOS', abbr: 'SAL', id: '23' },
  { name: 'PROVERBIOS', abbr: 'PROV', id: '24' },
  { name: 'ECLESIASTÉS', abbr: 'ECLE', id: '25' },
  { name: 'CANTAR DE LOS CANTARES', abbr: 'CANTAR', id: '26' },
  { name: 'SABIDURÍA', abbr: 'SAB', id: '27' },
  { name: 'ECLESIÁSTICO', abbr: 'ECLO', id: '28' },
  { name: 'ISAÍAS', abbr: 'IS', id: '29' },
  { name: 'JEREMÍAS', abbr: 'JER', id: '30' },
  { name: 'LAMENTACIONES', abbr: 'LAM', id: '31' },
  { name: 'BARUC', abbr: 'BAR', id: '32' },
  { name: 'EZEQUIEL', abbr: 'EZ', id: '33' },
  { name: 'DANIEL', abbr: 'DAN', id: '34' },
  { name: 'OSEAS', abbr: 'OSE', id: '35' },
  { name: 'JOEL', abbr: 'JOEL', id: '36' },
  { name: 'AMÓS', abbr: 'AMÓS', id: '37' },
  { name: 'ABDÍAS', abbr: 'ABDÍAS', id: '38' },
  { name: 'JONÁS', abbr: 'JON', id: '39' },
  { name: 'MIQUEAS', abbr: 'MIQ', id: '40' },
  { name: 'NAHUM', abbr: 'NAH', id: '41' },
  { name: 'HABACUC', abbr: 'HAB', id: '42' },
  { name: 'SOFONÍAS', abbr: 'SOF', id: '43' },
  { name: 'AGEO', abbr: 'AG', id: '44' },
  { name: 'ZACARÍAS', abbr: 'ZAC', id: '45' },
  { name: 'MALAQUÍAS', abbr: 'MAL', id: '46' },
  { name: 'MATEO', abbr: 'MT', id: '47' },
  { name: 'MARCOS', abbr: 'MC', id: '48' },
  { name: 'LUCAS', abbr: 'LC', id: '49' },
  { name: 'JUAN', abbr: 'JN', id: '50' },
  { name: 'HECHOS DE LOS APÓSTOLES', abbr: 'HA', id: '51' },
  { name: 'ROMANOS', abbr: 'ROM', id: '52' },
  { name: '1 CORINTIOS', abbr: '1 COR', id: '53' },
  { name: '2 CORINTIOS', abbr: '2 COR', id: '54' },
  { name: 'GÁLATAS', abbr: 'GAL', id: '55' },
  { name: 'EFESIOS', abbr: 'EF', id: '56' },
  { name: 'FILIPENSES', abbr: 'FIL', id: '57' },
  { name: 'COLOSENSES', abbr: 'COL', id: '58' },
  { name: '1 TESALONICENSES', abbr: '1 TES', id: '59' },
  { name: '2 TESALONICENSES', abbr: '2 TES', id: '60' },
  { name: '1 TIMOTEO', abbr: '1 TIM', id: '61' },
  { name: '2 TIMOTEO', abbr: '2 TIM', id: '62' },
  { name: 'TITO', abbr: 'TITO', id: '63' },
  { name: 'FILEMÓN', abbr: 'FILEMÓN', id: '64' },
  { name: 'HEBREOS', abbr: 'HEB', id: '65' },
  { name: 'SANTIAGO', abbr: 'SANT', id: '66' },
  { name: '1 PEDRO', abbr: '1 PE', id: '67' },
  { name: '2 PEDRO', abbr: '2 PE', id: '68' },
  { name: '1 JUAN', abbr: '1 JN', id: '69' },
  { name: '2 JUAN', abbr: '2 JN', id: '70' },
  { name: '3 JUAN', abbr: '3 JN', id: '71' },
  { name: 'JUDAS', abbr: 'JUD', id: '72' },
  { name: 'APOCALIPSIS', abbr: 'AP', id: '73' },
];

const ABBR_TO_ID = {};
BIBLE_BOOKS.forEach((b) => (ABBR_TO_ID[b.abbr.toUpperCase()] = b.id));
const normalizedAbbrToId = {};
for (const k in ABBR_TO_ID) normalizedAbbrToId[k.replace(/\s+/g, ' ')] = ABBR_TO_ID[k];
normalizedAbbrToId['STG'] = '66';
normalizedAbbrToId['1 PED'] = '67';
normalizedAbbrToId['2 PED'] = '68';

const REAL_SINGLE_CHAPTER_BOOKS = new Set(['38', '64', '70', '71', '72']);

async function extractNacar() {
  const logger = new Logger(import.meta.url, 'Nácar-Colunga (1944)', BIBLE_BOOKS.length);
  logger.start();

  try {
    logger.fetching(DOCX_URL);
    const response = await fetch(DOCX_URL);
    if (!response.ok) throw new Error(`Failed to fetch DOCX: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await mammoth.convertToHtml(
      { buffer: buffer },
      {
        ignoreEmptyParagraphs: true,
        convertImage: mammoth.images.inline(() => ({})),
      }
    );
    const html = result.value;
    const $ = cheerio.load(html);

    const bibleData = {};
    let currentBookId = null;
    let currentChapterNum = null;
    let lastSeenAbbr = null;
    let indexPassed = false;

    $('p').each((i, el) => {
      const p = $(el);
      let strong = '';
      p.find('strong').each((j, sEl) => (strong += $(sEl).text() + ' '));
      strong = strong.trim().replace(/\s+/g, ' ');
      const text = p.text().trim().replace(/\s+/g, ' ');

      if (!indexPassed) {
        if (strong.includes('APOCALIPSIS (AP)')) indexPassed = true;
        return;
      }

      let bookMatch = false;

      // 1. Book Header
      for (const book of BIBLE_BOOKS) {
        const abbrRegex = new RegExp(
          '\\(' +
            book.abbr
              .replace(/[\.]/g, '\\.')
              .replace('$', '\\$')
              .replace('(', '\\(')
              .replace(')', '\\)') +
            '\\)',
          'i'
        );
        if (strong.match(abbrRegex)) {
          currentBookId = book.id;
          lastSeenAbbr = book.abbr.toUpperCase().replace(/\s+/g, ' ');
          initBook(currentBookId, bibleData);
          if (REAL_SINGLE_CHAPTER_BOOKS.has(currentBookId)) {
            currentChapterNum = '1';
            initChapter(currentBookId, currentChapterNum, bibleData);
          } else {
            currentChapterNum = null;
          }
          bookMatch = true;
          break;
        }
      }

      if (!bookMatch) {
        // 2. Combined or Abbreviation
        const combinedMatch = strong.match(/^([A-ZÁÉÍÓÚÑº\d\s\.]+)\s+(\d+)$/i);
        if (combinedMatch) {
          const abbr = combinedMatch[1].trim().toUpperCase().replace(/\s+/g, ' ');
          const chap = combinedMatch[2];
          if (normalizedAbbrToId[abbr]) {
            currentBookId = normalizedAbbrToId[abbr];
            lastSeenAbbr = abbr;
            currentChapterNum = chap;
            initBook(currentBookId, bibleData);
            initChapter(currentBookId, currentChapterNum, bibleData);
            bookMatch = true;
          }
        } else if (strong.length > 0) {
          const abbr = strong.toUpperCase().replace(/\s+/g, ' ');
          if (normalizedAbbrToId[abbr]) {
            currentBookId = normalizedAbbrToId[abbr];
            lastSeenAbbr = abbr;
            bookMatch = true;
          }
        }
      }

      if (!bookMatch) {
        // 3. Just Chapter Number
        const chapMatch = strong.match(/^(\d+)$/);
        if (chapMatch && lastSeenAbbr) {
          const chap = chapMatch[1];
          if (normalizedAbbrToId[lastSeenAbbr]) {
            currentBookId = normalizedAbbrToId[lastSeenAbbr];
            currentChapterNum = chap;
            initBook(currentBookId, bibleData);
            initChapter(currentBookId, currentChapterNum, bibleData);
            bookMatch = true;
          }
        }
      }

      if (currentBookId && !bibleData[currentBookId]) initBook(currentBookId, bibleData);

      // Process Verses
      if (currentBookId && currentChapterNum && bibleData[currentBookId]) {
        const sups = p.find('sup');
        if (sups.length > 0) {
          sups.each((j, supEl) => {
            const sup = $(supEl);
            const verseNumRaw = sup.text().trim().replace(/[()]/g, '').split(/\s+/)[0];
            if (/^\d+$/.test(verseNumRaw)) {
              const verseNum = verseNumRaw;
              let vText = '';
              let nextNode = supEl.nextSibling;
              while (nextNode && nextNode.name !== 'sup') {
                if (nextNode.type === 'text') vText += nextNode.data;
                else vText += $(nextNode).text();
                nextNode = nextNode.nextSibling;
              }
              vText = vText.trim().replace(/\s+/g, ' ');
              if (vText) {
                const chapter = bibleData[currentBookId].capitula.find(
                  (c) => c.numerus === currentChapterNum
                );
                if (chapter) {
                  if (chapter.versus[verseNum]) chapter.versus[verseNum] += ' ' + vText;
                  else chapter.versus[verseNum] = vText;
                }
              }
            }
          });
        } else if (text && !strong) {
          const chapter = bibleData[currentBookId].capitula.find(
            (c) => c.numerus === currentChapterNum
          );
          if (chapter && Object.keys(chapter.versus).length > 0) {
            const vKeys = Object.keys(chapter.versus);
            chapter.versus[vKeys[vKeys.length - 1]] += ' ' + text;
          }
        }
      }
    });

    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const tableRows = [];
    let totalBooks = 0;
    let totalChapters = 0;
    let totalVerses = 0;

    const sortedIds = Object.keys(bibleData).sort((a, b) => parseInt(a) - parseInt(b));

    for (const id of sortedIds) {
      const book = bibleData[id];
      if (book.capitula.length === 0) continue;
      book.capitula.sort((a, b) => parseInt(a.numerus) - parseInt(b.numerus));
      book.ctd_capitula = book.capitula.length;
      let bookVerses = 0;
      const chaptersDetail = [];

      const meta = BIBLE_METADATA.find((m) => m.id === id);
      logger.bookStart(id, meta.nomen_es);

      book.capitula.forEach((c) => {
        const vKeys = Object.keys(c.versus).sort((a, b) => parseInt(a) - parseInt(b));
        const sortedV = {};
        vKeys.forEach((k) => (sortedV[k] = c.versus[k].trim().replace(/\s+/g, ' ')));
        c.versus = sortedV;
        c.ctd_versus = vKeys.length;
        bookVerses += c.ctd_versus;
        chaptersDetail.push(`Ch${c.numerus}(${c.ctd_versus})`);
      });
      book.ctd_versus = bookVerses;

      logger.found(book.ctd_capitula, 'chapters');
      logger.found(bookVerses, 'verses');

      totalBooks++;
      totalChapters += book.ctd_capitula;
      totalVerses += book.ctd_versus;

      const enrichedContent = createBibleJson(
        meta,
        INFO.versio,
        INFO.licentia,
        INFO.fons,
        INFO.lingua,
        book.capitula
      );

      await fs.writeFile(
        path.join(OUTPUT_DIR, `${id}_${meta.acronymum_es}_es.json`),
        JSON.stringify(enrichedContent, null, 2),
        'utf-8'
      );
      logger.bookSaved(id, meta.nomen_es);

      tableRows.push(
        `| ${id} | ${meta.acronymum_la} | ${meta.acronymum_es} | ${book.ctd_capitula} | ${book.ctd_versus} | ${chaptersDetail.join(', ')} |`
      );
    }

    // Generate Markdown Log
    await saveBibleExtractionLog(
      LOG_FILE,
      'Log de Extracción Sagrada Biblia Nácar-Colunga (1944)',
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
    logger.error(`Error in extractiōne Nácar: ${error.message}`);
  }
}

function initBook(id, bibleData) {
  if (!bibleData[id]) {
    const meta = BIBLE_METADATA.find((m) => m.id === id);
    bibleData[id] = {
      ...meta,
      lingua: 'es-ES',
      versio: 'Nácar-Colunga (1944)',
      licentia: 'Copyright BAC',
      fons: 'https://essoterico.wordpress.com/wp-content/uploads/2019/12/biblia-nacar-colunga-3.docx',
      capitula: [],
    };
  }
}

function initChapter(bookId, chapNum, bibleData) {
  const book = bibleData[bookId];
  if (book && !book.capitula.find((c) => c.numerus === chapNum)) {
    book.capitula.push({ numerus: chapNum, ctd_versus: 0, versus: {} });
  }
}

extractNacar();
