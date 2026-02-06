import path from 'node:path';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import readline from 'node:readline';
import { pathToFileURL } from 'node:url';

/**
 * Standardized logger for Bible extractions.
 * Optimized for a clean and professional CLI experience with a progress bar.
 */
export class Logger {
  constructor(scriptUrl, bibleName, totalBooks) {
    this.scriptUrl = scriptUrl;
    this.scriptName = path.basename(scriptUrl);
    this.bibleName = bibleName;
    this.totalBooks = totalBooks;
    this.startTime = Date.now();

    // Main Progress Bar (shades_classic)
    this.progressBar = new cliProgress.SingleBar(
      {
        format: chalk.cyan('{bar}') + ' {percentage}% | {value}/{total} Librī | {msg}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
        stopOnComplete: true,
        clearOnComplete: false,
      },
      cliProgress.Presets.shades_classic
    );
  }

  static header(scriptUrl) {
    const name = path.basename(scriptUrl);
    console.log(chalk.bold.magenta(`\n🚀 Execūtiō: ${name}\n`));
  }

  start() {
    console.log(
      chalk.cyan(
        `Incipiēns dētrāctiōnem: ${chalk.bold(this.bibleName)} (${this.totalBooks} librī)...`
      )
    );
    this.progressBar.start(this.totalBooks, 0, { msg: 'Incipiēns...' });
  }

  bookStart(index, name) {
    this.progressBar.update(parseInt(index) - 1, { msg: `Lēctiō: ${name}...` });
  }

  fetching(url) {
    const displayUrl = url.length > 50 ? url.substring(0, 47) + '...' : url;
    this.progressBar.update(this.progressBar.value, { msg: chalk.gray(`Petēns: ${displayUrl}`) });
  }

  found(count, type) {
    const label = type === 'chapters' ? 'cap.' : 'vers.';
    this.progressBar.update(this.progressBar.value, {
      msg: chalk.yellow(`Repertī ${count} ${label}`),
    });
  }

  bookSaved(index, name) {
    this.progressBar.update(parseInt(index), { msg: chalk.green(`Servātus: ${name}`) });
  }

  _print(msg, isError = false) {
    if (this.progressBar.isActive) {
      // Clear current progress bar line
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      if (isError) console.error(msg);
      else console.log(msg);
      // Redraw bar
      this.progressBar.render();
    } else {
      if (isError) console.error(msg);
      else console.log(msg);
    }
  }

  success(msg) {
    this._print(chalk.green(`✓ ${msg}`));
  }

  warn(msg) {
    this._print(chalk.yellow(`⚠ ${msg}`));
  }

  error(msg) {
    this._print(chalk.red(`❌ ${msg}`), true);
  }

  summary(stats) {
    this.progressBar.stop();
    console.log(`\n${chalk.bold.cyan('Summarium Generāle')}`);
    console.log(`${chalk.green('✓')} Librī dētrāctī:  ${chalk.bold(stats.totalBooks)}`);
    console.log(`${chalk.green('✓')} Capitula tōtālia: ${chalk.bold(stats.totalChapters)}`);
    console.log(`${chalk.green('✓')} Versiculī tōtālēs: ${chalk.bold(stats.totalVerses)}`);

    if (stats.outputDir) {
      const url = pathToFileURL(path.resolve(stats.outputDir)).href;
      console.log(`\n📂 Folder: ${chalk.underline.blue(url)}`);
    }

    if (stats.logFile) {
      const url = pathToFileURL(path.resolve(stats.logFile)).href;
      console.log(`📄 Log:    ${chalk.underline.gray(url)}`);
    }

    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log(chalk.bold.green(`\n✅ Bene factum! Extractiō complēta in ${duration}s\n`));
  }
}
