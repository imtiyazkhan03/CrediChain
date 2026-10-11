import fs from 'fs';
import path from 'path';
import solc from 'solc';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contractPath = path.resolve(__dirname, 'AcademicCertificateRegistry.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'AcademicCertificateRegistry.sol': {
      content: source,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode'],
      },
    },
  },
};

console.log('Compiling AcademicCertificateRegistry.sol with solc...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  let hasFatal = false;
  for (const error of output.errors) {
    if (error.severity === 'error') {
      console.error('Compilation Error:', error.formattedMessage);
      hasFatal = true;
    } else {
      console.warn('Compilation Warning:', error.formattedMessage);
    }
  }
  if (hasFatal) {
    process.exit(1);
  }
}

const contract = output.contracts['AcademicCertificateRegistry.sol']['AcademicCertificateRegistry'];
const abi = contract.abi;
const bytecode = contract.evm.bytecode.object;

const artifact = {
  contractName: 'AcademicCertificateRegistry',
  compilerVersion: solc.version(),
  compiledAt: new Date().toISOString(),
  abi,
  bytecode: '0x' + bytecode,
};

const artifactPath = path.resolve(__dirname, 'AcademicCertificateRegistry.json');
fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2), 'utf8');

console.log(`Compilation successful! Artifact saved to: ${artifactPath}`);
console.log(`ABI methods count: ${abi.length}`);
console.log(`Bytecode size: ${bytecode.length / 2} bytes`);
