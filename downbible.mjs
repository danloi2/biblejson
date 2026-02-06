import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);

function showHelp() {
  console.log(chalk.bold.magenta('\n  📖 Bible Extraction Suite CLI\n'));
  console.log('  ' + chalk.cyan('Usage:') + ' node downbible.mjs [command]\n');
  console.log('  ' + chalk.cyan('Commands:'));
  console.log(`    ${chalk.yellow('es-je')}     Download the Jerusalem Bible 1967 (Spanish)`);
  console.log(`    ${chalk.yellow('es-ta')}     Download the Torres Amat 1823 Bible (Spanish)`);
  console.log(`    ${chalk.yellow('es-cee')}    Download the CEE Bible (Spanish)`);
  console.log(`    ${chalk.yellow('es-na')}     Download the Nácar-Colunga 1944 Bible (Spanish)`);
  console.log(`    ${chalk.yellow('la-nv')}     Download the Nova Vulgata 1979 (Latin)`);
  console.log(`    ${chalk.yellow('la-vc')}     Download the Vulgata Clementina 1592 (Latin)`);
  console.log(`    ${chalk.yellow('es-all')}    Download all Spanish versions`);
  console.log(`    ${chalk.yellow('all')}       Download all versions`);
  console.log(`    ${chalk.yellow('help')}      Show this help message\n`);

  console.log('  ' + chalk.cyan('Examples:'));
  console.log('    node downbible.mjs es-je');
  console.log('    node downbible.mjs all\n');
}

function runScript(scriptName) {
  const scriptPath = path.join(__dirname, 'scripts', scriptName);
  // We don't log "Executing..." here because each script now has a Logger.header
  // that looks more professional.
  try {
    execSync(`node ${scriptPath}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(chalk.red(`\n❌ Error executoris ${scriptName}:`), error.message);
  }
}

if (args.length === 0 || args.includes('help')) {
  showHelp();
  process.exit(0);
}

const command = args[0].toLowerCase();

function finishBatch() {
  const rootDir = path.join(__dirname, 'bible_json');
  console.log(chalk.bold.green(`\n✅ Suite batch complēta!`));
  console.log(`📂 Omnia data in: ${chalk.cyan(`file://${rootDir}`)}\n`);
}

switch (command) {
  case 'es-je':
  case 'es_je':
  case 'es':
    runScript('down_1967_jerusalem_es.mjs');
    break;
  case 'es-ta':
  case 'es_ta':
  case 'ta':
  case 'torres':
    runScript('down_1823_torres_amat_es.mjs');
    break;
  case 'es-cee':
  case 'es_cee':
  case 'cee':
    runScript('down_2010_cee_es.mjs');
    break;
  case 'es-na':
  case 'es_na':
  case 'na':
  case 'nacar':
    runScript('down_1944_nacar_es.mjs');
    break;
  case 'la-nv':
  case 'la_nv':
  case 'la':
    runScript('down_1979_nova_vulgata_la.mjs');
    break;
  case 'la-vc':
  case 'la_vc':
  case 'vc':
  case 'clementina':
    runScript('down_1592_vulgata_clementina_la.mjs');
    break;
  case 'es-all':
  case 'es_all':
    runScript('down_1967_jerusalem_es.mjs');
    runScript('down_1823_torres_amat_es.mjs');
    runScript('down_2010_cee_es.mjs');
    runScript('down_1944_nacar_es.mjs');
    finishBatch();
    break;
  case 'all':
    runScript('down_1967_jerusalem_es.mjs');
    runScript('down_1979_nova_vulgata_la.mjs');
    runScript('down_1823_torres_amat_es.mjs');
    runScript('down_2010_cee_es.mjs');
    runScript('down_1944_nacar_es.mjs');
    runScript('down_1592_vulgata_clementina_la.mjs');
    finishBatch();
    break;
  default:
    console.log(chalk.red(`\nUnknown command: ${command}`));
    showHelp();
    process.exit(1);
}
