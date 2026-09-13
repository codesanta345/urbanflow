import re

with open('admin-users.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove Add User Button
html = re.sub(r'<button onclick=\"openAddUserModal\(\)\".*?Register System User\s*</button>', '', html, flags=re.DOTALL)

# Remove Modal
html = re.sub(r'<!-- ADD USER MODAL -->.*?</div>\s*</div>', '', html, flags=re.DOTALL)

# Remove modal related JS
html = re.sub(r'setupModalListeners\(\);', '', html)
html = re.sub(r'function openAddUserModal\(\) \{.*?\}', '', html, flags=re.DOTALL)
html = re.sub(r'function closeModals\(\) \{.*?\}', '', html, flags=re.DOTALL)
html = re.sub(r'function setupModalListeners\(\) \{.*?(?=function escapeHtml)', '', html, flags=re.DOTALL)

with open('admin-users.html', 'w', encoding='utf-8') as f:
    f.write(html)
