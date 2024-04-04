import os
# Author: Ghaith Ashqar
# Version: 0.1.0
# Requirements: Presentations should be in `_slides` in the main Learners directory. Format should be `{number}_{title}` without spaces, in .pdf format. E.g., `01_Intro_to_Cybersecurity.pdf` or `12_Why_Python_Sucks.pdf`.
 
#paths setup
script_directory = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.normpath(os.path.join(script_directory, '../../'))
pdf_directory_path = os.path.join(project_root, '_slides')
base_directory_path = os.path.join(project_root, 'content/presentations')
 
#input the language
language_code = input("Please enter the language code (e.g., 'en', 'fr', 'de'): ")
 
#reading the pdf files should be in this format {number}_{title}
 
pdf_files = [f for f in os.listdir(pdf_directory_path) if f.endswith('.pdf')]
 
for file in pdf_files:
 
    parts = file.split('_', 1)
   
    if len(parts) < 2:
        print(f"Skipping file due to unexpected filename format the expected format: {file}")
        continue
 
    # Now safe to unpack
    number, title_with_extension = parts
    title_with_underscores = title_with_extension[:-4]  # Title for directories, removing '.pdf'
    title = title_with_underscores.replace('_', ' ')  # Title for display, replacing underscores with spaces
 
    dir_name = f"{number}_{title.replace(' ', '_')}"
 
    full_dir_path = os.path.join(base_directory_path, dir_name)
    os.makedirs(full_dir_path, exist_ok=True)
 
 
    # Construct the markdown file path
    md_file_path = os.path.join(full_dir_path, f"index.{language_code}.md")
 
    # Format the markdown content
 
 
    md_content = f"""---
Title: {number} {title}
menuTitle: {number} {title}
weight: {int(number)}
chapter: false
slides: "{file}"
global_slides: true
---"""
 
    # Write the markdown file
    with open(md_file_path, 'w') as md_file:
        md_file.write(md_content)
 
print("Directories and markdown files created successfully.")