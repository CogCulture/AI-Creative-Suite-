import os
import re

def clean_chat_window():
    filepath = "ChatWindow.jsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Remove from props
    content = content.replace("isIncognitoMode = false,", "")
    content = content.replace("isIncognitoMode,", "")
    
    # 2. Remove the banner blocks (they look like {isIncognitoMode && ( <div ...> ... </div> )})
    content = re.sub(r'\{isIncognitoMode && \(\s*<div[^>]*>.*?</div>\s*\)\}', '', content, flags=re.DOTALL)
    
    # 3. Remove editor logic references. The user wants to remove the editor button and modal.
    # The Editor button calls `onEditMessage(msg)`.
    # Let's remove the edit button UI.
    content = re.sub(r'<button[^>]*onClick=\{\(\) => onEditMessage\(msg\)\}[^>]*>.*?</button>', '', content, flags=re.DOTALL)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Cleaned ChatWindow.jsx")

def clean_input_bar():
    filepath = "InputBar.jsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove from props
    content = content.replace("isIncognitoMode = false,", "")
    content = content.replace("isIncognitoMode,", "")
    
    # Remove usages like `if (!convId && !isIncognitoMode)` -> `if (!convId)`
    content = content.replace("!isIncognitoMode", "true")
    content = content.replace("isIncognitoMode", "false")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Cleaned InputBar.jsx")

if __name__ == "__main__":
    clean_chat_window()
    clean_input_bar()
