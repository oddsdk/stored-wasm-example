import * as webnative from 'webnative';
import * as dom from './dom';
import 'tachyons';
import './main.css'

let fs;

const fissionInit = {
  permissions: {
    app: {
      name: 'fission-wasm-example',
      creator: 'bgins'
    }
  }
};

webnative.initialize(fissionInit).then(async state => {
  switch (state.scenario) {
    case webnative.Scenario.AuthSucceeded:
    case webnative.Scenario.Continuation:
      fs = state.fs;

      const resultPath = fs.appPath(webnative.path.file('results', 'add'));
      if (await fs.exists(resultPath)) {
        const stored = JSON.parse(await fs.read(resultPath));
        revealStoredResult(stored);
      }

      dom.hide('loading-animation');
      dom.reveal('store');
      break;

    case webnative.Scenario.NotAuthorised:
    case webnative.Scenario.AuthCancelled:
      dom.hide('loading-animation');
      dom.reveal('auth');
      break;
  }

  const auth = () => {
    webnative.redirectToLobby(state.permissions);
  };

  const store = async () => {
    dom.reveal('loading-animation');

    fetch('add.wasm').then(response =>
      response.arrayBuffer().then(async buffer => {
        if (fs) {
          const path = fs.appPath(webnative.path.file('wasm', 'math', 'add.wasm'));
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
      const directoryPath = fs.appPath(webnative.path.directory('wasm', 'math'));
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
        const path = fs.appPath(webnative.path.file('wasm', 'math', 'add.wasm'));
        if (await fs.exists(path)) {
          const buffer = await fs.read(path);
          WebAssembly.instantiate(buffer).then(async wasmObject => {
            const result = wasmObject.instance.exports.add(lhs, rhs);
            dom.updateFirstChild('result', result);

            const resultPath = fs.appPath(webnative.path.file('results', 'add'));
            const computation = { lhs, rhs, result };
            await fs.write(resultPath, JSON.stringify(computation));
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

      const resultPath = fs.appPath(webnative.path.file('results', 'add'));
      const noComputation = { lhs: '', rhs: '', result: '?' };
      await fs.write(resultPath, JSON.stringify(noComputation));
      await fs.publish();
    }
  };

  const reset = async () => {
    dom.hide('store', 'list', 'contents', 'run', 'everywhere');
    dom.reveal('loading-animation');

    if (fs) {
      const funcPath = fs.appPath(webnative.path.file('wasm', 'math', 'add.wasm'));
      const resultPath = fs.appPath(webnative.path.file('results', 'add'));
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
