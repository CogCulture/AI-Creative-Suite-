import os
import re

def clean_prompts_modal():
    filepath = "PromptsModal.jsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Remove imports
    content = re.sub(r"import \{ useProject \} from '\./ProjectContext';\n?", "", content)
    content = re.sub(r"import \{ trackTemplateUse \} from '\.\./utils/api';\n?", "", content)
    
    # 2. Remove useProject usage (e.g. `const { projectDetails } = useProject();`)
    content = re.sub(r"const\s+\{\s*projectDetails\s*\}\s*=\s*useProject\(\);\n?", "", content)
    # also some variants like `const { ... } = useProject();`
    content = re.sub(r"const\s+\{[^}]*\}\s*=\s*useProject\(\);\n?", "", content)
    
    # 3. Remove trackTemplateUse usages
    # e.g., `trackTemplateUse(templateName);` or inside an async function
    content = re.sub(r"trackTemplateUse\([^)]*\);?", "", content)
    content = re.sub(r"await\s+trackTemplateUse\([^)]*\);?", "", content)

    # 4. In case they use `projectDetails` to fill some variable, we might need to remove that logic.
    # Looking at PromptsModal usually it doesn't need projectDetails except maybe for analytics?
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Cleaned PromptsModal.jsx")

if __name__ == "__main__":
    clean_prompts_modal()
