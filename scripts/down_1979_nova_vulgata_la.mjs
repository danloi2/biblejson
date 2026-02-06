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

const BASE_URL =
  'https://raw.githubusercontent.com/austintheriot/nova-vulgata-with-macrons/master/nova-vulgata/';
const OUTPUT_DIR = path.resolve(__dirname, '..', 'bible_json', '1979_nova_vulgata_la');
const LOG_FILE = path.join(path.dirname(OUTPUT_DIR), '1979_nova_vulgata_la_log.md');

const INFO = {
  versio: 'Nova Vulgata (1979)',
  lingua: 'la',
  licentia: 'Copyright Libreria Editrice Vaticana',
  fons: 'https://github.com/austintheriot/nova-vulgata-with-macrons',
};

const BOOKS = [
  '01 - Liber Genesis',
  '02 - Liber Exodus',
  '03 - Liber Leviticus',
  '04 - Liber Numeri',
  '05 - Liber Deuteronomii',
  '06 - Liber Joseu',
  '07 - Liber Judicum',
  '08 - Liber Ruth',
  '09 - Liber I Samuelis',
  '10 - Liber II Samuelis',
  '11 - Liber I Regum',
  '12 - Liber II Regum',
  '13 - Liber I Paralipomenon',
  '14 - Liber II Paralipomenom',
  '15 - Liber Esdrae',
  '16 - Liber Nehemiae',
  '17 - Liber Thobis',
  '18 - Liber Iudith',
  '19 - Liber Esther',
  '45 - Liber I Maccabaeorum',
  '46 - Liber II Maccabaeorum',
  '20 - Liber Iob',
  '21 - Liber Psalmorum',
  '22 - Liber Proverbium',
  '23 - Liber Ecclesiastes',
  '24 - Canticum Canticorum',
  '25 - Liber Sapientiae',
  '26 - Liber Ecclesiasticus',
  '27 - Liber Isaiae',
  '28 - Liber Ieremiae',
  '29 - Lamentationes',
  '30 - Liber Baruch',
  '31 - Prophetia Ezechielis',
  '32 - Prophetia Danielis',
  '33 - Prophetia Osee',
  '34 - Prophetia Ioel',
  '35 - Prophetia Amos',
  '36 - Prophetia Abdiae',
  '37 - Prophetia Ionae',
  '38 - Prophetia Michaeae',
  '39 - Prophetia Nahum',
  '40 - Prophetia Habacuc',
  '41 - Prophetia Sophoniae',
  '42 - Prophetia Aggaei',
  '43 - Prophetia Zachariae',
  '44 - Prophetia Malachiae',
  '47 - Evangelium secundum Matthaeum',
  '48 - Evangelium secundum Marcum',
  '49 - Evangelium secundum Lucam',
  '50 - Evangelium secundum Ioannem',
  '51 - Actus Apostolorum',
  '52 - Epistula ad Romanos',
  '53 - Epistula I ad Corinthios',
  '54 - Epistula II ad Corinthios',
  '55 - Epistula ad Galatas',
  '56 - Epistula ad Ephesios',
  '57 - Epistula ad Philippenses',
  '58 - Epistula ad Colossenses',
  '59 - Epistula I ad Thessalonicenses',
  '60 - Epistula II ad Thessalonicenses',
  '61 - Epistula I ad Timotheum',
  '62 - Epistula II ad Timotheum',
  '63 - Epistula ad Titum',
  '64 - Epistulam ad Philemonem',
  '65 - Epistula ad Hebraeos',
  '66 - Epistula Iacobi',
  '67 - Epistula I Petri',
  '68 - Epistula II Petri',
  '69 - Epistula I Ioannis',
  '70 - Epistula II Ioannis',
  '71 - Epistula III Ioannis',
  '72 - Epistula Iudae',
  '73 - Apocalypsis Ioannis',
];

function parseVulgataMd(content, index) {
  const lines = content.split('\n');

  const capitula = [];
  let currentChapter = null;
  let totalVersesCount = 0;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    let chapterNum = null;
    if (line.startsWith('### PSALMUS ')) {
      chapterNum = line.match(/PSALMUS\s+(\d+)/)?.[1] || line.replace('### PSALMUS ', '').trim();
    } else if (line.startsWith('## ')) {
      const candidate = line.replace('## ', '').trim();
      if (/^\d+$/.test(candidate)) chapterNum = candidate;
    }

    if (chapterNum) {
      currentChapter = {
        numerus: chapterNum,
        versus: {},
        ctd_versus: 0,
      };
      capitula.push(currentChapter);
      continue;
    }

    const verseMatch = line.match(/^(\d+)([a-z]?)\s+(.*)/);
    if (verseMatch) {
      if (!currentChapter) {
        currentChapter = {
          numerus: '1',
          versus: {},
          ctd_versus: 0,
        };
        capitula.push(currentChapter);
      }
      const verseNum = verseMatch[1] + verseMatch[2];
      const verseText = verseMatch[3].trim();
      currentChapter.versus[verseNum] = verseText;
      currentChapter.ctd_versus++;
      totalVersesCount++;
    } else if (currentChapter && Object.keys(currentChapter.versus).length > 0) {
      const lastVerseNum = Object.keys(currentChapter.versus).pop();
      currentChapter.versus[lastVerseNum] += ' ' + line;
    }
  }

  const metadata = BIBLE_METADATA[index];

  return createBibleJson(metadata, INFO.versio, INFO.licentia, INFO.fons, INFO.lingua, capitula);
}

async function run() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const logger = new Logger(import.meta.url, 'Nova Vulgata (1979)', BOOKS.length);
  logger.start();

  let totalBooks = 0;
  let totalChapters = 0;
  let totalVerses = 0;
  const tableRows = [];

  try {
    for (let i = 0; i < BOOKS.length; i++) {
      const bookFileName = BOOKS[i] + '.md';
      const url = BASE_URL + encodeURIComponent(bookFileName);
      const metadata = BIBLE_METADATA[i];

      logger.bookStart(metadata.id, metadata.nomen_la);

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const mdContent = await response.text();

        const jsonData = parseVulgataMd(mdContent, i);

        totalBooks++;
        totalChapters += jsonData.ctd_capitula;
        totalVerses += jsonData.ctd_versus;

        logger.found(jsonData.ctd_capitula, 'chapters');
        logger.found(jsonData.ctd_versus, 'verses');

        const versesPerChapter = jsonData.capitula.map((c) => c.ctd_versus);
        const indexStr = metadata.id;

        tableRows.push(
          `| ${indexStr} | ${metadata.acronymum_la} | ${metadata.acronymum_es} | ${jsonData.ctd_capitula} | ${jsonData.ctd_versus} | ${versesPerChapter.join(', ')} |`
        );

        const safeAcr = metadata.acronymum_la.replace(/\s+/g, '_');
        const savePath = path.join(OUTPUT_DIR, `${indexStr}_${safeAcr}_la.json`);
        await fs.writeFile(savePath, JSON.stringify(jsonData, null, 2), 'utf-8');

        logger.bookSaved(indexStr, metadata.nomen_la);
      } catch (error) {
        logger.error(`Error processing ${BOOKS[i]}: ${error.message}`);
      }
    }

    // Generate Markdown Log
    await saveBibleExtractionLog(
      LOG_FILE,
      'Log de Extracción Nova Vulgata (Latín)',
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
    logger.error(`Error in extractiōne Nova Vulgata: ${error.message}`);
  }
}

run();
