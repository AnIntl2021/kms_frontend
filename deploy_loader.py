import os
import re

directories = [
    'c:/xampp/htdocs/fresh_n_fast_frontend/src/pages',
    'c:/xampp/htdocs/fresh_n_fast_frontend/src/components'
]

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    modified = False

    # Skip FoodLoader itself
    if filepath.endswith('FoodLoader.tsx'):
        return

    # 1. Replace <Loader2 className="animate-spin" ... /> with <FoodLoader size="icon" />
    loader2_pattern = re.compile(r'<Loader2\s+className=["\']animate-spin["\'][^>]*\s*/>')
    if loader2_pattern.search(content):
        content = loader2_pattern.sub('<FoodLoader size="icon" />', content)
        modified = True

    # 2. Replace full-page loading indicators (e.g., <div className="portal-loading">...</div>)
    # This might be tricky because of nested divs, but let's target specific known strings
    # SettingsPage.tsx: <div className="loading-container">{t('gathering_configs')}</div>
    settings_pattern = re.compile(r'<div className="loading-container">.*?</div>', re.DOTALL)
    if settings_pattern.search(content):
        content = settings_pattern.sub('<FoodLoader size="large" />', content)
        modified = True

    # DispatchDashboardPage.tsx uses <div className="portal-loading">...</div>
    portal_pattern = re.compile(r'<div className="portal-loading">.*?</div>\s*(?:</Layout>)?', re.DOTALL)
    if portal_pattern.search(content):
        content = portal_pattern.sub('<FoodLoader size="large" /></Layout>', content)
        modified = True

    # 3. Replace table loading indicators
    # usually: <tr><td colSpan={X} className="...">Loading...</td></tr>
    # or {t('syncing_financial_records')}
    # We will search for <tr><td ...> ... </td></tr> blocks immediately after `loading ? (`
    # Actually simpler: any <tr> that contains "Loading", "syncing", "loading", "gathering" inside {loading ?
    # Let's just use regex to replace the content of <td> with <FoodLoader size="small" />
    
    # We will look for `{loading ? (` or `{itemsLoading ? (` or `{partnerLoading ? (` 
    # followed by `<tr><td...>`
    table_loader_pattern = re.compile(r'(\{[a-zA-Z]*[lL]oading\s*\?\s*\(\s*<tr[^>]*>\s*<td[^>]*>).*?(</td>\s*</tr>\s*\))', re.DOTALL)
    if table_loader_pattern.search(content):
        content = table_loader_pattern.sub(r'\1<FoodLoader size="small" />\2', content)
        modified = True
        
    table_loader_pattern_2 = re.compile(r'(loading\s*\?\s*\(\s*<tr[^>]*>\s*<td[^>]*>).*?(</td>\s*</tr>\s*\))', re.DOTALL)
    if table_loader_pattern_2.search(content):
        content = table_loader_pattern_2.sub(r'\1<FoodLoader size="small" />\2', content)
        modified = True
        
    table_loader_pattern_3 = re.compile(r'(\{[a-zA-Z]*[lL]oading\s*\?\s*<div[^>]*>).*?(</div>)', re.DOTALL)
    if table_loader_pattern_3.search(content):
        # Only replace if it contains text that indicates loading
        content = table_loader_pattern_3.sub(r'\1<FoodLoader size="small" />\2', content)
        modified = True

    if modified:
        # Check if FoodLoader is imported
        if 'FoodLoader' not in content[:1000]:
            # Add import after React imports
            import_statement = "import FoodLoader from '../components/FoodLoader';\n"
            if '../components/FoodLoader' not in content:
                # Find the last import
                last_import_idx = content.rfind('import ')
                if last_import_idx != -1:
                    end_of_line = content.find('\n', last_import_idx)
                    content = content[:end_of_line+1] + import_statement + content[end_of_line+1:]
                else:
                    content = import_statement + content

        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for d in directories:
    for filename in os.listdir(d):
        if filename.endswith('.tsx'):
            process_file(os.path.join(d, filename))

print("Global replacement complete.")
