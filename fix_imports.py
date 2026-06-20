import os

directories = [
    'c:/xampp/htdocs/kitchen_management_frontend/src/pages',
    'c:/xampp/htdocs/kitchen_management_frontend/src/components'
]

for d in directories:
    for filename in os.listdir(d):
        if filename.endswith('.tsx') and filename != 'FoodLoader.tsx':
            filepath = os.path.join(d, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'import FoodLoader from' in content:
                # Remove all instances of the import
                content = content.replace("import FoodLoader from '../components/FoodLoader';\n", "")
                content = content.replace("import FoodLoader from '../components/FoodLoader';\r\n", "")
                content = content.replace("import FoodLoader from './FoodLoader';\n", "")
                content = content.replace("import FoodLoader from './FoodLoader';\r\n", "")
                content = content.replace("import FoodLoader from '../components/FoodLoader';\r", "")
                content = content.replace("import FoodLoader from '../components/FoodLoader';", "")
                content = content.replace("import FoodLoader from './FoodLoader';", "")
                
                # Prepend the import at the very top of the file
                import_stmt = "import FoodLoader from '../components/FoodLoader';\n" if 'pages' in d else "import FoodLoader from './FoodLoader';\n"
                
                # Make sure we don't accidentally import it twice
                if 'import FoodLoader' not in content:
                    content = import_stmt + content
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed imports in {filename}")

print("Import fix complete.")
