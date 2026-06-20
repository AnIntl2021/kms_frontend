const fs = require('fs');

let content = fs.readFileSync('c:/xampp/htdocs/kitchen_management_frontend/src/pages/StorePNLReportPage.tsx', 'utf-8');

// The CSS starts with <style>{` and ends with `}</style> right inside the first </Layout>
const styleStart = content.indexOf('<style>{`');
const styleEnd = content.indexOf('`}</style>') + 10;

if (styleStart !== -1 && styleEnd !== -1) {
    const cssBlock = content.substring(styleStart, styleEnd);
    
    // Remove it from where it is
    content = content.replace(cssBlock, '');
    
    // We also need to fix the first </Layout> which might have been modified improperly
    // Wait, the original code had: ... return <Layout title="Store P&L">...</div></Layout>;
    // My replace did: replace('</Layout>', css + '\n    </Layout>')
    // So the first layout now looks like: return <Layout>...</div><style>...</style>\n    </Layout>;
    // Because I just removed <style>...</style>, it's now: return <Layout>...</div>\n    </Layout>;
    // This is valid JSX.

    // Now append cssBlock before the LAST </Layout>
    const lastLayoutIndex = content.lastIndexOf('</Layout>');
    content = content.substring(0, lastLayoutIndex) + cssBlock + '\n    ' + content.substring(lastLayoutIndex);
    
    fs.writeFileSync('c:/xampp/htdocs/kitchen_management_frontend/src/pages/StorePNLReportPage.tsx', content);
    console.log('Fixed CSS injection!');
} else {
    console.log('Could not find CSS block!');
}
