'use strict';

const readline = require('readline');

/**
 * Arrow-key list prompt, no dependencies.
 *
 * Typing "1" then Enter is a translation step the user should not have to do: they read
 * a label, then have to find its number. Moving a highlight onto the label removes that
 * step entirely.
 *
 * Node's readline.emitKeypressEvents decodes arrow keys the same way on Windows,
 * macOS, and Linux, so this needs no dependency and no platform branching.
 */

const ESC = '';
const isTTY = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);

// Respect NO_COLOR, and drop styling when output is piped somewhere that cannot show it.
const useColor = () => !process.env.NO_COLOR && Boolean(process.stdout.isTTY);
const paint = (code, text) => (useColor() ? `${ESC}[${code}m${text}${ESC}[0m` : text);

const cyan = (t) => paint('36', t);
const dim = (t) => paint('2', t);
const bold = (t) => paint('1', t);
const green = (t) => paint('32', t);

const hideCursor = () => process.stdout.write(`${ESC}[?25l`);
const showCursor = () => process.stdout.write(`${ESC}[?25h`);

/**
 * @param {object}   options
 * @param {string}   options.message  question shown above the list
 * @param {Array}    options.choices  [{ value, label, hint }]
 * @param {number}   options.initial  index highlighted on open
 * @returns {Promise<any>} the chosen `value`, or the initial one when non-interactive
 */
function select({ message, choices, initial = 0 }) {
  if (!choices.length) throw new Error('select: no choices');
  const start = Math.min(Math.max(initial, 0), choices.length - 1);

  // Piped or scripted runs have no way to answer; take the default rather than hang.
  if (!isTTY()) return Promise.resolve(choices[start].value);

  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const output = process.stdout;
    let index = start;
    let lines = 0;

    const render = (first) => {
      if (!first) output.write(`${ESC}[${lines}A`); // back to the top of the block
      lines = 0;

      const write = (text) => {
        output.write(`${ESC}[2K${text}\n`); // clear the row, then draw it
        lines += 1;
      };

      write(`${cyan('?')} ${bold(message)}`);
      choices.forEach((choice, i) => {
        const active = i === index;
        const pointer = active ? cyan('❯') : ' ';
        const label = active ? cyan(choice.label) : choice.label;
        // Short hints sit beside the label; long ones get their own row so nothing
        // wraps on a narrow terminal.
        const inline = choice.hint && choice.hint.length <= 32;
        write(`${pointer} ${label}${inline ? `  ${dim(choice.hint)}` : ''}`);
        if (choice.hint && !inline) write(`    ${dim(choice.hint)}`);
      });
      write('');
      write(dim('  ↑↓ move · enter select · esc cancel'));
    };

    const cleanup = () => {
      input.removeListener('keypress', onKey);
      if (input.isTTY) input.setRawMode(false);
      input.pause();
      showCursor();
    };

    const finish = () => {
      output.write(`${ESC}[${lines}A`); // rewind over the menu
      for (let i = 0; i < lines; i += 1) output.write(`${ESC}[2K${ESC}[1B`);
      output.write(`${ESC}[${lines}A`);
      output.write(`${ESC}[2K${green('✓')} ${bold(message)}  ${cyan(choices[index].label)}\n`);
      cleanup();
      resolve(choices[index].value);
    };

    const onKey = (str, key = {}) => {
      if (key.name === 'up' || key.name === 'k') {
        index = (index - 1 + choices.length) % choices.length;
        render(false);
      } else if (key.name === 'down' || key.name === 'j' || key.name === 'tab') {
        index = (index + 1) % choices.length;
        render(false);
      } else if (key.name === 'return' || key.name === 'enter') {
        finish();
      } else if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
        cleanup();
        output.write('\n');
        reject(new Error('cancelled'));
      } else if (/^[1-9]$/.test(str || '')) {
        // Numbers still work — muscle memory from every other CLI.
        const picked = Number(str) - 1;
        if (picked < choices.length) {
          index = picked;
          finish();
        }
      }
    };

    readline.emitKeypressEvents(input);
    input.setRawMode(true);
    input.resume();
    hideCursor();
    render(true);
    input.on('keypress', onKey);
  });
}

module.exports = { select, isTTY };
