const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPortal.tsx', 'utf8');

// remove biometric hooks
code = code.replace("  const [biometricScanning, setBiometricScanning] = useState(false);\n", "");
code = code.replace("  const [bioProgress, setBioProgress] = useState(0);\n", "");
code = code.replace("  const [bioSuccess, setBioSuccess] = useState(false);\n", "");

// remove triggerDoctorBiometricScan
const scanStartIdx = code.indexOf("  const triggerDoctorBiometricScan = () => {");
const returnRenderIdx = code.indexOf("  return (", scanStartIdx);

if (scanStartIdx !== -1 && returnRenderIdx !== -1) {
    code = code.substring(0, scanStartIdx) + code.substring(returnRenderIdx);
}

// remove Dr Biometric scan zone rendering
const uiStartIdx = code.indexOf("            {/* Dr Biometric scan zone */}");
const uiEndIdx = code.indexOf("            {/* Manual Passcode Option */}");
if (uiStartIdx !== -1 && uiEndIdx !== -1) {
    code = code.substring(0, uiStartIdx) + code.substring(uiEndIdx);
}

fs.writeFileSync('src/components/LoginPortal.tsx', code);
console.log('LoginPortal patched');
