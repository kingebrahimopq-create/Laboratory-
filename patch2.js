const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = "{/* RENDER CURRENT ROLE SELECTION VIEW OR EMULATED CLIENTS */}";
const endMarker = "/* THE DEFAULT WEB CLOUD PORTAL LAYOUT */";

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const toReplace = code.substring(startIndex, endIndex + endMarker.length);
  code = code.replace(toReplace, startMarker);
  
  code = code.replace("</div>\n              )}\n\n            </div>", "</div>\n\n            </div>");
  
  const aiWidgetStart = "<div className=\"bg-slate-950 border border-slate-800 p-4 rounded-3xl shadow-xl text-white\">";
  const aiWidgetEnd = "</div>\n\n              {/* Biometric Controller & Reset Fast Box */}";
  const startAi = code.indexOf(aiWidgetStart);
  const endAi = code.indexOf(aiWidgetEnd);
  
  if (startAi !== -1 && endAi !== -1) {
      const widgetToReplace = code.substring(startAi, endAi);
      code = code.replace(widgetToReplace, "");
  }

  fs.writeFileSync('src/App.tsx', code);
  console.log('patched');
} else {
  console.log('markers not found', startIndex, endIndex);
}
