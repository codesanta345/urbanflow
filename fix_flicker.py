import re

with open('admin-incidents.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Only show spinner if liveIncidents is empty
html = html.replace(
    "container.innerHTML = '<div style=\"text-align:center; padding:20px; color:#64748B;\"><i class=\"fa-solid fa-spinner fa-spin\"></i> Fetching incidents...</div>';",
    "if (liveIncidents.length === 0) container.innerHTML = '<div style=\"text-align:center; padding:20px; color:#64748B;\"><i class=\"fa-solid fa-spinner fa-spin\"></i> Fetching incidents...</div>';"
)

with open('admin-incidents.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('admin-users.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace(
    "tbody.innerHTML = '<tr><td colspan=\"6\" style=\"text-align:center; padding:16px; color:#64748B;\"><i class=\"fa-solid fa-spinner fa-spin\"></i> Fetching operators...</td></tr>';",
    "if (liveUsers.length === 0) tbody.innerHTML = '<tr><td colspan=\"6\" style=\"text-align:center; padding:16px; color:#64748B;\"><i class=\"fa-solid fa-spinner fa-spin\"></i> Fetching operators...</td></tr>';"
)

with open('admin-users.html', 'w', encoding='utf-8') as f:
    f.write(html)
