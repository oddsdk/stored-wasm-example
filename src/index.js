import 'tachyons';
import * as webnative from 'webnative';

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

      const appPath = fs.appPath();
      const appDirectoryExists = await fs.exists(appPath);

      if (!appDirectoryExists) {
        await fs.mkdir(appPath);
        await fs.publish();
      }

      const resultPath = fs.appPath(['results', 'add']);
      if (await fs.exists(resultPath)) {
        const stored = JSON.parse(await fs.read(resultPath));
        revealStored(stored);
      }

      reveal('store');
      break;

    case webnative.Scenario.NotAuthorised:
    case webnative.Scenario.AuthCancelled:
      reveal('auth');
      break;
  }

  const auth = () => {
    webnative.redirectToLobby(state.permissions);
  };

  const store = async () => {
    fetch('add.wasm').then(response =>
      response.arrayBuffer().then(async buffer => {
        if (fs) {
          const path = fs.appPath(['wasm', 'math', 'add.wasm']);
          const blob = new Blob([buffer], { type: 'application/wasm' });
          await fs.write(path, blob);
          await fs.publish();

          hide('store-button-row');
          reveal('list');
        }
      })
    );
  };

  const ls = async () => {
    if (fs) {
      const directoryListing = await fs.ls(fs.appPath(['wasm', 'math']));
      Object.keys(directoryListing).forEach(function (key) {
        appendRow(directoryListing[key]);
      });

      hide('list-button-row');
      reveal('contents');
    }
  };

  const showRunSection = () => {
    hide('show-run-button-row');
    reveal('run');
  };

  const add = async () => {
    const lhs = +document.getElementById('lhs').value;
    const rhs = +document.getElementById('rhs').value;

    if (fs) {
      if (!Number.isNaN(lhs) && !Number.isNaN(rhs)) {
        const path = fs.appPath(['wasm', 'math', 'add.wasm']);
        if (await fs.exists(path)) {
          const buffer = await fs.read(path);
          WebAssembly.instantiate(buffer).then(async wasmObject => {
            const result = wasmObject.instance.exports.add(lhs, rhs);
            updateResultNode(result);

            const resultPath = fs.appPath(['results', 'add']);
            const computation = { lhs, rhs, result };
            await fs.write(resultPath, JSON.stringify(computation));
            await fs.publish();

            reveal('everywhere');
          });
        }
      } else {
        updateResultNode('🤖🤖💥');
      }
    }
  };

  const clear = async () => {
    if (fs) {
      document.getElementById('lhs').value = '';
      document.getElementById('rhs').value = '';
      updateResultNode('?');

      const resultPath = fs.appPath(['results', 'add']);
      const noComputation = { lhs: '', rhs: '', result: '?' };
      await fs.write(resultPath, JSON.stringify(noComputation));
      await fs.publish();
    }
  };

  const reset = async () => {
    if (fs) {
      const funcPath = fs.appPath(['wasm', 'math', 'add.wasm']);
      const resultPath = fs.appPath(['results', 'add']);
      await fs.rm(funcPath);
      await fs.rm(resultPath);
      await fs.publish();

      hide('list', 'contents', 'run', 'everywhere');
      reveal(
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

// ADDER

let resultTextNode = document.createTextNode('?');
document.getElementById('result').appendChild(resultTextNode);

const updateResultNode = val => {
  const newTextNode = document.createTextNode(val);
  document.getElementById('result').replaceChild(newTextNode, resultTextNode);
  resultTextNode = newTextNode;
};

// REVEAL, HIDE AND SEEK

const reveal = (...ids) => {
  ids.forEach(id => {
    const el = document.getElementById(id);
    el.style.display = 'flex';
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY,
      behavior: 'smooth'
    });
  });
};

const hide = (...ids) => {
  ids.forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
};

const revealStored = async stored => {
  document.getElementById('lhs').value = stored.lhs;
  document.getElementById('rhs').value = stored.rhs;
  updateResultNode(stored.result);

  hide('store-button-row', 'list-button-row', 'show-run-button-row', 'store');
  reveal('run', 'everywhere');
};

// DIRECTORY LISTING TABLE

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

export {};
