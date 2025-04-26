import os

print("=== Diagnostyka problemu z szablonami ===")

# Sprawdź bieżący katalog roboczy
print(f"Obecny katalog roboczy: {os.getcwd()}")

# Sprawdź czy istnieje katalog templates
templates_path = os.path.join(os.getcwd(), 'templates')
print(f"Ścieżka do katalogu templates: {templates_path}")
print(f"Czy katalog templates istnieje: {os.path.exists(templates_path)}")

# Sprawdź czy istnieje plik index.html
index_path = os.path.join(templates_path, 'index.html')
print(f"Czy plik index.html istnieje: {os.path.exists(index_path)}")

# Sprawdź strukturę katalogu app
app_path = os.path.join(os.getcwd(), 'app')
print(f"Ścieżka do katalogu app: {app_path}")
print(f"Czy katalog app istnieje: {os.path.exists(app_path)}")

if os.path.exists(app_path):
    app_files = os.listdir(app_path)
    print(f"Pliki w katalogu app: {app_files}")

# Sprawdź ścieżkę względną
rel_templates_path = os.path.join('app', '..', 'templates')
abs_rel_templates_path = os.path.abspath(rel_templates_path)
print(f"Ścieżka względna ../templates z app/: {abs_rel_templates_path}")
print(f"Czy ta ścieżka istnieje: {os.path.exists(abs_rel_templates_path)}")