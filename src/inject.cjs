const fs = require('fs');
const src = fs.readFileSync('c:/xampp/htdocs/fresh_n_fast_frontend/src/pages/DispatchDashboardPage.tsx', 'utf-8');
const startMatch = src.indexOf('<style>{`');
const endMatch = src.indexOf('`}</style>');

if (startMatch !== -1 && endMatch !== -1) {
  const css = src.substring(startMatch, endMatch + 10);
  let tgt = fs.readFileSync('c:/xampp/htdocs/fresh_n_fast_frontend/src/pages/StorePNLReportPage.tsx', 'utf-8');
  tgt = tgt.replace('</Layout>', css + '\n    </Layout>');
  fs.writeFileSync('c:/xampp/htdocs/fresh_n_fast_frontend/src/pages/StorePNLReportPage.tsx', tgt);
  console.log('Injected CSS successfully');
} else {
  console.log('Style not found');
}
