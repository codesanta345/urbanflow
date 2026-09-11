import re

with open('admin-incidents.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove Add Incident Button
html = re.sub(r'<button onclick=\"openAddIncidentModal\(\)\".*?Add Fake/Test Incident\s*</button>', '', html, flags=re.DOTALL)

# Remove Modal
html = re.sub(r'<!-- ADD INCIDENT MODAL -->.*?</div>\s*</div>', '', html, flags=re.DOTALL)

# Remove modal related JS
html = re.sub(r'setupModalListeners\(\);', '', html)
html = re.sub(r'function openAddIncidentModal\(\) \{.*?\}', '', html, flags=re.DOTALL)
html = re.sub(r'function closeModals\(\) \{.*?\}', '', html, flags=re.DOTALL)
html = re.sub(r'function setupModalListeners\(\) \{.*?(?=function escapeHtml)', '', html, flags=re.DOTALL)

with open('admin-incidents.html', 'w', encoding='utf-8') as f:
    f.write(html)
