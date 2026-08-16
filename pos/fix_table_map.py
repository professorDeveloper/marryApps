import os

file_path = r'c:\yurtal_llc\mary_ai_pos\lib\features\view\main\presentation\pages\main\widgets\table_map.dart'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_count = 0
removed_count = 0

for i in range(len(lines)):
    if skip_count > 0:
        skip_count -= 1
        continue
    
    # Check if this line and next 2 form the pattern "], ), ),"
    if i + 2 < len(lines):
        l1 = lines[i].strip()
        l2 = lines[i+1].strip()
        l3 = lines[i+2].strip()
        
        if l1 == '],' and l2 == '),' and l3 == '),':
            # Found the pattern to remove
            # Double check it is not the last one (safety, though mismatching ); should handle it)
            skip_count = 2 # skip next 2 (current i is handled by not appending)
            removed_count += 1
            print(f"Removing block at line {i+1}")
            continue

    new_lines.append(lines[i])

print(f"Total blocks removed: {removed_count}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
