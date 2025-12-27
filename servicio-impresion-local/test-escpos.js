const escpos = require('escpos');

console.log('========================================');
console.log('  VERIFICACION DE escpos');
console.log('========================================');
console.log('');

console.log('Tipo de escpos:', typeof escpos);
console.log('Keys de escpos:', Object.keys(escpos).join(', '));
console.log('');

// Verificar USB
if (escpos.USB) {
  console.log('✅ USB encontrado en escpos.USB');
  console.log('   Tipo:', typeof escpos.USB);
} else if (escpos.default && escpos.default.USB) {
  console.log('✅ USB encontrado en escpos.default.USB');
  console.log('   Tipo:', typeof escpos.default.USB);
} else {
  console.error('❌ USB NO encontrado');
}

// Verificar Printer
if (escpos.Printer) {
  console.log('✅ Printer encontrado en escpos.Printer');
  console.log('   Tipo:', typeof escpos.Printer);
} else if (escpos.default && escpos.default.Printer) {
  console.log('✅ Printer encontrado en escpos.default.Printer');
  console.log('   Tipo:', typeof escpos.default.Printer);
} else {
  console.error('❌ Printer NO encontrado');
}

// Verificar Network
if (escpos.Network) {
  console.log('✅ Network encontrado en escpos.Network');
  console.log('   Tipo:', typeof escpos.Network);
} else if (escpos.default && escpos.default.Network) {
  console.log('✅ Network encontrado en escpos.default.Network');
  console.log('   Tipo:', typeof escpos.default.Network);
} else {
  console.error('❌ Network NO encontrado');
}

console.log('');
console.log('========================================');

