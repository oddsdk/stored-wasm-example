import * as webnative from 'webnative';
import * as dom from './dom';
import 'tachyons';
import './main.css'

let fs;

const permissions = {
  app: { creator: "bgins", name: "fission-wasm-example" }
}

webnative.program({ tag: { creator: "Nullsoft", name: "Winamp" }, permissions }).then(async program => {
  const session = program.session

  if (session) {
    fs = session.fs;

    const resultPath = webnative.appDataPath(permissions.app, webnative.path.file('results', 'add'));
    if (await fs.exists(resultPath)) {
      const stored = JSON.parse(new TextDecoder().decode(
        await fs.read(resultPath)
      ));
      revealStoredResult(stored)
    }

    dom.hide('loading-animation');
    dom.reveal('store');

  } else {
    dom.hide('loading-animation');
    dom.reveal('auth');
  }

  const auth = () => {
    program.confidences.request(permissions)
  };

  const store = async () => {
    dom.reveal('loading-animation');

    fetch('add.wasm').then(response =>
      response.arrayBuffer().then(async buffer => {
        if (fs) {
          const path = webnative.appDataPath(permissions.app, webnative.path.file('wasm', 'math', 'add.wasm'));
          const blob = new Blob([buffer], { type: 'application/wasm' });
          await fs.write(path, blob);
          await fs.publish();

          dom.hide('store-button-row', 'loading-animation');
          dom.reveal('list');
        }
      })
    );
  };

  const ls = async () => {
    if (fs) {
      const directoryPath = webnative.appDataPath(permissions.app, webnative.path.directory('wasm', 'math'));
      const directoryListing = await fs.ls(directoryPath);
      Object.keys(directoryListing).forEach(function (key) {
        appendRow(directoryListing[key]);
      });

      dom.hide('list-button-row');
      dom.reveal('contents');
    }
  };

  const showRunSection = () => {
    dom.hide('show-run-button-row');
    dom.reveal('run');
  };

  const add = async () => {
    const lhs = +document.getElementById('lhs').value;
    const rhs = +document.getElementById('rhs').value;

    if (fs) {
      if (!Number.isNaN(lhs) && !Number.isNaN(rhs)) {
        const path = webnative.appDataPath(permissions.app, webnative.path.file('wasm', 'math', 'add.wasm'));
        if (await fs.exists(path)) {
          const buffer = await fs.read(path);
          WebAssembly.instantiate(buffer).then(async wasmObject => {
            const result = wasmObject.instance.exports.add(lhs, rhs);
            dom.updateFirstChild('result', result);

            const resultPath = webnative.appDataPath(permissions.app, webnative.path.file('results', 'add'));
            const computation = { lhs, rhs, result };
            await fs.write(resultPath, new TextEncoder().encode(JSON.stringify(computation)));
            await fs.publish();

            dom.reveal('everywhere');
          });
        }
      } else {
        dom.updateFirstChild('result', '🤖🤖💥');
      }
    }
  };

  const clear = async () => {
    if (fs) {
      document.getElementById('lhs').value = '';
      document.getElementById('rhs').value = '';
      dom.updateFirstChild('result', '?');

      const resultPath = webnative.appDataPath(permissions.app, webnative.path.file('results', 'add'));
      const noComputation = { lhs: '', rhs: '', result: '?' };
      await fs.write(resultPath, JSON.stringify(noComputation));
      await fs.publish();
    }
  };

  const reset = async () => {
    dom.hide('store', 'list', 'contents', 'run', 'everywhere');
    dom.reveal('loading-animation');

    if (fs) {
      const funcPath = webnative.appDataPath(permissions.app, webnative.path.file('wasm', 'math', 'add.wasm'));
      const resultPath = webnative.appDataPath(permissions.app, webnative.path.file('results', 'add'));
      await fs.rm(funcPath);
      await fs.rm(resultPath);
      await fs.publish();

      dom.hide('loading-animation')
      dom.reveal(
        'store',
        'store-button-row',
        'list-button-row',
        'show-run-button-row'
      );
    }
  };

  const initialize = () => {
    document.getElementById('auth-button').onclick = auth;
    document.getElementById('store-button').onclick = store;
    document.getElementById('list-button').onclick = ls;
    document.getElementById('show-run-button').onclick = showRunSection;
    document.getElementById('add-button').onclick = add;
    document.getElementById('clear-button').onclick = clear;
    document.getElementById('reset-button').onclick = reset;
  };

  initialize();
});

dom.reveal('loading-animation');  // Show animation on page load

// REVEAL STORED RESULT

const revealStoredResult = async stored => {
  document.getElementById('lhs').value = stored.lhs;
  document.getElementById('rhs').value = stored.rhs;
  dom.updateFirstChild('result', stored.result);

  dom.hide('store-button-row', 'list-button-row', 'show-run-button-row', 'store');
  dom.reveal('run', 'everywhere');
};


// UPDATE DIRECTORY LISTING

const appendRow = data => {
  const tr = document.createElement('tr');
  tr.classList.add('lh-copy');

  appendCell(tr, data.name);
  appendCell(tr, data.size);
  appendCell(tr, data.mtime);
  appendCell(tr, data.isFile);

  const tbody = document.getElementById('directory-listing');
  tbody.appendChild(tr);
};

const appendCell = (tr, cellData) => {
  const cell = document.createElement('td');
  cell.classList.add('pv3', 'pr3', 'bb', 'b--black-20');

  const text = document.createTextNode(cellData);
  cell.appendChild(text);
  tr.appendChild(cell);
};

export { };
